import { asyncHandler } from "../utils/asyncHandler"
import { User } from "../models/user.model"
import  Jwt  from "jsonwebtoken"
import { ApiError } from "../utils/apiError"

export const verifyJWT =  asyncHandler(async(req,res,next)=> {
       const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // removed bearer from bearer token
       if(!token){
        throw new ApiError(401,"Unauthorized request")
       }
       const decodedToken = Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

       if(!user){
        //planning for frontend
        throw new ApiError(401,"Invalid access Token")
       }

       req.user = user
       next()
    })
