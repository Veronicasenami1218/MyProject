# Email Notifications Setup Guide

This guide explains how to set up email notifications for the Chess in Slums Inventory System.

## 📧 Email Configuration

### 1. Environment Variables

Add the following variables to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

### 3. Other Email Providers

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

#### Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

#### Custom SMTP:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## 🔔 Email Notifications

The system sends the following types of emails:

### 1. User Registration
- **When**: New user registers
- **Recipients**: New user
- **Content**: Welcome message with account details

### 2. Password Reset
- **When**: User requests password reset
- **Recipients**: User requesting reset
- **Content**: Reset token and instructions

### 3. Resource Checkout
- **When**: User checks out a resource
- **Recipients**: User who checked out the resource
- **Content**: Resource details, quantity, expected return date

### 4. Return Reminders
- **When**: Resource is overdue for return
- **Recipients**: User who checked out the resource
- **Content**: Overdue details and reminder to return

### 5. Low Stock Alerts
- **When**: Resource quantity falls below threshold
- **Recipients**: All admin and manager users
- **Content**: Resource details and restocking reminder

### 6. Maintenance Reminders
- **When**: Resource is due for maintenance
- **Recipients**: All admin and manager users
- **Content**: Maintenance schedule and due date

## ⏰ Scheduled Notifications

The system automatically sends notifications at these times (UTC):

- **9:00 AM**: Overdue return reminders
- **10:00 AM**: Low stock alerts
- **11:00 AM**: Maintenance reminders
- **6:00 PM**: Daily summary to admins

## 🧪 Testing Email Configuration

### 1. Test Email Endpoint

Send a POST request to test email configuration:

```bash
POST /api/notifications/test-email
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "email": "test@example.com"
}
```

### 2. Check Email Status

Get email configuration status:

```bash
GET /api/notifications/email-status
Authorization: Bearer YOUR_TOKEN
```

### 3. Manual Notification Triggers

Trigger notifications manually (Admin only):

```bash
# Send overdue reminders
POST /api/notifications/send-overdue-reminders

# Send low stock alerts
POST /api/notifications/send-low-stock-alerts

# Send maintenance reminders
POST /api/notifications/send-maintenance-reminders

# Send daily summary
POST /api/notifications/send-daily-summary
```

## 🔧 Troubleshooting

### Common Issues:

1. **"SMTP configuration missing"**
   - Check that all SMTP environment variables are set
   - Verify the values are correct

2. **"Authentication failed"**
   - For Gmail: Use App Password instead of regular password
   - Check that 2FA is enabled
   - Verify username and password

3. **"Connection timeout"**
   - Check firewall settings
   - Verify SMTP host and port
   - Try different port (465 for SSL, 587 for TLS)

4. **"Emails not sending"**
   - Check server logs for error messages
   - Verify email templates are working
   - Test with the test endpoint

### Debug Mode:

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will show detailed email sending logs in the console.

## 📋 Email Templates

Email templates are located in `backend/config/email.js`. You can customize:

- Email subject lines
- HTML content and styling
- Email formatting and branding

## 🔒 Security Notes

1. **Never commit email credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Enable 2FA** on email accounts used for sending
4. **Use App Passwords** instead of regular passwords
5. **Monitor email sending** for unusual activity

## 📊 Monitoring

Monitor email sending through:

1. **Server logs** - Check console output for email status
2. **Email provider logs** - Check your email provider's sending logs
3. **Database logs** - Check activity logs for email-related events

## 🚀 Production Deployment

For production:

1. **Use a reliable email service** (SendGrid, Mailgun, etc.)
2. **Set up email monitoring** and alerts
3. **Configure proper SPF/DKIM** records
4. **Monitor email deliverability** rates
5. **Set up email bounce handling**

---

For additional support, check the server logs or contact your system administrator. 