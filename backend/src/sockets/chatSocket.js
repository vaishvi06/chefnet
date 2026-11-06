const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const ChatMessage = require('../models/chatMessageModel');
const notificationService = require('../services/notificationService');

/**
 * Configure and register Socket.io events
 */
const initChatSocket = (io) => {
  // Give notification service access to io instance
  notificationService.setIO(io);

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.isSuspended) {
        return next(new Error('Authentication error: User invalid or suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket.io] User connected: ${socket.user.name} (${userId})`);

    // Join personal notifications room
    socket.join(`user:${userId}`);

    /**
     * Join Subscription Chat Room
     */
    socket.on('join_subscription', async ({ subscriptionId }) => {
      try {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
          return socket.emit('error', { message: 'Subscription not found' });
        }

        const isCustomer = subscription.customer.toString() === userId;
        const isChef = subscription.chef.toString() === userId;

        if (!isCustomer && !isChef) {
          return socket.emit('error', {
            message: 'You are not a participant of this subscription'
          });
        }

        if (!['accepted', 'active'].includes(subscription.status)) {
          return socket.emit('error', {
            message: 'Chat is only available for accepted or active subscriptions'
          });
        }

        const room = `subscription:${subscriptionId}`;
        socket.join(room);
        socket.emit('joined_room', { room, subscriptionId });
        console.log(`[Socket.io] User ${socket.user.name} joined room ${room}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /**
     * Send Chat Message
     */
    socket.on('send_message', async ({ subscriptionId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
          return socket.emit('error', { message: 'Subscription not found' });
        }

        const isCustomer = subscription.customer.toString() === userId;
        const isChef = subscription.chef.toString() === userId;

        if (!isCustomer && !isChef) {
          return socket.emit('error', {
            message: 'You are not a participant of this subscription'
          });
        }

        if (!['accepted', 'active'].includes(subscription.status)) {
          return socket.emit('error', {
            message: 'Chat is only open for accepted or active subscriptions'
          });
        }

        const message = await ChatMessage.create({
          subscription: subscriptionId,
          sender: userId,
          text: text.trim()
        });

        const populatedMessage = await ChatMessage.findById(message._id).populate(
          'sender',
          'name photoUrl role'
        );

        const room = `subscription:${subscriptionId}`;
        io.to(room).emit('receive_message', populatedMessage);

        // Notify recipient if they are not in the room
        const recipientId = isCustomer ? subscription.chef : subscription.customer;
        notificationService.createAndSend({
          userId: recipientId,
          type: 'subscription_request',
          message: `New message from ${socket.user.name}: "${text.slice(0, 50)}..."`,
          data: { subscriptionId, messageId: message._id }
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /**
     * Mark message as read
     */
    socket.on('mark_read', async ({ messageId }) => {
      try {
        const msg = await ChatMessage.findByIdAndUpdate(
          messageId,
          { readAt: new Date() },
          { new: true }
        );
        if (msg) {
          io.to(`subscription:${msg.subscription}`).emit('message_read', { messageId });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = {
  initChatSocket
};
