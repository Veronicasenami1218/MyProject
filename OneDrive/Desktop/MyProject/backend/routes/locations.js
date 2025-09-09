const express = require('express');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Resource = require('../models/Resource');

const router = express.Router();

// @route   GET /api/locations
// @desc    Get all unique locations
// @access  Private
router.get('/',
  auth,
  asyncHandler(async (req, res) => {
    const locations = await Resource.distinct('location', { isActive: true });
    
    const locationStats = await Promise.all(
      locations.map(async (location) => {
        const count = await Resource.countDocuments({ 
          location, 
          isActive: true 
        });
        const availableCount = await Resource.countDocuments({ 
          location, 
          isActive: true,
          status: 'Available'
        });
        
        return {
          name: location,
          totalResources: count,
          availableResources: availableCount
        };
      })
    );

    res.json({
      success: true,
      data: { locations: locationStats }
    });
  })
);

// @route   GET /api/locations/:location/resources
// @desc    Get resources by location
// @access  Private
router.get('/:location/resources',
  auth,
  asyncHandler(async (req, res) => {
    const { location } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { 
      location: { $regex: location, $options: 'i' }, 
      isActive: true 
    };

    const skip = (page - 1) * limit;
    const resources = await Resource.find(query)
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(query);

    res.json({
      success: true,
      data: {
        location,
        resources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  })
);

module.exports = router; 