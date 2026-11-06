const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    photoUrl: {
      type: String,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    location: {
      type: pointSchema,
      default: () => ({ type: 'Point', coordinates: [0, 0] })
    },
    isLocationVerified: {
      type: Boolean,
      default: false
    },
    locationSource: {
      type: String,
      enum: ['gps', 'search', 'manual', 'pin'],
      default: 'manual'
    },
    role: {
      type: String,
      enum: ['customer', 'chef', 'admin'],
      default: 'customer'
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    missedPickupCount: {
      type: Number,
      default: 0
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      default: null
    },

    // Security & Auth details
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifyTokenHash: {
      type: String,
      select: false,
      default: null
    },
    emailVerifyExpires: {
      type: Date,
      select: false,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      select: false,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          userAgent: { type: String, default: '' },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      select: false,
      default: []
    },

    // Role-specific Profiles
    customerProfile: {
      dietaryPreference: {
        type: String,
        enum: ['all', 'veg', 'jain', 'vegan', 'non_veg'],
        default: 'all'
      },
      favorites: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ]
    },

    chefProfile: {
      kitchenName: {
        type: String,
        trim: true,
        default: ''
      },
      description: {
        type: String,
        trim: true,
        default: ''
      },
      kitchenCode: {
        type: String,
        uppercase: true,
        trim: true,
        default: undefined
      },
      kitchenCodeUpdatedAt: {
        type: Date,
        default: null
      },
      rejectionReason: {
        type: String,
        trim: true,
        default: null
      },
      operatingHours: {
        type: String,
        default: '07:00 - 21:00'
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
      },
      dailyCapacity: {
        type: Number,
        default: 20
      },
      maxSubscribers: {
        type: Number,
        default: 15
      },
      availabilityStatus: {
        type: String,
        enum: ['accepting', 'limited', 'full', 'paused'],
        default: 'accepting'
      },
      vacationPeriods: [
        {
          from: { type: Date, required: true },
          to: { type: Date, required: true },
          reason: { type: String, default: '' }
        }
      ],
      holidaySchedule: [
        {
          type: String
        }
      ]
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.emailVerifyTokenHash;
        delete ret.emailVerifyExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// 2dsphere index on location field for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1, 'chefProfile.verificationStatus': 1 });
userSchema.index({ 'chefProfile.kitchenCode': 1 }, { unique: true, sparse: true });

// Reset isLocationVerified and re-trigger approval if address or location changes on existing chef
userSchema.pre('save', function (next) {
  if (this.role === 'chef') {
    if (!this.chefProfile) {
      this.chefProfile = {};
    }
    if (!this.chefProfile.kitchenCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'CHF-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      this.chefProfile.kitchenCode = code;
    }
  } else if (this.chefProfile) {
    this.chefProfile.kitchenCode = undefined;
  }

  if ((this.isModified('address') || this.isModified('location')) && !this.isNew) {
    if (this.role === 'chef' && this.chefProfile) {
      if (this.isModified('address')) {
        this.isLocationVerified = false;
        this.chefProfile.verificationStatus = 'pending';
        this.chefProfile.isVerified = false;
      }
    } else if (this.isModified('address')) {
      this.isLocationVerified = false;
    }
  }
  next();
});

// Compare password using bcrypt
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if account is locked due to repeated failed login attempts
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Check if password was changed after a JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
