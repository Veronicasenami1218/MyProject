const express = require('express');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard',
  auth,
  logActivity('report_generate', 'low'),
  asyncHandler(async (req, res) => {
    // Resource statistics
    const resourceStats = await Resource.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalResources: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalAvailable: { $sum: '$availableQuantity' },
          totalCheckedOut: { $sum: { $subtract: ['$quantity', '$availableQuantity'] } }
        }
      }
    ]);

    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .populate('user', 'username firstName lastName')
      .populate('resource', 'name type')
      .sort({ createdAt: -1 })
      .limit(10);

    // Low stock alerts
    const lowStockResources = await Resource.find({
      isActive: true,
      availableQuantity: { $lte: 2 }
    }).select('name type availableQuantity location');

    // Overdue transactions
    const overdueTransactions = await Transaction.getOverdueTransactions();

    res.json({
      success: true,
      data: {
        resources: resourceStats[0] || {
          totalResources: 0,
          totalQuantity: 0,
          totalAvailable: 0,
          totalCheckedOut: 0
        },
        users: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0
        },
        recentTransactions,
        lowStockResources,
        overdueTransactions
      }
    });
  })
);

// @route   GET /api/reports/resources
// @desc    Get detailed resource report
// @access  Private
router.get('/resources',
  auth,
  logActivity('report_generate', 'low'),
  asyncHandler(async (req, res) => {
    const { type, status, location, startDate, endDate } = req.query;

    const query = { isActive: true };

    if (type) query.type = type;
    if (status) query.status = status;
    if (location) query.location = { $regex: location, $options: 'i' };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const resources = await Resource.find(query)
      .populate('createdBy', 'username firstName lastName')
      .populate('lastModifiedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    const typeDistribution = await Resource.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          availableQuantity: { $sum: '$availableQuantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const statusDistribution = await Resource.aggregate([
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
        resources,
        typeDistribution,
        statusDistribution,
        summary: {
          totalResources: resources.length,
          totalQuantity: resources.reduce((sum, r) => sum + r.quantity, 0),
          totalAvailable: resources.reduce((sum, r) => sum + r.availableQuantity, 0)
        }
      }
    });
  })
);

// @route   GET /api/reports/transactions
// @desc    Get detailed transaction report
// @access  Private
router.get('/transactions',
  auth,
  logActivity('report_generate', 'low'),
  asyncHandler(async (req, res) => {
    const { type, status, userId, resourceId, startDate, endDate } = req.query;

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

    const transactions = await Transaction.find(query)
      .populate('user', 'username firstName lastName')
      .populate('resource', 'name type location')
      .populate('approvedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

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

    // Populate user details
    const userStatsWithDetails = await User.populate(userStats, {
      path: '_id',
      select: 'username firstName lastName'
    });

    res.json({
      success: true,
      data: {
        transactions,
        typeStats,
        topUsers: userStatsWithDetails,
        summary: {
          totalTransactions: transactions.length,
          totalQuantity: transactions.reduce((sum, t) => sum + t.quantity, 0)
        }
      }
    });
  })
);

// @route   GET /api/reports/activity
// @desc    Get activity log report
// @access  Private (Admin only)
router.get('/activity',
  auth,
  authorize('admin'),
  logActivity('report_generate', 'low'),
  asyncHandler(async (req, res) => {
    const { category, action, severity, startDate, endDate, limit = 100 } = req.query;

    const query = {};

    if (category) query.category = category;
    if (action) query.action = action;
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'username firstName lastName')
      .populate('resource', 'name type')
      .populate('targetUser', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const categoryStats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const severityStats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const userActivityStats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user',
          activityCount: { $sum: 1 }
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ]);

    const userActivityWithDetails = await User.populate(userActivityStats, {
      path: '_id',
      select: 'username firstName lastName'
    });

    res.json({
      success: true,
      data: {
        activities,
        categoryStats,
        severityStats,
        topUsers: userActivityWithDetails,
        summary: {
          totalActivities: activities.length
        }
      }
    });
  })
);

// @route   GET /api/reports/export/:type
// @desc    Export report data
// @access  Private
router.get('/export/:type',
  auth,
  logActivity('report_export', 'low'),
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    let data;
    let filename;

    switch (type) {
      case 'resources':
        const query = { isActive: true };
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) query.createdAt.$gte = new Date(startDate);
          if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        data = await Resource.find(query).populate('createdBy', 'username');
        filename = `resources-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'transactions':
        const txnQuery = {};
        if (startDate || endDate) {
          txnQuery.createdAt = {};
          if (startDate) txnQuery.createdAt.$gte = new Date(startDate);
          if (endDate) txnQuery.createdAt.$lte = new Date(endDate);
        }
        data = await Transaction.find(txnQuery)
          .populate('user', 'username firstName lastName')
          .populate('resource', 'name type');
        filename = `transactions-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'activity':
        if (!['admin', 'manager'].includes(req.user.role)) {
          throw new AppError('Access denied', 403);
        }
        const activityQuery = {};
        if (startDate || endDate) {
          activityQuery.createdAt = {};
          if (startDate) activityQuery.createdAt.$gte = new Date(startDate);
          if (endDate) activityQuery.createdAt.$lte = new Date(endDate);
        }
        data = await ActivityLog.find(activityQuery)
          .populate('user', 'username firstName lastName')
          .populate('resource', 'name type');
        filename = `activity-report-${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        throw new AppError('Invalid report type', 400);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvData);
    }

    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({
      success: true,
      data,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username
    });
  })
);

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

module.exports = router; 