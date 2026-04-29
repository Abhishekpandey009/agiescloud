const File = require('../models/File');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const stream = require('stream');
const crypto = require('crypto');

// Helper function to generate auto tags based on file type and name
const generateAutoTags = (filename, mimetype) => {
  const tags = [];
  const extension = filename.split('.').pop().toLowerCase();
  
  // File type tags
  if (mimetype.startsWith('image/')) {
    tags.push('image', 'media');
  } else if (mimetype.startsWith('video/')) {
    tags.push('video', 'media');
  } else if (mimetype.startsWith('audio/')) {
    tags.push('audio', 'media');
  } else if (mimetype.includes('pdf')) {
    tags.push('document', 'pdf');
  } else if (mimetype.includes('word') || mimetype.includes('text')) {
    tags.push('document', 'text');
  } else if (mimetype.includes('zip') || mimetype.includes('rar')) {
    tags.push('archive', 'compressed');
  }
  
  // Add extension as tag
  tags.push(extension);
  
  // Add filename-based tags
  const nameWords = filename.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').split(/\s+/);
  nameWords.forEach(word => {
    if (word.length > 2 && !tags.includes(word)) {
      tags.push(word);
    }
  });
  
  return tags;
};

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Check if user has enough storage
    const fileSize = req.file.size;
    const user = await User.findById(req.user.id);
    
    if (!user.hasEnoughStorage(fileSize)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient storage space'
      });
    }

    // Compute checksum (md5) for duplicate detection
    const checksum = crypto.createHash('md5').update(req.file.buffer).digest('hex');

    // Create GridFS upload stream
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${req.file.originalname}`;
    const uploadStream = global.gridfsBucket.openUploadStream(filename, {
      metadata: {
        originalName: req.file.originalname,
        userId: req.user.id,
        uploadDate: new Date(),
        checksum
      }
    });

    // Convert buffer to stream and pipe to GridFS
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    
    bufferStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading file'
      });
    });

    uploadStream.on('finish', async () => {
      try {
        // Generate auto tags
        const autoTags = generateAutoTags(req.file.originalname, req.file.mimetype);
        
        // Create file record in database
        const newFile = new File({
          filename: filename,
          originalName: req.file.originalname,
          size: fileSize,
          type: req.file.originalname.split('.').pop().toLowerCase(),
          mimeType: req.file.mimetype,
          ownerId: req.user.id,
          gridFsId: uploadStream.id,
          tags: autoTags,
          metadata: { checksum }
        });

        const savedFile = await newFile.save();

        // Update user's storage usage
        user.storageUsed += fileSize;
        await user.save();

        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          data: {
            file: savedFile
          }
        });
      } catch (error) {
        console.error('Database save error:', error);
        // Clean up GridFS file if database save fails
        try {
          global.gridfsBucket.delete(uploadStream.id);
        } catch (cleanupError) {
          console.error('Error cleaning up GridFS file:', cleanupError);
        }
        
        res.status(500).json({
          success: false,
          message: 'Error saving file metadata'
        });
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
};

// @desc    Get user files with pagination and filters
// @route   GET /api/files/list
// @access  Private
const listFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      status = 'active'
    } = req.query;

    // Build filter
    const filter = { 
      ownerId: req.user.id,
      isDeleted: false
    };

    // Add type filter if provided
    if (type && type !== 'all') {
      switch (type) {
        case 'documents':
          filter.mimeType = { $regex: /(pdf|doc|docx|txt)/i };
          break;
        case 'images':
          filter.mimeType = { $regex: /image/i };
          break;
        case 'videos':
          filter.mimeType = { $regex: /video/i };
          break;
        case 'audio':
          filter.mimeType = { $regex: /audio/i };
          break;
        case 'archives':
          filter.mimeType = { $regex: /(zip|rar)/i };
          break;
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const files = await File.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-gridfsId'); // Don't expose GridFS ID

    // Get total count for pagination
    const totalFiles = await File.countDocuments(filter);
    const totalPages = Math.ceil(totalFiles / limit);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFiles,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files'
    });
  }
};

// @desc    Search files
// @route   GET /api/files/search
// @access  Private
const searchFiles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q, type, limit = 20 } = req.query;

    // Build search filter
    const filter = {
      ownerId: req.user.id,
      isDeleted: false
    };

    // Add text search if query provided
    if (q) {
      // Normalize and expand simple intents (resume, bills, invoices, certificate, domicile, etc.)
      const raw = String(q || '').toLowerCase().trim();
      const stripped = raw.replace(/^(find|show|get|list)\s+/i, '');
      const tokens = stripped.split(/\s+/).filter(Boolean);
      const synonyms = {
        resume: ['resume', 'cv'],
        bill: ['bill', 'bills', 'invoice', 'invoices', 'receipt', 'receipts'],
        invoice: ['invoice', 'invoices', 'bill', 'bills'],
        certificate: ['certificate', 'certificates'],
        income: ['income', 'salary', 'earnings'],
        domicile: ['domicile', 'residence', 'address proof'],
        id: ['id', 'identity', 'aadhaar', 'passport', 'license'],
        tax: ['tax', 'itr', 'gst'],
        presentation: ['presentation', 'ppt', 'slides'],
        document: ['doc', 'docx', 'document'],
        pdf: ['pdf']
      };

      // Build regex set from tokens and synonyms
      const termSet = new Set();
      tokens.forEach(t => {
        termSet.add(t);
        Object.values(synonyms).forEach(arr => {
          if (arr.includes(t)) arr.forEach(x => termSet.add(x));
        });
        // Map single token groups like 'resume' -> add from key lookup
        if (synonyms[t]) {
          synonyms[t].forEach(x => termSet.add(x));
        }
      });
      // If no tokens (e.g., empty after stripping), fallback to raw
      if (termSet.size === 0 && stripped) termSet.add(stripped);

      const regexes = Array.from(termSet).map(t => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

      filter.$or = [
        { filename: { $in: regexes } },
        { originalName: { $in: regexes } },
        { tags: { $in: regexes } }
      ];
    }

    // Add type filter
    if (type && type !== 'all') {
      switch (type.toLowerCase()) {
        case 'documents':
        case 'document':
        case 'doc':
          filter.mimeType = { $regex: /(pdf|doc|docx|txt)/i };
          break;
        case 'images':
        case 'image':
          filter.mimeType = { $regex: /image/i };
          break;
        case 'videos':
        case 'video':
          filter.mimeType = { $regex: /video/i };
          break;
        case 'audio':
          filter.mimeType = { $regex: /audio/i };
          break;
        case 'archives':
        case 'archive':
          filter.mimeType = { $regex: /(zip|rar)/i };
          break;
        case 'pdf':
          filter.mimeType = { $regex: /pdf/i };
          break;
        case 'xls':
          filter.mimeType = { $regex: /(excel|spreadsheet)/i };
          break;
        case 'ppt':
          filter.mimeType = { $regex: /(powerpoint|presentation)/i };
          break;
        case 'resume':
          filter.$or = [
            ...(filter.$or || []),
            { originalName: { $regex: /(resume|cv)/i } },
            { tags: { $in: [new RegExp('(resume|cv)', 'i')] } }
          ];
          break;
        case 'bill':
        case 'bills':
        case 'invoice':
          filter.$or = [
            ...(filter.$or || []),
            { originalName: { $regex: /(bill|invoice|receipt)/i } },
            { tags: { $in: [new RegExp('(bill|invoice|receipt)', 'i')] } }
          ];
          break;
        case 'certificate':
          filter.$or = [
            ...(filter.$or || []),
            { originalName: { $regex: /(certificate)/i } },
            { tags: { $in: [new RegExp('(certificate)', 'i')] } }
          ];
          break;
      }
    }

    const files = await File.find(filter)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select('-gridfsId');

    res.json({
      success: true,
      data: {
        files,
        query: q,
        resultsCount: files.length
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching files'
    });
  }
};

// @desc    Download file
// @route   GET /api/files/download/:id
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { ownerId: req.user.id }, // User owns the file
        { 'sharedWith.email': req.user.email.toLowerCase() } // File is shared with user
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Create download stream from GridFS
    const downloadStream = global.gridfsBucket.openDownloadStream(file.gridFsId);

    // Handle stream errors
    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          message: 'File not found in storage'
        });
      }
    });

    // Set response headers
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': file.size
    });

    // Update download count
    file.downloadCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    // Pipe file to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading file'
      });
    }
  }
};

// @desc    Delete file (soft delete)
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Soft delete - move to trash
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({
      success: true,
      message: 'File moved to trash successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

// @desc    Toggle favorite status
// @route   PATCH /api/files/:id/favorite
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    res.json({
      success: true,
      message: `File ${file.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { isFavorite: file.isFavorite }
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating favorite status'
    });
  }
};

