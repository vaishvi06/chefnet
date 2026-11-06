const User = require('../models/userModel');
const Area = require('../models/areaModel');
const WaitingListEntry = require('../models/waitingListModel');
const Complaint = require('../models/complaintModel');
const SupportTicket = require('../models/supportTicketModel');
const Subscription = require('../models/subscriptionModel');
const Reservation = require('../models/reservationModel');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { checkAndUpdateAreaActivation } = require('../services/areaService');

/**
 * List pending chefs awaiting verification (with optional status filter)
 */
const getPendingChefs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const { status } = req.query;
  const query = { role: 'chef' };

  if (status && status !== 'all') {
    query['chefProfile.verificationStatus'] = status;
  } else if (!status) {
    query['chefProfile.verificationStatus'] = 'pending';
  }

  const [chefs, total] = await Promise.all([
    User.find(query)
      .populate('area', 'name type isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Chefs fetched successfully', {
    chefs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

/**
 * Approve chef kitchen verification
 */
const approveChef = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const chef = await User.findOne({ _id: id, role: 'chef' });
  if (!chef) {
    return next(new AppError('Chef not found', 404));
  }

  chef.chefProfile.isVerified = true;
  chef.chefProfile.verificationStatus = 'approved';
  await chef.save();

  // Check if chef's area now meets activation threshold
  if (chef.area) {
    await checkAndUpdateAreaActivation(chef.area);
  }

  return sendResponse(res, 200, 'Chef kitchen approved successfully', { chef });
});

/**
 * Reject chef kitchen verification with reason
 */
const rejectChef = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const chef = await User.findOne({ _id: id, role: 'chef' });
  if (!chef) {
    return next(new AppError('Chef not found', 404));
  }

  chef.chefProfile.isVerified = false;
  chef.chefProfile.verificationStatus = 'rejected';
  chef.chefProfile.rejectionReason =
    reason || 'Kitchen application did not meet hygiene or local safety standards.';
  await chef.save();

  // Notify chef
  const notificationService = require('../services/notificationService');
  await notificationService.createAndSend({
    userId: chef._id,
    type: 'general',
    message: `Your kitchen verification application was not approved. Reason: ${chef.chefProfile.rejectionReason}`,
    data: { reason: chef.chefProfile.rejectionReason }
  });

  return sendResponse(res, 200, 'Chef kitchen rejected', { chef });
});

/**
 * Suspend or reinstate any user
 */
const toggleSuspendUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isSuspended = true, reason } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isSuspended = isSuspended;
  // If suspended, revoke all active sessions
  if (isSuspended) {
    user.refreshTokens = [];
  }

  await user.save({ validateBeforeSave: false });

  return sendResponse(
    res,
    200,
    `User ${isSuspended ? 'suspended' : 'reinstated'} successfully`,
    { user }
  );
});

/**
 * List all areas with dynamic aggregation counts
 */
const getAreas = asyncHandler(async (req, res, next) => {
  const areas = await Area.find().sort({ demandCount: -1, createdAt: -1 });

  // Enrich with verified chefs count, open kitchens count, and waiting list count
  const areasWithCounts = await Promise.all(
    areas.map(async (area) => {
      const [approvedChefsCount, openKitchensCount, waitingListSize] = await Promise.all([
        User.countDocuments({
          role: 'chef',
          area: area._id,
          isLocationVerified: true,
          'chefProfile.verificationStatus': 'approved',
          isSuspended: false
        }),
        User.countDocuments({
          role: 'chef',
          area: area._id,
          isLocationVerified: true,
          'chefProfile.verificationStatus': 'approved',
          isSuspended: false,
          'chefProfile.availabilityStatus': { $ne: 'paused' }
        }),
        WaitingListEntry.countDocuments({ area: area._id })
      ]);

      return {
        ...area.toObject(),
        approvedChefsCount,
        openKitchensCount,
        waitingListSize
      };
    })
  );

  return sendResponse(res, 200, 'Areas fetched successfully', { areas: areasWithCounts });
});

