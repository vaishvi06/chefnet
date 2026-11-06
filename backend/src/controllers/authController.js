const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateRandomToken
} = require('../utils/token');
const emailService = require('../services/emailService');
const env = require('../config/env');

const setRefreshTokenCookie = (res, rawRefreshToken) => {
  res.cookie('refreshToken', rawRefreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * Register Customer or Chef
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, address, kitchenName } = req.body;

  if (role === 'admin') {
    return next(new AppError('Admin registration is not allowed through this endpoint.', 403));
  }

  // Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  const passwordHash = await bcrypt.hash(password, salt);

  // Email verification token
  const rawVerifyToken = generateRandomToken();
  const emailVerifyTokenHash = hashToken(rawVerifyToken);
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Initial user doc
  const userData = {
    name,
    email,
    passwordHash,
    role,
    phone: phone || null,
    address: address || null,
    isEmailVerified: false,
    emailVerifyTokenHash,
    emailVerifyExpires
  };

  if (role === 'chef') {
    userData.chefProfile = {
      kitchenName: kitchenName || `${name}'s Kitchen`,
      isVerified: false,
      verificationStatus: 'pending',
      availabilityStatus: 'accepting'
    };
  }

  const user = await User.create(userData);

  // Send verification email
  await emailService.sendVerificationEmail(user.email, rawVerifyToken);

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens.push({
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpires,
    userAgent: req.headers['user-agent'] || ''
  });
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, rawRefreshToken);

  return sendResponse(
    res,
    201,
    'Registration successful. Please verify your email using the link sent to your inbox.',
    {
      user,
      accessToken
    }
  );
});

/**
 * Login User
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select(
    '+passwordHash +failedLoginAttempts +lockUntil +refreshTokens'
  );

  // Generic invalid message
  const genericAuthError = new AppError('Invalid email or password', 401);

  if (!user) {
    return next(genericAuthError);
  }

  // Check account lockout
  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
    return next(
      new AppError(
        `Account is temporarily locked due to repeated failed attempts. Please try again after ${minutesLeft} minute(s).`,
        403
      )
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      user.failedLoginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    return next(genericAuthError);
  }

  // Check suspension
  if (user.isSuspended) {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  // Reset failed attempts on successful password
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  // Token generation and rotation
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Prune expired tokens
  const activeTokens = (user.refreshTokens || []).filter(
    (t) => t.expiresAt && t.expiresAt > new Date()
  );

  activeTokens.push({
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpires,
    userAgent: req.headers['user-agent'] || ''
  });

  user.refreshTokens = activeTokens;
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, rawRefreshToken);

  return sendResponse(res, 200, 'Logged in successfully', {
    user,
    accessToken
  });
});

/**
 * Refresh Access Token with Token Rotation
 */
const refresh = asyncHandler(async (req, res, next) => {
  const presentedToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!presentedToken) {
    return next(new AppError('Refresh token required', 401));
  }

  const tokenHash = hashToken(presentedToken);

  // Find user that has this token
  const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash }).select(
    '+refreshTokens'
  );

  if (!user) {
    // If not found, possible token reuse/theft: clear cookie
    res.clearCookie('refreshToken');
    return next(new AppError('Invalid refresh token. Please log in again.', 401));
  }

  if (user.isSuspended) {
    res.clearCookie('refreshToken');
    return next(new AppError('Your account has been suspended.', 403));
  }

  const tokenIndex = user.refreshTokens.findIndex((t) => t.tokenHash === tokenHash);
  const existingToken = user.refreshTokens[tokenIndex];

  if (!existingToken || existingToken.expiresAt < new Date()) {
    // Token expired or invalid: remove it
    user.refreshTokens.splice(tokenIndex, 1);
    await user.save({ validateBeforeSave: false });
    res.clearCookie('refreshToken');
    return next(new AppError('Refresh token expired. Please log in again.', 401));
  }

  // Rotate: remove used token, generate new refresh token
  user.refreshTokens.splice(tokenIndex, 1);

  const newAccessToken = generateAccessToken(user);
  const newRawRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRawRefreshToken);
  const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens.push({
    tokenHash: newRefreshTokenHash,
    expiresAt: newExpires,
    userAgent: req.headers['user-agent'] || ''
  });

  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, newRawRefreshToken);

  return sendResponse(res, 200, 'Token refreshed successfully', {
    accessToken: newAccessToken
  });
});

/**
 * Logout User
 */
const logout = asyncHandler(async (req, res, next) => {
  const presentedToken = req.cookies.refreshToken || req.body.refreshToken;

  if (presentedToken) {
    const tokenHash = hashToken(presentedToken);
    await User.updateOne(
      { 'refreshTokens.tokenHash': tokenHash },
      { $pull: { refreshTokens: { tokenHash } } }
    );
  }

  res.clearCookie('refreshToken');
  return sendResponse(res, 200, 'Logged out successfully');
});

/**
 * Verify Email with Token
 */
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    emailVerifyTokenHash: tokenHash,
    emailVerifyExpires: { $gt: new Date() }
  }).select('+emailVerifyTokenHash +emailVerifyExpires');

  if (!user) {
    return next(new AppError('Invalid or expired email verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerifyTokenHash = null;
  user.emailVerifyExpires = null;
  await user.save({ validateBeforeSave: false });

  return sendResponse(res, 200, 'Email verified successfully', {
    isEmailVerified: true
  });
});

/**
 * Resend Email Verification Token
 */
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user && !user.isEmailVerified) {
    const rawVerifyToken = generateRandomToken();
    user.emailVerifyTokenHash = hashToken(rawVerifyToken);
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await emailService.sendVerificationEmail(user.email, rawVerifyToken);
  }

  return sendResponse(
    res,
    200,
    'If your account exists and is unverified, a new verification link has been sent.'
  );
});

/**
 * Forgot Password - Send Reset Token
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const rawResetToken = generateRandomToken();
    user.passwordResetTokenHash = hashToken(rawResetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordResetEmail(user.email, rawResetToken);
  }

  // Always return identical message
  return sendResponse(
    res,
    200,
    'If an account with that email exists, a password reset link has been sent.'
  );
});

/**
 * Reset Password with Token
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordResetTokenHash +passwordResetExpires +refreshTokens');

  if (!user) {
    return next(new AppError('Invalid or expired password reset token', 400));
  }

  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  user.passwordHash = await bcrypt.hash(password, salt);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  // Single use: revokes all refresh tokens
  user.refreshTokens = [];
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  await user.save({ validateBeforeSave: false });

  res.clearCookie('refreshToken');

  return sendResponse(
    res,
    200,
    'Password reset successful. Please log in with your new password.'
  );
});

/**
 * Change Password (for logged-in user)
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash +refreshTokens');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 401));
  }

  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChangedAt = new Date();
  // Invalidate all other sessions
  user.refreshTokens = [];

  // Generate new tokens for this current session
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens.push({
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpires,
    userAgent: req.headers['user-agent'] || ''
  });

  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, rawRefreshToken);

  return sendResponse(res, 200, 'Password changed successfully', {
    accessToken
  });
});

/**
 * Get currently authenticated user profile
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('area');
  return sendResponse(res, 200, 'User profile fetched successfully', { user });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe
};
