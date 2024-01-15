import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async(req,res)=>{
   //get user details from frontend
   const {fullName, email, username, password} = req.body
   //validation
   if([fullName, email, username, password].some((field)=> field?.trim()==="")){
    throw new ApiError(400,"All fields are compulsary or required")
   }
   const existingUser = await User.findOne({
    $or:[{username},{email}]
   })

   if(existingUser){
    throw new ApiError(409, "User with the following email or username already exists")
   }
   console.log(req.files)
   const avatarLocalPath = req.files?.avatar[0]?.path
   // const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files.coverImage[0].path
   }

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
   }
   //upload to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400,"Avatar file is required")
   }

   const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
   }

   return res.status(201).json(
    new apiResponse(200, createdUser,"User registered successfully")
   )



   //check if user already exists ::using email or username
   //check for images
   //check for avatar 
   //upload to cloudinary and get url string
   //create user object and create entry in db
   //remove password and refrest token field from response
   //check for user creation
   //return response
} )

const generateAccessAndRefreshToken = async(userId) => {
   try{
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      user.save({validateBeforeSave:false})
      return {accessToken,refreshToken}
   }catch(error){
      throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
   }
}

const loginUser = asyncHandler(async(req,res)=> {
   //get data from body
   const {username,email,password} = req.body

   if(!(username || email)){
      throw new ApiError(400,"Username or email is required")
   }
   //username or email based
   const user = await User.findOne({
      $or:[{username},{email}]
   })
   
   if(!user){
      throw new ApiError(404,"User does not exist")
   }
   //password check
   const isPasswordValid = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials")
   }
   //access nad refresh token generation and send
   const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   //send cookie
   const options ={
      httpOnly:true,
      secure:true
   }

   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new apiResponse(200,{
         user:loggedInUser,accessToken,refreshToken,
      },
      "User Logged in successfully")
   )
})

export {registerUser,loginUser} 