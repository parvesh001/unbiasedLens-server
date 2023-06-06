const multer = require("multer");
const multerS3 = require("multer-s3");
const {
  S3Client,
  PutObjectCommand,
  DeleteBucketCommand,
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
const storage = multerS3({
  s3: s3Client,
  bucket: process.env.S3_BUCKET_NAME,
  // acl: 'public-read', 
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `user_${req.author._id}_${uniqueSuffix}_${file.originalname}`;
    cb(null, fileName);
  },
})

//defining filter
const fileFilter = (req,file,cb)=>{
   if(file.mimetype.startsWith('image')){
    cb(null,true)
   }else{
    cb(new AppError('file is not an image',400), false)
   }
}

exports.uploadProfile = multer({ storage, fileFilter }).single('profilePicture');

exports.processProfile = (req,res, next)=>{
  console.log(req.file)
  next()
}

exports.setProfile = catchAsync(async (req, res, next) => {
  // console.log(req)
  // console.log(req.file.buffer);
  // console.log(req.body);
  res.json({ message: "ok" });
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
