const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    blogPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPost",
      required: [true, "Blog post field is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: [true, "Author field is required"],
    },
    content: {
      type: String,
      required: [true, "Content field is required"],
    },
  },
  { timestamps: true,toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

commentSchema.index({blogPost:1} )

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
