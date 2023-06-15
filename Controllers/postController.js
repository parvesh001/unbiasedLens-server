const sharp = require("sharp");
const multer = require("multer");

const AppError = require("../Utils/appError");
const BlogPost = require("../Models/postModel");
const catchAsync = require("../Utils/catchAsync");
const filterObj = require("../Utils/filterObj");
const Category = require("../Models/categoryModel");
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

const getPosts = async (category, search) => {
  let availableCategories = await Category.find();
  availableCategories = availableCategories.map((category) => category.name);

  if (!category) {
    category = [...availableCategories];
  } else {
    category = [category];
  }
  const query = BlogPost.find({
    title: { $regex: search || "", $options: "i" },
  })
    .where("category")
    .in(category).populate({path:'author', select:'name photo'});
  return query;
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

exports.createPost = async (req, res, next) => {
  const { fileName, processedBuffer, mimetype } = req.file;

  let imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  try {
    //set file to s3
    await setFileToS3Bucket(
      process.env.S3_BUCKET_NAME,
      fileName,
      processedBuffer,
      mimetype,
      next
    );

    //first check if category is expected
    let availableCategories = await Category.find();
    availableCategories = availableCategories.map((category) => category.name);

    if (!availableCategories.includes(req.body.category)) {
      throw new AppError(`Please select provided category`, 400);
    }

    //now, Set file url and data to the db
    const filteredObj = filterObj(req.body, "title", "content", "category");
    let newBlogPost = await BlogPost.create({
      ...filteredObj,
      image: imageUrl,
      author: req.author._id,
    });
    //Set post reference inside author
    req.author.posts.push(newBlogPost._id);
    await req.author.save({ validateBeforeSave: false });
    //send response
    res
      .status(200)
      .json({ status: "success", data: { BlogPost: newBlogPost } });
  } catch (err) {
    //undo file upload from s3 bucket
    await deleteFileFromS3Bucket(imageUrl, next);
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const { postId } = req.params;
  const { fileName, processedBuffer, mimetype } = req.file;
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  try {
    // Check if the post exists
    const post = await BlogPost.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Check if the user has permission to update the post
    if (!post.author.equals(req.author._id)) {
      throw new AppError("You are not authorized to update this post", 403);
    }

    //Store the url of previous image to delete latter from cloud
    let oldImageUrl = post.image;

    // Upload the new image to the S3 bucket
    await setFileToS3Bucket(
      process.env.S3_BUCKET_NAME,
      fileName,
      processedBuffer,
      mimetype,
      next
    );

    // Update the post with the new data
    const { title, content, category } = filterObj(
      req.body,
      "title",
      "content",
      "category"
    );
    post.title = title;
    post.content = content;
    post.category = category;
    post.image = imageUrl;
    // Save the updated post
    const updatedPost = await post.save();

    // Delete the previous image from the S3 bucket
    await deleteFileFromS3Bucket(oldImageUrl, next);

    // Send the response
    res
      .status(200)
      .json({ status: "success", data: { blogPost: updatedPost } });
  } catch (err) {
    //Delete post from the cloud if there is error
    await deleteFileFromS3Bucket(imageUrl, next);
    next(err);
  }
};

exports.deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  // Find the post to be deleted
  const post = await BlogPost.findById(postId);

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  // Check if the user has permission to update the post
  if (!post.author.equals(req.author._id)) {
    throw new AppError("You are not authorized to update this post", 403);
  }

  // Delete the image from the S3 bucket
  await deleteFileFromS3Bucket(post.image, next);

  // Delete the post from the database
  await BlogPost.findByIdAndDelete(post._id);

  req.author.posts.pull(post._id);
  await req.author.save({ validateBeforeSave: false });
  res
    .status(200)
    .json({ status: "success", message: "Post deleted successfully" });
});

exports.likePost = catchAsync(async (req, res, next) => {
  const postId = req.params.postId;
  const authorId = req.author._id;

  const blogPost = await BlogPost.findById(postId);

  if (!blogPost) {
    throw new AppError("Blog post not found", 404);
  }

  // Check if the author has already liked the post
  if (blogPost.likes.includes(authorId)) {
    throw new AppError("You have already liked this post", 400);
  }

  // Check if the author has previously disliked the post
  if (blogPost.dislikes.includes(authorId)) {
    // Remove the author's dislike
    blogPost.dislikes.pull(authorId);
  }

  // Add the author's user ID to the likes array
  blogPost.likes.push(authorId);

  await blogPost.save();

  res.status(200).json({ status: "success", data: blogPost });
});

exports.dislikePost = catchAsync(async (req, res, next) => {
  const postId = req.params.postId;
  const authorId = req.author._id;

  const blogPost = await BlogPost.findById(postId);

  if (!blogPost) {
    throw new AppError("Blog post not found", 404);
  }

  // Check if the author has already disliked the post
  if (blogPost.dislikes.includes(authorId)) {
    throw new AppError("You have already disliked this post", 400);
  }

  // Check if the author has previously liked the post
  if (blogPost.likes.includes(authorId)) {
    // Remove the author's like
    blogPost.likes.pull(authorId);
  }

  // Add the author's user ID to the dislikes array
  blogPost.dislikes.push(authorId);

  await blogPost.save();

  res.status(200).json({ status: "success", data: blogPost });
});

exports.viewPost = catchAsync(async (req, res, next) => {
  const postId = req.params.postId;
  const authorId = req.author._id;

  const blogPost = await BlogPost.findById(postId);

  if (!blogPost) {
    throw new AppError("Blog post not found", 404);
  }

  // Check if the author has previously viewed the post
  if (blogPost.views.includes(authorId)) {
    return res.status(200).json({ status: "success", data: blogPost });
  }

  // Add the author's user ID to the views array
  blogPost.views.push(authorId);
  await blogPost.save();

  res.status(200).json({ status: "success", data: blogPost });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await BlogPost.findById(postId);
  if (!post) throw new AppError("Post not found", 404);
  res.status(200).json({ status: "success", data: { post } });
});

exports.getPosts = catchAsync(async (req, res, next) => {
  let { search, category } = req.query;

  const posts = await getPosts(category, search);
  res.status(200).json({ status: "success", data: { posts } });
});

exports.getPostsSuggestions = catchAsync(async (req, res, next) => {
  let { search, category } = req.query;

  const posts = await getPosts(category, search);

  const suggestions = posts.map((post) => post.title);

  res.status(200).json({ status: "success", data: { suggestions } });
});





