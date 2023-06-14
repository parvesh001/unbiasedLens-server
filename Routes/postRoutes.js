const { protect } = require("../Controllers/authcontroller");
const {
  uploadFile,
  createPost,
  processFile,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  viewPost,
  getPost,
  getPosts,
} = require("../Controllers/postController");

const router = require("express").Router();

router.get("/", getPosts);
router.get("/post/:postId", getPost);

router.use(protect);

router.post("/", uploadFile, processFile, createPost);
router
  .route("/post/:postId")
  .patch(uploadFile, processFile, updatePost)
  .delete(deletePost);

router.put("/post/:postId/like", likePost);
router.put("/post/:postId/dislike", dislikePost);
router.put("/post/:postId/view", viewPost);

module.exports = router;
