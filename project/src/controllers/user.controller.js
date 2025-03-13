import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiErrors.js"
import ApiResponse from "../utils/apiResponse.js";
import {User} from "../models/user.model.js"
import { uploadFileToCloudinary } from "../utils/cloudinary.js";



const registerUser = asyncHandler(async(req, res)=>{

    const {email, password, fullName, username} = await req.body;
    if([email, password, fullName, username].some((field)=>field.trim()==="")){
        throw new ApiError(400, "All fields are required");
    }
    const doesExistsUser = User.findOne({
        $or: [{email}, {username}]
    })
    if(doesExistsUser){
        throw new ApiError(409, "User with same email or usernam already exists.")
    }
    const files = req.files;
    console.log(files)
    const avatarLocalPath = files?.avatar[0]?.path;
    const coverImageLocalPath = files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadFileToCloudinary(avatarLocalPath);

    const coverImage = await uploadFileToCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    console.log("After uploading to cloudinary", avatar)
    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })

    const createdUser = User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500, "Error while registering a user");
    }
    const response = new ApiResponse(201, createdUser, "User registered successfully");
    return res.status(201).json(response)

})

export default registerUser


// step1 parse the body  and extract username password
// step2 check is user already exists
//step2 if not the create user 
// send response
