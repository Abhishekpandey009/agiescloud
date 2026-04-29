// backend/controllers/pdfController.js
const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');
const multer = require('multer');
const stream = require('stream');
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/database'); // adapt to your DB helper if different

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 52428800) } });

// helper: read PDF from buffer
async function extractTextFromPdfBuffer(buffer) {
  const data = await pdfParse(buffer);
  // pdf-parse returns text; simple normalization:
  return (data.text || '').replace(/\s+/g, ' ').trim();
}

// chunk text into overlapping chunks sized by approx characters (simple)
function chunkText(text, maxChars = 3000, overlap = 400) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
    if (end === text.length) break;
  }
  return chunks;
}

// call Groq with retry / fallback
async function callGroq(messages, model) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = { model, messages };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json;
}

// build dynamic summarization prompt based on instruction
function buildSummarizePrompt(chunk, instruction, styleFallback = null) {
  // instruction is user instruction like "short", "bullet", "explain like I'm 12", etc.
  // We'll interpret common keywords, else use variable instruction
  const style = (instruction || '').toLowerCase();

  if (!instruction) {
    // default: produce summary + 5 bullets + keywords
    return `Summarize the following text. Provide a short summary (3-5 lines), then 5 bullet points of key ideas, then 5 keywords.\n\nText:\n${chunk}`;
  }

  if (style.includes('short') || style.includes('tl;dr') || style.includes('tldr')) {
    return `Provide a very short summary (2-4 lines) of the following text:\n\n${chunk}`;
  }
  if (style.includes('detailed') || style.includes('explain deeply') || style.includes('long')) {
    return `Provide a detailed summary (3-5 paragraphs) of the following text. Explain important concepts and highlight implications:\n\n${chunk}`;
  }
  if (style.includes('bullet')) {
    return `Provide 8 concise bullet points summarizing the important information in the following text:\n\n${chunk}`;
  }
  if (style.includes('simple') || style.includes("explain like i'm 12") || style.includes("eli5")) {
    return `Explain the following text in simple language that a 12 year old can understand. Provide a short summary and 5 simple bullets:\n\n${chunk}`;
  }
  if (style.includes('key') || style.includes('insight') || style.includes('keywords')) {
    return `Extract the key points and keywords from the following text. Provide 5 bullet points and 8 keywords:\n\n${chunk}`;
  }

  // default fallback: use instruction as a directive
  return `Follow this instruction: "${instruction}". Then summarize or transform the text accordingly.\n\nText:\n${chunk}`;
}

// combine chunked results into a final summary
function mergeChunkSummaries(chunkSummaries, finalInstruction) {
  // naive merge: concatenate chunk summaries and ask the model to condense
  const combined = chunkSummaries.map((s, i) => `Chunk ${i+1} summary:\n${s}`).join('\n\n');

  // return a final prompt to condense them (we will call Groq once more)
  return `You are a summarization assistant. Condense the following chunk summaries into a single ${finalInstruction || 'concise'} summary. Provide a short summary (3-6 lines), 5 bullet points of key takeaways, and 5 keywords.\n\n${combined}`;
}

// ----- route handlers -----

