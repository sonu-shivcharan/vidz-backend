import { MongooseError } from "mongoose";
import ApiError from "../utils/apiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statucCode =
      error.statusCode || error instanceof MongooseError ? 400 : 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statucCode, message, error?.errors || [], error.stack);
  }
  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };
  return res.status(error.statusCode).json(response);
};
