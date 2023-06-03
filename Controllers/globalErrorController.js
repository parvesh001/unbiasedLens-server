const AppError = require("../Utils/appError");

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

function handleErrorDev(res, err) {
  res.status(err.statusCode || 500).json({
    errors: err,
    status: err.status || 'error',
    message: err.message || 'something went wrong',
    stack: err.stack,
  });
}

function handleErrorProd(res, err) {
  if (err.isOperational) {
    const { message, statusCode, status } = err;
    res.status(statusCode).json({ status, message });
  } else {
    res.status(500).json({ status: "error", message: "something went wrong" });
  }
}

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    handleErrorDev(res, err);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.code === 11000) error = handleDuplicateKeyErrorDB(error);
    handleErrorProd(res, error);
  }
};
