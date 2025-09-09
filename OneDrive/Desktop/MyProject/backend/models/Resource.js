const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
    maxlength: [100, 'Resource name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: ['Electronics', 'Furniture', 'Office Supplies', 'Books', 'Tools', 'Other'],
    default: 'Other'
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative'],
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['Available', 'Checked Out', 'Needs Repair', 'Out of Stock', 'Discontinued'],
    default: 'Available'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  specifications: {
    type: Map,
    of: String
  },
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative']
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: [100, 'Supplier cannot exceed 100 characters']
  },
  warrantyExpiry: {
    type: Date
  },
  maintenanceSchedule: {
    type: String,
    enum: ['None', 'Monthly', 'Quarterly', 'Semi-annually', 'Annually'],
    default: 'None'
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  imageUrl: {
    type: String
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resourceSchema.index({ name: 1, type: 1 });
resourceSchema.index({ location: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ barcode: 1 });
resourceSchema.index({ tags: 1 });

// Virtual for total checked out quantity
resourceSchema.virtual('checkedOutQuantity').get(function() {
  return this.quantity - this.availableQuantity;
});

// Pre-save middleware to update available quantity
resourceSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('status')) {
    if (this.status === 'Out of Stock' || this.status === 'Discontinued') {
      this.availableQuantity = 0;
    } else if (this.availableQuantity > this.quantity) {
      this.availableQuantity = this.quantity;
    }
  }
  next();
});

// Method to check if resource is low in stock
resourceSchema.methods.isLowStock = function(threshold = 2) {
  return this.availableQuantity <= threshold;
};

// Method to check if resource is available for checkout
resourceSchema.methods.canCheckout = function(quantity = 1) {
  return this.status === 'Available' && this.availableQuantity >= quantity;
};

// Method to update quantities after checkout
resourceSchema.methods.checkout = function(quantity) {
  if (this.canCheckout(quantity)) {
    this.availableQuantity -= quantity;
    if (this.availableQuantity === 0) {
      this.status = 'Out of Stock';
    }
    return true;
  }
  return false;
};

// Method to update quantities after check-in
resourceSchema.methods.checkin = function(quantity) {
  this.availableQuantity += quantity;
  if (this.status === 'Out of Stock' && this.availableQuantity > 0) {
    this.status = 'Available';
  }
  if (this.availableQuantity > this.quantity) {
    this.availableQuantity = this.quantity;
  }
};

module.exports = mongoose.models.Resource || mongoose.model('Resource', resourceSchema); 