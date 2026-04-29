const express = require('express');
const rateLimit = require('express-rate-limit');
const { chatWithAI } = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Route-specific limiter for AI chat usage
const aiChatLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: 'Too many AI requests, please try again later.' }
});

// Stateless chat – POST /api/ai/chat
router.post('/', aiChatLimiter, chatWithAI);

// Session-based chat endpoints
router.get('/sessions', authMiddleware, aiChatLimiter, chatController.listSessions);
router.post('/sessions', authMiddleware, aiChatLimiter, chatController.startSession);
router.get('/sessions/:id', authMiddleware, aiChatLimiter, chatController.getSession);
router.post('/sessions/:id/messages', authMiddleware, aiChatLimiter, chatController.sendMessage);
router.post('/sessions/:id/messages/stream', authMiddleware, aiChatLimiter, chatController.streamMessage);

module.exports = router;
