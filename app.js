//Third party packages
const express = require("express");
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp')

//Local files
const globalErrorHandler = require("./Controllers/globalErrorController");

//Required Routers
const authorRouter = require("./Routes/authorRoutes");
const followRouter = require("./Routes/followRoutes");
const unfollowRouter = require("./Routes/unfollowRoutes");
const viewRouter = require("./Routes/viewRoutes");
const categoryRouter = require("./Routes/categoryRoutes");
const blogPostRouter = require("./Routes/postRoutes");
const commentRouter = require("./Routes/commentRoutes");

const app = express();
const rateLimiter = rateLimit({
  max:200000,
  windowMs:60*60*1000,
  message:'Too many requests!'
})

//Global Middlewares
app.use(helmet())
app.use(cors());
app.use(rateLimiter);
app.use(express.json());

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize())
//Data Sanitization against XSS
app.use(xss())
app.use(hpp({whitelist:[]}))

//Routers
app.use("/api/v1/authors", authorRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/unfollow", unfollowRouter);
app.use("/api/v1/view", viewRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/blog-posts", blogPostRouter);
app.use("/api/v1/comments", commentRouter);

//404 handler
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `The route ${req.originalUrl} is not defined`,
  });
});

app.use(globalErrorHandler);

module.exports = app;
