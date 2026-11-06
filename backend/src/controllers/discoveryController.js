const mongoose = require('mongoose');
const User = require('../models/userModel');
const Meal = require('../models/mealModel');
const DailyMenu = require('../models/dailyMenuModel');
const Subscription = require('../models/subscriptionModel');
const Area = require('../models/areaModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

/**
 * Discover home chefs within 1 km radius with filters & sorting
 */
const discoverChefs = asyncHandler(async (req, res, next) => {
  let customerLng, customerLat;

  if (req.query.lng && req.query.lat) {
    customerLng = parseFloat(req.query.lng);
    customerLat = parseFloat(req.query.lat);
  } else if (
    req.user &&
    req.user.location &&
    req.user.location.coordinates &&
    req.user.location.coordinates.length === 2 &&
    (req.user.location.coordinates[0] !== 0 || req.user.location.coordinates[1] !== 0)
  ) {
    [customerLng, customerLat] = req.user.location.coordinates;
  }

  if (customerLng === undefined || customerLat === undefined) {
    return next(
      new AppError(
        'Location required for discovery. Please verify your GPS location or provide lat and lng query params.',
        400
      )
    );
  }

  // Check if customer's area is active
  if (req.user && req.user.area) {
    const area = await Area.findById(req.user.area);
    if (area && !area.isActive) {
      return res.status(200).json({
        success: false,
        message: `Area "${area.name}" is not active yet (requires ${area.activationThreshold} approved chefs). Discovery is blocked.`,
        data: {
          areaActive: false,
          area
        }
      });
    }
  }

  const {
    category,
    minRating,
    vegOnly,
    jainOnly,
    minPrice,
    maxPrice,
    availability,
    sortBy = 'distance',
    page = 1,
    limit = 10
  } = req.query;

  const maxDist = Math.min(parseInt(req.query.maxDistance, 10) || 1000, 1000); // capped at 1 km (1000m)
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Base geoNear stage
  const matchCriteria = {
    role: 'chef',
    isLocationVerified: true,
    'chefProfile.verificationStatus': 'approved',
    isSuspended: false,
    'chefProfile.availabilityStatus': { $ne: 'paused' }
  };

  if (availability) {
    matchCriteria['chefProfile.availabilityStatus'] = availability;
  }

  if (minRating) {
    matchCriteria.ratingAverage = { $gte: parseFloat(minRating) };
  }

  // Find chefs meeting dietary/category criteria if requested
  const mealFilter = { isPaused: false, isRemoved: false };
  let mealFilterActive = false;

  if (category) {
    mealFilter.category = category;
    mealFilterActive = true;
  }
  if (vegOnly === 'true' || vegOnly === true) {
    mealFilter.isVeg = true;
    mealFilterActive = true;
  }
  if (jainOnly === 'true' || jainOnly === true) {
    mealFilter.isJain = true;
    mealFilterActive = true;
  }
  if (minPrice || maxPrice) {
    mealFilter.price = {};
    if (minPrice) mealFilter.price.$gte = parseFloat(minPrice);
    if (maxPrice) mealFilter.price.$lte = parseFloat(maxPrice);
    mealFilterActive = true;
  }

  if (mealFilterActive) {
    const matchingChefIds = await Meal.distinct('chef', mealFilter);
    matchCriteria._id = { $in: matchingChefIds };
  }

  const pipeline = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [customerLng, customerLat]
        },
        distanceField: 'distanceInMeters',
        maxDistance: maxDist,
        spherical: true,
        query: matchCriteria
      }
    },
    // Look up active subscriber count
    {
      $lookup: {
        from: 'subscriptions',
        let: { chefId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$chef', '$$chefId'] },
                  { $eq: ['$status', 'active'] }
                ]
              }
            }
          },
          { $count: 'count' }
        ],
        as: 'activeSubscribersData'
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $ifNull: [{ $arrayElemAt: ['$activeSubscribersData.count', 0] }, 0]
        }
      }
    },
    // Look up recent menu history / active meals
    {
      $lookup: {
        from: 'meals',
        let: { chefId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$chef', '$$chefId'] },
                  { $eq: ['$isPaused', false] },
                  { $eq: ['$isRemoved', false] }
                ]
              }
            }
          },
          { $limit: 6 },
          { $project: { name: 1, category: 1, price: 1, photoUrl: 1, isVeg: 1, isJain: 1, mealType: 1 } }
        ],
        as: 'availableMeals'
      }
    },
    // Project only safe fields
    {
      $project: {
        name: 1,
        photoUrl: 1,
        address: 1,
        location: 1,
        distanceInMeters: { $round: ['$distanceInMeters', 1] },
        ratingAverage: 1,
        ratingCount: 1,
        trustScore: 1,
        subscriberCount: 1,
        chefProfile: {
          kitchenName: 1,
          operatingHours: 1,
          dailyCapacity: 1,
          maxSubscribers: 1,
          availabilityStatus: 1,
          isVerified: 1,
          verificationStatus: 1
        },
        availableMeals: 1
      }
    }
  ];

  // Sorting
  if (sortBy === 'rating') {
    pipeline.push({ $sort: { ratingAverage: -1, distanceInMeters: 1 } });
  } else {
    // Default by distance
    pipeline.push({ $sort: { distanceInMeters: 1 } });
  }

  // Count total matching
  const totalChefsMatch = await User.aggregate([...pipeline, { $count: 'total' }]);
  const total = totalChefsMatch[0] ? totalChefsMatch[0].total : 0;

  // Add pagination stages
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: pageLimit });

  const chefs = await User.aggregate(pipeline);

  const customerFavorites = req.user?.customerProfile?.favorites
    ? req.user.customerProfile.favorites.map((f) => f.toString())
    : [];

  const enrichedChefs = chefs.map((chef) => ({
    ...chef,
    isFavorite: customerFavorites.includes(chef._id.toString())
  }));

  return sendResponse(res, 200, 'Chefs discovered successfully within 1 km', {
    chefs: enrichedChefs,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Get detailed chef public discovery profile by chef ID
 */
const getChefById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid chef ID', 400));
  }

  const chef = await User.findOne({
    _id: id,
    role: 'chef',
    'chefProfile.verificationStatus': 'approved',
    isSuspended: false
  }).populate('area', 'name type');

  if (!chef) {
    return next(new AppError('Chef not found or not currently active', 404));
  }

  // Fetch chef's meals
  const meals = await Meal.find({ chef: id, isRemoved: false });

  // Fetch today's and upcoming daily menus
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyMenus = await DailyMenu.find({
    chef: id,
    menuDate: { $gte: today }
  })
    .populate('meals')
    .sort({ menuDate: 1 });

  // Calculate distance if customer coords provided
  let distanceInMeters = null;
  if (req.user && req.user.location && req.user.location.coordinates) {
    const { calculateHaversineDistance } = require('../services/areaService');
    const [custLng, custLat] = req.user.location.coordinates;
    const [chefLng, chefLat] = chef.location.coordinates;
    distanceInMeters = Math.round(
      calculateHaversineDistance(custLat, custLng, chefLat, chefLng)
    );
  }

  // Active subscriber count
  const subscriberCount = await Subscription.countDocuments({
    chef: id,
    status: 'active'
  });

  const isFavorite = req.user?.customerProfile?.favorites
    ? req.user.customerProfile.favorites.some((f) => f.toString() === chef._id.toString())
    : false;

  return sendResponse(res, 200, 'Chef details fetched successfully', {
    chef: {
      _id: chef._id,
      name: chef.name,
      photoUrl: chef.photoUrl,
      address: chef.address,
      ratingAverage: chef.ratingAverage,
      ratingCount: chef.ratingCount,
      trustScore: chef.trustScore,
      chefProfile: chef.chefProfile,
      area: chef.area,
      distanceInMeters,
      subscriberCount,
      isFavorite
    },
    meals,
    dailyMenus
  });
});

module.exports = {
  discoverChefs,
  getChefById
};
