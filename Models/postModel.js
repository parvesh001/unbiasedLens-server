const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    maxLenght:[20, "Title must be under 20 words limit"]
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    maxLenght:[500,"Content must be under 500 words limit"]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, "Author is required"]
  },
  category:{
   type:String,
   required:[true, "Category is required"]
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: [true, "Image is required"]
  }
}, {timestamps:true});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;
