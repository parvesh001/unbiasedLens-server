const router = require("express").Router();

const {
  register,
  login,
  forgetPassword,
  resetPassword,
  protect
} = require("../Controllers/authcontroller");
const { getAuthor } = require("../Controllers/authorController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);
router.patch("/resetPassword/:resetPassToken", resetPassword);
router.get("/:authorId", getAuthor);

module.exports = router;