// POST /api/ai/features/summarize  (upload file)
exports.uploadAndSummarize = [
  upload.single('file'),
  async (req, res) => {
    try {
      const instruction = req.body.instruction || ''; // user's preferred style
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      // Only process PDFs (you can extend)
      if (!req.file.mimetype.includes('pdf') && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ success: false, message: 'Only PDF files are supported for summarization' });
      }

      const text = await extractTextFromPdfBuffer(req.file.buffer);
      if (!text || text.length < 10) {
        return res.status(400).json({ success: false, message: 'Could not extract text from PDF' });
      }

      const chunks = chunkText(text, 3000, 400);
      const chunkSummaries = [];

      // try primary model, fallback to env fallback
      const primaryModel = process.env.DEFAULT_GROQ_MODEL || 'llama-3.1-8b-instant';
      const fallbackModel = process.env.GROQ_MODEL_FALLBACK || 'gemma2-9b-it';

      for (const chunk of chunks) {
        const prompt = buildSummarizePrompt(chunk, instruction);
        const messages = [
          { role: 'system', content: 'You are a helpful summarization assistant.' },
          { role: 'user', content: prompt }
        ];

        let result = await callGroq(messages, primaryModel);
        if (result.error && result.error.code === 'model_decommissioned') {
          result = await callGroq(messages, fallbackModel);
        }

        // if still error, return debugging
        if (!result || !result.choices) {
          console.log('GROQ CHUNK ERROR:', result);
          return res.status(500).json({ success: false, message: 'Groq error', error: result });
        }

        const reply = result.choices[0].message?.content || result.choices[0]?.text || '';
        chunkSummaries.push(reply.trim());
      }

      // final condensation
      const finalPrompt = mergeChunkSummaries(chunkSummaries, instruction || 'concise summary');
      const finalMessages = [
        { role: 'system', content: 'You are a helpful summarization assistant.' },
        { role: 'user', content: finalPrompt }
      ];

      let finalRes = await callGroq(finalMessages, primaryModel);
      if (finalRes.error && finalRes.error.code === 'model_decommissioned') {
        finalRes = await callGroq(finalMessages, fallbackModel);
      }
      if (!finalRes || !finalRes.choices) {
        console.log('GROQ FINAL ERROR:', finalRes);
        return res.status(500).json({ success: false, message: 'Groq final error', error: finalRes });
      }

      const finalReply = finalRes.choices[0].message?.content || finalRes.choices[0]?.text || '';
      return res.json({
        success: true,
        summary: finalReply,
        chunkSummaries,
        instruction: instruction || null
      });

    } catch (err) {
      console.error('Summarize error:', err);
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
];

// POST /api/ai/features/summarize/:fileId  (GridFS)
exports.summarizeByFileId = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const instruction = req.body.instruction || '';
    if (!fileId) return res.status(400).json({ success: false, message: 'fileId is required' });

    const db = getDb(); // implement getDb in config/database to return connected db
    const bucket = new db.mongo.GridFSBucket(db.database, { bucketName: 'uploads' }); // adjust bucketName to your setup
    const _id = new ObjectId(fileId);

    const downloadStream = bucket.openDownloadStream(_id);
    const chunks = [];
    await new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    const text = await extractTextFromPdfBuffer(buffer);
    if (!text) return res.status(400).json({ success: false, message: 'No text extracted' });

    // same flow as uploadAndSummarize
    const textChunks = chunkText(text, 3000, 400);
    const chunkSummaries = [];
    const primaryModel = process.env.DEFAULT_GROQ_MODEL || 'llama-3.1-8b-instant';
    const fallbackModel = process.env.GROQ_MODEL_FALLBACK || 'gemma2-9b-it';

    for (const chunk of textChunks) {
      const prompt = buildSummarizePrompt(chunk, instruction);
      const messages = [
        { role: 'system', content: 'You are a helpful summarization assistant.' },
        { role: 'user', content: prompt }
      ];

      let result = await callGroq(messages, primaryModel);
      if (result.error && result.error.code === 'model_decommissioned') {
        result = await callGroq(messages, fallbackModel);
      }
      if (!result || !result.choices) {
        console.log('GROQ CHUNK ERROR:', result);
        return res.status(500).json({ success: false, message: 'Groq error', error: result });
      }
      const reply = result.choices[0].message?.content || result.choices[0]?.text || '';
      chunkSummaries.push(reply.trim());
    }

    const finalPrompt = mergeChunkSummaries(chunkSummaries, instruction || 'concise summary');
    const finalMessages = [
      { role: 'system', content: 'You are a helpful summarization assistant.' },
      { role: 'user', content: finalPrompt }
    ];

    let finalRes = await callGroq(finalMessages, primaryModel);
    if (finalRes.error && finalRes.error.code === 'model_decommissioned') {
      finalRes = await callGroq(finalMessages, fallbackModel);
    }
    if (!finalRes || !finalRes.choices) {
      console.log('GROQ FINAL ERROR:', finalRes);
      return res.status(500).json({ success: false, message: 'Groq final error', error: finalRes });
    }

    const finalReply = finalRes.choices[0].message?.content || finalRes.choices[0]?.text || '';
    return res.json({
      success: true,
      summary: finalReply,
      chunkSummaries,
      instruction: instruction || null
    });

  } catch (err) {
    console.error('Summarize by fileId error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
