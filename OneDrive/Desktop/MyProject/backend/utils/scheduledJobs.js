const cron = require('node-cron');
const NotificationService = require('./notificationService');

class ScheduledJobs {
  constructor() {
    this.jobs = new Map();
  }

  // Initialize all scheduled jobs
  init() {
    console.log('🕐 Initializing scheduled jobs...');
    
    // Send overdue reminders daily at 9 AM
    this.scheduleOverdueReminders();
    
    // Send low stock alerts daily at 10 AM
    this.scheduleLowStockAlerts();
    
    // Send maintenance reminders daily at 11 AM
    this.scheduleMaintenanceReminders();
    
    // Send daily summary to admins at 6 PM
    this.scheduleDailySummary();
    
    console.log('✅ Scheduled jobs initialized');
  }

  // Schedule overdue return reminders
  scheduleOverdueReminders() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('📧 Running scheduled overdue reminders...');
      try {
        const result = await NotificationService.sendOverdueNotifications();
        console.log(`✅ Sent ${result.count} overdue notifications`);
      } catch (error) {
        console.error('❌ Error sending overdue notifications:', error);
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set('overdueReminders', job);
    job.start();
    console.log('📅 Scheduled overdue reminders: Daily at 9:00 AM UTC');
  }

  // Schedule low stock alerts
  scheduleLowStockAlerts() {
    const job = cron.schedule('0 10 * * *', async () => {
      console.log('📧 Running scheduled low stock alerts...');
      try {
        const result = await NotificationService.sendLowStockNotifications();
        console.log(`✅ Sent ${result.count} low stock notifications`);
      } catch (error) {
        console.error('❌ Error sending low stock notifications:', error);
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set('lowStockAlerts', job);
    job.start();
    console.log('📅 Scheduled low stock alerts: Daily at 10:00 AM UTC');
  }

  // Schedule maintenance reminders
  scheduleMaintenanceReminders() {
    const job = cron.schedule('0 11 * * *', async () => {
      console.log('📧 Running scheduled maintenance reminders...');
      try {
        const result = await NotificationService.sendMaintenanceNotifications();
        console.log(`✅ Sent ${result.count} maintenance notifications`);
      } catch (error) {
        console.error('❌ Error sending maintenance notifications:', error);
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set('maintenanceReminders', job);
    job.start();
    console.log('📅 Scheduled maintenance reminders: Daily at 11:00 AM UTC');
  }

  // Schedule daily summary
  scheduleDailySummary() {
    const job = cron.schedule('0 18 * * *', async () => {
      console.log('📧 Running scheduled daily summary...');
      try {
        const result = await NotificationService.sendDailySummary();
        console.log('✅ Daily summary generated');
      } catch (error) {
        console.error('❌ Error generating daily summary:', error);
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set('dailySummary', job);
    job.start();
    console.log('📅 Scheduled daily summary: Daily at 6:00 PM UTC');
  }

  // Manually trigger a job
  triggerJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.fireOnTick();
      return true;
    }
    return false;
  }

  // Stop a specific job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      return true;
    }
    return false;
  }

  // Start a specific job
  startJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      return true;
    }
    return false;
  }

  // Stop all jobs
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    });
  }

  // Get job status
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate()
      };
    });
    return status;
  }
}

// Create singleton instance
const scheduledJobs = new ScheduledJobs();

module.exports = scheduledJobs; 