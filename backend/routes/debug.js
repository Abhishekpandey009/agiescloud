const express = require('express');
const router = express.Router();

// Development-only diagnostics: environment + basic route health
router.get('/info', (req, res) => {
  if ((process.env.NODE_ENV || 'development') !== 'development') {
    return res.status(403).json({ success: false, message: 'Debug route disabled in production' });
  }
  res.json({
    success: true,
    message: 'Debug info',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CHAT_PROVIDER: process.env.CHAT_PROVIDER,
      HF_MODEL: process.env.HF_MODEL,
      HF_FALLBACK_MODEL: process.env.HF_FALLBACK_MODEL,
      LLM_TIMEOUT_MS: process.env.LLM_TIMEOUT_MS,
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;