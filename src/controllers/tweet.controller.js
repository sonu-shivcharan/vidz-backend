import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    let {content} = req.body;
    content = content?.trim();
    if(!content){
        throw new ApiError(400,"tweet content is required")
    }
    if(content.length>250){
        throw new ApiError(400, "tweet content length can't be greater than 250 chars")
    }
    const userId = req.user._id;
    const newTweet = await Tweet.create({
        content,
        owner: userId
    });
    if(!newTweet){
        throw new ApiError(500, "Error while creating tweet")
    }
    return res.status(200).json(new ApiResponse(200, {tweet:newTweet}, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {owner: new mongoose.Types.ObjectId(String(userId))}
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes",
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        _id:1,
                        username:1,
                        email:1,
                        fullname:1,
                        avatar:1,
                        coverImage:1,
                    }
                }]
            }
        },
        {
            $addFields:{
                likes:{$size: "$likes"},
                owner:{$first: "$owner"}
            }
        }
    ])

    if(!userTweets){
        throw new ApiError(500,"Error while fetching the tweets");
    }
    return res.status(200).json(new ApiResponse(200, {tweets: userTweets}, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}