import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const uploadOnCloudinary = async(localFilePath) => {
    try{
        if(!localFilePath) return null
        //upload the file on cloudinary
       const response =await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //upload successful
        // fs.unlink(localFilePath)
        return response
    }catch(error){
        fs.unlinkSync(localFilePath)  //removes locally sa ved temporary file if upload operation gets failed
        return null
    }
  }

  export {uploadOnCloudinary}