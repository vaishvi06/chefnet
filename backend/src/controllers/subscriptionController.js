const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const Area = require('../models/areaModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { calculateHaversineDistance } = require('../services/areaService');
const { runInTransaction } = require('../utils/transaction');
const notificationService = require('../services/notificationService');

/**
 * Request a meal plan subscription (Customer)
 */
const createSubscription = asyncHandler(async (req, res, next) => {
  const { chefId, planType, mealPlan } = req.body;

  // 1. Email verification check
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address before creating a subscription.', 403));
  }

  // 2. Location verification check
  if (!req.user.isLocationVerified || !req.user.location?.coordinates) {
    return next(new AppError('Please verify your GPS location before subscribing to a chef.', 400));
  }

  // 3. Area active check
  if (req.user.area) {
    const area = await Area.findById(req.user.area);
    if (area && !area.isActive) {
      return next(
        new AppError(
          `Subscriptions are disabled: Area "${area.name}" is not active yet.`,
          403
        )
      );
    }
  }

  // 4. Chef verification and availability check
  const chef = await User.findOne({
    _id: chefId,
    role: 'chef',
    'chefProfile.verificationStatus': 'approved',
    isSuspended: false
  });

  if (!chef) {
    return next(new AppError('Chef not found or not currently active.', 404));
  }

  if (
    chef.chefProfile.availabilityStatus === 'full' ||
    chef.chefProfile.availabilityStatus === 'paused'
  ) {
    return next(
      new AppError(
        `This chef is currently ${chef.chefProfile.availabilityStatus} and not accepting new subscriptions.`,
        400
      )
    );
  }

  // 5. 1 km distance verification
  const [custLng, custLat] = req.user.location.coordinates;
  const [chefLng, chefLat] = chef.location.coordinates;
  const distanceInMeters = calculateHaversineDistance(custLat, custLng, chefLat, chefLng);

  if (distanceInMeters > 1000) {
    return next(
      new AppError(
        `Chef is ${Math.round(distanceInMeters)} meters away. Self-pickup subscriptions are only permitted within 1 km (1000m).`,
        400
      )
    );
  }

  // 6. Block duplicate active or pending subscription for the same customer, chef, and mealPlan
  const existingSub = await Subscription.findOne({
    customer: req.user._id,
    chef: chefId,
    mealPlan,
    status: { $in: ['pending', 'accepted', 'active'] }
  });

  if (existingSub) {
    return next(
      new AppError(
        `You already have an ongoing or pending subscription with this chef for the ${mealPlan} plan.`,
        409
      )
    );
  }

  // 7. Create subscription with status 'pending'
  const subscription = await Subscription.create({
    customer: req.user._id,
    chef: chefId,
    planType,
    mealPlan,
    status: 'pending'
  });

  // 8. Notify chef
  await notificationService.createAndSend({
    userId: chefId,
    type: 'subscription_request',
    message: `New ${planType} subscription request for ${mealPlan} plan from ${req.user.name}.`,
    data: { subscriptionId: subscription._id }
  });

  return sendResponse(
    res,
    201,
    'Subscription request submitted successfully. Awaiting chef acceptance.',
    { subscription }
  );
});

/**
 * Get Subscriptions (Role-aware)
 */
