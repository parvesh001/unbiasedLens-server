const Author = require("../Models/authorModel");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");

async function followUnfollow(targetId, currentAuthor, action) {
  const followedAuthor = await Author.findById(targetId);

  if (!followedAuthor) {
    return next(new AppError("Author not found", 404));
  }

  if (action === "follow") {
    const alreadyFollowed = followedAuthor.followers.findIndex(
      (followerId) => followerId.toString() === currentAuthor._id.toString()
    );

    if (alreadyFollowed !== -1) {
      throw new AppError("Author already followed", 400);
    }
    followedAuthor.followers.push(currentAuthor._id);
    await followedAuthor.save({ validateBeforeSave: false });

    currentAuthor.followings.push(targetId);
    await currentAuthor.save({ validateBeforeSave: false });
  } else {
    followedAuthor.followers.pull(currentAuthor._id);
    await followedAuthor.save({ validateBeforeSave: false });

    currentAuthor.followings.pull(targetId);
    await currentAuthor.save({ validateBeforeSave: false });
  }
}

exports.follow = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;

  await followUnfollow(authorId, req.author, "follow");
  res.status(200).json({ status: "success", message: "Author followed" });
});

exports.unfollow = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  await followUnfollow(authorId, req.author, "unfollow");
  res.status(200).json({ status: "success", message: "Author unfollowed" });
});

exports.view = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;

  const viewedAuthor = await Author.findById(authorId);
  if (!viewedAuthor) return next(new AppError("Author not found", 404));
  if (
    viewedAuthor._id.toString() !== req.author._id.toString() &&
    !viewedAuthor.profileViewers.includes(req.author._id)
  ) {
    viewedAuthor.profileViewers.push(req.author._id);
    await viewedAuthor.save({ validateBeforeSave: false });
    res.status(200).json({ status: "success" });
  }else{
    res.status(200).json({message:'already viewed or viewing your own profile'})
  }

  
});
