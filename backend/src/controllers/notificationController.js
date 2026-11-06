const Notification = require('../models/notificationModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

/**
 * Get notifications for authenticated user
 */
const getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  return sendResponse(res, 200, 'Notifications fetched successfully', {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

/**
 * Mark a single notification as read
 */
const markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  return sendResponse(res, 200, 'Notification marked as read', { notification });
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

  return sendResponse(res, 200, 'All notifications marked as read');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
