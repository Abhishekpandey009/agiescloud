const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const {
  analyzeFile,
  suggestTags,
  getSimilarFiles,
  getOrganizationSuggestions,
  getSearchSuggestions,
  applyTags,
  getDuplicates,
  cleanupDuplicates,
  semanticSearch,
  autoApplyTags
} = require('../controllers/aiController');

// Base route
router.get('/', authMiddleware, apiLimiter, (req, res) => {
  res.json({
    success: true,
    message: 'AegisCloud AI Feature API is running',
  });
});

// File analysis
router.post('/analyze/:fileId', authMiddleware, apiLimiter, analyzeFile);

// Suggest tags for a file
router.post('/tags/:fileId', authMiddleware, apiLimiter, suggestTags);
router.post('/suggest-tags/:fileId', authMiddleware, apiLimiter, suggestTags); // legacy path compatibility

// Get similar files
router.get('/similar/:fileId', authMiddleware, apiLimiter, getSimilarFiles);

// Get organization/folder suggestions for a file
router.get('/organization/suggestions', authMiddleware, apiLimiter, getOrganizationSuggestions);
router.get('/organization-suggestions/:fileId', authMiddleware, apiLimiter, getOrganizationSuggestions); // legacy path compatibility

// Search suggestion endpoint (query-based)
router.get('/search/suggestions', authMiddleware, apiLimiter, getSearchSuggestions);
router.get('/search-suggestions', authMiddleware, apiLimiter, getSearchSuggestions);

// Apply tags to a file
router.post('/tags/:fileId/apply', authMiddleware, apiLimiter, applyTags);
router.post('/apply-tags/:fileId', authMiddleware, apiLimiter, applyTags);

// Duplicate detection
router.get('/duplicates', authMiddleware, apiLimiter, getDuplicates);
router.post('/duplicates/cleanup', authMiddleware, apiLimiter, cleanupDuplicates);

// Auto-apply tags (bulk/auto rules)
router.post('/tags/:fileId/auto', authMiddleware, apiLimiter, autoApplyTags);
router.post('/auto-apply/:fileId', authMiddleware, apiLimiter, autoApplyTags); // allow legacy clients
router.post('/auto-apply', authMiddleware, apiLimiter, autoApplyTags);

// Semantic search across files
router.get('/semantic/search', authMiddleware, apiLimiter, semanticSearch);
router.post('/semantic/search', authMiddleware, apiLimiter, semanticSearch);
router.post('/semantic-search', authMiddleware, apiLimiter, semanticSearch);

module.exports = router;
