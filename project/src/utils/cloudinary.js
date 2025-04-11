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


async function deleteFileFromCloudinary(fileUrl) {
    const fileId = getAssetIdFromURL(fileUrl);
    console.log('Deleting file', fileId)
    try{
        if(!fileId) return null;
        const response = await cloudinary.uploader.destroy(fileId);
        return response;
    }catch(error){
        console.log("Error deleting file from cloudinary", error);
        throw new ApiError(500, error?.message || "Somthing went wrong while deleting file from cloudinary")
    }
}


function getAssetIdFromURL(url){
  // Use URL parsing to extract the last part of the path
  const parsedUrl = new URL(url);
  // Get the pathname and split it
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  // If there are path parts, return the last part
  if (pathParts.length > 0) {
    return pathParts[pathParts.length - 1].split('.')[0];
  }
  return false
}
export {uploadFileToCloudinary, deleteFileFromCloudinary, getAssetIdFromURL};