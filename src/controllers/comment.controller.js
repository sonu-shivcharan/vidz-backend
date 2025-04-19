import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const options = {
    page,
    limit,
    customLabels: {
      docs: "comments",
      totalDocs: "count",
    },
  };
  const comments = await Comment.aggregatePaginate(
    [
      {
        $match: { video: new mongoose.Types.ObjectId(String(videoId)) },
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
                username: 1,
                avatar: 1,
                _id: 1,
                fullName: 1,
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
        $unset: ["video"],
      },
    ],
    options
  );

  return res.json(
    new ApiResponse(200, comments, "Fetched comments successfully")
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { comment } = req.body;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if (!comment.trim()) {
    throw new ApiError(400, "Comment is required");
  }

  const userId = req.user._id;
  const newComment = await Comment.create({
    content: comment.trim(),
    owner: userId,
    video: videoId,
  });

  if (!newComment) {
    throw new ApiError(500, "Something went wrong while adding comment");
  }
  console.log(newComment);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { comment: newComment },
        "Added comment successfully."
      )
    );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  if (!comment.trim()) {
    throw new ApiError(400, "Comment is required");
  }
  try {
    const existingComment = await Comment.findById(commentId)
    if (!existingComment) {
      throw new ApiError(404, "Comment not found");
    }
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content: comment },
      { new: true }
    );

    if (!updatedComment) {
      throw new ApiError(500, "Something went wrong while updating comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { comment: updatedComment },"Updated comment successfully."));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while updating comment"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  const existingComment = await Comment.findByIdAndDelete(commentId);
  if (!existingComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Deleted comment successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
