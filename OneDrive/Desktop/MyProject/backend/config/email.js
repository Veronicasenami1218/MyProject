const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to Chess in Slums Inventory System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🎉 Welcome to Chess in Slums Inventory System!</h2>
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>Your account has been successfully created and you can now access our comprehensive inventory management system.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Account Details:</h3>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Department:</strong> ${user.department || 'Not specified'}</p>
          </div>
          
          <p>You can now:</p>
          <ul>
            <li>Browse and search available resources</li>
            <li>Check out items for your projects</li>
            <li>Track your borrowed items</li>
            <li>View transaction history</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact your system administrator.</p>
          <br>
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request - Chess in Slums Inventory System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; text-align: center; margin-bottom: 30px;">🔐 Password Reset Request</h2>
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>We received a request to reset your password for the Chess in Slums Inventory System.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">Reset Token:</h3>
            <p style="font-family: monospace; background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetToken}
            </p>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This token will expire in 1 hour</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>For security, never share this token with anyone</li>
          </ul>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  checkoutNotification: (transaction, resource, user) => ({
    subject: `✅ Resource Checked Out: ${resource.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; text-align: center; margin-bottom: 30px;">📦 Resource Checked Out Successfully</h2>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">Resource Details:</h3>
            <p><strong>Resource Name:</strong> ${resource.name}</p>
            <p><strong>Type:</strong> ${resource.type}</p>
            <p><strong>Quantity:</strong> ${transaction.quantity}</p>
            <p><strong>Location:</strong> ${resource.location}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Transaction Details:</h3>
            <p><strong>Checked out by:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Checkout date:</strong> ${new Date(transaction.createdAt).toLocaleDateString()}</p>
            <p><strong>Expected return date:</strong> ${new Date(transaction.expectedReturnDate).toLocaleDateString()}</p>
            <p><strong>Purpose:</strong> ${transaction.purpose || 'Not specified'}</p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Reminder:</strong> Please ensure the resource is returned on or before the expected return date.</p>
          </div>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  returnReminder: (transaction, resource, user) => ({
    subject: `⚠️ Return Reminder: ${resource.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #ffc107; text-align: center; margin-bottom: 30px;">⏰ Return Reminder</h2>
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>This is a friendly reminder that you have a resource that needs to be returned:</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">Resource Details:</h3>
            <p><strong>Resource Name:</strong> ${resource.name}</p>
            <p><strong>Type:</strong> ${resource.type}</p>
            <p><strong>Quantity:</strong> ${transaction.quantity}</p>
            <p><strong>Location:</strong> ${resource.location}</p>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-top: 0;">Return Information:</h3>
            <p><strong>Expected return date:</strong> ${new Date(transaction.expectedReturnDate).toLocaleDateString()}</p>
            <p><strong>Days overdue:</strong> ${Math.ceil((new Date() - new Date(transaction.expectedReturnDate)) / (1000 * 60 * 60 * 24))} days</p>
            <p><strong>Checkout date:</strong> ${new Date(transaction.createdAt).toLocaleDateString()}</p>
          </div>
          
          <p><strong>Please return the resource as soon as possible to avoid any penalties.</strong></p>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  lowStockAlert: (resource) => ({
    subject: `🚨 Low Stock Alert: ${resource.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; text-align: center; margin-bottom: 30px;">⚠️ Low Stock Alert</h2>
          <p>The following resource is running low on stock and may need to be restocked soon:</p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-top: 0;">Resource Details:</h3>
            <p><strong>Resource Name:</strong> ${resource.name}</p>
            <p><strong>Type:</strong> ${resource.type}</p>
            <p><strong>Current quantity:</strong> ${resource.availableQuantity}</p>
            <p><strong>Total quantity:</strong> ${resource.quantity}</p>
            <p><strong>Location:</strong> ${resource.location}</p>
            <p><strong>Minimum threshold:</strong> ${resource.minQuantity || 5}</p>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 Action Required:</strong> Please consider restocking this resource to maintain adequate inventory levels.</p>
          </div>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  maintenanceReminder: (resource) => ({
    subject: `🔧 Maintenance Due: ${resource.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #fd7e14; text-align: center; margin-bottom: 30px;">🔧 Maintenance Reminder</h2>
          <p>The following resource is due for maintenance:</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">Resource Details:</h3>
            <p><strong>Resource Name:</strong> ${resource.name}</p>
            <p><strong>Type:</strong> ${resource.type}</p>
            <p><strong>Location:</strong> ${resource.location}</p>
            <p><strong>Maintenance Schedule:</strong> ${resource.maintenanceSchedule}</p>
            <p><strong>Last Maintenance:</strong> ${resource.lastMaintenance ? new Date(resource.lastMaintenance).toLocaleDateString() : 'Never'}</p>
            <p><strong>Next Maintenance Due:</strong> ${new Date(resource.nextMaintenance).toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 Action Required:</strong> Please schedule maintenance for this resource to ensure optimal performance.</p>
          </div>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  accountDeactivated: (user) => ({
    subject: 'Account Deactivated - Chess in Slums Inventory System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; text-align: center; margin-bottom: 30px;">🚫 Account Deactivated</h2>
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>Your account in the Chess in Slums Inventory System has been deactivated by an administrator.</p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-top: 0;">Account Information:</h3>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Department:</strong> ${user.department || 'Not specified'}</p>
          </div>
          
          <p>If you believe this was done in error or need to reactivate your account, please contact your system administrator.</p>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Chess in Slums Team</strong>
          </p>
        </div>
      </div>
    `
  })
};

// Send email function with better error handling
const sendEmail = async (to, template, data = {}) => {
  try {
    // Check if email configuration is available
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Email not sent: SMTP configuration missing');
      return { success: false, error: 'SMTP configuration missing' };
    }

    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"Chess in Slums Inventory" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send bulk emails with better error handling
const sendBulkEmails = async (recipients, template, data = {}) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient.email, template, { ...data, recipient });
      results.push({ 
        email: recipient.email, 
        success: result.success, 
        messageId: result.messageId,
        error: result.error 
      });
    } catch (error) {
      results.push({ 
        email: recipient.email, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  emailTemplates,
  testEmailConfig
}; 