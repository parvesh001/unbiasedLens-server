const multer = require("multer");
const sharp = require("sharp");
const Author = require("../Models/authorModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filterObj");
const { setFileToS3Bucket, deleteFileFromS3Bucket } = require("../Utils/S3Bucket");

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
    mimetype,
    next
  );

  //Set file to mongodb
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  await Author.findByIdAndUpdate(req.author._id, { photo: imageUrl });

  //Send response
  res.status(200).json({ status: "success", message: "file uploaded" });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  //First delete exiting one
  await deleteFileFromS3Bucket(req.author.photo, next);

  //Then, upload new one
  const { fileName, processedBuffer, mimetype } = req.file;

  //Set file to bucket
  await setFileToS3Bucket(
    process.env.S3_BUCKET_NAME,
    fileName,
    processedBuffer,
    mimetype,
    next
  );

  //Set file to mongodb
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  await Author.findByIdAndUpdate(req.author._id, { photo: imageUrl });

  //Send back response
  res.status(200).json({ status: "success", message: "profile updated" });
});

exports.deleteProfile = catchAsync(async (req, res, next) => {
  await deleteFileFromS3Bucket(req.author.photo, next);
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/authors/default.jpg`;
  await Author.findByIdAndUpdate(req.author._id, { photo: imageUrl });
  res
    .status(200)
    .json({ status: "success", message: "Profile picture deleted." });
});

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
  const authors = await Author.find();
  res.status(200).json({ status: "success", data: { authors } });
});

exports.blockAuthor = catchAsync(async (req, res, next) => {
  await blockUnblockAuthor(req);
  res.status(200).json({ status: "success", message: "Author blocked" });
});
exports.unblockAuthor = catchAsync(async (req, res, next) => {
  await blockUnblockAuthor(req);
  res.status(200).json({ status: "success", message: "Author unblocked" });
});
