const express = require('express');
const { auth, authorize, logActivity, rateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyToken
} = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (but can be restricted to admin only)
router.post('/register', 
  rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  logActivity('register', 'medium'),
  asyncHandler(register)
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  logActivity('login', 'low'),
  asyncHandler(login)
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout',
  auth,
  logActivity('logout', 'low'),
  asyncHandler(logout)
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me',
  auth,
  asyncHandler(getMe)
);

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me',
  auth,
  logActivity('user_edit', 'low'),
  asyncHandler(updateMe)
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password',
  auth,
  logActivity('password_change', 'medium'),
  asyncHandler(changePassword)
);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password (send reset email)
// @access  Public
router.post('/forgot-password',
  rateLimit(3, 15 * 60 * 1000), // 3 requests per 15 minutes
  logActivity('forgot_password', 'medium'),
  asyncHandler(forgotPassword)
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
  rateLimit(3, 15 * 60 * 1000), // 3 requests per 15 minutes
  logActivity('password_reset', 'medium'),
  asyncHandler(resetPassword)
);

// @route   GET /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.get('/verify-token',
  auth,
  asyncHandler(verifyToken)
);

module.exports = router; 