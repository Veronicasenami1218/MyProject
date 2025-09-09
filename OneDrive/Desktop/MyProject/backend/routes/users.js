const express = require('express');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/',
  auth,
  authorize('admin'),
  logActivity('user_view', 'medium'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
  })
);

// @route   GET /api/users/:id
// @desc    Get single user (Admin only)
// @access  Private (Admin only)
router.get('/:id',
  auth,
  authorize('admin'),
  logActivity('user_view', 'medium'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  })
);

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin only)
router.put('/:id',
  auth,
  authorize('admin'),
  logActivity('user_edit', 'high'),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, role, department, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email is already in use', 400);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        role,
        department,
        isActive
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  })
);

// @route   DELETE /api/users/:id
// @desc    Deactivate user (Admin only)
// @access  Private (Admin only)
router.delete('/:id',
  auth,
  authorize('admin'),
  logActivity('user_delete', 'high'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      throw new AppError('Cannot deactivate your own account', 400);
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  })
);

// @route   POST /api/users/:id/reactivate
// @desc    Reactivate user (Admin only)
// @access  Private (Admin only)
router.post('/:id/reactivate',
  auth,
  authorize('admin'),
  logActivity('user_reactivate', 'high'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User reactivated successfully'
    });
  })
);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.put('/:id/reset-password',
  auth,
  authorize('admin'),
  logActivity('password_reset_admin', 'high'),
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
      throw new AppError('Please provide new password', 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (Admin only)
// @access  Private (Admin only)
router.get('/stats/overview',
  auth,
  authorize('admin'),
  asyncHandler(async (req, res) => {
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
      .select('username firstName lastName email role isActive createdAt')
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
        byRole: roleStats,
        recentUsers
      }
    });
  })
);

module.exports = router; 