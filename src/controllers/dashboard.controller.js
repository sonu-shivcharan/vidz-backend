import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;
  const stats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(userId)),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $lookup:{
        from:"likes",
        let: { videoIds: "$videos._id" },
        pipeline:[
          {
            $match:{
              $expr:{
                $in:["$video", "$$videoIds"]
              },
            }
          }
        ],
        as:"videoLikes"
      }
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalSubscribers: { $size: "$subscribers" },
        totalChannelsSubscribedTo:{$size:"$subscribedTo"},
        totalViews:{
          $sum:{
            $map : {input:"$videos", as:"vid", in:"$vid.views"}
          }
        },
        totalVideoLikes:{$size:"$videoLikes"}
      },
    },
    {
      $project: {
        username:1,
        email:1,
        avatar:1,
        coverImage:1,
        totalVideos:1,
        totalSubscribers:1,
        totalChannelsSubscribedTo:1,
        totalViews:1,
        totalVideoLikes:1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, {stats:stats[0]} , "Fetched Stats"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
      docs: "videos",
      totalDocs: "count",
    },
  };
  const videos = await Video.aggregatePaginate(
    [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(String(userId)),
        },
      },
    ],
    options
  );

  return res.status(200).json(new ApiResponse(200, videos));
});

export { getChannelStats, getChannelVideos };
