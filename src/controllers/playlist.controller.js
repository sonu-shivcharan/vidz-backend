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
    // {
    //     $lookup:{
    //         from:"videos",
    //         let: {videoId:"$videos._id"},
    //         pipeline:[
    //             {
    //                 $match:{
    //                     $expr:{
    //                         $in:["$video", "$$videoId"]
    //                     }
    //                 }
    //             }
    //         ],
    //         as:"video"
    //     }
    // }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylists, "Fetched playlist"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
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
  if(!doesVideoExists){
    throw new ApiError(404, "Video not found")
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
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
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
