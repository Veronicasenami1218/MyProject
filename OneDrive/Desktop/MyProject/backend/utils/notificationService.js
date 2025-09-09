const { sendEmail, sendBulkEmails } = require('../config/email');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');

class NotificationService {
  // Send welcome email to new users
  static async sendWelcomeEmail(user) {
    try {
      const result = await sendEmail(user.email, 'welcome', user);
      console.log(`📧 Welcome email ${result.success ? 'sent' : 'failed'} to ${user.email}`);
      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(user, resetToken) {
    try {
      const result = await sendEmail(user.email, 'passwordReset', { user, resetToken });
      console.log(`📧 Password reset email ${result.success ? 'sent' : 'failed'} to ${user.email}`);
      return result;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send checkout notification
  static async sendCheckoutNotification(transaction, resource, user) {
    try {
      const result = await sendEmail(user.email, 'checkoutNotification', { transaction, resource, user });
      console.log(`📧 Checkout notification ${result.success ? 'sent' : 'failed'} to ${user.email}`);
      return result;
    } catch (error) {
      console.error('Error sending checkout notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send return reminder
  static async sendReturnReminder(transaction, resource, user) {
    try {
      const result = await sendEmail(user.email, 'returnReminder', { transaction, resource, user });
      console.log(`📧 Return reminder ${result.success ? 'sent' : 'failed'} to ${user.email}`);
      return result;
    } catch (error) {
      console.error('Error sending return reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send low stock alert to admins/managers
  static async sendLowStockAlert(resource) {
    try {
      // Get all admin and manager users
      const admins = await User.find({ 
        role: { $in: ['admin', 'manager'] }, 
        isActive: true 
      }).select('email firstName lastName');

      if (admins.length === 0) {
        console.log('No admin users found for low stock alert');
        return { success: false, error: 'No admin users found' };
      }

      const results = await sendBulkEmails(admins, 'lowStockAlert', { resource });
      console.log(`📧 Low stock alert sent to ${admins.length} admin users`);
      return { success: true, results };
    } catch (error) {
      console.error('Error sending low stock alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send maintenance reminder to admins/managers
  static async sendMaintenanceReminder(resource) {
    try {
      // Get all admin and manager users
      const admins = await User.find({ 
        role: { $in: ['admin', 'manager'] }, 
        isActive: true 
      }).select('email firstName lastName');

      if (admins.length === 0) {
        console.log('No admin users found for maintenance reminder');
        return { success: false, error: 'No admin users found' };
      }

      const results = await sendBulkEmails(admins, 'maintenanceReminder', { resource });
      console.log(`📧 Maintenance reminder sent to ${admins.length} admin users`);
      return { success: true, results };
    } catch (error) {
      console.error('Error sending maintenance reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send account deactivation notification
  static async sendAccountDeactivationEmail(user) {
    try {
      const result = await sendEmail(user.email, 'accountDeactivated', user);
      console.log(`📧 Account deactivation email ${result.success ? 'sent' : 'failed'} to ${user.email}`);
      return result;
    } catch (error) {
      console.error('Error sending account deactivation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send overdue return notifications
  static async sendOverdueNotifications() {
    try {
      // Get all overdue transactions
      const overdueTransactions = await Transaction.getOverdueTransactions();
      
      if (overdueTransactions.length === 0) {
        console.log('No overdue transactions found');
        return { success: true, count: 0 };
      }

      const results = [];
      for (const transaction of overdueTransactions) {
        const result = await this.sendReturnReminder(
          transaction, 
          transaction.resource, 
          transaction.user
        );
        results.push(result);
      }

      console.log(`📧 Sent ${overdueTransactions.length} overdue notifications`);
      return { success: true, count: overdueTransactions.length, results };
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send low stock notifications for all low stock items
  static async sendLowStockNotifications() {
    try {
      // Get all resources with low stock
      const lowStockResources = await Resource.find({
        isActive: true,
        availableQuantity: { $lte: 2 }
      });

      if (lowStockResources.length === 0) {
        console.log('No low stock resources found');
        return { success: true, count: 0 };
      }

      const results = [];
      for (const resource of lowStockResources) {
        const result = await this.sendLowStockAlert(resource);
        results.push(result);
      }

      console.log(`📧 Sent ${lowStockResources.length} low stock notifications`);
      return { success: true, count: lowStockResources.length, results };
    } catch (error) {
      console.error('Error sending low stock notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send maintenance due notifications
  static async sendMaintenanceNotifications() {
    try {
      // Get all resources due for maintenance
      const maintenanceDueResources = await Resource.find({
        isActive: true,
        nextMaintenance: { $lte: new Date() }
      });

      if (maintenanceDueResources.length === 0) {
        console.log('No maintenance due resources found');
        return { success: true, count: 0 };
      }

      const results = [];
      for (const resource of maintenanceDueResources) {
        const result = await this.sendMaintenanceReminder(resource);
        results.push(result);
      }

      console.log(`📧 Sent ${maintenanceDueResources.length} maintenance notifications`);
      return { success: true, count: maintenanceDueResources.length, results };
    } catch (error) {
      console.error('Error sending maintenance notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send daily summary to admins
  static async sendDailySummary() {
    try {
      // Get admin users
      const admins = await User.find({ 
        role: { $in: ['admin', 'manager'] }, 
        isActive: true 
      }).select('email firstName lastName');

      if (admins.length === 0) {
        return { success: false, error: 'No admin users found' };
      }

      // Get today's statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStats = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]);

      const overdueCount = await Transaction.countDocuments({
        type: 'checkout',
        status: 'completed',
        expectedReturnDate: { $lt: new Date() },
        actualReturnDate: { $exists: false }
      });

      const lowStockCount = await Resource.countDocuments({
        isActive: true,
        availableQuantity: { $lte: 2 }
      });

      const summaryData = {
        date: today.toLocaleDateString(),
        stats: todayStats,
        overdueCount,
        lowStockCount
      };

      // For now, just log the summary (you can create a summary email template later)
      console.log('📊 Daily Summary:', summaryData);
      
      return { success: true, summary: summaryData };
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationService; 