const express = require('express');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Transaction = require('../models/Transaction');
const Resource = require('../models/Resource');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions with filtering
// @access  Private
router.get('/',
  auth,
  logActivity('transaction_view', 'low'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      userId,
      resourceId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (resourceId) query.resource = resourceId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(query)
      .populate('user', 'username firstName lastName')
      .populate('resource', 'name type location')
      .populate('approvedBy', 'username firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
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

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id',
  auth,
  logActivity('transaction_view', 'low'),
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'username firstName lastName')
      .populate('resource', 'name type location')
      .populate('approvedBy', 'username firstName lastName');

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({
      success: true,
      data: { transaction }
    });
  })
);

// @route   PUT /api/transactions/:id/approve
// @desc    Approve transaction (Admin/Manager only)
// @access  Private (Admin/Manager only)
router.put('/:id/approve',
  auth,
  authorize('admin', 'manager'),
  logActivity('checkout_approve', 'medium'),
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== 'pending') {
      throw new AppError('Transaction is not pending approval', 400);
    }

    if (transaction.type === 'checkout') {
      const resource = await Resource.findById(transaction.resource);
      
      if (!resource.canCheckout(transaction.quantity)) {
        throw new AppError(`Cannot approve checkout. Insufficient quantity available.`, 400);
      }

      resource.checkout(transaction.quantity);
      await resource.save();
    }

    transaction.status = 'approved';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction approved successfully',
      data: { transaction }
    });
  })
);

// @route   PUT /api/transactions/:id/reject
// @desc    Reject transaction (Admin/Manager only)
// @access  Private (Admin/Manager only)
router.put('/:id/reject',
  auth,
  authorize('admin', 'manager'),
  logActivity('checkout_reject', 'medium'),
  asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== 'pending') {
      throw new AppError('Transaction is not pending approval', 400);
    }

    transaction.status = 'rejected';
    transaction.rejectionReason = rejectionReason;
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction rejected successfully',
      data: { transaction }
    });
  })
);

// @route   PUT /api/transactions/:id/return
// @desc    Mark transaction as returned
// @access  Private
router.put('/:id/return',
  auth,
  logActivity('checkin', 'medium'),
  asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.type !== 'checkout') {
      throw new AppError('Only checkout transactions can be returned', 400);
    }

    if (transaction.status !== 'approved') {
      throw new AppError('Transaction is not approved', 400);
    }

    if (transaction.actualReturnDate) {
      throw new AppError('Transaction has already been returned', 400);
    }

    // Update resource
    const resource = await Resource.findById(transaction.resource);
    resource.checkin(transaction.quantity);
    await resource.save();

    // Mark as returned
    await transaction.markAsReturned();

    // Create return transaction
    const returnTransaction = await Transaction.create({
      resource: transaction.resource,
      user: req.user._id,
      type: 'checkin',
      quantity: transaction.quantity,
      notes,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Transaction returned successfully',
      data: { 
        originalTransaction: transaction,
        returnTransaction 
      }
    });
  })
);

// @route   GET /api/transactions/overdue
// @desc    Get overdue transactions
// @access  Private
router.get('/overdue',
  auth,
  asyncHandler(async (req, res) => {
    const overdueTransactions = await Transaction.getOverdueTransactions();

    res.json({
      success: true,
      data: { transactions: overdueTransactions }
    });
  })
);

// @route   GET /api/transactions/my-checkouts
// @desc    Get current user's active checkouts
// @access  Private
router.get('/my-checkouts',
  auth,
  asyncHandler(async (req, res) => {
    const checkouts = await Transaction.getUserActiveCheckouts(req.user._id);

    res.json({
      success: true,
      data: { checkouts }
    });
  })
);

// @route   GET /api/transactions/stats/overview
// @desc    Get transaction statistics
// @access  Private
router.get('/stats/overview',
  auth,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalCheckouts: { $sum: { $cond: [{ $eq: ['$type', 'checkout'] }, 1, 0] } },
          totalCheckins: { $sum: { $cond: [{ $eq: ['$type', 'checkin'] }, 1, 0] } },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const typeStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const statusStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalTransactions: 0,
          totalCheckouts: 0,
          totalCheckins: 0,
          totalQuantity: 0
        },
        byType: typeStats,
        byStatus: statusStats
      }
    });
  })
);

module.exports = router; 