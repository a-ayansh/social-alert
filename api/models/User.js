const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  profile: {
    avatar: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      default: null
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      publicProfile: {
        type: Boolean,
        default: false
      },
      showLocation: {
        type: Boolean,
        default: false
      }
    }
  },
  statistics: {
    casesReported: {
      type: Number,
      default: 0
    },
    sightingsReported: {
      type: Number,
      default: 0
    },
    casesHelped: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function(next) {
  
  if (!this.isModified('password')) return next();

  try {
    
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.checkPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLoginInfo = async function(ipAddress, userAgent) {
  try {
    this.lastLogin = new Date();
    this.loginCount += 1;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    
    await this.save({ validateBeforeSave: false });
        
    return this;
  } catch (error) {
    console.error('❌ Error updating login info:', error);
    throw error;
  }
};

userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  return verificationToken;
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

userSchema.virtual('accountAge').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

userSchema.pre('remove', async function(next) {
  try {
    
    const Case = mongoose.model('Case');
    await Case.deleteMany({ reportedBy: this._id });
    
        next();
  } catch (error) {
    next(error);
  }
});

userSchema.post('save', function(doc, next) {
  if (this.isNew) {
      }
  next();
});

module.exports = mongoose.model('User', userSchema);