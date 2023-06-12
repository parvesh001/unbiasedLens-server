//Third party packages
const express = require("express");
const cors = require("cors");

//Local files
const globalErrorHandler = require('./Controllers/globalErrorController')

//Required Routers
const authorRouter = require("./Routes/authorRoutes");
const followRouter = require('./Routes/followRoutes');
const unfollowRouter = require('./Routes/unfollowRoutes');
const viewRouter = require('./Routes/viewRoutes');
const categoryRouter = require('./Routes/categoryRoutes')

const app = express();

app.use(cors());
app.use(express.json());

//Routers
app.use("/api/v1/authors", authorRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/unfollow", unfollowRouter);
app.use("/api/v1/view", viewRouter);
app.use("/api/v1/category", categoryRouter)

//404 handler
app.all("*", (req, res, next) => {
  
  res
    .status(404)
    .json({
      status: "fail",
      message: `The route ${req.originalUrl} is not defined`,
    });
});

app.use(globalErrorHandler);

module.exports = app;
