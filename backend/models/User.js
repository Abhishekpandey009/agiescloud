const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minLength: [2, 'Name must be at least 2 characters'],
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxLength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    type: String,
    default: '',
    maxLength: [100, 'Location cannot exceed 100 characters']
  },
  website: {
    type: String,
    default: ''
  },
  // Storage management
  storageUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  storageLimit: {
    type: Number,
    default: 10 * 1024 * 1024 * 1024, // 10GB default
    min: 0
  },
  // Account settings
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Security settings
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  // Notification preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    fileShared: {
      type: Boolean,
      default: true
    },
    storageLimit: {
      type: Boolean,
      default: true
    }
  },
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Email verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  // Login tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.twoFactorSecret;
      return ret;
    }
  }
});

// Virtual for storage percentage
userSchema.virtual('storagePercentage').get(function() {
  return Math.round((this.storageUsed / this.storageLimit) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Guard against missing inputs
  if (typeof candidatePassword !== 'string' || candidatePassword.length === 0) {
    return false;
  }

  const stored = this.password;
  if (typeof stored !== 'string' || stored.length === 0) {
    return false;
  }

  const isBcryptHash = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');

  try {
    if (isBcryptHash) {
      return await bcrypt.compare(candidatePassword, stored);
    }

    // Fallback: legacy/plaintext password detected. Compare directly and rehash on success.
    if (candidatePassword === stored) {
      this.password = candidatePassword; // will be hashed by pre-save hook
      await this.save();
      return true;
    }

    return false;
  } catch (error) {
    // Do not throw to avoid 500s on login; treat as mismatch
    return false;
  }
};

// Instance method to check if user has enough storage
userSchema.methods.hasEnoughStorage = function(fileSize) {
  return (this.storageUsed + fileSize) <= this.storageLimit;
};

// Instance method to update storage usage
userSchema.methods.updateStorageUsage = function(sizeChange) {
  this.storageUsed = Math.max(0, this.storageUsed + sizeChange);
  return this.save();
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
