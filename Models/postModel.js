const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      maxLenght: [20, "Title must be under 20 words limit"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxLenght: [500, "Content must be under 500 words limit"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: [true, "Author is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
      },
    ],
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
      },
    ],
    image: {
      type: String,
      required: [true, "Image is required"],
    },
  },
  { timestamps: true }
);

blogPostSchema.index({ category: 1 });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = BlogPost;
