const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { processUserLocation } = require('../services/areaService');
const { storageService } = require('../services/storageService');

/**
 * Update authenticated user's profile
 */
const updateMe = asyncHandler(async (req, res, next) => {
  const allowedUpdates = [
    'name',
    'phone',
    'address',
    'photoUrl',
    'customerProfile',
    'chefProfile'
  ];

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Handle uploaded photo if present
  if (req.file) {
    user.photoUrl = await storageService.save(req.file);
  } else if (req.body.photoUrl) {
    user.photoUrl = req.body.photoUrl;
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.locationSource) user.locationSource = req.body.locationSource;

  if (req.body.address !== undefined) {
    // If address changed, location must be re-verified
    if (user.address !== req.body.address) {
      user.isLocationVerified = false;
      if (user.role === 'chef' && user.chefProfile) {
        user.chefProfile.verificationStatus = 'pending';
        user.chefProfile.isVerified = false;
      }
    }
    user.address = req.body.address;
  }

  // Customer profile updates
  if (req.body.dietaryPreference && user.customerProfile) {
    user.customerProfile.dietaryPreference = req.body.dietaryPreference;
  }

  // Chef profile updates
  if (user.role === 'chef' && user.chefProfile) {
    if (req.body.kitchenName) user.chefProfile.kitchenName = req.body.kitchenName;
    if (req.body.description !== undefined) user.chefProfile.description = req.body.description;
    if (req.body.operatingHours) user.chefProfile.operatingHours = req.body.operatingHours;
    if (req.body.dailyCapacity) user.chefProfile.dailyCapacity = Number(req.body.dailyCapacity);
    if (req.body.maxSubscribers) user.chefProfile.maxSubscribers = Number(req.body.maxSubscribers);
  }

  await user.save();

  return sendResponse(res, 200, 'Profile updated successfully', { user });
});

/**
 * Verify / Update user location coordinates
 */
const updateLocation = asyncHandler(async (req, res, next) => {
  let { latitude, longitude, coordinates } = req.body;

  let lat, lng;
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    lng = Number(coordinates[0]);
    lat = Number(coordinates[1]);
  } else if (latitude !== undefined && longitude !== undefined) {
    lat = Number(latitude);
    lng = Number(longitude);
  }

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return next(new AppError('Please provide valid latitude (-90 to 90) and longitude (-180 to 180)', 400));
  }

  if (req.body.locationSource) {
    req.user.locationSource = req.body.locationSource;
  }
  if (req.body.address) {
    req.user.address = req.body.address;
  }

  const result = await processUserLocation(req.user, lng, lat);

  if (!result.success) {
    return res.status(200).json({
      success: false,
      message: result.message,
      data: {
        isLocationVerified: result.isLocationVerified,
        areaActive: result.areaActive,
        waitingList: result.waitingList,
        area: result.area
      }
    });
  }

  return sendResponse(res, 200, result.message, {
    isLocationVerified: result.isLocationVerified,
    areaActive: result.areaActive,
    area: result.area,
    coordinates: [lng, lat]
  });
});

/**
 * Public profile of a chef or customer
 */
const getPublicProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const targetUser = await User.findById(id).populate('area', 'name type');
  if (!targetUser) {
    return next(new AppError('User not found', 404));
  }

  // Public sanitized response
  const publicData = {
    _id: targetUser._id,
    name: targetUser.name,
    photoUrl: targetUser.photoUrl,
    role: targetUser.role,
    ratingAverage: targetUser.ratingAverage,
    ratingCount: targetUser.ratingCount,
    trustScore: targetUser.trustScore,
    area: targetUser.area
  };

  if (targetUser.role === 'chef') {
    publicData.chefProfile = {
      kitchenName: targetUser.chefProfile.kitchenName,
      description: targetUser.chefProfile.description || '',
      kitchenCode: targetUser.chefProfile.kitchenCode,
      operatingHours: targetUser.chefProfile.operatingHours,
      dailyCapacity: targetUser.chefProfile.dailyCapacity,
      maxSubscribers: targetUser.chefProfile.maxSubscribers,
      availabilityStatus: targetUser.chefProfile.availabilityStatus,
      isVerified: targetUser.chefProfile.isVerified,
      verificationStatus: targetUser.chefProfile.verificationStatus
    };
  }

  return sendResponse(res, 200, 'Public profile fetched successfully', {
    user: publicData
  });
});

module.exports = {
  updateMe,
  updateLocation,
  getPublicProfile
};
