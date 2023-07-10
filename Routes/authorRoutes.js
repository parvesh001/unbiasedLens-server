const router = require("express").Router();

const {
  register,
  login,
  forgetPassword,
  resetPassword,
  protect,
  restrict,
} = require("../Controllers/authcontroller");
const {
  getAuthor,
  uploadProfile,
  processProfile,
  setProfile,
  updateProfile,
  deleteProfile,
  updateAuthor,
  getFollowers,
  getFollowings,
  getMyProfileViewers,
  getAllAuthors,
  blockAuthor,
  unblockAuthor,
  getAuthorPosts,
  getMe,
} = require("../Controllers/authorController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);
router.patch("/resetPassword/:resetPassToken", resetPassword);
router.get("/author/:authorId", getAuthor);
router.get("/author/:authorId/followers", getFollowers)
router.get("/author/:authorId/followings", getFollowings)
router.get("/author/:authorId/posts", getAuthorPosts)

//From here protected APIs start
router.use(protect);
router.get('/getMe', getMe);
router.get("/myProfileViewers", getMyProfileViewers)
router.post("/uploadProfile", uploadProfile, processProfile, setProfile);
router.patch("/updateProfile",uploadProfile, processProfile, updateProfile);
router.delete("/deleteProfile", deleteProfile);

router.patch("/updateMe", updateAuthor);

//Admin specific routes
router.use(restrict)

router.get('/', getAllAuthors);
router.patch('/author/:authorId/block', blockAuthor);
router.patch('/author/:authorId/unblock', unblockAuthor);
module.exports = router;
