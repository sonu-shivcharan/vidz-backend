import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "asc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  // const filters={}
  // const sortOptions = {};
  // if(sortBy){
  //   sortOptions[sortBy] = sortType=="asc"?1:-1;
  // }
  // if(userId && isValidObjectId(userId)){
  //   filters.owner=userId
  // }
  // if(query){
  //   filters.$or=[
  //     {title:{$regex: query , $options:"i"}},
  //     {description: {$regex: query, $options:"i"}}
  //   ]
  // }
  // const videos = await Video.find(filters).sort(sortOptions).limit(limit).skip((page-1)*limit)
  // const videoCount = videos.length;


  const videos = await Video.aggregatePaginate( [
    {
      $match: {
        isPublished: true,
        ...(userId && isValidObjectId(userId) && {owner: userId}),
        ...(query && {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        }),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: { [sortBy]: sortType == "asc" ? 1 : -1 },
    },
  ],{
    page: Number(page),
    limit: Number(limit),
  });
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Fetched videos successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title.trim()) {
    throw new ApiError(400, "Video title is required.");
  } else if (!description.trim()) {
    throw new ApiError(400, "Video description is required.");
  }
  const files = req.files;
  const videoLocalPath =
    files?.videoFile?.length > 0 ? files.videoFile[0].path : "";
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required.");
  }

  const thumbnailLocalPath =
    files?.thumbnail?.length > 0 ? files.thumbnail[0].path : "";
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Video thumbnail is required.");
  }
  const videoFile = await uploadFileToCloudinary(videoLocalPath);
  const thumbnailFile = await uploadFileToCloudinary(thumbnailLocalPath);
  const userId = String(req.user._id); //converting user id explicitly to string

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    duration: videoFile.duration,
    owner: new mongoose.Types.ObjectId(userId),
    // mongoose.Types.ObjectId(id:number)->deprecated -> that why I converted userId explicity to string
  });
  console.log("video", video);
  if (!video) {
    throw new ApiError(
      500,
      "Something went wrong while publshing video",
      video
    );
  }
  console.log("video after uploading it cloudinary", video);
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }
  try {
    const video = await Video.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(String(videoId)) },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                avatar: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
    ]);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    console.error("Error while finding video:", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while fetching the video"
    );
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }
  if (!title?.trim()) {
    throw new ApiError(400, "title is required");
  }
  if (!description?.trim()) {
    throw new ApiError(400, "description is required");
  }
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found!");
    }
    video.title = title;
    video.description = description;

    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {
      const newThumbnail = await uploadFileToCloudinary(thumbnailLocalPath);
      if (newThumbnail) {
        await deleteFileFromCloudinary(video.thumbnail); // delete old thumbnail
        video.thumbnail = newThumbnail.url;
      }
    }
    await video.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Update video edtails successfully"));
  } catch (error) {
    throw new ApiError(
      error?.status || 500,
      error?.message || "Something went wrong while updating video details"
    );
  }
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  try {
    const video = await Video.findById(videoId);
    console.log("video deleted", video);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    await Promise.all([
      await deleteFileFromCloudinary(video.videoFile, true),
      await deleteFileFromCloudinary(video.thumbnail),
    ]);
    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) {
      throw new ApiResponse(500, "Something went wrong while deleting video.");
    }
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while deleting video"
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }
  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "Video not found!");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !existingVideo.isPublished } },
    { new: true }
  );
  const publishedStatus = updatedVideo.isPublished
    ? "published"
    : "unpublished";
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, `video ${publishedStatus}`));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
