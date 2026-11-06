const ChatMessage = require('../models/chatMessageModel');
const Subscription = require('../models/subscriptionModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const notificationService = require('../services/notificationService');

/**
 * Get paginated chat messages for a subscription
 */
const getSubscriptionMessages = asyncHandler(async (req, res, next) => {
  const { subscriptionId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const userId = req.user._id.toString();
  const isCustomer = subscription.customer.toString() === userId;
  const isChef = subscription.chef.toString() === userId;

  if (!isCustomer && !isChef && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view messages for this subscription', 403));
  }

  const [messages, total] = await Promise.all([
    ChatMessage.find({ subscription: subscriptionId })
      .populate('sender', 'name photoUrl role')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatMessage.countDocuments({ subscription: subscriptionId })
  ]);

  return sendResponse(res, 200, 'Chat messages fetched successfully', {
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

/**
 * Send a message via REST
 */
const sendMessage = asyncHandler(async (req, res, next) => {
  const { subscriptionId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return next(new AppError('Message text is required', 400));
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const userId = req.user._id.toString();
  const isCustomer = subscription.customer.toString() === userId;
  const isChef = subscription.chef.toString() === userId;

  if (!isCustomer && !isChef) {
    return next(new AppError('You are not authorized to send messages in this subscription', 403));
  }

  if (!['accepted', 'active'].includes(subscription.status)) {
    return next(new AppError('Chat is only available for accepted or active subscriptions', 400));
  }

  const message = await ChatMessage.create({
    subscription: subscriptionId,
    sender: req.user._id,
    text: text.trim()
  });

  const populatedMessage = await ChatMessage.findById(message._id).populate(
    'sender',
    'name photoUrl role'
  );

  // Broadcast to Socket.io room if active
  if (notificationService.io) {
    notificationService.io
      .to(`subscription:${subscriptionId}`)
      .emit('receive_message', populatedMessage);
  }

  return sendResponse(res, 201, 'Message sent successfully', {
    message: populatedMessage
  });
});

module.exports = {
  getSubscriptionMessages,
  sendMessage
};
