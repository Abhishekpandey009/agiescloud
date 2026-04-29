const mongoose = require('mongoose');
const crypto = require('crypto');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: 0
  },
  type: {
    type: String,
    required: [true, 'File type is required'],
    lowercase: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'File owner is required'],
    index: true
  },
  gridFsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'GridFS ID is required']
  },
  // File organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  // File status
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  // Sharing and permissions
  isShared: {
    type: Boolean,
    default: false,
    index: true
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  shareSettings: {
    linkAccess: {
      type: String,
      enum: ['private', 'view', 'edit'],
      default: 'private'
    },
    allowDownload: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    password: {
      type: String,
      default: null
    }
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    permissions: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  // File metadata
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    pages: Number,
    encoding: String,
    checksum: String
  },
  // Activity tracking
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  // Version control
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  parentFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  // Security
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file size in human readable format
fileSchema.virtual('sizeFormatted').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.size === 0) return '0 Bytes';
  const i = Math.floor(Math.log(this.size) / Math.log(1024));
  return Math.round(this.size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Pre-save middleware to generate share link
fileSchema.pre('save', function(next) {
  if (this.isModified('isShared') && this.isShared && !this.shareLink) {
    this.shareLink = this.generateShareLink();
  }
  next();
});

// Instance method to generate unique share link
fileSchema.methods.generateShareLink = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Instance method to share file with user
fileSchema.methods.shareWith = async function(email, permissions = 'view') {
  // Check if already shared with this email
  const existingShare = this.sharedWith.find(share => share.email === email);
  
  if (existingShare) {
    // Update permissions if already shared
    existingShare.permissions = permissions;
    existingShare.sharedAt = new Date();
  } else {
    // Add new share
    this.sharedWith.push({
      email: email,
      permissions: permissions,
      sharedBy: this.ownerId,
      sharedAt: new Date()
    });
  }
  
  // Update shared status
  this.isShared = this.sharedWith.length > 0;
  
  // Generate share link if not exists
  if (this.isShared && !this.shareLink) {
    this.shareLink = this.generateShareLink();
  }
  
  return this.save();
};

// Instance method to unshare file from user
fileSchema.methods.unshareWith = async function(email) {
  this.sharedWith = this.sharedWith.filter(share => share.email !== email);
  
  // Update shared status
  this.isShared = this.sharedWith.length > 0;
  
  // Remove share link if no longer shared
  if (!this.isShared) {
    // Use undefined to avoid duplicate key issues on sparse unique index
    this.shareLink = undefined;
    this.shareSettings = {
      linkAccess: 'private',
      allowDownload: true,
      expiresAt: null,
      password: null
    };
  }
  
  return this.save();
};

// Instance method to update share settings
fileSchema.methods.updateShareSettings = async function(settings) {
  if (settings.linkAccess !== undefined) {
    this.shareSettings.linkAccess = settings.linkAccess;
  }
  if (settings.allowDownload !== undefined) {
    this.shareSettings.allowDownload = settings.allowDownload;
  }
  if (settings.expiresAt !== undefined) {
    this.shareSettings.expiresAt = settings.expiresAt;
  }
  if (settings.password !== undefined) {
    this.shareSettings.password = settings.password;
  }
  
  return this.save();
};

// Instance method to check if user can access file
fileSchema.methods.canAccess = function(userId, userEmail) {
  // Owner can always access
  if (this.ownerId.toString() === userId.toString()) {
    return { canAccess: true, permissions: 'admin' };
  }
  
  // Check if shared with user
  const shareInfo = this.sharedWith.find(share => 
    share.email === userEmail.toLowerCase() || 
    (share.userId && share.userId.toString() === userId.toString())
  );
  
  if (shareInfo) {
    return { canAccess: true, permissions: shareInfo.permissions };
  }
  
  // Check public link access
  if (this.shareSettings && this.shareSettings.linkAccess !== 'private') {
    return { canAccess: true, permissions: 'view' };
  }
  
  return { canAccess: false, permissions: null };
};

// Instance method to add tag
fileSchema.methods.addTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
  }
  return this.save();
};

// Instance method to remove tag
fileSchema.methods.removeTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  return this.save();
};

// Static method to find files by owner
fileSchema.statics.findByOwner = function(ownerId, options = {}) {
  const query = { 
    ownerId,
    isDeleted: options.includeDeleted ? undefined : false
  };
  
  if (query.isDeleted === undefined) {
    delete query.isDeleted;
  }
  
  return this.find(query);
};

// Static method to search files
fileSchema.statics.searchFiles = function(ownerId, searchTerm, options = {}) {
  const query = {
    ownerId,
    isDeleted: false,
    $or: [
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.mimeType) {
    query.mimeType = { $regex: options.mimeType, $options: 'i' };
  }
  
  return this.find(query);
};

// Indexes for better performance
fileSchema.index({ ownerId: 1, isDeleted: 1 });
fileSchema.index({ ownerId: 1, isFavorite: 1 });
fileSchema.index({ ownerId: 1, isShared: 1 });
fileSchema.index({ shareLink: 1 });
fileSchema.index({ 'sharedWith.email': 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ mimeType: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ lastAccessed: -1 });
// Index checksum for duplicate detection
fileSchema.index({ 'metadata.checksum': 1 });

// Text index for full-text search
fileSchema.index({
  originalName: 'text',
  description: 'text',
  tags: 'text'
});

module.exports = mongoose.model('File', fileSchema);