// @desc    Get favorite files
// @route   GET /api/files/favorites
// @access  Private
const getFavoriteFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const files = await File.find({
      ownerId: req.user.id,
      isDeleted: false,
      isFavorite: true
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-gridFsId');
    
    const totalFiles = await File.countDocuments({
      ownerId: req.user.id,
      isDeleted: false,
      isFavorite: true
    });
    
    res.json({
      success: true,
      data: files,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles,
        hasNext: page * limit < totalFiles,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get favorite files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite files'
    });
  }
};

// @desc    Restore file from trash
// @route   PATCH /api/files/:id/restore
// @access  Private
const restoreFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
      isDeleted: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash'
      });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json({
      success: true,
      message: 'File restored successfully',
      data: { file }
    });

  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring file'
    });
  }
};

// @desc    Share file with users
// @route   POST /api/files/:id/share
// @access  Private
const shareFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;
    let { permissions = 'view' } = req.body;

    // Normalize incoming permissions to supported enum values
    const perm = (permissions || '').toString().toLowerCase();
    if (perm === 'download') permissions = 'view';
    else if (!['view','edit','admin'].includes(perm)) permissions = 'view';
    else permissions = perm;

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one email address'
      });
    }

    // Find file and verify ownership
    const file = await File.findOne({
      _id: id,
      ownerId: req.user.id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    // Share with each email
    for (const email of emails) {
      await file.shareWith(email.trim().toLowerCase(), permissions);
    }

    // Populate shared with details
    await file.populate('sharedWith.userId', 'name email');

    res.json({
      success: true,
      message: `File shared with ${emails.length} user(s)`,
      data: { 
        file,
        shareLink: file.shareLink,
        sharedWith: file.sharedWith
      }
    });

  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing file'
    });
  }
};

