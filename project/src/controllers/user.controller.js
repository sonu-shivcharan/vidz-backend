import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

// step1 parse the body  and extract username password
// step2 check is user already exists
//step2 if not the create user
// send response
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log("after injecting refresh token", user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // console.log(refreshToken, accessToken);

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error while generating token", error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, fullName, username } = await req.body;
  console.log("/register", email, fullName);
  if (
    [email, password, fullName, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const doesExistsUserWithEmail = await User.findOne({ email });
  const doesExistsUserWithUsename = await User.findOne({ username });
  if (doesExistsUserWithEmail) {
    throw new ApiError(409, "User with same email already exists.");
  } else if (doesExistsUserWithUsename) {
    throw new ApiError(
      409,
      `User with same username = ${username} already exists.`
    );
  }
  const files = req.files;
  const avatarLocalPath = files?.avatar?.length > 0 ? files.avatar[0].path : "";
  const coverImageLocalPath =
    files?.coverImage?.length > 0 ? files.coverImage[0].path : "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadFileToCloudinary(avatarLocalPath);

  let coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadFileToCloudinary(coverImageLocalPath);
  }
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  console.log("upload avatar success");
  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Error while registering a user");
  }
  const response = new ApiResponse(
    201,
    createdUser,
    "User registered successfully"
  );
  return res.status(201).json(response);
});

// todo for loginUser
// 1. get credentials (email, password)
// 2. check if user with email exists
// 3. if not the throw error "no account found"
// 4. if exist check for password with bcrypt
// 5. if incorrect password throw error "incorrect password"
// 6. if correct then generate tokens (accessToken, refreshToken)
// 7. send response login succes
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = await req.body;
  console.log("/login ", email, username);
  if (!(email || username)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res.cookie("accessToken", accessToken, options);
  res.cookie("refreshToken", refreshToken, options);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken,
      },
      "Login success"
    )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );
  console.log("/logout ", req.user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  return res.status(200).json(new ApiResponse(200, {}, "Logout success"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshTokenFromClient =
    (await req.cookies?.refreshToken) || (await req.body.refreshToken);
  console.log("resfreshTokenFrom client", refreshTokenFromClient);

  if (!refreshTokenFromClient) {
    console.log("token not  recieved");
    throw new ApiError(400, "Invalid refresh token");
  }
  try {
    console.log("entered try block");
    const decodedToken = jwt.verify(
      refreshTokenFromClient,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("decoded token", decodedToken);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    console.log("refresh token from user db", user);

    if (refreshTokenFromClient !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired!");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("accessToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token ");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = await req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both fields are required");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "get current user success"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = await req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { email, fullName },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "fields updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res)=>{
  const avatarLocalPath = await req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is required")
  }
  const avatar = await uploadFileToCloudinary(avatarLocalPath)
  if(!avatar?.url){
    throw new ApiError(500, "Failed to upload file to cloudinary")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new:true}
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Avatar upadted successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
  const coverImageLocalPath = await req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image is required")
  }
  const coverImage = await uploadFileToCloudinary(coverImageLocalPath)

  if(!coverImage?.url){
    throw new ApiError(500, "Failed to upload file to cloudinary")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {new:true}
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "CoverImage updated successfully"))
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};
