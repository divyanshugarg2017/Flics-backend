import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async(req,res)=>{
   //get user details from frontend
   const {fullName, email, username, password} = req.body
   //validation
   if([fullName, email, userrname, password].some((field)=> field?.trim()==="")){
    throw new ApiError(400,"All fields are compulsary or required")
   }
   const existingUser = User.findOne({
    $or:[{username},{email}]
   })

   if(existingUser){
    throw new ApiError(409, "User with the following email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

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

export {registerUser} 