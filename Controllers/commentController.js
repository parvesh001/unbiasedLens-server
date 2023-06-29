const Comment = require("../Models/commentModel");
const AppError = require("../Utils/appError");

const catchAsync = require("../Utils/catchAsync");

exports.createComment = catchAsync(async (req, res, next) => {
  const { blogPostId, content } = req.body;
  const newComment = await Comment.create({
    blogPost: blogPostId,
    author: req.author._id,
    content,
  });
  res.status(201).json({ status: "success", data: { comment: newComment } });
});

exports.getCommentsByBlogPost = catchAsync(async (req, res, next) => {
  const { blogPostId } = req.params;
  const comments = await Comment.find({ blogPost: blogPostId })
    .populate("author", "name photo") 
    .sort({ createdAt: -1 });
  res.status(200).json({ status: "success", data: { comments } });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);
  if(!comment) throw new AppError('Comment not found', 404)
  if (!comment.author.equals(req.author._id)) {
    throw new AppError("You are not authorized to perform this action", 401);
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    {runValidators:true, new: true}
  );
  res
    .status(200)
    .json({ status: "success", data: { comment: updatedComment } });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  
  const comment = await Comment.findById(commentId);
  if(!comment) throw new AppError('Comment not found', 404)
  if (!comment.author.equals(req.author._id)) {
    throw new AppError("You are not authorized to perform this action", 401);
  }

  await Comment.findByIdAndDelete(commentId);
  res.status(204).json({ status: "success", data: null });
});
