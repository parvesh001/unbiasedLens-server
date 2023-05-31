const jwt = require("jsonwebtoken");

const Author = require("../Models/authorModel");

function signToken(userId) {
  const jsonWebTokenSecret = process.env.JSON_WEB_TOKEN_SECRET;
  const jsonWebTokenExpiresIn = process.env.JSON_WEB_TOKEN_EXPIRESIN;
  return jwt.sign({ userId }, jsonWebTokenSecret, {
    expiresIn: jsonWebTokenExpiresIn,
  });
}

exports.register = async(req,res,next)=>{
     try {
        const newAuthor = await Author.create(req.body)
        // Exclude the 'password' field from the response
        newAuthor.password = undefined;
        const token = signToken(newAuthor._id)
        res.status(201).json({status:'success', token, author:newAuthor})
     } catch (err) {
        next(err)
     }
}
