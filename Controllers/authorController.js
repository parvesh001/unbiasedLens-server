const multer = require("multer");
const sharp = require("sharp");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const Author = require("../Models/authorModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

//creating client instance
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_REGION,
});

//defining storage
const storage = multer.memoryStorage();

//defining filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("file is not an image", 400), false);
  }
};

//helper functions
async function setFileToCloudAndDB(fileName, buffer, mimetype, authorId) {
  //set image to cloud and db
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: mimetype,
  };
  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  await Author.findByIdAndUpdate(authorId, { photo: imageUrl });
}
//delete file from cloud
async function deleteCloudFile(url) {
  const parts = url.split('amazonaws.com/');
  const key = parts[1]
  const deleteParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };
  const deleteCommand = new DeleteObjectCommand(deleteParams);
  await s3Client.send(deleteCommand);
}

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
  await setFileToCloudAndDB(
    fileName,
    processedBuffer,
    mimetype,
    req.author._id
  );
  res.status(200).json({ status: "success", message: "file uploaded" });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  //First delete exiting one
  await deleteCloudFile(req.author.photo);

  //Uploading new one
  const { fileName, processedBuffer, mimetype } = req.file;
  await setFileToCloudAndDB(
    fileName,
    processedBuffer,
    mimetype,
    req.author._id
  );
  res.status(200).json({ status: "success", message: "profile updated" });
});

exports.deleteProfile = catchAsync(async (req, res, next) => {
  await deleteCloudFile(req.author.photo);
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/default.jpg`;
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
