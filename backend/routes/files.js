const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadFile,
  listFiles,
  downloadFile,
  deleteFile,
  searchFiles,
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
} = require('../controllers/fileController');
const { 
  validateFileId, 
  validateSearch, 
  validateFileUpload 
} = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB default
  },
  fileFilter: (req, file, cb) => {
    // Basic file type checking (more validation in middleware)
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'audio/mpeg',
      'audio/mp3',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the maximum allowed limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Routes

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', 
  authMiddleware, 
  uploadLimiter,
  upload.single('file'),
  handleMulterError,
  validateFileUpload,
  uploadFile
);

// @route   GET /api/files/list
// @desc    Get user's files
// @access  Private
router.get('/list', authMiddleware, listFiles);

// @route   GET /api/files/search
// @desc    Search files
// @access  Private
router.get('/search', authMiddleware, ...validateSearch, searchFiles);

// @route   GET /api/files/favorites
// @desc    Get favorite files
// @access  Private
router.get('/favorites', authMiddleware, getFavoriteFiles);

// @route   GET /api/files/shared
// @desc    Get files shared with current user
// @access  Private
router.get('/shared', authMiddleware, getSharedFiles);

// @route   GET /api/files/shared-by-me
// @desc    Get files shared by current user
// @access  Private
router.get('/shared-by-me', authMiddleware, getFilesSharedByMe);

// @route   GET /api/files/trash
// @desc    Get trash files
// @access  Private
router.get('/trash', authMiddleware, getTrashFiles);

// @route   DELETE /api/files/trash/empty
// @desc    Empty trash (permanently delete all)
// @access  Private
router.delete('/trash/empty', authMiddleware, emptyTrash);

// @route   GET /api/files/download/:id
// @desc    Download a file
// @access  Private
router.get('/download/:id', authMiddleware, ...validateFileId, downloadFile);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', authMiddleware, ...validateFileId, deleteFile);

// @route   PATCH /api/files/:id/favorite
// @desc    Toggle favorite status
// @access  Private
router.patch('/:id/favorite', authMiddleware, ...validateFileId, toggleFavorite);

// @route   PATCH /api/files/:id/restore
// @desc    Restore file from trash
// @access  Private
router.patch('/:id/restore', authMiddleware, ...validateFileId, restoreFile);

// @route   DELETE /api/files/:id/permanent
// @desc    Permanently delete file
// @access  Private
router.delete('/:id/permanent', authMiddleware, ...validateFileId, permanentDeleteFile);

// @route   PATCH /api/files/:id/rename
// @desc    Rename a file
// @access  Private
router.patch('/:id/rename', authMiddleware, ...validateFileId, async (req, res, next) => {
  try {
    await renameFile(req, res);
  } catch (e) {
    next(e);
  }
});

// @route   POST /api/files/:id/share
// @desc    Share file with users
// @access  Private
router.post('/:id/share', authMiddleware, ...validateFileId, shareFile);

// @route   DELETE /api/files/:id/unshare
// @desc    Unshare file from users
// @access  Private
router.delete('/:id/unshare', authMiddleware, ...validateFileId, unshareFile);

// @route   PUT /api/files/:id/share-settings
// @desc    Update share settings
// @access  Private
router.put('/:id/share-settings', authMiddleware, ...validateFileId, updateShareSettings);

module.exports = router;