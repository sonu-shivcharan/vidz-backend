import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;
  if (!name.trim()) {
    throw new ApiError(400, "Playlist name is required!");
  }
  if (!description.trim()) {
    throw new ApiError(400, "Playlist description is required!");
  }
  const newPlaylist = {
    name: name.trim(),
    description: description.trim(),
    owner: userId,
  };
  const playlistDoc = await Playlist.create(newPlaylist);
  if (!playlistDoc) {
    throw new ApiError(500, "Error while creating playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: playlistDoc },
        "Playlist created successfully."
      )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }
  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(String(userId)),
      },
    },
    {
      $lookup: {
        from: "videos",
        let: { videoIds: "$videos" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$videoIds"] },
                  { $eq: ["$isPublished", true] },
                ],
              },
            },
          },
          {
            $project:{
              _id: 1,
              title: 1,
              description: 1,
              thumbnail: 1,
              views:1,
              owner:1,
            }
          }
        ],
        as: "videos",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {playlists:userPlaylists}, "Fetched playlist"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if(!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid playlist id")
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(playlistId)),
      },
    },
    {
      $lookup: {
        from: "videos",
        let: { videoIds: "$videos" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$videoIds"] },
                  { $eq: ["$isPublished", true] },
                ],
              },
            },
          },
          {
            $project:{
              _id: 1,
              title: 1,
              description: 1,
              thumbnail: 1,
              views:1,
              owner:1,
            }
          }
        ],
        as: "videos",
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Fetched playlist"));

});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist id.");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist id.");
  }
  const doesVideoExists = await Video.findById(videoId);
  if (!doesVideoExists) {
    throw new ApiError(404, "Video not found");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: new mongoose.Types.ObjectId(String(videoId)),
      },
    },
    { new: true }
  );
  if (!playlist) {
    throw new ApiError(404, `Playlist not found playlist id : ${playlistId}`);
  }

  return res.status(200).json(new ApiResponse(200, playlist));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid video id")
  }
  if(!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid plyalist id")
  }
  const doesVideoExists = await Video.findById(videoId);
  if(!doesVideoExists){
    throw new ApiError(404, "Video not found")
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
    {
      $pull:{
        videos: new mongoose.Types.ObjectId(String(videoId))
      }
    },
    {new: true}
  )
  if(!updatedPlaylist){
    throw new ApiError(404, "Playlist not found")
  }
  return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from Playlist"))
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  if (!name.trim()) {
    throw new ApiError(400, "Playlist name is required!");
  }
  if (!description.trim()) {
    throw new ApiError(400, "Playlist description is required!");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name.trim(),
      description: description.trim(),
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: updatedPlaylist },
        "Playlist updated successfully."
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
