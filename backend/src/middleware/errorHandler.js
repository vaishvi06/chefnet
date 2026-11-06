const AppError = require('../utils/appError');
const env = require('../config/env');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const val = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value for '${field}': "${val}". Please use another value.`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message
  }));
  return new AppError('Validation failed', 400, errors);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;
  error.errors = err.errors || null;

  // Log in development
  if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
    console.error('[Error Details]:', err);
  }

  // Handle specific known error types
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Internal server error'
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  // Never leak stack trace in production
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
