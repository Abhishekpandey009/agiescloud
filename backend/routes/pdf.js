// backend/routes/pdf.js
const express = require('express');
const router = express.Router();
const pdfCtrl = require('../controllers/pdfController');
const { authMiddleware } = require('../middleware/authMiddleware'); // optional

// Upload file and summarize (form-data: file, instruction)
router.post('/summarize', /*authMiddleware,*/ pdfCtrl.uploadAndSummarize);

// Summarize existing file by id (body: instruction)
router.post('/summarize/:fileId', /*authMiddleware,*/ pdfCtrl.summarizeByFileId);

module.exports = router;