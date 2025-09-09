const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['checkout', 'checkin', 'add', 'edit', 'delete', 'maintenance'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  previousQuantity: {
    type: Number,
    default: 0
  },
  newQuantity: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'completed'
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: [200, 'Purpose cannot exceed 200 characters']
  },
  expectedReturnDate: {
    type: Date
  },
  actualReturnDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  overdueDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ resource: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ expectedReturnDate: 1 });

// Virtual for transaction duration
transactionSchema.virtual('duration').get(function() {
  if (this.actualReturnDate && this.createdAt) {
    return Math.ceil((this.actualReturnDate - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to check for overdue items
transactionSchema.pre('save', function(next) {
  if (this.type === 'checkout' && this.expectedReturnDate) {
    const now = new Date();
    if (now > this.expectedReturnDate && this.status === 'completed') {
      this.isOverdue = true;
      this.overdueDays = Math.ceil((now - this.expectedReturnDate) / (1000 * 60 * 60 * 24));
    }
  }
  next();
});

// Method to mark transaction as returned
transactionSchema.methods.markAsReturned = function(returnDate = new Date()) {
  this.actualReturnDate = returnDate;
  this.status = 'completed';
  this.isOverdue = false;
  this.overdueDays = 0;
  return this.save();
};

// Method to check if transaction is overdue
transactionSchema.methods.checkOverdue = function() {
  if (this.type === 'checkout' && this.expectedReturnDate && this.status === 'completed') {
    const now = new Date();
    if (now > this.expectedReturnDate) {
      this.isOverdue = true;
      this.overdueDays = Math.ceil((now - this.expectedReturnDate) / (1000 * 60 * 60 * 24));
      return this.save();
    }
  }
  return Promise.resolve(this);
};

// Static method to get overdue transactions
transactionSchema.statics.getOverdueTransactions = function() {
  return this.find({
    type: 'checkout',
    status: 'completed',
    expectedReturnDate: { $lt: new Date() },
    actualReturnDate: { $exists: false }
  }).populate('resource user', 'name username email');
};

// Static method to get user's active checkouts
transactionSchema.statics.getUserActiveCheckouts = function(userId) {
  return this.find({
    user: userId,
    type: 'checkout',
    status: 'completed',
    actualReturnDate: { $exists: false }
  }).populate('resource', 'name type location');
};

module.exports = mongoose.model('Transaction', transactionSchema); 