const rateLimit = require('express-rate-limit');

// Upload rate limiter - more restrictive for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 file uploads per windowMs
  message: {
    success: false,
    message: 'Too many file uploads. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Download rate limiter
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 downloads per windowMs
  message: {
    success: false,
    message: 'Too many download requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Search rate limiter
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: {
    success: false,
    message: 'Too many search requests. Please try again in a minute.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiter - general API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 API requests per windowMs
  message: {
    success: false,
    message: 'Too many API requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many attempts for this operation. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Share operation limiter
const shareLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 share operations per 5 minutes
  message: {
    success: false,
    message: 'Too many share operations. Please try again in 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create custom rate limiter
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000) + ' seconds'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Skip rate limiting for certain conditions
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

const skipFailedRequests = (req, res) => {
  return res.statusCode >= 400;
};

// Dynamic rate limiter based on user authentication
const dynamicLimiter = (authenticatedMax = 200, unauthenticatedMax = 50) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Higher limits for authenticated users
      return req.user ? authenticatedMax : unauthenticatedMax;
    },
    message: (req) => ({
      success: false,
      message: req.user 
        ? 'Too many requests. Please try again in 15 minutes.'
        : 'Too many requests. Please login for higher limits or try again in 15 minutes.',
      retryAfter: '15 minutes'
    }),
    standardHeaders: true,
    legacyHeaders: false
  });
};

// IP-based limiter with different limits for different operations
const operationLimiter = {
  // File operations
  upload: uploadLimiter,
  download: downloadLimiter,
  search: searchLimiter,
  share: shareLimiter,
  
  // General operations
  api: apiLimiter,
  strict: strictLimiter,
  
  // Custom limiters
  custom: createRateLimiter,
  dynamic: dynamicLimiter
};

module.exports = {
  uploadLimiter,
  downloadLimiter,
  searchLimiter,
  apiLimiter,
  strictLimiter,
  shareLimiter,
  createRateLimiter,
  dynamicLimiter,
  operationLimiter,
  skipSuccessfulRequests,
  skipFailedRequests
};
