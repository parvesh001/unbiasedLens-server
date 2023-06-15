router = require("express").Router();
const { protect } = require("../Controllers/authcontroller");
const {
  getCommentsByBlogPost,
  createComment,
  updateComment,
  deleteComment,
} = require("../Controllers/commentController");

router.get("/blogpost/:blogPostId", getCommentsByBlogPost);

router.use(protect);

router.post("/", createComment);
router.route("/comment/:commentId").patch(updateComment).delete(deleteComment);

module.exports = router;
