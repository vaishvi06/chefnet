const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign 15-minute access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generate 7-day raw refresh token string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash raw token with SHA-256 for secure DB storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a cryptographically secure random token (e.g. for email verify or password reset)
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateRandomToken
};
