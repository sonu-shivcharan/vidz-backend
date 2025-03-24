import {v2 as cloudinary } from "cloudinary"
import fs from "fs"
import ApiError from "./apiError.js";
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});

async function uploadFileToCloudinary(pathToFile){  
    try {
        if(!pathToFile) return null;
        const response = await cloudinary.uploader.upload(pathToFile, {
            resource_type:"auto",
        })
        console.log("File uploaded to cloudinary succsfully ", response.url);  
        fs.unlinkSync(pathToFile)
        return response
          
    } catch (error) {
        fs.unlinkSync(pathToFile);
        console.log("Error uploding file to Cloudinary uploadFileToCloudinary Error::", error);
        return null;
    }
}


async function deleteFileFromCloudinary(fileId) {
    try{
        if(!fileId) return null;
        const response = await cloudinary.uploader.destroy(fileId);
        return response;
    }catch(error){
        console.log("Error deleting file from cloudinary", error);
        throw new ApiError(500, error?.message || "Somthing went wrong while deleting file from cloudinary")
    }
}

export {uploadFileToCloudinary, deleteFileFromCloudinary};