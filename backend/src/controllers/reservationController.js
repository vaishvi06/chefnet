const Reservation = require('../models/reservationModel');
const Subscription = require('../models/subscriptionModel');
const DailyMenu = require('../models/dailyMenuModel');
const Meal = require('../models/mealModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { runInTransaction } = require('../utils/transaction');
const qrService = require('../services/qrService');
const notificationService = require('../services/notificationService');
const { calculateTrustScore } = require('../utils/trustScore');

/**
 * Create a Meal Reservation under an active subscription
 */
const createReservation = asyncHandler(async (req, res, next) => {
  const { subscriptionId, dailyMenuId, mealId, reserveDate, mealType } = req.body;

  // 1. Check email verification
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address before creating reservations.', 403));
  }

  // 2. Load Subscription
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  if (subscription.customer.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to reserve under this subscription', 403));
  }

  if (subscription.status !== 'active') {
    return next(
      new AppError(
        `Cannot create reservation. Subscription is currently "${subscription.status}".`,
        400
      )
    );
  }

  // Check if subscription includes this mealType
  if (subscription.mealPlan !== 'full_day' && subscription.mealPlan !== mealType) {
    return next(
      new AppError(
        `Your subscription (${subscription.mealPlan}) does not cover ${mealType}.`,
        400
      )
    );
  }

  // 3. Load DailyMenu and verify cutoff time
  const dailyMenu = await DailyMenu.findById(dailyMenuId);
  if (!dailyMenu) {
    return next(new AppError('Daily menu not found', 404));
  }

  if (dailyMenu.chef.toString() !== subscription.chef.toString()) {
    return next(new AppError('Daily menu does not belong to the subscribed chef', 400));
  }

  if (dailyMenu.mealType !== mealType) {
    return next(
      new AppError(
        `Daily menu mealType (${dailyMenu.mealType}) does not match reservation mealType (${mealType})`,
        400
      )
    );
  }

  const now = new Date();
  if (now > dailyMenu.cutoffTime) {
    return next(
      new AppError(
        `Reservation cutoff time (${dailyMenu.cutoffTime.toISOString()}) has passed for this menu.`,
        400
      )
    );
  }

  // 4. Verify meal exists in menu
  const meal = await Meal.findById(mealId);
  if (!meal || meal.isRemoved || meal.isPaused) {
    return next(new AppError('Selected meal is currently unavailable', 400));
  }

  const isMealInMenu = dailyMenu.meals.some((m) => m.toString() === mealId);
  if (!isMealInMenu) {
    return next(new AppError('Selected meal is not part of this daily menu', 400));
  }

  const dateObj = new Date(reserveDate);
  dateObj.setHours(0, 0, 0, 0);

  // 5. Check duplicate reservation
  const existingRes = await Reservation.findOne({
    subscription: subscriptionId,
    reserveDate: dateObj,
    mealType
  });

  if (existingRes) {
    return next(
      new AppError(
        `You already have a reservation for ${mealType} on ${dateObj.toISOString().split('T')[0]}.`,
        409
      )
    );
  }

  // 6. Execute atomic quantity decrement and reservation creation inside transaction
  const reservation = await runInTransaction(async (session) => {
    // Decrement available quantity atomically
    const updatedMenu = await DailyMenu.findOneAndUpdate(
      { _id: dailyMenuId, quantityAvailable: { $gt: 0 } },
      { $inc: { quantityAvailable: -1 } },
      { new: true, session }
    );

    if (!updatedMenu) {
      throw new AppError('Sorry, this daily menu has reached its maximum order limit (sold out).', 400);
    }

    // Temporary placeholder for signed token
    const tempId = new (require('mongoose').Types.ObjectId)();
    const qrToken = qrService.generateSignedToken({
      reservationId: tempId,
      customerId: req.user._id,
      chefId: subscription.chef,
      mealType,
      reserveDate: dateObj
    });

    const chefUser = await User.findById(subscription.chef).session(session);
    const kCode = chefUser?.chefProfile?.kitchenCode || 'CHF-9999';
    const manualToken = `${kCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newReservation] = await Reservation.create(
      [
        {
          _id: tempId,
          subscription: subscriptionId,
          customer: req.user._id,
          chef: subscription.chef,
          dailyMenu: dailyMenuId,
          meal: mealId,
          reserveDate: dateObj,
          mealType,
          status: 'reserved',
          qrToken,
          manualToken,
          price: meal.price
        }
      ],
      { session }
    );

    return newReservation;
  });

  // 7. Notify chef
  await notificationService.createAndSend({
    userId: subscription.chef,
    type: 'reservation_created',
    message: `New reservation for ${meal.name} (${mealType}) from ${req.user.name}.`,
    data: { reservationId: reservation._id }
  });

  // Generate QR code data URL
  const qrCodeDataUrl = await qrService.generateQRCodeDataURL(reservation.qrToken);

  return sendResponse(res, 201, 'Meal reserved successfully', {
    reservation,
    qrCodeDataUrl,
    manualToken: reservation.manualToken
  });
});

/**
 * Get Reservations (Role-aware & Filterable)
 */
const getReservations = asyncHandler(async (req, res, next) => {
  const { status, date, mealType, page = 1, limit = 10 } = req.query;
  const query = {};

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.user.role === 'chef') {
    query.chef = req.user._id;
  }

  if (status) query.status = status;
  if (mealType) query.mealType = mealType;
  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    query.reserveDate = { $gte: targetDate, $lt: nextDay };
  }

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [reservations, total] = await Promise.all([
    Reservation.find(query)
      .populate('customer', 'name phone photoUrl')
      .populate('chef', 'name chefProfile.kitchenName phone address')
      .populate('meal', 'name category price photoUrl isVeg isJain')
      .populate('dailyMenu', 'pickupStart pickupEnd cutoffTime')
      .sort({ reserveDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Reservation.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Reservations fetched successfully', {
    reservations,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Update reservation status with strict flow enforcement:
 * reserved -> preparing -> ready -> picked_up
 */
const updateReservationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const reservation = await Reservation.findById(id).populate('meal');
  if (!reservation) {
    return next(new AppError('Reservation not found', 404));
  }

  // Role authorization
  const isChef = reservation.chef.toString() === req.user._id.toString();
  const isCustomer = reservation.customer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isChef && !isCustomer && !isAdmin) {
    return next(new AppError('Not authorized to update this reservation', 403));
  }

  // Handle cancellation by customer or chef
  if (status === 'cancelled') {
    if (reservation.status !== 'reserved') {
      return next(
        new AppError(
          `Cannot cancel reservation with status "${reservation.status}". Only "reserved" meals can be cancelled.`,
          400
        )
      );
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Increment menu quantity back
    await DailyMenu.findByIdAndUpdate(reservation.dailyMenu, {
      $inc: { quantityAvailable: 1 }
    });

    return sendResponse(res, 200, 'Reservation cancelled successfully', { reservation });
  }

  // Only chef or admin can advance kitchen preparation status
  if (!isChef && !isAdmin) {
    return next(new AppError('Only the chef can update kitchen progress', 403));
  }

  // Enforce strict state machine
  const allowedTransitions = {
    reserved: ['preparing', 'cancelled'],
    preparing: ['ready'],
    ready: ['picked_up', 'missed'],
    picked_up: [],
    missed: [],
    cancelled: []
  };

  const validNextStates = allowedTransitions[reservation.status] || [];
  if (!validNextStates.includes(status)) {
    return next(
      new AppError(
        `Invalid status transition from "${reservation.status}" to "${status}". Allowed next states: ${validNextStates.join(', ') || 'none'}`,
        400
      )
    );
  }

  reservation.status = status;
  if (status === 'picked_up') {
    reservation.pickedUpAt = new Date();
  }

  await reservation.save();

  // Notify customer when status becomes ready
  if (status === 'ready') {
    await notificationService.createAndSend({
      userId: reservation.customer,
      type: 'meal_ready',
      message: `Your ${reservation.meal.name} is freshly prepared and ready for self-pickup! Please present your QR code to the chef.`,
      data: { reservationId: reservation._id }
    });
  }

  return sendResponse(res, 200, `Reservation status updated to "${status}"`, {
    reservation
  });
});

/**
 * Get QR token and QR PNG Base64 Data URL for a reservation
 */
const getReservationQR = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const reservation = await Reservation.findById(id);
  if (!reservation) {
    return next(new AppError('Reservation not found', 404));
  }

  const isAuthorized =
    reservation.customer.toString() === req.user._id.toString() ||
    reservation.chef.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Not authorized to access this QR code', 403));
  }

  const qrCodeDataUrl = await qrService.generateQRCodeDataURL(reservation.qrToken);

  return sendResponse(res, 200, 'QR Code generated successfully', {
    reservationId: reservation._id,
    qrToken: reservation.qrToken,
    manualToken: reservation.manualToken,
    qrCodeDataUrl,
    status: reservation.status
  });
});

/**
 * Verify scanned QR code OR manual token (Chef scans QR or enters CHF-XXXX token)
 */
const verifyReservation = asyncHandler(async (req, res, next) => {
  const rawToken = req.body.token || req.body.qrToken || req.body.manualToken;

  if (!rawToken || typeof rawToken !== 'string') {
    return next(new AppError('Verification token (QR code or manual token) is required', 400));
  }

  const token = rawToken.trim();
  let reservation = null;

  // 1. Try decoding as JWT if format looks like JWT (contains '.')
  if (token.includes('.')) {
    try {
      const decoded = qrService.verifyToken(token);
      if (decoded && decoded.sub) {
        reservation = await Reservation.findById(decoded.sub)
          .populate('meal')
          .populate('dailyMenu');
      }
    } catch (err) {
      // If token signature expired or invalid, check if raw qrToken matches in DB
      reservation = await Reservation.findOne({ qrToken: token })
        .populate('meal')
        .populate('dailyMenu');
    }
  }

  // 2. If not found via JWT, search by manualToken or qrToken
  if (!reservation) {
    reservation = await Reservation.findOne({
      $or: [
        { manualToken: token.toUpperCase() },
        { qrToken: token }
      ]
    })
      .populate('meal')
      .populate('dailyMenu');
  }

  if (!reservation) {
    return next(new AppError('No matching reservation found for this pass/token.', 404));
  }

  // 3. Verify it belongs to this chef
  if (reservation.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('This meal pass does not belong to your kitchen', 403));
  }

  // 4. Verify state machine
  if (reservation.status === 'picked_up') {
    return next(
      new AppError(
        `Meal was already picked up on ${reservation.pickedUpAt ? reservation.pickedUpAt.toLocaleTimeString() : 'earlier'}.`,
        400
      )
    );
  }

  if (reservation.status === 'cancelled') {
    return next(new AppError('This reservation was cancelled and cannot be picked up.', 400));
  }

  if (reservation.status !== 'ready') {
    return next(
      new AppError(
        `Cannot complete pickup. Reservation status is currently "${reservation.status}". Status must be "ready".`,
        400
      )
    );
  }

  // 5. Mark as picked_up and record verification metadata
  reservation.status = 'picked_up';
  reservation.pickedUpAt = new Date();
  reservation.verifiedAt = new Date();
  reservation.verifiedBy = req.user._id;
  await reservation.save();

  // 6. Update customer TrustScore
  const customerId = reservation.customer;
  const [totalRes, pickedUpRes, missedRes, cancelledRes, customerUser] = await Promise.all([
    Reservation.countDocuments({ customer: customerId }),
    Reservation.countDocuments({ customer: customerId, status: 'picked_up' }),
    Reservation.countDocuments({ customer: customerId, isMissed: true }),
    Reservation.countDocuments({ customer: customerId, status: 'cancelled' }),
    User.findById(customerId)
  ]);

  if (customerUser) {
    customerUser.trustScore = calculateTrustScore({
      totalReservations: totalRes,
      pickedUpCount: pickedUpRes,
      missedPickupCount: missedRes,
      cancelledCount: cancelledRes,
      ratingAverage: customerUser.ratingAverage,
      ratingCount: customerUser.ratingCount
    });
    await customerUser.save();
  }

  // 7. Notify customer
  await notificationService.createAndSend({
    userId: reservation.customer,
    type: 'meal_ready',
    message: `Pickup confirmed! Enjoy your delicious homemade meal from ${req.user.name}.`,
    data: { reservationId: reservation._id }
  });

  // 8. Emit live socket update
  try {
    const socketService = require('../services/socketService');
    const io = socketService.getIO();
    if (io) {
      io.to(`chef_${reservation.chef.toString()}`).emit('reservation_updated', {
        reservationId: reservation._id,
        status: 'picked_up',
        pickedUpAt: reservation.pickedUpAt
      });
      io.to(`customer_${reservation.customer.toString()}`).emit('reservation_updated', {
        reservationId: reservation._id,
        status: 'picked_up',
        pickedUpAt: reservation.pickedUpAt
      });
    }
  } catch (err) {
    // Socket server may not be active in test environments
  }

  return sendResponse(res, 200, 'Pass verified successfully. Meal marked as picked up!', {
    reservation
  });
});

module.exports = {
  createReservation,
  getReservations,
  updateReservationStatus,
  getReservationQR,
  verifyReservation,
  verifyQR: verifyReservation
};
