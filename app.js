//Third party packages
const express = require("express");
const cors = require("cors");

//Local files
const globalErrorHandler = require('./Controllers/globalErrorController')

//Required Routers
const authorRouter = require("./Routes/authorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

//Routers
app.use("/api/v1/authors", authorRouter);

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
