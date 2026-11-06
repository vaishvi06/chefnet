const Complaint = require('../models/complaintModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

const Reservation = require('../models/reservationModel');

/**
 * File a complaint against a chef or customer
 */
const createComplaint = asyncHandler(async (req, res, next) => {
  let { againstId, reservationId, category, description } = req.body;

  // Auto-resolve accused user if reservationId is provided without againstId
  if (!againstId && reservationId) {
    const reservation = await Reservation.findById(reservationId);
    if (reservation) {
      if (reservation.customer.toString() === req.user._id.toString()) {
        againstId = reservation.chef;
      } else if (reservation.chef.toString() === req.user._id.toString()) {
        againstId = reservation.customer;
      }
    }
  }

  if (!againstId) {
    return next(new AppError('Target user of complaint is required', 400));
  }

  const accusedUser = await User.findById(againstId);
  if (!accusedUser) {
    return next(new AppError('Target user of complaint not found', 404));
  }

  if (accusedUser._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot file a complaint against yourself', 400));
  }

  const complaint = await Complaint.create({
    raisedBy: req.user._id,
    reporterRole: req.user.role,
    against: againstId,
    reservation: reservationId || null,
    category,
    description
  });

  return sendResponse(
    res,
    201,
    'Complaint submitted successfully. An administrator will review this shortly.',
    { complaint }
  );
});

/**
 * Get all complaints raised by the current user
 */
const getMyComplaints = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    Complaint.find({ raisedBy: req.user._id })
      .populate('against', 'name role photoUrl chefProfile.kitchenName')
      .populate('reservation', 'reserveDate mealType status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments({ raisedBy: req.user._id })
  ]);

  return sendResponse(res, 200, 'Your complaints fetched successfully', {
    complaints,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

module.exports = {
  createComplaint,
  getMyComplaints
};
