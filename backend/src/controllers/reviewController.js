const Review = require('../models/reviewModel');
const Reservation = require('../models/reservationModel');
const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { calculateTrustScore } = require('../utils/trustScore');

/**
 * Submit a Review (Customer -> Chef or Chef -> Customer)
 */
const createReview = asyncHandler(async (req, res, next) => {
  const { reservationId, ratings, comment } = req.body;

  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return next(new AppError('Reservation not found', 404));
  }

  const isCustomer = reservation.customer.toString() === req.user._id.toString();
  const isChef = reservation.chef.toString() === req.user._id.toString();

  if (!isCustomer && !isChef) {
    return next(new AppError('You are not a participant of this reservation', 403));
  }

  // 1. Customer -> Chef: Requires picked_up status
  if (isCustomer) {
    if (reservation.status !== 'picked_up') {
      return next(
        new AppError(
          `Reviews can only be submitted after meal pickup is completed. Current status: "${reservation.status}".`,
          400
        )
      );
    }

    if (!ratings || !ratings.overall) {
      return next(new AppError('Overall rating (1-5) is required', 400));
    }

    // Check duplicate
    const existingReview = await Review.findOne({
      reservation: reservationId,
      author: req.user._id
    });

    if (existingReview) {
      return next(new AppError('You have already reviewed this reservation', 409));
    }

    const review = await Review.create({
      reservation: reservationId,
      author: req.user._id,
      target: reservation.chef,
      authorRole: 'customer',
      ratings: {
        foodQuality: ratings.foodQuality || ratings.overall,
        foodQuantity: ratings.foodQuantity || ratings.overall,
        hygiene: ratings.hygiene || ratings.overall,
        overall: ratings.overall
      },
      comment
    });

    // Update Chef's rating aggregates
    const chefReviews = await Review.find({
      target: reservation.chef,
      isHidden: false,
      authorRole: 'customer'
    });

    const totalRatings = chefReviews.length;
    const avgRating =
      chefReviews.reduce((acc, r) => acc + (r.ratings.overall || 0), 0) / (totalRatings || 1);

    const chef = await User.findById(reservation.chef);
    if (chef) {
      chef.ratingAverage = parseFloat(avgRating.toFixed(2));
      chef.ratingCount = totalRatings;

      // Update chef trust score
      const [totalRes, pickedUpRes, missedRes, cancelledRes] = await Promise.all([
        Reservation.countDocuments({ chef: chef._id }),
        Reservation.countDocuments({ chef: chef._id, status: 'picked_up' }),
        Reservation.countDocuments({ chef: chef._id, isMissed: true }),
        Reservation.countDocuments({ chef: chef._id, status: 'cancelled' })
      ]);

      chef.trustScore = calculateTrustScore({
        totalReservations: totalRes,
        pickedUpCount: pickedUpRes,
        missedPickupCount: missedRes,
        cancelledCount: cancelledRes,
        ratingAverage: chef.ratingAverage,
        ratingCount: chef.ratingCount
      });

      await chef.save();
    }

    return sendResponse(res, 201, 'Review submitted successfully', { review });
  }

  // 2. Chef -> Customer: Can review customer behavior
  if (isChef) {
    if (reservation.status !== 'picked_up' && reservation.status !== 'missed') {
      return next(
        new AppError('Chef can only review completed or missed pickup reservations.', 400)
      );
    }

    const existingReview = await Review.findOne({
      reservation: reservationId,
      author: req.user._id
    });

    if (existingReview) {
      return next(new AppError('You have already reviewed this customer for this reservation', 409));
    }

    const punctuality = ratings?.punctuality || 5;
    const communication = ratings?.communication || 5;
    const reliability = ratings?.reliability || 5;
    const avgScore = (punctuality + communication + reliability) / 3;

    const review = await Review.create({
      reservation: reservationId,
      author: req.user._id,
      target: reservation.customer,
      authorRole: 'chef',
      ratings: {
        punctuality,
        communication,
        reliability,
        overall: parseFloat(avgScore.toFixed(1))
      },
      comment
    });

    // Update customer rating aggregates
    const customerReviews = await Review.find({
      target: reservation.customer,
      isHidden: false,
      authorRole: 'chef'
    });

    const totalCustRatings = customerReviews.length;
    const avgCustRating =
      customerReviews.reduce((acc, r) => acc + (r.ratings.overall || 0), 0) /
      (totalCustRatings || 1);

    const customer = await User.findById(reservation.customer);
    if (customer) {
      customer.ratingAverage = parseFloat(avgCustRating.toFixed(2));
      customer.ratingCount = totalCustRatings;

      const [totalRes, pickedUpRes, missedRes, cancelledRes] = await Promise.all([
        Reservation.countDocuments({ customer: customer._id }),
        Reservation.countDocuments({ customer: customer._id, status: 'picked_up' }),
        Reservation.countDocuments({ customer: customer._id, isMissed: true }),
        Reservation.countDocuments({ customer: customer._id, status: 'cancelled' })
      ]);

      customer.trustScore = calculateTrustScore({
        totalReservations: totalRes,
        pickedUpCount: pickedUpRes,
        missedPickupCount: missedRes,
        cancelledCount: cancelledRes,
        ratingAverage: customer.ratingAverage,
        ratingCount: customer.ratingCount
      });

      await customer.save();
    }

    return sendResponse(res, 201, 'Customer feedback submitted successfully', { review });
  }
});

/**
 * Get public reviews for a specific chef
 */
const getChefReviews = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {
    target: id,
    authorRole: 'customer',
    isHidden: false
  };

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('author', 'name photoUrl')
      .populate({
        path: 'reservation',
        select: 'meal reserveDate',
        populate: { path: 'meal', select: 'name category' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Chef reviews fetched successfully', {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

module.exports = {
  createReview,
  getChefReviews
};
