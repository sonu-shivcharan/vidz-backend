import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }
  const userId = req.user._id;
  const channel = await Subscription.findOneAndDelete({
    subscriber: userId,
    channel: channelId,
  });
  //   console.log("channel", channel);

  if (channel) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Channel unsubscribed successfully"
        )
      );
  }

  try {
    await Subscription.create({ subscriber: userId, channel: channelId });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: true },
          "Channel subscribed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while toggling the subscription"
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }
 try {
     const subscribers = await Subscription.aggregate([
       {
         $match: {
           channel : new mongoose.Types.ObjectId(String(channelId))
         },
       },
       {
         $lookup: {
           from: "users",
           localField: "subscriber",
           foreignField: "_id",
           as: "subscribers",
           pipeline: [
             {
               $project: {
                 username: 1,
                 fullName: 1,
                 email: 1,
                 avatar: 1,
                 coverImage: 1,
               },
             },
           ],
         },
       },
       {
         $addFields: {
           subscribersCount: { $size: "$subscribers" },
         },
       },
     ]);
     return res.status(200).json(new ApiResponse(200, subscribers, "Fetched subscribers successfully"))
 } catch (error) {
    throw new ApiError(
        error?.statusCode || 500,
        error?.message || "Something went wrong while toggling the subscription"
      );
 }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
