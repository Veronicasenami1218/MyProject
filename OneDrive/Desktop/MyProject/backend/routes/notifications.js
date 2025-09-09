const express = require('express');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const NotificationService = require('../utils/notificationService');
const { testEmailConfig } = require('../config/email');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications
// @access  Private
router.get('/',
  auth,
  logActivity('notification_view', 'low'),
  asyncHandler(async (req, res) => {
    // This would typically fetch notifications from a database
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        notifications: [],
        message: 'Notification system is active'
      }
    });
  })
);

// @route   POST /api/notifications/test-email
// @desc    Test email configuration (Admin only)
// @access  Private (Admin only)
router.post('/test-email',
  auth,
  authorize('admin'),
  logActivity('email_test', 'medium'),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new Error('Email address is required');
    }

    // Test email configuration
    const configTest = await testEmailConfig();
    
    if (!configTest) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration is invalid. Please check your SMTP settings.'
      });
    }

    // Send a test email
    const result = await NotificationService.sendWelcomeEmail({
      email,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      role: 'user'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: { messageId: result.messageId }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  })
);

// @route   POST /api/notifications/send-overdue-reminders
// @desc    Send overdue return reminders (Admin only)
// @access  Private (Admin only)
router.post('/send-overdue-reminders',
  auth,
  authorize('admin'),
  logActivity('overdue_reminders', 'medium'),
  asyncHandler(async (req, res) => {
    const result = await NotificationService.sendOverdueNotifications();

    res.json({
      success: true,
      message: `Sent ${result.count} overdue notifications`,
      data: result
    });
  })
);

// @route   POST /api/notifications/send-low-stock-alerts
// @desc    Send low stock alerts (Admin only)
// @access  Private (Admin only)
router.post('/send-low-stock-alerts',
  auth,
  authorize('admin'),
  logActivity('low_stock_alerts', 'medium'),
  asyncHandler(async (req, res) => {
    const result = await NotificationService.sendLowStockNotifications();

    res.json({
      success: true,
      message: `Sent ${result.count} low stock notifications`,
      data: result
    });
  })
);

// @route   POST /api/notifications/send-maintenance-reminders
// @desc    Send maintenance reminders (Admin only)
// @access  Private (Admin only)
router.post('/send-maintenance-reminders',
  auth,
  authorize('admin'),
  logActivity('maintenance_reminders', 'medium'),
  asyncHandler(async (req, res) => {
    const result = await NotificationService.sendMaintenanceNotifications();

    res.json({
      success: true,
      message: `Sent ${result.count} maintenance notifications`,
      data: result
    });
  })
);

// @route   POST /api/notifications/send-daily-summary
// @desc    Send daily summary to admins (Admin only)
// @access  Private (Admin only)
router.post('/send-daily-summary',
  auth,
  authorize('admin'),
  logActivity('daily_summary', 'medium'),
  asyncHandler(async (req, res) => {
    const result = await NotificationService.sendDailySummary();

    res.json({
      success: true,
      message: 'Daily summary generated',
      data: result
    });
  })
);

// @route   GET /api/notifications/email-status
// @desc    Check email configuration status
// @access  Private (Admin only)
router.get('/email-status',
  auth,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const configTest = await testEmailConfig();
    
    const status = {
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      smtpValid: configTest,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpUser: process.env.SMTP_USER ? 'Configured' : 'Not configured'
    };

    res.json({
      success: true,
      data: status
    });
  })
);

// @route   GET /api/notifications/alerts
// @desc    Get system alerts (low stock, overdue, maintenance)
// @access  Private
router.get('/alerts',
  auth,
  asyncHandler(async (req, res) => {
    const alerts = [];

    // Low stock alerts
    const lowStockResources = await Resource.find({
      isActive: true,
      availableQuantity: { $lte: 2 }
    }).select('name type availableQuantity location');

    lowStockResources.forEach(resource => {
      alerts.push({
        type: 'low_stock',
        severity: 'medium',
        title: 'Low Stock Alert',
        message: `${resource.name} is running low (${resource.availableQuantity} available)`,
        resource: resource._id,
        resourceName: resource.name,
        createdAt: new Date()
      });
    });

    // Overdue transaction alerts
    const overdueTransactions = await Transaction.getOverdueTransactions();
    
    overdueTransactions.forEach(transaction => {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        title: 'Overdue Transaction',
        message: `${transaction.resource.name} is overdue for return`,
        transaction: transaction._id,
        resourceName: transaction.resource.name,
        user: transaction.user,
        dueDate: transaction.expectedReturnDate,
        createdAt: new Date()
      });
    });

    // Maintenance alerts
    const maintenanceResources = await Resource.find({
      isActive: true,
      nextMaintenance: { $lte: new Date() }
    }).select('name type nextMaintenance location');

    maintenanceResources.forEach(resource => {
      alerts.push({
        type: 'maintenance',
        severity: 'medium',
        title: 'Maintenance Due',
        message: `${resource.name} requires maintenance`,
        resource: resource._id,
        resourceName: resource.name,
        dueDate: resource.nextMaintenance,
        createdAt: new Date()
      });
    });

    res.json({
      success: true,
      data: {
        alerts: alerts.sort((a, b) => b.createdAt - a.createdAt),
        summary: {
          total: alerts.length,
          lowStock: alerts.filter(a => a.type === 'low_stock').length,
          overdue: alerts.filter(a => a.type === 'overdue').length,
          maintenance: alerts.filter(a => a.type === 'maintenance').length
        }
      }
    });
  })
);

// @route   GET /api/notifications/dashboard
// @desc    Get dashboard notifications and recent activities
// @access  Private
router.get('/dashboard',
  auth,
  asyncHandler(async (req, res) => {
    // Recent activity logs
    const recentActivities = await ActivityLog.getRecentActivities(10);

    // System notifications
    const notifications = [];

    // Check for new users (last 24 hours)
    const newUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).select('username firstName lastName createdAt');

    if (newUsers.length > 0) {
      notifications.push({
        type: 'new_users',
        title: 'New Users Registered',
        message: `${newUsers.length} new user(s) registered in the last 24 hours`,
        count: newUsers.length,
        createdAt: new Date()
      });
    }

    // Check for pending approvals
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    
    if (pendingTransactions > 0) {
      notifications.push({
        type: 'pending_approvals',
        title: 'Pending Approvals',
        message: `${pendingTransactions} transaction(s) awaiting approval`,
        count: pendingTransactions,
        createdAt: new Date()
      });
    }

    // Check for system health
    const totalResources = await Resource.countDocuments({ isActive: true });
    const lowStockCount = await Resource.countDocuments({
      isActive: true,
      availableQuantity: { $lte: 2 }
    });

    if (lowStockCount > 0) {
      notifications.push({
        type: 'system_health',
        title: 'System Health Alert',
        message: `${lowStockCount} out of ${totalResources} resources are running low on stock`,
        severity: 'warning',
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        recentActivities,
        notifications: notifications.sort((a, b) => b.createdAt - a.createdAt),
        summary: {
          totalNotifications: notifications.length,
          totalActivities: recentActivities.length
        }
      }
    });
  })
);

module.exports = router; 