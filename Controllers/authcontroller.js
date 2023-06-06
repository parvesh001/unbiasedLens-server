const crypto = require("crypto");

const jwt = require("jsonwebtoken");


const Author = require("../Models/authorModel");
const filterObj = require("../Utils/filterObj");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const sendMail = require("../Utils/sendMail");

function signToken(userId) {
  const jsonWebTokenSecret = process.env.JSON_WEB_TOKEN_SECRET;
  const jsonWebTokenExpiresIn = process.env.JSON_WEB_TOKEN_EXPIRESIN;
  return jwt.sign({ userId }, jsonWebTokenSecret, {
    expiresIn: jsonWebTokenExpiresIn,
  });
}

//Controllers
exports.register = catchAsync(async (req, res, next) => {
  //filter the request body and create author
  const newAuthor = await Author.create(
    filterObj(req.body, "name", "email", "password", "confirmPassword")
  );
  // Exclude the 'password' field from the response
  newAuthor.password = undefined;
  const token = signToken(newAuthor._id);
  res.status(201).json({ status: "success", token, author: newAuthor });
});

exports.login = catchAsync(async (req, res, next) => {
  //Extract data
  //Check for email password existence
  //Check if author exist with email
  //check if author is blocked
  //check if password matches
  //All good, send back token
  const { email, password } = req.body;

  if (!email) return next(new AppError("Email filed is required", 400));
  if (!password) return next(new AppError("Password filed is required", 400));
  const author = await Author.findOne({ email }).select("+password");
  if (!author) return next(new AppError("Wrong email or password", 401));
  if (author.blocked) return next(new AppError("Author is bloked", 403));
  if (!(await author.isComparable(password, author.password)))
    return next(new AppError("Wrong email or password", 401));
  const token = signToken(author._id);
  const postsCount = author.posts.length;
  const followersCount = author.followers.length;
  const followingsCount = author.followings.length;
  res.status(200).json({
    status: "success",
    token,
    data: {
      author: {
        name: author.name,
        email: author.email,
        photo: author.photo,
        role: author.role,
        postsCount,
        followersCount,
        followingsCount,
        active: author.active,
        blocked: author.blocked,
        createdAt: author.createdAt,
      },
    },
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Please provide email!", 400));
  const author = await Author.findOne({ email });
  if (!author) return next(new AppError("Author do not exist", 404));

  const forgetPassToken = await author.generateAndSaveForgetPassToken();
  const url = `${process.env.FRONTEND_DOMAIN_NAME}/api/v1/authors/resetPassword/${forgetPassToken}`;
  const sender = process.env.ADMIN_EMAIL;
  const receiver = author.email;
  const subject = "Request for forgetting password.";
  const message =
    "You requested for forgetting your password. Please click bellow to forget your password and reset it.";
  const htmlContent = `<div><p>${message}</p><a href=${url}>Click here</a></div>`;

  try {
    await sendMail({ sender, receiver, subject, htmlContent });
    res.status(200).json({
      status: "success",
      message: "Email sent successfully",
    });
  } catch (err) {
    author.forgetPassToken = undefined;
    author.forgetPassExpiresIn = undefined;
    await author.save({ validateBeforeSave: false });
    return next(err);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const { resetPassToken } = req.params;

  const forgetPassTokenHashed = crypto
    .createHash("sha256")
    .update(resetPassToken)
    .digest("hex");

  const author = await Author.findOne({
    forgetPassToken: forgetPassTokenHashed,
    forgetPassExpiresIn: { $gt: Date.now() },
  });

  if (!author)
    return next(new AppError("Either token is wrong or expired!", 401));

  author.password = password;
  author.confirmPassword = confirmPassword;
  author.forgetPassExpiresIn = undefined;
  author.forgetPassToken = undefined;
  author.passwordChangedAt = Date.now() - 1000;
  await author.save();

  const token = signToken(author._id);
  const postsCount = author.posts.length;
  const followersCount = author.followers.length;
  const followingsCount = author.followings.length;
  res.status(200).json({
    status: "success",
    token,
    data: {
      author: {
        name: author.name,
        email: author.email,
        photo: author.photo,
        role: author.role,
        postsCount,
        followersCount,
        followingsCount,
        active: author.active,
        blocked: author.blocked,
        createdAt: author.createdAt,
      },
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //check if jsontoken exist
  let token;
  if (req.headers.authorization) {
    token = req.get("Authorization").split(" ")[1];
  }
  if (!token)
    return next(new AppError("You are not authorized, please login", 401));
  //if yes, verify the token and decode it to extract payload
  const { userId, iat} = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET);
  //if verified, query user with id in payload and check if author is there
  const author = await Author.findById(userId);
  if (!author) return next(new AppError("Authot no longer exist", 401));
  //check if author has changed password after issuing token
  if (author.passwordChangedAfter(iat))
    return next(new AppError("Login again, password is changed", 401));
  //if all good allow to proceed
  req.author = author;
  next();
});