/**
 * Create a new Area
 */
const createArea = asyncHandler(async (req, res, next) => {
  const { name, type, center, radiusInMeters, geoFence, activationThreshold } = req.body;

  const area = await Area.create({
    name,
    type,
    center,
    radiusInMeters: radiusInMeters || 2000,
    geoFence,
    activationThreshold: activationThreshold || 5
  });

  return sendResponse(res, 201, 'Area created successfully', { area });
});

/**
 * Update an Area
 */
const updateArea = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const area = await Area.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!area) {
    return next(new AppError('Area not found', 404));
  }

  return sendResponse(res, 200, 'Area updated successfully', { area });
});

/**
 * Manually activate an Area
 */
const activateArea = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const area = await Area.findById(id);
  if (!area) {
    return next(new AppError('Area not found', 404));
  }

  area.isActive = true;
  await area.save();

  return sendResponse(res, 200, `Area "${area.name}" manually activated`, { area });
});

/**
 * View Waiting List entries
 */
const getWaitingLists = asyncHandler(async (req, res, next) => {
  const { areaId } = req.query;
  const query = {};
  if (areaId) query.area = areaId;

  const entries = await WaitingListEntry.find(query)
    .populate('customer', 'name email phone ratingAverage address')
    .populate('area', 'name type isActive demandCount activationThreshold')
    .sort({ joinedAt: -1 });

  return sendResponse(res, 200, 'Waiting list entries fetched successfully', { entries });
});

/**
 * List all complaints
 */
const getComplaints = asyncHandler(async (req, res, next) => {
  const { status, category, reporterRole, page = 1, limit = 10 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (reporterRole && reporterRole !== 'all') query.reporterRole = reporterRole;

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('raisedBy', 'name role email')
      .populate('against', 'name role email chefProfile.kitchenName')
      .populate('reservation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Complaint.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Complaints fetched successfully', {
    complaints,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Resolve complaint and take administrative action
 */
const resolveComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status = 'resolved', adminNote, action = 'none', hideReview = false } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  complaint.status = status;
  complaint.adminNote = adminNote || complaint.adminNote;
  complaint.action = action;
  complaint.resolvedBy = req.user._id;
  await complaint.save();

  // If suspension action was selected, suspend the accused user
  if (action === 'suspension') {
    await User.findByIdAndUpdate(complaint.against, {
      isSuspended: true,
      refreshTokens: []
    });
  }

  // If hideReview requested and complaint is linked to reservation
  if (hideReview && complaint.reservation) {
    await Review.updateMany(
      { reservation: complaint.reservation },
      { isHidden: true }
    );
  }

  return sendResponse(res, 200, 'Complaint resolved and administrative action applied', {
    complaint
  });
});

/**
 * List support tickets
 */
const getSupportTickets = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = {};
  if (status) query.status = status;

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .populate('user', 'name email role')
      .populate('assignedAdmin', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    SupportTicket.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Support tickets fetched successfully', {
    tickets,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Update support ticket
 */
const updateSupportTicket = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, assignedAdmin, resolution } = req.body;

  const ticket = await SupportTicket.findById(id);
  if (!ticket) {
    return next(new AppError('Support ticket not found', 404));
  }

  if (status) ticket.status = status;
  if (assignedAdmin) ticket.assignedAdmin = assignedAdmin;
  if (resolution) ticket.resolution = resolution;

  await ticket.save();

  return sendResponse(res, 200, 'Support ticket updated successfully', { ticket });
});

/**
 * Admin Comprehensive Analytics
 * (verified households, household growth, active subscriptions, weekly/monthly plan distribution,
 * active vs waiting areas, reservation volume, pickup completion rate, complaint rate, average household rating)
 */
