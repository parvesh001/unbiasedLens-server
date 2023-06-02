const jwt = require("jsonwebtoken");

const Author = require("../Models/authorModel");
const filterObj = require("../Utils/filterObj");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");

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
