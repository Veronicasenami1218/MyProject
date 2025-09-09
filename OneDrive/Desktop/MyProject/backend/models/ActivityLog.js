const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'register',
      'resource_add', 'resource_edit', 'resource_delete', 'resource_view',
      'checkout', 'checkin', 'checkout_approve', 'checkout_reject',
      'user_add', 'user_edit', 'user_delete', 'user_view',
      'report_generate', 'report_export',
      'system_config', 'backup', 'restore'
    ]
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: String,
    trim: true,
    maxlength: [500, 'Details cannot exceed 500 characters']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  category: {
    type: String,
    enum: ['authentication', 'resource_management', 'user_management', 'system', 'reporting'],
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isSuccessful: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// Virtual for formatted timestamp
activityLogSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString();
});

// Pre-save middleware to set category based on action
activityLogSchema.pre('save', function(next) {
  if (!this.category) {
    if (['login', 'logout', 'register'].includes(this.action)) {
      this.category = 'authentication';
    } else if (['resource_add', 'resource_edit', 'resource_delete', 'resource_view', 'checkout', 'checkin'].includes(this.action)) {
      this.category = 'resource_management';
    } else if (['user_add', 'user_edit', 'user_delete', 'user_view'].includes(this.action)) {
      this.category = 'user_management';
    } else if (['report_generate', 'report_export'].includes(this.action)) {
      this.category = 'reporting';
    } else {
      this.category = 'system';
    }
  }
  next();
});

// Static method to get recent activities
activityLogSchema.statics.getRecentActivities = function(limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName')
    .populate('resource', 'name type')
    .populate('targetUser', 'username firstName lastName');
};

// Static method to get user activities
activityLogSchema.statics.getUserActivities = function(userId, limit = 100) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('resource', 'name type')
    .populate('targetUser', 'username firstName lastName');
};

// Static method to get resource activities
activityLogSchema.statics.getResourceActivities = function(resourceId, limit = 100) {
  return this.find({ resource: resourceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to get activities by date range
activityLogSchema.statics.getActivitiesByDateRange = function(startDate, endDate, category = null) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'username firstName lastName')
    .populate('resource', 'name type');
};

// Static method to get critical activities
activityLogSchema.statics.getCriticalActivities = function(limit = 50) {
  return this.find({ severity: 'critical' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName')
    .populate('resource', 'name type');
};

module.exports = mongoose.model('ActivityLog', activityLogSchema); 