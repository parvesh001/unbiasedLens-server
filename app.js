//Third party packages
const express = require("express");
const cors = require("cors");

//Local files
const authorRouter = require("./Routes/authorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

//Routers
app.use("/api/v1/authors", authorRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "sth went wrong";
  const status = err.status || 'error'
  res.status(statusCode).json({status, message, error: err });
  next();
});

//404 handler
app.all("*", (req, res, next) => {
  res
    .status(404)
    .json({
      status: "fail",
      message: `The route ${req.originalUrl} is not defined`,
    });
});


module.exports = app;
