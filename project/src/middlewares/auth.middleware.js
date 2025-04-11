import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  try {
    const token =
      (await req.cookies?.accessToken) || req.header("Authorization")?.replace("Bearer", "");
      console.log("verifying token")
    if (!token) {
      throw new ApiError(401, "Unathorized access");
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
    console.log('error', error)
    throw new ApiError(
      error.statusCode,
      error?.message || "Something went wrong while validating user"
    );
  }
});