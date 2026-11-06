const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Review must reference a reservation']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have an author']
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a target user']
    },
    authorRole: {
      type: String,
      enum: ['customer', 'chef'],
      required: true
    },
    ratings: {
      // Customer to Chef ratings (1 to 5)
      foodQuality: { type: Number, min: 1, max: 5 },
      foodQuantity: { type: Number, min: 1, max: 5 },
      hygiene: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5, required: true },

      // Chef to Customer ratings (1 to 5)
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      reliability: { type: Number, min: 1, max: 5 }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// One review per reservation per author
reviewSchema.index({ reservation: 1, author: 1 }, { unique: true });
reviewSchema.index({ target: 1, isHidden: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
