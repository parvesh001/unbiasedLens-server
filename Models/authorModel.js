const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const validator = require('validator')

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Author name field is required!"],
    },
    email: {
      type: String,
      trim:true,
      lowercase:true,
      validate:[validator.isEmail, 'Please provide a valid email!'],
      required: [true, "Author email field is required!"],
      unique:[true,'Email must be unique!'],
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minLength: [6, "Password must be six characters long!"],
      //password filed will be excluded on queries not on save and create
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, "Confirming password is required!"],
      validate: {
      //only works on create and save(mongoose validation methods by default triggers by only these two methods)
      validator: function (val) {
        return val === this.password;
      },
      message: 'password must be same',
    },
    },
    role: {
      type: String,
      enum: ["author", "admin"],
      default: "author",
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }],
    followings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Authors" }],
    profileViewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Authors" }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    active: {
      type: Boolean,
      default: true,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpiresIn:Date,
  },
  {
    timestamps: true,
  }
);

//Methods
authorSchema.methods.isComparable = async function(inputPass, hasedPass){
    return await bcrypt.compare(inputPass,hasedPass)
}

//Middlewares
authorSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next()
    try {
        this.password = await bcrypt.hash(this.password,12)
        this.confirmPassword = undefined
    } catch (err) {
        console.log(err)
    }
})

module.exports = mongoose.model("Author", authorSchema);
