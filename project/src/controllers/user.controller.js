import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
// step1 parse the body  and extract username password
// step2 check is user already exists
//step2 if not the create user
// send response
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
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
  console.log(files);
  const avatarLocalPath = files?.avatar[0]?.path;
  const coverImageLocalPath =
    files?.coverImage?.length > 0 ? files.coverImage[0].path : "";
  console.log("coverImag", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadFileToCloudinary(avatarLocalPath);

  let coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadFileToCloudinary(coverImageLocalPath);
    // console.log(coverImage);
  }
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  console.log("After uploading to cloudinary", avatar);
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
  console.log(email, username);
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

  const options = {
    httpOnly: true,
    secure: true,
  };
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

  const options = {
    httpOnly: true,
    secure: true,
  };
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  return res.status(200).json(new ApiResponse(200, {}, "Logout success"));
});

export { registerUser, loginUser, logoutUser };
