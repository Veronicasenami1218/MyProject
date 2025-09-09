const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const NotificationService = require('../utils/notificationService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { username, email, password, firstName, lastName, department } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 400);
  }

  // Determine role based on email domain
  const isAdmin = email && email.endsWith('@chessinslumsafrica.com');
  const role = isAdmin ? 'admin' : 'user';

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    department,
    role
  });

  // Generate token
  const token = user.generateAuthToken();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Send welcome email
  await NotificationService.sendWelcomeEmail(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact administrator.', 401);
  }

  // Update role based on email domain (in case email was changed)
  const isAdmin = user.email && user.email.endsWith('@chessinslumsafrica.com');
  if (user.role !== (isAdmin ? 'admin' : 'user')) {
    user.role = isAdmin ? 'admin' : 'user';
    await user.save();
  }

  // Generate token
  const token = user.generateAuthToken();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  // In a more complex system, you might want to blacklist the token
  // For now, we'll just log the logout activity
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  const { firstName, lastName, department, email } = req.body;
  
  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email is already in use', 400);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName,
      lastName,
      department,
      email
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.getPublicProfile()
    }
  });
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
};

// @desc    Forgot password (send reset email)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token (in a real app, you'd send this via email)
  const resetToken = user.generateAuthToken();

  // Send reset email
  await NotificationService.sendPasswordResetEmail(user, resetToken);

  res.json({
    success: true,
    message: 'Password reset link sent to email',
    data: {
      resetToken // In production, this would be sent via email only
    }
  });
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Please provide token and new password', 400);
  }

  // Verify token and get user
  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
};

// @desc    Verify if token is valid
// @route   GET /api/auth/verify-token
// @access  Private
const verifyToken = async (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user.getPublicProfile()
    }
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyToken
}; 