const getAdminAnalytics = asyncHandler(async (req, res, next) => {
  // 1. Verified households (verified customers + verified chefs)
  const [verifiedCustomers, verifiedChefs, totalCustomers, totalChefs] = await Promise.all([
    User.countDocuments({ role: 'customer', isLocationVerified: true }),
    User.countDocuments({
      role: 'chef',
      isLocationVerified: true,
      'chefProfile.verificationStatus': 'approved'
    }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'chef' })
  ]);

  const verifiedHouseholds = verifiedCustomers + verifiedChefs;

  // 2. Household growth (grouped by month over past 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const householdGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
        chefs: { $sum: { $cond: [{ $eq: ['$role', 'chef'] }, 1, 0] } },
        total: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 3. Subscriptions & Plan Distribution
  const [activeSubscriptions, planDistributionAgg] = await Promise.all([
    Subscription.countDocuments({ status: 'active' }),
    Subscription.aggregate([
      { $match: { status: { $in: ['active', 'accepted'] } } },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const planDistribution = {
    weekly: 0,
    monthly: 0
  };
  planDistributionAgg.forEach((item) => {
    if (item._id === 'weekly') planDistribution.weekly = item.count;
    if (item._id === 'monthly') planDistribution.monthly = item.count;
  });

  // 4. Active vs Waiting Areas
  const [activeAreasCount, waitingAreasCount] = await Promise.all([
    Area.countDocuments({ isActive: true }),
    Area.countDocuments({ isActive: false })
  ]);

  // 5. Reservation metrics (volume, picked_up rate, missed)
  const [totalReservations, pickedUpReservations, missedReservations] = await Promise.all([
    Reservation.countDocuments(),
    Reservation.countDocuments({ status: 'picked_up' }),
    Reservation.countDocuments({ isMissed: true })
  ]);

  const pickupCompletionRate =
    totalReservations > 0
      ? parseFloat(((pickedUpReservations / totalReservations) * 100).toFixed(1))
      : 0;

  // 6. Complaint Rate
  const totalComplaints = await Complaint.countDocuments();
  const complaintRate =
    totalReservations > 0
      ? parseFloat(((totalComplaints / totalReservations) * 100).toFixed(2))
      : 0;

  // 7. Average Household Rating
  const avgRatingAgg = await User.aggregate([
    { $match: { role: 'chef', 'chefProfile.verificationStatus': 'approved', ratingCount: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$ratingAverage' }
      }
    }
  ]);

  const averageHouseholdRating = avgRatingAgg[0]
    ? parseFloat(avgRatingAgg[0].averageRating.toFixed(2))
    : 4.8;

  return sendResponse(res, 200, 'Admin platform analytics fetched successfully', {
    households: {
      verifiedHouseholds,
      verifiedCustomers,
      verifiedChefs,
      totalCustomers,
      totalChefs,
      growth: householdGrowth
    },
    subscriptions: {
      activeSubscriptions,
      planDistribution
    },
    areas: {
      activeAreas: activeAreasCount,
      waitingAreas: waitingAreasCount,
      totalAreas: activeAreasCount + waitingAreasCount
    },
    reservations: {
      volume: totalReservations,
      pickedUp: pickedUpReservations,
      missed: missedReservations,
      pickupCompletionRate
    },
    complaints: {
      total: totalComplaints,
      complaintRate
    },
    averageHouseholdRating
  });
});

/**
 * List all users with search, role filter, and suspension state
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const { role, search, isSuspended, page = 1, limit = 10 } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isSuspended !== undefined) query.isSuspended = isSuspended === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { 'chefProfile.kitchenName': { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('area', 'name type isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    User.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Users fetched successfully', {
    users,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

module.exports = {
  getPendingChefs,
  approveChef,
  rejectChef,
  toggleSuspendUser,
  getAreas,
  createArea,
  updateArea,
  activateArea,
  getWaitingLists,
  getComplaints,
  resolveComplaint,
  getSupportTickets,
  updateSupportTicket,
  getAdminAnalytics,
  getUsers
};
