const jwt = require("jsonwebtoken");

const Author = require("../Models/authorModel");
const filterObj = require("../Utils/filterObj");

function signToken(userId) {
  const jsonWebTokenSecret = process.env.JSON_WEB_TOKEN_SECRET;
  const jsonWebTokenExpiresIn = process.env.JSON_WEB_TOKEN_EXPIRESIN;
  return jwt.sign({ userId }, jsonWebTokenSecret, {
    expiresIn: jsonWebTokenExpiresIn,
  });
}

//Controllers
exports.register = async (req, res, next) => {
  try {
    //filter the request body and create author
    const newAuthor = await Author.create(
      filterObj(req.body, "name", "email", "password", "confirmPassword")
    );
    // Exclude the 'password' field from the response
    newAuthor.password = undefined;
    const token = signToken(newAuthor._id);
    res.status(201).json({ status: "success", token, author: newAuthor });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  //Extract data
  //Check for email password existence
  //Check if author exist with email
  //check if author is blocked
  //check if password matches
  //All good, send back token
  const { email, password } = req.body;
  try {
    if (!email) throw new Error("Email filed is required");
    if (!password) throw new Error("Password filed is required");
    const author = await Author.findOne({ email }).select("+password");
    if (!author) throw new Error("Wrong email or password");
    if (author.blocked) throw new Error("Author is bloked");
    if (!(await author.isComparable(password, author.password)))
      throw new Error("Wrong email or password");
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
  } catch (err) {
    next(err);
  }
};
