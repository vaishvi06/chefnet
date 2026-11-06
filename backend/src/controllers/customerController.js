const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

/**
 * Get all favorite chefs for current customer
 */
const getFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: 'customerProfile.favorites',
    select: 'name photoUrl chefProfile ratingAverage ratingCount trustScore address location isSuspended'
  });

  return sendResponse(res, 200, 'Favorites fetched successfully', {
    favorites: user.customerProfile ? user.customerProfile.favorites : []
  });
});

/**
 * Add a chef to favorites
 */
const addFavorite = asyncHandler(async (req, res, next) => {
  const { chefId } = req.params;

  const chef = await User.findOne({ _id: chefId, role: 'chef' });
  if (!chef) {
    return next(new AppError('Chef not found', 404));
  }

  const user = await User.findById(req.user._id);
  if (!user.customerProfile) {
    user.customerProfile = { favorites: [] };
  }

  const alreadyFav = user.customerProfile.favorites.some(
    (id) => id.toString() === chefId
  );

  if (!alreadyFav) {
    user.customerProfile.favorites.push(chefId);
    await user.save();
  }

  return sendResponse(res, 200, 'Chef added to favorites', {
    favorites: user.customerProfile.favorites
  });
});

/**
 * Remove a chef from favorites
 */
const removeFavorite = asyncHandler(async (req, res, next) => {
  const { chefId } = req.params;

  const user = await User.findById(req.user._id);
  if (user.customerProfile && user.customerProfile.favorites) {
    user.customerProfile.favorites = user.customerProfile.favorites.filter(
      (id) => id.toString() !== chefId
    );
    await user.save();
  }

  return sendResponse(res, 200, 'Chef removed from favorites', {
    favorites: user.customerProfile ? user.customerProfile.favorites : []
  });
});

/**
 * Get customer meal and subscription history
 */
const getHistory = asyncHandler(async (req, res, next) => {
  // Dynamically require models to avoid circular references if any
  const Subscription = require('../models/subscriptionModel');
  const Reservation = require('../models/reservationModel');

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [subscriptions, reservations, totalReservations] = await Promise.all([
    Subscription.find({ customer: req.user._id })
      .populate('chef', 'name chefProfile.kitchenName phone photoUrl')
      .sort({ createdAt: -1 }),
    Reservation.find({ customer: req.user._id })
      .populate('chef', 'name chefProfile.kitchenName')
      .populate('meal', 'name category price photoUrl isVeg isJain')
      .sort({ reserveDate: -1 })
      .skip(skip)
      .limit(limit),
    Reservation.countDocuments({ customer: req.user._id })
  ]);

  return sendResponse(res, 200, 'Customer history fetched successfully', {
    subscriptions,
    reservations,
    pagination: {
      page,
      limit,
      total: totalReservations,
      pages: Math.ceil(totalReservations / limit) || 1
    }
  });
});

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  getHistory
};
