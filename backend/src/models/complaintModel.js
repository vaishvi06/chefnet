const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complaint must have a reporting user']
    },
    reporterRole: {
      type: String,
      enum: ['customer', 'chef', 'admin'],
      default: 'customer'
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complaint must specify the accused user']
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null
    },
    category: {
      type: String,
      enum: [
        'food_quality',
        'incorrect_info',
        'hygiene',
        'misconduct',
        'no_show',
        'payment_issue',
        'other'
      ],
      required: [true, 'Complaint category is required']
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'rejected'],
      default: 'open'
    },
    adminNote: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      enum: ['none', 'warning', 'suspension'],
      default: 'none'
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ raisedBy: 1 });
complaintSchema.index({ against: 1, status: 1 });
complaintSchema.index({ status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
