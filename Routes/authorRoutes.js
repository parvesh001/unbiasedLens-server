const router = require("express").Router();
const multer = require("multer");

const {
  register,
  login,
  forgetPassword,
  resetPassword,
  protect,
} = require("../Controllers/authcontroller");
const {
  getAuthor,
  uploadProfile,
  processProfile,
  setProfile,
  updateProfile,
  deleteProfile,
} = require("../Controllers/authorController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);
router.patch("/resetPassword/:resetPassToken", resetPassword);
router.get("/:authorId", getAuthor);

//From here protected APIs start
router.use(protect);

router.post("/uploadProfile", uploadProfile, processProfile, setProfile);
router.patch("/updateProfile",uploadProfile, processProfile, updateProfile);
router.delete("/deleteProfile", deleteProfile);
module.exports = router;
