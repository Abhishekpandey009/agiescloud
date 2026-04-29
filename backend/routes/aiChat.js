const express = require('express');
const rateLimit = require('express-rate-limit');
const { chatWithAI } = require('../controllers/aiController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Optional: route-specific limiter (layered on top of any global limiter)
// Allows finer control (e.g., 100 requests / 15 min) specifically for AI usage.
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please try again later.' }
});

// SIMPLE (stateless) chat – POST /api/ai/chat  (mount path is /api/ai/chat)
// Add optional auth so actions can auto-execute when a token is present
router.post('/', optionalAuthMiddleware, aiChatLimiter, chatWithAI);

// SESSION-BASED CHAT ENDPOINTS (match frontend expectations)
// List sessions
router.get('/sessions', authMiddleware, aiChatLimiter, chatController.listSessions);
// Start new session
router.post('/sessions', authMiddleware, aiChatLimiter, chatController.startSession);
// Get a session
router.get('/sessions/:id', authMiddleware, aiChatLimiter, chatController.getSession);
// Send message (non-streaming)
router.post('/sessions/:id/messages', authMiddleware, aiChatLimiter, chatController.sendMessage);
// Streaming message endpoint
router.post('/sessions/:id/messages/stream', authMiddleware, aiChatLimiter, chatController.streamMessage);

module.exports = router;
