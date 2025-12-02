import Router from "express";
import {
  changePassword,
  getCurrentUser,
  getUserWatchHistory,
  getUserChannelProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.use((req,res,next)=>{
  console.log("[user]")
  next();
})
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, changePassword);
router.route("/update").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").post(
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);

router.route("/update-cover-image").post(
  verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage
);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT, getUserWatchHistory);


// router.route("/test/file").post(verifyJWT, upload.single("avatar"), test)

export default router;
