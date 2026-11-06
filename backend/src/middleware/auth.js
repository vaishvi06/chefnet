const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - verify access JWT, load user, check suspension and password change
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // Verify access token
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check if user still exists
  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // Check if user is suspended
  if (user.isSuspended) {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  // Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user = user;
  next();
});

/**
 * Optional authentication - sets req.user if valid token provided, otherwise leaves it null
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (user && !user.isSuspended && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
});

/**
 * Restrict access to specified roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Ensure user has verified their email address
 * Used for actions like creating subscriptions and reservations
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user || !req.user.isEmailVerified) {
    return next(
      new AppError('Please verify your email address to perform this action.', 403)
    );
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireEmailVerified
};
