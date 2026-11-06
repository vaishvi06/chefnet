const rateLimit = require('express-rate-limit');

const env = require('../config/env');

/**
 * General API rate limiter: max 300 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Strict login rate limiter: 10 attempts in prod, 100 in dev
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

/**
 * Strict register rate limiter: 5 accounts per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts registered from this IP, please try again after an hour.'
  }
});

/**
 * Strict forgot password limiter: 5 requests per hour per IP
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP, please try again after an hour.'
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter
};
