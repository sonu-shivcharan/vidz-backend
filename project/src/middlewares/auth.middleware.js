import jwt from "jsonwebtoken";
import ApiError from "../utils/apiErrors";
import asyncHandler from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  try {
    const token =
      (await req.cookies?.accessToken) || req.header("Authorization")?.replace("Bearer", "");
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
    throw new ApiError(
      500,
      error?.message || "Something went wrong while validating user"
    );
  }
});