const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const NotificationService = require('../utils/notificationService');

// @desc    Get all resources with filtering and pagination
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    type,
    status,
    location,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  if (type) query.type = type;
  if (status) query.status = status;
  if (location) query.location = { $regex: location, $options: 'i' };

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const resources = await Resource.find(query)
    .populate('createdBy', 'username firstName lastName')
    .populate('lastModifiedBy', 'username firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Resource.countDocuments(query);

  res.json({
    success: true,
    data: {
      resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id)
    .populate('createdBy', 'username firstName lastName')
    .populate('lastModifiedBy', 'username firstName lastName');

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  res.json({
    success: true,
    data: { resource }
  });
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private (Admin/Manager)
const createResource = async (req, res) => {
  const resourceData = {
    ...req.body,
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  };

  const resource = await Resource.create(resourceData);

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    data: { resource }
  });
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Admin/Manager)
const updateResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  const updatedResource = await Resource.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastModifiedBy: req.user._id
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Resource updated successfully',
    data: { resource: updatedResource }
  });
};

// @desc    Delete resource (soft delete)
// @route   DELETE /api/resources/:id
// @access  Private (Admin only)
const deleteResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  // Check if resource is currently checked out
  const activeTransactions = await Transaction.find({
    resource: req.params.id,
    type: 'checkout',
    status: 'completed',
    actualReturnDate: { $exists: false }
  });

  if (activeTransactions.length > 0) {
    throw new AppError('Cannot delete resource that is currently checked out', 400);
  }

  // Soft delete
  resource.isActive = false;
  resource.lastModifiedBy = req.user._id;
  await resource.save();

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
};

// @desc    Checkout resource
// @route   POST /api/resources/:id/checkout
// @access  Private
const checkoutResource = async (req, res) => {
  const { quantity = 1, purpose, expectedReturnDate } = req.body;

  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  if (!resource.canCheckout(quantity)) {
    throw new AppError(`Cannot checkout ${quantity} items. Available: ${resource.availableQuantity}`, 400);
  }

  // Create transaction
  const transaction = await Transaction.create({
    resource: resource._id,
    user: req.user._id,
    type: 'checkout',
    quantity,
    purpose,
    expectedReturnDate,
    status: 'completed'
  });

  // Update resource
  resource.checkout(quantity);
  resource.lastModifiedBy = req.user._id;
  await resource.save();

  // Send checkout notification
  await NotificationService.sendCheckoutNotification(transaction, resource, req.user);

  // Check if resource is now low in stock and send alert
  if (resource.isLowStock()) {
    await NotificationService.sendLowStockAlert(resource);
  }

  res.status(201).json({
    success: true,
    message: 'Resource checked out successfully',
    data: { transaction }
  });
};

// @desc    Checkin resource
// @route   POST /api/resources/:id/checkin
// @access  Private
const checkinResource = async (req, res) => {
  const { quantity = 1, notes } = req.body;

  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  // Create transaction
  const transaction = await Transaction.create({
    resource: resource._id,
    user: req.user._id,
    type: 'checkin',
    quantity,
    notes,
    status: 'completed'
  });

  // Update resource
  resource.checkin(quantity);
  resource.lastModifiedBy = req.user._id;
  await resource.save();

  res.status(201).json({
    success: true,
    message: 'Resource checked in successfully',
    data: { transaction }
  });
};

// @desc    Get resource transaction history
// @route   GET /api/resources/:id/transactions
// @access  Private
const getResourceTransactions = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;
  const transactions = await Transaction.find({ resource: req.params.id })
    .populate('user', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Transaction.countDocuments({ resource: req.params.id });

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
};

// @desc    Get resource statistics
// @route   GET /api/resources/stats/overview
// @access  Private
const getResourceStats = async (req, res) => {
  const stats = await Resource.aggregate([
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

  const typeStats = await Resource.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const statusStats = await Resource.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const lowStockResources = await Resource.find({
    isActive: true,
    availableQuantity: { $lte: 2 }
  }).select('name type availableQuantity location');

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalResources: 0,
        totalQuantity: 0,
        totalAvailable: 0,
        totalCheckedOut: 0
      },
      byType: typeStats,
      byStatus: statusStats,
      lowStock: lowStockResources
    }
  });
};

// @desc    Bulk import resources (Admin only)
// @route   POST /api/resources/bulk-import
// @access  Private (Admin only)
const bulkImportResources = async (req, res) => {
  const { resources } = req.body;

  if (!Array.isArray(resources) || resources.length === 0) {
    throw new AppError('Please provide an array of resources', 400);
  }

  const importedResources = [];
  const errors = [];

  for (let i = 0; i < resources.length; i++) {
    try {
      const resourceData = {
        ...resources[i],
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      };

      const resource = await Resource.create(resourceData);
      importedResources.push(resource);
    } catch (error) {
      errors.push({
        index: i,
        data: resources[i],
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Successfully imported ${importedResources.length} resources`,
    data: {
      imported: importedResources.length,
      errors: errors.length,
      errorDetails: errors
    }
  });
};

// @desc    Get low stock alerts
// @route   GET /api/resources/alerts/low-stock
// @access  Private
const getLowStockAlerts = async (req, res) => {
  const { threshold = 2 } = req.query;

  const lowStockResources = await Resource.find({
    isActive: true,
    availableQuantity: { $lte: parseInt(threshold) }
  }).select('name type availableQuantity location quantity');

  res.json({
    success: true,
    data: {
      lowStockResources,
      count: lowStockResources.length,
      threshold: parseInt(threshold)
    }
  });
};

// @desc    Get maintenance due alerts
// @route   GET /api/resources/alerts/maintenance
// @access  Private
const getMaintenanceAlerts = async (req, res) => {
  const maintenanceDueResources = await Resource.find({
    isActive: true,
    nextMaintenance: { $lte: new Date() }
  }).select('name type nextMaintenance lastMaintenance maintenanceSchedule');

  res.json({
    success: true,
    data: {
      maintenanceDueResources,
      count: maintenanceDueResources.length
    }
  });
};

module.exports = {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  checkoutResource,
  checkinResource,
  getResourceTransactions,
  getResourceStats,
  bulkImportResources,
  getLowStockAlerts,
  getMaintenanceAlerts
}; 