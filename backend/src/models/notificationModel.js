const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user']
    },
    type: {
      type: String,
      enum: [
        'general',
        'subscription_request',
        'subscription_accepted',
        'subscription_rejected',
        'subscription_cancelled',
        'subscription_expiry',
        'reservation_created',
        'meal_preparing',
        'meal_ready',
        'pickup_reminder',
        'meal_missed',
        'review_received',
        'complaint_update'
      ],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
