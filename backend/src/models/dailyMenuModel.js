const mongoose = require('mongoose');

const dailyMenuSchema = new mongoose.Schema(
  {
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Daily menu must belong to a chef']
    },
    menuDate: {
      type: Date,
      required: [true, 'Menu date is required']
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: [true, 'Meal type is required']
    },
    meals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meal',
        required: true
      }
    ],
    pickupStart: {
      type: String, // e.g. "12:00" or ISO Date string
      required: [true, 'Pickup start time is required']
    },
    pickupEnd: {
      type: String, // e.g. "14:00" or ISO Date string
      required: [true, 'Pickup end time is required']
    },
    cutoffTime: {
      type: Date,
      required: [true, 'Cutoff time is required']
    },
    quantityAvailable: {
      type: Number,
      required: [true, 'Quantity available is required'],
      min: [0, 'Quantity available cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Unique on chef + menuDate + mealType
dailyMenuSchema.index({ chef: 1, menuDate: 1, mealType: 1 }, { unique: true });

const DailyMenu = mongoose.model('DailyMenu', dailyMenuSchema);

module.exports = DailyMenu;
