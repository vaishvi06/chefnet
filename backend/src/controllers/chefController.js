const User = require('../models/userModel');
const Reservation = require('../models/reservationModel');
const Subscription = require('../models/subscriptionModel');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

/**
 * Register kitchen details for verification
 */
const registerKitchen = asyncHandler(async (req, res, next) => {
  const { kitchenName, operatingHours, dailyCapacity, maxSubscribers } = req.body;

  const chef = await User.findById(req.user._id);
  if (!chef || chef.role !== 'chef') {
    return next(new AppError('Only chefs can register a kitchen', 403));
  }

  chef.chefProfile.kitchenName = kitchenName || chef.chefProfile.kitchenName;
  if (operatingHours) chef.chefProfile.operatingHours = operatingHours;
  if (dailyCapacity) chef.chefProfile.dailyCapacity = Number(dailyCapacity);
  if (maxSubscribers) chef.chefProfile.maxSubscribers = Number(maxSubscribers);

  // Set pending verification status
  chef.chefProfile.verificationStatus = 'pending';
  chef.chefProfile.isVerified = false;

  await chef.save();

  return sendResponse(
    res,
    200,
    'Kitchen registration submitted for admin approval',
    { chef }
  );
});

/**
 * Update chef availability status (accepting, limited, full, paused)
 */
const updateAvailability = asyncHandler(async (req, res, next) => {
  const { availabilityStatus } = req.body;

  const validStatuses = ['accepting', 'limited', 'full', 'paused'];
  if (!validStatuses.includes(availabilityStatus)) {
    return next(
      new AppError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      )
    );
  }

  const chef = await User.findById(req.user._id);
  chef.chefProfile.availabilityStatus = availabilityStatus;
  await chef.save();

  return sendResponse(res, 200, 'Availability status updated successfully', {
    availabilityStatus: chef.chefProfile.availabilityStatus
  });
});

/**
 * Schedule vacation period
 */
const addVacation = asyncHandler(async (req, res, next) => {
  const { from, to, reason } = req.body;

  if (!from || !to) {
    return next(new AppError('Please provide both from and to dates for vacation', 400));
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
    return next(new AppError('Invalid date range. "from" must be before "to"', 400));
  }

  const chef = await User.findById(req.user._id);
  chef.chefProfile.vacationPeriods.push({
    from: fromDate,
    to: toDate,
    reason: reason || 'Personal Vacation'
  });

  await chef.save();

  return sendResponse(res, 201, 'Vacation period scheduled successfully', {
    vacationPeriods: chef.chefProfile.vacationPeriods
  });
});

/**
 * Get Chef Dashboard Analytics
 * (daily/weekly/monthly earnings, active subscribers, pending requests, cancellations,
 * most ordered meals, reservation trends, occupancy)
 */
const getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  const Subscription = require('../models/subscriptionModel');
  const Reservation = require('../models/reservationModel');

  const chefId = req.user._id;
  const now = new Date();

  // Date ranges
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Subscriptions counts
  const [activeSubscribers, pendingRequests, cancellations] = await Promise.all([
    Subscription.countDocuments({ chef: chefId, status: 'active' }),
    Subscription.countDocuments({ chef: chefId, status: 'pending' }),
    Subscription.countDocuments({ chef: chefId, status: 'cancelled' })
  ]);

  // Aggregate picked_up reservations for earnings (daily, weekly, monthly)
  const earningsAgg = await Reservation.aggregate([
    {
      $match: {
        chef: chefId,
        status: 'picked_up'
      }
    },
    {
      $facet: {
        daily: [
          { $match: { pickedUpAt: { $gte: startOfDay } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ],
        weekly: [
          { $match: { pickedUpAt: { $gte: startOfWeek } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ],
        monthly: [
          { $match: { pickedUpAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ]
      }
    }
  ]);

  const dailyEarnings = earningsAgg[0].daily[0] ? earningsAgg[0].daily[0].total : 0;
  const weeklyEarnings = earningsAgg[0].weekly[0] ? earningsAgg[0].weekly[0].total : 0;
  const monthlyEarnings = earningsAgg[0].monthly[0] ? earningsAgg[0].monthly[0].total : 0;

  // Most ordered meals
  const mostOrderedMeals = await Reservation.aggregate([
    { $match: { chef: chefId, status: { $in: ['reserved', 'preparing', 'ready', 'picked_up'] } } },
    { $group: { _id: '$meal', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'meals',
        localField: '_id',
        foreignField: '_id',
        as: 'mealDetails'
      }
    },
    { $unwind: '$mealDetails' },
    {
      $project: {
        _id: 1,
        count: 1,
        name: '$mealDetails.name',
        category: '$mealDetails.category',
        price: '$mealDetails.price'
      }
    }
  ]);

  // Reservation trends (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const reservationTrends = await Reservation.aggregate([
    {
      $match: {
        chef: chefId,
        reserveDate: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$reserveDate' } },
        totalReservations: { $sum: 1 },
        pickedUp: {
          $sum: { $cond: [{ $eq: ['$status', 'picked_up'] }, 1, 0] }
        },
        missed: {
          $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Occupancy rate calculation
  const maxSubs = req.user.chefProfile?.maxSubscribers || 15;
  const occupancyPercentage = Math.min(100, Math.round((activeSubscribers / maxSubs) * 100));

  return sendResponse(res, 200, 'Chef dashboard analytics fetched successfully', {
    earnings: {
      daily: dailyEarnings,
      weekly: weeklyEarnings,
      monthly: monthlyEarnings
    },
    subscriptions: {
      activeSubscribers,
      pendingRequests,
      cancellations,
      maxSubscribers: maxSubs,
      occupancyPercentage
    },
    mostOrderedMeals,
    reservationTrends
  });
});

/**
 * Get chef reservations filtered by date
 */
const getChefReservations = asyncHandler(async (req, res, next) => {
  const Reservation = require('../models/reservationModel');

  const { date } = req.query;
  const query = { chef: req.user._id };

  if (date) {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    query.reserveDate = {
      $gte: targetDate,
      $lt: nextDay
    };
  }

  const reservations = await Reservation.find(query)
    .populate('customer', 'name phone photoUrl address ratingAverage')
    .populate('meal', 'name category price isVeg isJain')
    .sort({ mealType: 1, createdAt: -1 });

  return sendResponse(res, 200, 'Reservations fetched successfully', {
    reservations
  });
});

/**
 * Get Today's Kitchen Queue with live counts
 */
const getKitchenQueue = asyncHandler(async (req, res, next) => {
  const { date, mealType } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);

  const query = {
    chef: req.user._id,
    reserveDate: { $gte: targetDate, $lt: nextDay }
  };

  if (mealType && mealType !== 'all') {
    query.mealType = mealType;
  }

  const reservations = await Reservation.find(query)
    .populate('customer', 'name phone photoUrl address ratingAverage trustScore')
    .populate('meal', 'name category price photoUrl isVeg isJain mealType')
    .populate('dailyMenu', 'pickupStart pickupEnd cutoffTime')
    .sort({ status: 1, createdAt: 1 });

  const counts = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'reserved' || r.status === 'preparing').length,
    ready: reservations.filter((r) => r.status === 'ready').length,
    picked_up: reservations.filter((r) => r.status === 'picked_up').length,
    missed: reservations.filter((r) => r.status === 'missed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length
  };

  return sendResponse(res, 200, "Today's kitchen queue fetched successfully", {
    reservations,
    counts,
    date: targetDate.toISOString().split('T')[0],
    mealType: mealType || 'all'
  });
});

/**
 * Rotate or update unique Kitchen Code (e.g., CHF-7890)
 */
const updateKitchenCode = asyncHandler(async (req, res, next) => {
  let { kitchenCode } = req.body;

  if (kitchenCode) {
    kitchenCode = kitchenCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,10}$/.test(kitchenCode)) {
      return next(
        new AppError(
          'Kitchen code must be between 4 and 10 alphanumeric characters (hyphens allowed), e.g. CHF-4521',
          400
        )
      );
    }

    const existing = await User.findOne({
      _id: { $ne: req.user._id },
      'chefProfile.kitchenCode': kitchenCode
    });
    if (existing) {
      return next(new AppError('Kitchen code already taken by another home kitchen', 409));
    }
  } else {
    // Generate new unique code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CHF-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    kitchenCode = code;
  }

  const chef = await User.findById(req.user._id);
  chef.chefProfile.kitchenCode = kitchenCode;
  chef.chefProfile.kitchenCodeUpdatedAt = new Date();
  await chef.save();

  // Refresh manualToken on all active, unpicked reservations for today and future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingReservations = await Reservation.find({
    chef: chef._id,
    reserveDate: { $gte: today },
    status: { $in: ['reserved', 'preparing', 'ready'] }
  });

  for (const resv of pendingReservations) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    resv.manualToken = `${kitchenCode}-${randomSuffix}`;
    await resv.save();

    // Notify customer
    await notificationService.createAndSend({
      userId: resv.customer,
      type: 'general',
      message: `${chef.chefProfile.kitchenName || chef.name} updated their kitchen code. Your new pickup token is ${resv.manualToken}.`,
      data: { reservationId: resv._id, manualToken: resv.manualToken }
    });
  }

  return sendResponse(res, 200, 'Kitchen code updated successfully', {
    kitchenCode,
    updatedReservationsCount: pendingReservations.length
  });
});

