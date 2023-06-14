const sharp = require("sharp");
const multer = require("multer");

const AppError = require("../Utils/appError");
const BlogPost = require("../Models/postModel");
const catchAsync = require("../Utils/catchAsync");
const filterObj = require("../Utils/filterObj");
const Category = require("../Models/categoryModel");
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

exports.uploadFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

exports.processFile = catchAsync(async (req, res, next) => {
  //check if file exists
  if (!req.file)
    return next(new AppError("Please provide blog post image", 400));

  //check if file is under expected width and height
  const metadata = await sharp(req.file.buffer).metadata();
  const desiredWidth = 1200;
  const desiredHeight = Math.round((desiredWidth * 9) / 16);
  if (metadata.width < desiredWidth || metadata.height < desiredHeight) {
    return next(
      new AppError(
        `The height or width of image is too small, please choose another one`,
        400
      )
    );
  }

  //Now process image and proceed
  const processedBuffer = await sharp(req.file.buffer)
    .resize({
      width: desiredWidth,
      height: desiredHeight,
      fit: "contain",
    })
    .jpeg()
    .toBuffer();
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = `blogPosts/post-${req.author._id}-${uniqueSuffix}.jpg`;
  req.file.processedBuffer = processedBuffer;
  req.file.fileName = filename;
  next();
});

exports.createPost = catchAsync(async (req, res, next) => {
  const { fileName, processedBuffer, mimetype } = req.file;
  //set file to s3
  await setFileToS3Bucket(
    process.env.S3_BUCKET_NAME,
    fileName,
    processedBuffer,
    mimetype,
    next
  );

  //set data and file url in mongodb
  let newBlogPost;
  let  imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  try {
    //first check if category is expected
    let availableCategories = await Category.find();
    availableCategories = availableCategories.map((category) => category.name);
    
    if (!availableCategories.includes(req.body.category)) {
      throw new AppError(`Please select provided category`, 400);
    }

    //now, Set file url and data to the db
    const filteredObj = filterObj(req.body, "title", "content", "category");
    newBlogPost = await BlogPost.create({
      ...filteredObj,
      image: imageUrl,
      author: req.author._id,
    });
    res.status(200).json({ status: "success", data: { BlogPost: newBlogPost } });
  } catch (err) {
    //undo file upload from s3 bucket
    await deleteFileFromS3Bucket(imageUrl, next);
    next(err);
  }
});