// @desc    Unshare file from specific users
// @route   DELETE /api/files/:id/unshare
// @access  Private
const unshareFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one email address'
      });
    }

    // Find file and verify ownership
    const file = await File.findOne({
      _id: id,
      ownerId: req.user.id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    // Unshare from each email
    for (const email of emails) {
      await file.unshareWith(email.trim().toLowerCase());
    }

    res.json({
      success: true,
      message: `File unshared from ${emails.length} user(s)`,
      data: { 
        file,
        sharedWith: file.sharedWith
      }
    });

  } catch (error) {
    console.error('Unshare error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unsharing file'
    });
  }
};

// @desc    Get shared files (files shared with current user)
// @route   GET /api/files/shared
// @access  Private
const getSharedFiles = async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    
    // Find files shared with this user
    const sharedFiles = await File.find({
      isDeleted: false,
      'sharedWith.email': userEmail
    })
    .populate('ownerId', 'name email')
    .sort({ 'sharedWith.sharedAt': -1 });

    // Filter and format the response
    const formattedFiles = sharedFiles.map(file => {
      const shareInfo = file.sharedWith.find(share => share.email === userEmail);
      return {
        ...file.toObject(),
        sharedBy: file.ownerId,
        sharePermissions: shareInfo.permissions,
        sharedAt: shareInfo.sharedAt
      };
    });

    res.json({
      success: true,
      data: { 
        files: formattedFiles,
        count: formattedFiles.length
      }
    });

  } catch (error) {
    console.error('Get shared files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shared files'
    });
  }
};

// @desc    Get files shared by current user
// @route   GET /api/files/shared-by-me
// @access  Private
const getFilesSharedByMe = async (req, res) => {
  try {
    // Find files owned by user that are shared
    const sharedFiles = await File.find({
      ownerId: req.user.id,
      isDeleted: false,
      isShared: true
    })
    .populate('sharedWith.userId', 'name email')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { 
        files: sharedFiles,
        count: sharedFiles.length
      }
    });

  } catch (error) {
    console.error('Get files shared by me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files shared by you'
    });
  }
};

// @desc    Update share settings
// @route   PUT /api/files/:id/share-settings
// @access  Private
const updateShareSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { linkAccess, allowDownload, expiresAt } = req.body;

    // Find file and verify ownership
    const file = await File.findOne({
      _id: id,
      ownerId: req.user.id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    // Update settings
    const settings = {};
    if (linkAccess !== undefined) settings.linkAccess = linkAccess;
    if (allowDownload !== undefined) settings.allowDownload = allowDownload;
    if (expiresAt !== undefined) settings.expiresAt = expiresAt;

    await file.updateShareSettings(settings);

    res.json({
      success: true,
      message: 'Share settings updated successfully',
      data: { 
        file,
        shareLink: file.shareLink,
        shareSettings: file.shareSettings
      }
    });

  } catch (error) {
    console.error('Update share settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating share settings'
    });
  }
};

