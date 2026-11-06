const SupportTicket = require('../models/supportTicketModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

/**
 * Create a new support ticket
 */
const createTicket = asyncHandler(async (req, res, next) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return next(new AppError('Subject and message are required', 400));
  }

  const ticket = await SupportTicket.create({
    user: req.user._id,
    subject,
    message
  });

  return sendResponse(res, 201, 'Support ticket created successfully', { ticket });
});

/**
 * Get all support tickets submitted by current user
 */
const getMyTickets = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    SupportTicket.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments({ user: req.user._id })
  ]);

  return sendResponse(res, 200, 'Support tickets fetched successfully', {
    tickets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

module.exports = {
  createTicket,
  getMyTickets
};
