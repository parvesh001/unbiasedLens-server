const multer = require("multer");
const sharp = require("sharp");
const Author = require("../Models/authorModel");
const BlogPost = require("../Models/postModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filterObj");
const {
  setFileToS3Bucket,
  deleteFileFromS3Bucket,
} = require("../Utils/S3Bucket");

//defining storage
const storage = multer.memoryStorage();

//Defining filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("file is not an image", 400), false);
  }
};

//>>>>>>> HELPER FUNCTIONS >>>>>>>>>>

async function getAuthorExtraData(authorId, populateField) {
  const author = await Author.findById(authorId).populate({
    path: populateField,
    match: { blocked: false, active: true },
  });
  if (!author) throw new AppError("Author not found", 404);
  const data = author[populateField].map((data) => {
    return {
      _id: data._id,
      name: data.name,
      photo: data.photo,
      email: data.email,
    };
  });
  return data;
}

async function blockUnblockAuthor(req) {
  const { authorId } = req.params;
  const author = await Author.findById(authorId);
  if (!author) return next(new AppError("Author not found", 404));

  //Block or unblock author
  if (req.url.split("/").includes("block")) {
    author.blocked = true;
  } else {
    author.blocked = false;
  }
  await author.save({ validateBeforeSave: false });
}

//>>>>>>> CONTROLLERS >>>>>>>>>>

exports.uploadProfile = multer({ storage, fileFilter }).single(
  "profilePicture"
);

exports.processProfile = catchAsync(async (req, res, next) => {
  if (req.url === "/uploadProfile") {
    const alreadyUploaded = req.author.photo
      .split("/")
      .find((part) => part.startsWith("author-"));
    if (alreadyUploaded)
      return next(new AppError("You can not upload profile again", 400));
  }

  if (!req.file)
    return next(new AppError("Please provide profile picture", 400));
  const processedBuffer = await sharp(req.file.buffer)
    .resize({
      width: 300,
      height: 300,
      fit: "contain",
    })
    .toBuffer();
  req.file.processedBuffer = processedBuffer;
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = `authors/author-${req.author._id}-${uniqueSuffix}.jpg`;
  req.file.fileName = filename;
  next();
});

exports.setProfile = catchAsync(async (req, res, next) => {
  const { fileName, processedBuffer, mimetype } = req.file;
  //Set file to bucket
  await setFileToS3Bucket(
    process.env.S3_BUCKET_NAME,
    fileName,
    processedBuffer,
    mimetype
  );

  //Set file to mongodb
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  await Author.findByIdAndUpdate(req.author._id, { photo: imageUrl });

  //Send response
  res.status(200).json({
    status: "success",
    message: "file uploaded",
    data: { newImageUrl: imageUrl },
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  //First delete exiting one
  await deleteFileFromS3Bucket(req.author.photo);

  //Then, upload new one
  const { fileName, processedBuffer, mimetype } = req.file;

  //Set file to bucket
  await setFileToS3Bucket(
    process.env.S3_BUCKET_NAME,
    fileName,
    processedBuffer,
    mimetype
  );

  //Set file to mongodb
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  await Author.findByIdAndUpdate(req.author._id, { photo: imageUrl });

  //Send back response
  res.status(200).json({
    status: "success",
    message: "profile updated",
    data: { newImageUrl: imageUrl },
  });
});

exports.deleteProfile = catchAsync(async (req, res, next) => {
  await deleteFileFromS3Bucket(req.author.photo);
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/authors/default.jpg`;
  await Author.findByIdAndUpdate(req.author._id, { photo: imageUrl });
  res
    .status(200)
    .json({ status: "success", message: "Profile picture deleted." });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const author = await Author.findById(req.author._id)
    .populate({
      path: "profileViewers",
      select: "_id name photo email",
      match: { blocked: false, active: true },
    })
    .populate({
      path: "followers",
      select: "_id name photo email",
      match: { blocked: false, active: true },
    })
    .populate({
      path: "followings",
      select: "_id name photo email",
      match: { blocked: false, active: true },
    });
  if (!author) return next(new AppError("Author is not found", 404));
  res.status(200).json({
    status: "success",
    data: {
      author,
    },
  });
});

exports.getAuthor = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  const author = await Author.findById(authorId)
    .populate({
      path: "followers",
      select: "_id name photo email",
      match: { blocked: false, active: true },
    })
    .populate({
      path: "followings",
      select: "_id name photo email",
      match: { blocked: false, active: true },
    })
    .populate({ path: "posts", select: "-content" })
    .select("-profileViewers");

  if (!author || !author.active || author.blocked)
    return next(new AppError("Author not found", 404));

  res.status(200).json({
    status: "success",
    data: {
      author,
    },
  });
});

exports.getFollowers = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  const followers = await getAuthorExtraData(authorId, "followers");
  res.status(200).json({ status: "success", data: { followers } });
});

exports.getFollowings = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  const followings = await getAuthorExtraData(authorId, "followings");
  res.status(200).json({ status: "success", data: { followings } });
});

exports.getAuthorPosts = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const imposedLimit = limit || 6;
  const skip = (currentPage - 1) * imposedLimit;
  const authorPosts = await BlogPost.find({ author: authorId })
    .skip(skip)
    .limit(imposedLimit)
    .sort([["createdAt", "-1"]])
    .populate({ path: "author", select: "name photo email" })
    .select("-content");
  const totalDocs = await BlogPost.countDocuments({ author: authorId });
  res
    .status(200)
    .json({ status: "success", results:authorPosts.length, data: { posts: authorPosts, totalDocs } });
});

exports.updateAuthor = catchAsync(async (req, res, next) => {
  const filteredObj = filterObj(req.body, "name", "email");
  const updatedAuthor = await Author.findByIdAndUpdate(
    req.author._id,
    filteredObj,
    { new: true, runValidators: true }
  );
  res.status(200).json({ status: "success", data: { author: updatedAuthor } });
});

exports.getMyProfileViewers = catchAsync(async (req, res, next) => {
  const profileViewers = await getAuthorExtraData(
    req.author._id,
    "profileViewers"
  );
  res.status(200).json({ status: "success", data: { profileViewers } });
});

//Admin specific tasks, highly critical and restricted
exports.getAllAuthors = catchAsync(async (req, res, next) => {
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const imposedLimit = limit || 3;
  const skip = (currentPage - 1) * imposedLimit;
  const authors = await Author.find({ role: { $ne: "admin" } })
    .skip(skip)
    .limit(imposedLimit)
    .sort([["createdAt", "-1"]]);
  const totalDocs = await Author.countDocuments()
  res
    .status(200)
    .json({ status: "success", results: authors.length, data: { authors, totalDocs } });
});

exports.blockAuthor = catchAsync(async (req, res, next) => {
  await blockUnblockAuthor(req);
  res.status(200).json({ status: "success", message: "Author blocked" });
});
exports.unblockAuthor = catchAsync(async (req, res, next) => {
  await blockUnblockAuthor(req);
  res.status(200).json({ status: "success", message: "Author unblocked" });
});