const getSubscriptions = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = {};

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.user.role === 'chef') {
    query.chef = req.user._id;
  }

  if (status) query.status = status;

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [rawSubscriptions, total] = await Promise.all([
    Subscription.find(query)
      .populate('customer', 'name photoUrl phone ratingAverage address')
      .populate('chef', 'name photoUrl phone chefProfile address location ratingAverage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Subscription.countDocuments(query)
  ]);

  // Mask phone numbers if subscription is NOT accepted or active
  const subscriptions = rawSubscriptions.map((sub) => {
    const obj = sub.toObject();
    const isContactUnlocked = ['accepted', 'active'].includes(obj.status);

    if (!isContactUnlocked) {
      if (obj.customer && req.user.role === 'chef') {
        obj.customer.phone = 'Available once subscription is accepted';
      }
      if (obj.chef && req.user.role === 'customer') {
        obj.chef.phone = 'Available once subscription is accepted';
      }
    }
    return obj;
  });

  return sendResponse(res, 200, 'Subscriptions fetched successfully', {
    subscriptions,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Accept Subscription Request (Chef only, Transactional)
 */
const acceptSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  if (subscription.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to accept this subscription', 403));
  }

  if (subscription.status !== 'pending') {
    return next(
      new AppError(
        `Cannot accept subscription with status "${subscription.status}". Must be "pending".`,
        400
      )
    );
  }

  // Execute capacity check and activation inside transaction
  const result = await runInTransaction(async (session) => {
    const chef = await User.findById(subscription.chef).session(session);
    const maxSubs = chef.chefProfile?.maxSubscribers || 15;

    const activeCount = await Subscription.countDocuments({
      chef: chef._id,
      status: 'active'
    }).session(session);

    if (activeCount >= maxSubs) {
      throw new AppError('Maximum active subscribers reached. Cannot accept more requests.', 400);
    }

    // Set active dates
    subscription.status = 'active';
    subscription.startDate = new Date();
    const durationDays = subscription.planType === 'weekly' ? 7 : 30;
    subscription.endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await subscription.save({ session });

    const newActiveCount = activeCount + 1;

    // Update chef availability status based on capacity
    if (newActiveCount >= maxSubs) {
      chef.chefProfile.availabilityStatus = 'full';
      // Auto-reject other pending requests
      await Subscription.updateMany(
        { chef: chef._id, status: 'pending', _id: { $ne: subscription._id } },
        { $set: { status: 'rejected' } },
        { session }
      );
    } else if (newActiveCount >= Math.floor(maxSubs * 0.8)) {
      chef.chefProfile.availabilityStatus = 'limited';
    } else {
      chef.chefProfile.availabilityStatus = 'accepting';
    }

    await chef.save({ session });
    return subscription;
  });

  // Notify customer
  await notificationService.createAndSend({
    userId: subscription.customer,
    type: 'subscription_accepted',
    message: `Your ${subscription.planType} subscription for ${subscription.mealPlan} has been accepted! You can now place meal reservations.`,
    data: { subscriptionId: subscription._id }
  });

  return sendResponse(
    res,
    200,
    'Subscription accepted and active. Phone contacts and direct chat are now unlocked.',
    { subscription: result }
  );
});

/**
 * Reject Subscription Request (Chef only)
 */
const rejectSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  if (subscription.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to reject this subscription', 403));
  }

  if (subscription.status !== 'pending') {
    return next(new AppError(`Cannot reject subscription with status "${subscription.status}".`, 400));
  }

  subscription.status = 'rejected';
  await subscription.save();

  // Notify customer
  await notificationService.createAndSend({
    userId: subscription.customer,
    type: 'subscription_rejected',
    message: 'Your subscription request was declined by the chef.',
    data: { subscriptionId: subscription._id }
  });

  return sendResponse(res, 200, 'Subscription rejected successfully', { subscription });
});

/**
 * Pause Subscription
 */
const pauseSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { from, to, reason } = req.body;

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const isOwner =
    subscription.customer.toString() === req.user._id.toString() ||
    subscription.chef.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to pause this subscription', 403));
  }

  if (subscription.status !== 'active') {
    return next(new AppError('Only active subscriptions can be paused', 400));
  }

  const fromDate = new Date(from || Date.now());
  const toDate = new Date(to || Date.now() + 7 * 24 * 60 * 60 * 1000);

  subscription.pausedPeriods.push({
    from: fromDate,
    to: toDate,
    reason: reason || 'Temporarily paused'
  });

  subscription.status = 'paused';
  await subscription.save();

  return sendResponse(res, 200, 'Subscription paused successfully', { subscription });
});

/**
 * Resume Subscription
 */
const resumeSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const isOwner =
    subscription.customer.toString() === req.user._id.toString() ||
    subscription.chef.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to resume this subscription', 403));
  }

  if (subscription.status !== 'paused') {
    return next(new AppError('Only paused subscriptions can be resumed', 400));
  }

  subscription.status = 'active';
  await subscription.save();

  return sendResponse(res, 200, 'Subscription resumed successfully', { subscription });
});

/**
 * Cancel Subscription
 */
const cancelSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { cancelOption = 'immediate' } = req.body;

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const isOwner =
    subscription.customer.toString() === req.user._id.toString() ||
    subscription.chef.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to cancel this subscription', 403));
  }

  subscription.cancelOption = cancelOption;

  if (cancelOption === 'immediate') {
    subscription.status = 'cancelled';
  }

  await subscription.save();

  // Re-evaluate chef availability if chef was previously full
  const chef = await User.findById(subscription.chef);
  if (chef && chef.chefProfile.availabilityStatus === 'full') {
    const activeCount = await Subscription.countDocuments({
      chef: chef._id,
      status: 'active'
    });
    const maxSubs = chef.chefProfile.maxSubscribers || 15;
    if (activeCount < maxSubs) {
      chef.chefProfile.availabilityStatus =
        activeCount >= Math.floor(maxSubs * 0.8) ? 'limited' : 'accepting';
      await chef.save();
    }
  }

  return sendResponse(res, 200, `Subscription cancellation scheduled (${cancelOption})`, {
    subscription
  });
});

module.exports = {
  createSubscription,
  getSubscriptions,
  acceptSubscription,
  rejectSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription
};
