import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {
  generateAccessAndRefreshToken,
  ONE_DAY_IN_MS,
  options,
  SEVEN_DAYS_IN_MS,
} from "../controllers/user.controller.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization")?.replace("Bearer", "");
    console.log("verifying token");
    if (!token) {
      const refreshToken = await req.cookies?.refreshToken;
      console.log("user has refreshToken", refreshToken);
      if (!refreshToken) {
        throw new ApiError(401, "Unathorized access");
      }
      await refreshAccessToken(refreshToken, req, res);
      next();
    }
    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodeToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Inavlid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("error", error);
    throw new ApiError(
      error.statusCode,
      error?.message || "Something went wrong while validating user"
    );
  }
});

async function refreshAccessToken(refreshToken, request, response) {
  const decodedRefreshToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decodedRefreshToken?._id) {
    throw new ApiError("Session expired login again!");
  }

  const user = await User.findById(decodedRefreshToken._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  console.log("refresh token from user db", user);

  if (refreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired!");
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user._id);
  response
    .cookie("accessToken", accessToken, { ...options, maxAge: ONE_DAY_IN_MS })
    .cookie("refreshToken", newRefreshToken, {
      ...options,
      maxAge: SEVEN_DAYS_IN_MS,
    });
    request.user = user;
}