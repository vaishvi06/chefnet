const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meal must belong to a chef']
    },
    name: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Meal price is required'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      enum: [
        'gujarati',
        'punjabi',
        'south_indian',
        'jain',
        'healthy_diet',
        'student_budget'
      ],
      required: [true, 'Meal category is required']
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: [true, 'Meal type is required']
    },
    photoUrl: {
      type: String,
      default: null
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    isJain: {
      type: Boolean,
      default: false
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    isRemoved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

mealSchema.index({ chef: 1, isRemoved: 1, isPaused: 1 });
mealSchema.index({ category: 1, mealType: 1 });

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;