/**
 * List all subscribers for the authenticated chef
 */
const getChefSubscribers = asyncHandler(async (req, res, next) => {
  const subscriptions = await Subscription.find({ chef: req.user._id })
    .populate('customer', 'name email phone photoUrl address trustScore ratingAverage')
    .sort({ createdAt: -1 });

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;

  return sendResponse(res, 200, 'Subscribers fetched successfully', {
    subscribers: subscriptions,
    maxSubscribers: req.user.chefProfile?.maxSubscribers || 15,
    activeCount,
    pendingCount
  });
});

/**
 * Remove a subscriber with mandatory reason, cancel future reservations & free capacity
 */
const removeSubscriber = asyncHandler(async (req, res, next) => {
  const { subscriptionId } = req.params;
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return next(new AppError('A valid reason (minimum 5 characters) is required to remove a subscriber', 400));
  }

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    chef: req.user._id
  });

  if (!subscription) {
    return next(new AppError('Subscription not found for your kitchen', 404));
  }

  subscription.status = 'cancelled_by_chef';
  subscription.removedBy = req.user._id;
  subscription.removalReason = reason.trim();
  subscription.removedAt = new Date();
  await subscription.save();

  // Cancel upcoming unpicked reservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Reservation.updateMany(
    {
      subscription: subscription._id,
      reserveDate: { $gte: today },
      status: { $in: ['reserved', 'preparing', 'ready'] }
    },
    { status: 'cancelled' }
  );

  // If chef was at full capacity, restore to accepting
  const chef = await User.findById(req.user._id);
  const activeCount = await Subscription.countDocuments({
    chef: req.user._id,
    status: 'active'
  });

  if (activeCount < (chef.chefProfile.maxSubscribers || 15) && chef.chefProfile.availabilityStatus === 'full') {
    chef.chefProfile.availabilityStatus = 'accepting';
    await chef.save();
  }

  // Notify customer
  await notificationService.createAndSend({
    userId: subscription.customer,
    type: 'subscription_cancelled',
    message: `Your subscription with ${chef.chefProfile.kitchenName || chef.name} was removed by the chef. Reason: ${reason.trim()}`,
    data: { subscriptionId: subscription._id, reason: reason.trim() }
  });

  return sendResponse(res, 200, 'Subscriber removed and future reservations cancelled successfully', {
    subscription
  });
});

module.exports = {
  registerKitchen,
  updateAvailability,
  addVacation,
  getDashboardAnalytics,
  getChefReservations,
  getKitchenQueue,
  updateKitchenCode,
  getChefSubscribers,
  removeSubscriber
};