// @desc    Get trash files
// @route   GET /api/files/trash
// @access  Private
const getTrashFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'deletedAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const files = await File.find({
      ownerId: req.user.id,
      isDeleted: true
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-gridFsId');
    
    const totalFiles = await File.countDocuments({
      ownerId: req.user.id,
      isDeleted: true
    });
    
    res.json({
      success: true,
      data: {
        files,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalFiles / limit),
          totalFiles,
          hasNext: page * limit < totalFiles,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get trash files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trash files'
    });
  }
};

// @desc    Permanently delete file
// @route   DELETE /api/files/:id/permanent
// @access  Private
const permanentDeleteFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
      isDeleted: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash'
      });
    }

    try {
      // Delete from GridFS
      await global.gridfsBucket.delete(file.gridFsId);
    } catch (gridFsError) {
      console.error('GridFS deletion error:', gridFsError);
      // Continue with database deletion even if GridFS fails
    }

    // Delete from database
    await File.findByIdAndDelete(file._id);

    // Update user's storage usage
    const user = await User.findById(req.user.id);
    if (user && user.storageUsed >= file.size) {
      user.storageUsed -= file.size;
      await user.save();
    }

    res.json({
      success: true,
      message: 'File permanently deleted successfully'
    });

  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting file'
    });
  }
};

// @desc    Empty trash (permanently delete all trash files)
// @route   DELETE /api/files/trash/empty
// @access  Private
const emptyTrash = async (req, res) => {
  try {
    const trashFiles = await File.find({
      ownerId: req.user.id,
      isDeleted: true
    });

    if (trashFiles.length === 0) {
      return res.json({
        success: true,
        message: 'Trash is already empty'
      });
    }

    let totalSizeFreed = 0;
    let deletedCount = 0;

    // Delete files from GridFS and calculate storage freed
    for (const file of trashFiles) {
      try {
        await global.gridfsBucket.delete(file.gridFsId);
        totalSizeFreed += file.size;
        deletedCount++;
      } catch (gridFsError) {
        console.error(`GridFS deletion error for file ${file._id}:`, gridFsError);
        // Continue with next file
      }
    }

    // Delete all trash files from database
    await File.deleteMany({
      ownerId: req.user.id,
      isDeleted: true
    });

    // Update user's storage usage
    if (totalSizeFreed > 0) {
      const user = await User.findById(req.user.id);
      if (user && user.storageUsed >= totalSizeFreed) {
        user.storageUsed -= totalSizeFreed;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: `Trash emptied successfully. ${deletedCount} files permanently deleted.`,
      data: {
        deletedCount,
        storageFreed: totalSizeFreed
      }
    });

  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error emptying trash'
    });
  }
};

// @desc    Rename a file
// @route   PATCH /api/files/:id/rename
// @access  Private
const renameFile = async (req, res) => {
  try {
    const { id } = req.params;
    let { newName } = req.body || {};
    newName = (newName || '').toString().trim();
    if (!newName) {
      return res.status(400).json({ success: false, message: 'newName is required' });
    }

    const file = await File.findOne({ _id: id, ownerId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const keepExt = !/\.[a-z0-9]{2,}$/i.test(newName);
    if (keepExt && file.originalName.includes('.')) {
      const ext = file.originalName.split('.').pop();
      if (ext) newName = `${newName}.${ext}`;
    }

    const dup = await File.findOne({ ownerId: req.user.id, isDeleted: false, _id: { $ne: file._id }, originalName: { $regex: new RegExp(`^${newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (dup) return res.status(409).json({ success: false, message: `A file named "${newName}" already exists` });

    const prev = file.originalName;
    file.originalName = newName;
    file.filename = newName;
    file.markModified('originalName');
    file.markModified('filename');
    await file.save();

    return res.json({ success: true, message: `Renamed "${prev}" to "${newName}"`, data: { fileId: file._id, oldName: prev, newName } });
  } catch (error) {
    console.error('Rename error:', error);
    return res.status(500).json({ success: false, message: 'Error renaming file' });
  }
};

module.exports = {
  uploadFile,
  listFiles,
  searchFiles,
  downloadFile,
  deleteFile,
  toggleFavorite,
  getFavoriteFiles,
  restoreFile,
  shareFile,
  unshareFile,
  getSharedFiles,
  getFilesSharedByMe,
  updateShareSettings,
  getTrashFiles,
  permanentDeleteFile,
  emptyTrash,
  renameFile
};