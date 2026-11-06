const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['society', 'locality', 'sector', 'campus'],
      default: 'locality'
    },
    center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0]
      }
    },
    radiusInMeters: {
      type: Number,
      default: 2000 // default 2km radius if polygon is not specified
    },
    geoFence: {
      type: {
        type: String,
        enum: ['Polygon']
      },
      coordinates: {
        type: [[[Number]]] // [[[lng, lat], [lng, lat], ...]]
      }
    },
    isActive: {
      type: Boolean,
      default: false
    },
    demandCount: {
      type: Number,
      default: 0
    },
    activationThreshold: {
      type: Number,
      default: 5
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index on location / center
areaSchema.index({ center: '2dsphere' });
areaSchema.index({ geoFence: '2dsphere' });
areaSchema.index({ isActive: 1 });

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
