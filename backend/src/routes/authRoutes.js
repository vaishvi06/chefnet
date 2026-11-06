const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter
} = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resendVerificationSchema
} = require('../validators/authValidator');

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/verify-email/:token', authController.verifyEmail);

router.post(
  '/resend-verification',
  validate(resendVerificationSchema),
  authController.resendVerification
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.get('/me', authenticate, authController.getMe);

router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
