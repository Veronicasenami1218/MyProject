const Transaction = require('../models/Transaction');
const Resource = require('../models/Resource');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all transactions with filtering
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
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
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
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
};

// @desc    Approve transaction (Admin/Manager only)
// @route   PUT /api/transactions/:id/approve
// @access  Private (Admin/Manager only)
const approveTransaction = async (req, res) => {
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
};

// @desc    Reject transaction (Admin/Manager only)
// @route   PUT /api/transactions/:id/reject
// @access  Private (Admin/Manager only)
const rejectTransaction = async (req, res) => {
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
};

// @desc    Mark transaction as returned
// @route   PUT /api/transactions/:id/return
// @access  Private
const returnTransaction = async (req, res) => {
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

  // Mark transaction as returned
  await transaction.markAsReturned();

  res.json({
    success: true,
    message: 'Transaction returned successfully',
    data: { transaction }
  });
};

// @desc    Get user's active checkouts
// @route   GET /api/transactions/my-checkouts
// @access  Private
const getMyCheckouts = async (req, res) => {
  const checkouts = await Transaction.getUserActiveCheckouts(req.user._id);

  res.json({
    success: true,
    data: { checkouts }
  });
};

// @desc    Get overdue transactions
// @route   GET /api/transactions/overdue
// @access  Private
const getOverdueTransactions = async (req, res) => {
  const overdueTransactions = await Transaction.getOverdueTransactions();

  res.json({
    success: true,
    data: { overdueTransactions }
  });
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

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

  const userStats = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$user',
        transactionCount: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    },
    { $sort: { transactionCount: -1 } },
    { $limit: 10 }
  ]);

  // Get total counts
  const totalTransactions = await Transaction.countDocuments(query);
  const totalCheckouts = await Transaction.countDocuments({ ...query, type: 'checkout' });
  const totalCheckins = await Transaction.countDocuments({ ...query, type: 'checkin' });
  const pendingApprovals = await Transaction.countDocuments({ ...query, status: 'pending' });

  res.json({
    success: true,
    data: {
      overview: {
        totalTransactions,
        totalCheckouts,
        totalCheckins,
        pendingApprovals
      },
      byType: typeStats,
      byStatus: statusStats,
      topUsers: userStats
    }
  });
};

// @desc    Cancel transaction
// @route   PUT /api/transactions/:id/cancel
// @access  Private
const cancelTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Only allow cancellation of pending transactions
  if (transaction.status !== 'pending') {
    throw new AppError('Only pending transactions can be cancelled', 400);
  }

  // Only allow users to cancel their own transactions (unless admin/manager)
  if (transaction.user.toString() !== req.user._id.toString() && 
      !['admin', 'manager'].includes(req.user.role)) {
    throw new AppError('You can only cancel your own transactions', 403);
  }

  transaction.status = 'cancelled';
  await transaction.save();

  res.json({
    success: true,
    message: 'Transaction cancelled successfully',
    data: { transaction }
  });
};

module.exports = {
  getTransactions,
  getTransaction,
  approveTransaction,
  rejectTransaction,
  returnTransaction,
  getMyCheckouts,
  getOverdueTransactions,
  getTransactionStats,
  cancelTransaction
}; 