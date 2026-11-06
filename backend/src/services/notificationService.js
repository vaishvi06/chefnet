const Notification = require('../models/notificationModel');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  async createAndSend({ userId, type, message, data = {} }) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        message,
        data
      });

      // Emit to user's individual room via Socket.io if connected
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification', notification);
      }

      return notification;
    } catch (err) {
      console.error('[NotificationService] Failed to create notification:', err.message);
      return null;
    }
  }
}

const notificationService = new NotificationService();

module.exports = notificationService;
