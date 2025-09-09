const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) query.role = role;
  if (status) query.isActive = status === 'active';

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  const { username, firstName, lastName, email, role, isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if username or email already exists (excluding current user)
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError('Username already exists', 400);
    }
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      username,
      firstName,
      lastName,
      email,
      role,
      isActive,
      lastModifiedBy: req.user._id
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
};

// @desc    Deactivate user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deactivating self
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  // Check if user has active transactions
  const Transaction = require('../models/Transaction');
  const activeTransactions = await Transaction.find({
    user: req.params.id,
    type: 'checkout',
    status: 'completed',
    actualReturnDate: { $exists: false }
  });

  if (activeTransactions.length > 0) {
    throw new AppError('Cannot deactivate user with active checkouts', 400);
  }

  // Soft delete
  user.isActive = false;
  user.lastModifiedBy = req.user._id;
  await user.save();

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
};

// @desc    Reactivate user
// @route   POST /api/users/:id/reactivate
// @access  Private (Admin only)
const reactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isActive) {
    throw new AppError('User is already active', 400);
  }

  // Reactivate user
  user.isActive = true;
  user.lastModifiedBy = req.user._id;
  await user.save();

  res.json({
    success: true,
    message: 'User reactivated successfully',
    data: { user }
  });
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  user.password = hashedPassword;
  user.lastModifiedBy = req.user._id;
  await user.save();

  res.json({
    success: true,
    message: 'User password reset successfully'
  });
};

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Admin only)
const getUserStats = async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } }
      }
    }
  ]);

  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const recentUsers = await User.find()
    .select('username firstName lastName role createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
      },
      roleDistribution: roleStats,
      recentUsers
    }
  });
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  getUserStats
}; 