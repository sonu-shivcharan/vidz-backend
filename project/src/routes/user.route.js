import Router from "express"
import {changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser
)


router.route("/login").post(loginUser);
router.route("/test").get((req, res)=>{
    return res.json({message:"Tets"})
})
// secured routes 

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/change-password").patch(verifyJWT, changePassword);
router.route("/update").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").post(verifyJWT, upload.fields([{
    name:"avatar",
    maxCount:1
}]), updateUserAvatar);

export default router;