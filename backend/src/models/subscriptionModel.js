const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subscription must belong to a customer']
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subscription must specify a chef']
    },
    planType: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: [true, 'Plan type is required']
    },
    mealPlan: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'full_day'],
      required: [true, 'Meal plan is required']
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'rejected',
        'active',
        'paused',
        'cancelled',
        'cancelled_by_chef',
        'removed',
        'expired'
      ],
      default: 'pending'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    removalReason: {
      type: String,
      default: null
    },
    removedAt: {
      type: Date,
      default: null
    },
    pausedPeriods: [
      {
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        reason: { type: String, default: '' }
      }
    ],
    cancelOption: {
      type: String,
      enum: ['immediate', 'after_week', 'after_month'],
      default: null
    },
    expiryReminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.index({ customer: 1, chef: 1, mealPlan: 1, status: 1 });
subscriptionSchema.index({ chef: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
