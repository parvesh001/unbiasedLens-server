const Author = require("../Models/authorModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

exports.getAuthor = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  const author = await Author.findById(authorId);
  if (!author || !author.active || author.blocked)
    return next(new AppError("Author is not found", 404));
  const postsCount = author.posts.length;
  const followersCount = author.followers.length;
  const followingsCount = author.followings.length;
  res.status(200).json({
    status: "success",
    data: {
      author: {
        name: author.name,
        email: author.email,
        photo: author.photo,
        postsCount,
        followersCount,
        followingsCount,
        createdAt: author.createdAt,
      },
    },
  });
});


exports.uploadProfile = catchAsync(async(req,res,next)=>{
  console.log(req.file.buffer)
  console.log(req.body)
  res.json({message:'ok'})
})