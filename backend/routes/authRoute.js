const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  registerLimiter,
  loginLimiter,
  emailLimiter,
  passwordResetLimiter,
  verifyEmailLimiter
} = require('../middlewear/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  sanitizeInput
} = require('../middlewear/validation');
const { getCsrfToken } = require('../middlewear/csrf');
const { authenticate } = require('../middlewear/auth');

// Public routes (no authentication required)

// Register new user
router.post(
  '/register',
  sanitizeInput,
  registerLimiter,
  validateRegistration,
  authController.register
);

// Login user
router.post(
  '/login',
  sanitizeInput,
  loginLimiter,
  validateLogin,
  authController.login
);

// Verify email
router.get(
  '/verify/:token',
  verifyEmailLimiter,
  authController.verifyEmail
);

// Request password reset
router.post(
  '/forgot',
  emailLimiter,
  sanitizeInput,
  authController.forgotPassword
);

// Reset password with token
router.post(
  '/reset/:token',
  passwordResetLimiter,
  sanitizeInput,
  validatePasswordReset,
  authController.resetPassword
);

// Get CSRF token
router.get(
  '/csrf-token',
  getCsrfToken
);

// Protected routes (authentication required)

// Refresh access token
router.post(
  '/refresh',
  authenticate,
  authController.refreshToken
);

// Logout user
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// Get user profile
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

// Update user profile
router.put(
  '/profile',
  authenticate,
  sanitizeInput,
  authController.updateProfile
);

module.exports = router;
