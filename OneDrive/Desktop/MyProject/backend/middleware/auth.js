const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Special admin check: email ends with @chessinslumsafrica.com
    const isAdmin = req.user.email && req.user.email.endsWith('@chessinslumsafrica.com');
    if (roles.includes('admin') && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required.'
      });
    }
    if (!roles.includes('admin') && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// Log activity middleware
const logActivity = (action, severity = 'low') => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      res.send = originalSend;
      
      // Log activity after response is sent
      setTimeout(async () => {
        try {
          const activityData = {
            user: req.user?._id,
            action: action,
            details: `${action} performed by ${req.user?.username || 'unknown'}`,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.session?.id,
            severity: severity,
            isSuccessful: res.statusCode < 400,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
              requestBody: req.body,
              queryParams: req.query
            }
          };

          // Add resource reference if available
          if (req.params.resourceId) {
            activityData.resource = req.params.resourceId;
          }

          // Add transaction reference if available
          if (req.params.transactionId) {
            activityData.transaction = req.params.transactionId;
          }

          // Add target user reference if available
          if (req.params.userId) {
            activityData.targetUser = req.params.userId;
          }

          await ActivityLog.create(activityData);
        } catch (error) {
          console.error('Error logging activity:', error);
        }
      }, 0);

      return originalSend.call(this, data);
    };

    next();
  };
};

// Rate limiting middleware for specific actions
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  auth,
  authorize,
  logActivity,
  rateLimit,
  optionalAuth
}; 