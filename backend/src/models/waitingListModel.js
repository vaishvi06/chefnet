const mongoose = require('mongoose');

const waitingListEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index per customer + area
waitingListEntrySchema.index({ customer: 1, area: 1 }, { unique: true });

const WaitingListEntry = mongoose.model('WaitingListEntry', waitingListEntrySchema);

module.exports = WaitingListEntry;
