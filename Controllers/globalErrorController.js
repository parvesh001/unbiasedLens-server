const { MulterError } = require("multer");

const AppError = require("../Utils/appError");

//Mongoose Errors
function handleCastErrorDB(err) {
  const message = `Invalid ${err.path} value:${err.value}`;
  return new AppError(message, 400);
}

function handleValidationErrorDB(err) {
  let values = Object.values(err.errors);
  values = values.map((val) => {
    if (val.name === "CastError") {
      return `Invalid ${val.path} value:${val.value}`;
    } else {
      return val.message;
    }
  });

  return new AppError(`Invalid Input:${values}`, 400);
}

function handleDuplicateKeyErrorDB(err) {
  const message = `${Object.keys(err.keyPattern)} already exist.`;
  return new AppError(message, 400);
}

//JSON WEB TOKEN ERRORS
const handleTokenExpiredError = () => {
  return new AppError("Token is expired, please login again", 401);
};
const handleJsonWebTokenError = () => {
  return new AppError("Invalid token, please login again", 401);
};

//MULTER ERRORS
const handleMulterErrors = (err) => {
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return new AppError(`The ${err.field} field is not expected`, 400);
  } else if (err.code === "LIMIT_FILE_SIZE") {
    return new AppError("File size is too large", 413);
  } else if (err.code === "LIMIT_FILE_COUNT") {
    return new AppError("Exceeded the maximum number of files allowed", 400);
  } else if (err.code === "LIMIT_FIELD_KEY") {
    return new AppError(
      "The field name size exceeds the maximum allowed limit",
      400
    );
  }else{
    return new AppError('Something went wrong while uploading file',500)
  }
};

//ERROR IN DEV MODE VS ERROR IN PROD MODE
//error in dev
function handleErrorDev(res, err) {
  res.status(err.statusCode || 500).json({
    errors: err,
    status: err.status || "error",
    message: err.message || "something went wrong",
    stack: err.stack,
  });
}
//error in prod
function handleErrorProd(res, err) {
  if (err.isOperational) {
    const { message, statusCode, status } = err;
    res.status(statusCode).json({ status, message });
  } else {
    res.status(500).json({ status: "error", message: "something went wrong" });
  }
}

//GLOBAL ERROR HANDLER
module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    handleErrorDev(res, err);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.code === 11000) error = handleDuplicateKeyErrorDB(error);
    if (err.name === "TokenExpiredError") error = handleTokenExpiredError();
    if (err.name === "JsonWebTokenError") error = handleJsonWebTokenError();
    if (err instanceof MulterError) error = handleMulterErrors(error);
    handleErrorProd(res, error);
  }
};
