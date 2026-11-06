const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Reservation must belong to a subscription']
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reservation must have a customer']
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reservation must specify a chef']
    },
    dailyMenu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyMenu',
      required: [true, 'Reservation must reference a daily menu']
    },
    meal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: [true, 'Reservation must reference a meal']
    },
    reserveDate: {
      type: Date,
      required: [true, 'Reservation date is required']
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: [true, 'Meal type is required']
    },
    status: {
      type: String,
      enum: [
        'reserved',
        'preparing',
        'ready',
        'picked_up',
        'missed',
        'cancelled'
      ],
      default: 'reserved'
    },
    qrToken: {
      type: String,
      required: [true, 'Signed QR token is required'],
      unique: true
    },
    manualToken: {
      type: String,
      uppercase: true,
      trim: true,
      default: undefined
    },
    isMissed: {
      type: Boolean,
      default: false
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: one reservation per subscription per date per mealType
reservationSchema.index(
  { subscription: 1, reserveDate: 1, mealType: 1 },
  { unique: true }
);

reservationSchema.index({ chef: 1, reserveDate: 1, status: 1 });
reservationSchema.index({ chef: 1, reserveDate: 1, mealType: 1 });
reservationSchema.index({ customer: 1, reserveDate: 1 });
reservationSchema.index({ manualToken: 1 }, { unique: true, sparse: true });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
