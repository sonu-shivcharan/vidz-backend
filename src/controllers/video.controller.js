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
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
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
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      // console.log("Video not found");
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
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    const video = await Video.findByIdAndDelete(videoId);
    console.log("video deleted", video);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    if (video) {
      await Promise.all([
        await deleteFileFromCloudinary(video.videoFile, true),
        await deleteFileFromCloudinary(video.thumbnail),
      ]);
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
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );
  const publishedStatus = video.isPublished ? "published" : "unpublished";
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, video, `video ${publishedStatus}`));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
