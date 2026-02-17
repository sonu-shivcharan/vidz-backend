import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
const healthcheck = asyncHandler(async (_req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  return res
    .status(200)
    .json(
      new ApiResponse(200, { status: "OK" }, "Server is up and running broo")
    );
});

export { healthcheck };
