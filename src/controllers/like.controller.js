import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const userId = req.user._id;
  const existingLikedVideo = await Like.findOneAndDelete({
    video: videoId,
    likedBy: userId,
  });
  if (existingLikedVideo) {
    console.log("remove like");
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false, videoId }, "Video like removed")
      );
  }
  try {
    const newLike = await Like.create({
      video: videoId,
      likedBy: userId,
    });

    if (!newLike) {
      throw new ApiError(
        500,
        "Something went wrong while creating like to video"
      );
    }
    // console.log(newLike);
    console.log(`Like to video : ${videoId}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: true, videoId },
          "Video liked successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while toggling the like to video"
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  const userId = req.user._id;
  const existingLikedComment = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: userId,
  });
  if (existingLikedComment) {
    console.log("remove like from comment");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false, commentId },
          "Video like removed"
        )
      );
  }
  try {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: userId,
    });

    if (!newLike) {
      throw new ApiError(
        500,
        `Something went wrong while creating like to comment ${commentId}`
      );
    }
    // console.log(newLike);
    console.log(`liked to comment : ${commentId}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: true, commentId },
          "comment liked successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message ||
        `Something went wrong while toggling the like to comment : ${commentId}`
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }
  const userId = req.user._id;
  const existingLikedTweet = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: userId,
  });
  if (existingLikedTweet) {
    console.log("remove like from tweet");
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false, tweetId }, "Tweet like removed")
      );
  }
  try {
    const newLike = await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });

    if (!newLike) {
      throw new ApiError(
        500,
        `Something went wrong while creating like to tweet ${tweetId}`
      );
    }
    // console.log(newLike);
    console.log(`liked to tweet : ${tweetId}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: true, tweetId },
          "tweet liked successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message ||
        `Something went wrong while toggling the like to tweet : ${tweetId}`
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  
  const {page=1, limit=10} = req.query;
  const userId = req.user._id;

  const options={
    page,
    limit,
    customLabels:{
      docs:"likedVideos",
      totalDocs:"count",
    }
  }
  const likedVideos = await Like.aggregatePaginate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(String(userId)),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $addFields:{
        video:{$first: "$video"},
        likeId:"$_id"
      }
    },
    {
      $sort: { createdAt: -1},
    },
    {
      $unset:["_id","likedBy","createdAt", "updatedAt"]
    }
   
  ],
  options
);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
