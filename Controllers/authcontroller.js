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

exports.login = async (req,res,next) => {
    try {
        
    } catch (err) {
        
    }
}