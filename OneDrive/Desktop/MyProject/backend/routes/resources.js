const express = require('express');
const { auth, authorize, logActivity, rateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
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
} = require('../controllers/resourceController');

const router = express.Router();

// @route   GET /api/resources
// @desc    Get all resources with filtering and pagination
// @access  Private
router.get('/',
  auth,
  logActivity('resource_view', 'low'),
  asyncHandler(getResources)
);

// @route   GET /api/resources/:id
// @desc    Get single resource
// @access  Private
router.get('/:id',
  auth,
  logActivity('resource_view', 'low'),
  asyncHandler(getResource)
);

// @route   POST /api/resources
// @desc    Create new resource
// @access  Private (Admin/Manager)
router.post('/',
  auth,
  authorize('admin', 'manager'),
  logActivity('resource_add', 'medium'),
  asyncHandler(createResource)
);

// @route   PUT /api/resources/:id
// @desc    Update resource
// @access  Private (Admin/Manager)
router.put('/:id',
  auth,
  authorize('admin', 'manager'),
  logActivity('resource_edit', 'medium'),
  asyncHandler(updateResource)
);

// @route   DELETE /api/resources/:id
// @desc    Delete resource (soft delete)
// @access  Private (Admin only)
router.delete('/:id',
  auth,
  authorize('admin'),
  logActivity('resource_delete', 'high'),
  asyncHandler(deleteResource)
);

// @route   POST /api/resources/:id/checkout
// @desc    Checkout resource
// @access  Private
router.post('/:id/checkout',
  auth,
  logActivity('checkout', 'medium'),
  asyncHandler(checkoutResource)
);

// @route   POST /api/resources/:id/checkin
// @desc    Checkin resource
// @access  Private
router.post('/:id/checkin',
  auth,
  logActivity('checkin', 'medium'),
  asyncHandler(checkinResource)
);

// @route   GET /api/resources/:id/transactions
// @desc    Get resource transaction history
// @access  Private
router.get('/:id/transactions',
  auth,
  asyncHandler(getResourceTransactions)
);

// @route   GET /api/resources/stats/overview
// @desc    Get resource statistics
// @access  Private
router.get('/stats/overview',
  auth,
  asyncHandler(getResourceStats)
);

// @route   POST /api/resources/bulk-import
// @desc    Bulk import resources (Admin only)
// @access  Private (Admin only)
router.post('/bulk-import',
  auth,
  authorize('admin'),
  logActivity('bulk_import', 'high'),
  asyncHandler(bulkImportResources)
);

// @route   GET /api/resources/alerts/low-stock
// @desc    Get low stock alerts
// @access  Private
router.get('/alerts/low-stock',
  auth,
  asyncHandler(getLowStockAlerts)
);

// @route   GET /api/resources/alerts/maintenance
// @desc    Get maintenance due alerts
// @access  Private
router.get('/alerts/maintenance',
  auth,
  asyncHandler(getMaintenanceAlerts)
);

module.exports = router; 