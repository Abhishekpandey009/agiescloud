const axios = require('axios');
const { extractJsonAction, executeAssistantAction } = require('../services/assistantActions');
const { handleAssistantIntent } = require('../services/assistantIntents');

// ========================
// 🤖 AEGIS AI CHAT (GROQ)
// ========================
const AEGIS_CHAT_SYSTEM_PROMPT = `You are Aegis AI, the assistant of AegisCloud.

Your job is to help users manage their files through natural language.

When the user asks for a file operation, DO NOT execute the action yourself.
Instead, OUTPUT A JSON ACTION BLOCK for the backend to execute.

VALID ACTIONS (only these):
1. rename_file → { file, newName }
2. delete_file → { file }
3. recover_file → { file }
4. favorite_file → { file }
5. share_file → { file, shareWith }
6. summarize_file → { file }
7. get_info → { file }
8. none → for normal chat (no operation)

FORMAT FOR FILE ACTIONS ONLY:
Respond with raw JSON, for example:
{
 "action": "rename_file",
 "file": "resume.pdf",
 "newName": "final_resume.pdf"
}

IF NO FILE ACTION IS REQUESTED:
Respond concisely in plain text (no JSON).

RULES:
- Never guess file content.
- Ask for file name if missing.
- If multiple matches, ask which one.
- Summaries require backend-provided content.
- Do NOT invent actions beyond VALID ACTIONS. Never output "upload_file" or similar. If the user asks how to upload, explain the UI steps succinctly: Click "Choose Files to Upload" or drag-and-drop; auth required; typical size/type limits.`;

const MAX_AEGIS_WORDS = (() => {
  const raw = parseInt(process.env.AEGIS_MAX_RESPONSE_WORDS || '120', 10);
  return Number.isFinite(raw) && raw > 20 ? raw : 120;
})();

const trimBoilerplate = (text = '') => {
  if (!text) return '';
  return text
    .replace(/\b(?:i'?m|i am)\s+here to help!?/ig, '')
    .replace(/\bhere to help!?/ig, '')
    .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
    .replace(/^i am an ai[^\.!?]*[\.!?]?\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const enforceWordLimit = (text = '') => {
  const words = text.trim().split(/\s+/);
  if (words.length <= MAX_AEGIS_WORDS) return text.trim();
  return `${words.slice(0, MAX_AEGIS_WORDS).join(' ')} ...`;
};

const formatAegisReply = (text = '') => {
  const stripped = trimBoilerplate(text);
  const concise = enforceWordLimit(stripped);
  return concise || 'Sorry, I could not generate a response.';
};

exports.chatWithAI = async (req, res) => {
  try {
    const body = req.body || {};
    const prompt = body.prompt || body.message || body.text;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    // Dev-mode fallback: when GROQ_API_KEY isn't configured, return a mock reply
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not set — returning mock AI reply (dev mode)');
      return res.json({ success: true, reply: '(dev) Aegis AI placeholder: configure GROQ_API_KEY to enable real responses.' });
    }

    // Quick intent/action detection to avoid relying on external LLM for common commands
    const parseSimpleAction = (text = '') => {
      if (!text || typeof text !== 'string') return null;
      const t = text.trim();
      let m;
      // rename <file> to <newName>
      m = t.match(/\brename\b\s+"?([^"\n]+?)"?\s+(?:to|as)\s+"?([^"\n]+?)"?/i);
      if (m) return { action: 'rename_file', file: m[1].trim(), newName: m[2].trim() };
      // delete/remove <file>
      m = t.match(/\b(delete|remove)\b\s+"?([^"\n]+?)"?/i);
      if (m) return { action: 'delete_file', file: m[2].trim() };
      // recover/restore <file>
      m = t.match(/\b(recover|restore)\b\s+"?([^"\n]+?)"?/i);
      if (m) return { action: 'recover_file', file: m[2].trim() };
      // favorite/star <file>
      m = t.match(/\b(favorite|star)\b\s+"?([^"\n]+?)"?/i);
      if (m) return { action: 'favorite_file', file: m[2].trim() };
      // share <file> with <emails>
      m = t.match(/\bshare\b\s+"?([^"\n]+?)"?\s+with\s+([^\n]+)$/i);
      if (m) {
        const emails = m[2].split(/[,\s]+and\s+|,|\s+/i).map(s => s.trim()).filter(Boolean);
        return { action: 'share_file', file: m[1].trim(), shareWith: emails };
      }
      // summarize <file>
      m = t.match(/\bsummarize\b\s+"?([^"\n]+?)"?/i);
      if (m) return { action: 'summarize_file', file: m[1].trim() };
      // get info about <file> | info <file>
      m = t.match(/\b(get\s+info|info|details)\b(?:\s+about)?\s+"?([^"\n]+?)"?/i);
      if (m) return { action: 'get_info', file: (m[2] || '').trim() };
      return null;
    };

    const auto = body.auto === true || String(req.query?.auto || '').trim() === '1';
    const simple = parseSimpleAction(prompt || '');
    if (simple) {
      if (auto) {
        if (!req.user || !req.user.id) {
          return res.status(401).json({ success: false, message: 'Sign in required to perform actions. Please log in and try again.', meta: { action: simple } });
        }
        try {
          const executed = await executeAssistantAction(req.user.id, simple);
          return res.json({ success: true, reply: formatAegisReply(executed.message || ''), meta: { action: simple, executed } });
        } catch (e) {
          return res.status(500).json({ success: false, message: e.message || 'Action execution failed.' });
        }
      }
      // Not auto: return JSON block so client can execute
      return res.json({ success: true, reply: JSON.stringify(simple, null, 1) });
    }

    // If auto and authenticated, try intent handler to cover broader NLP
    if (auto && req.user && req.user.id) {
      try {
        const intentReply = await handleAssistantIntent(req.user.id, prompt);
        if (intentReply) {
          return res.json({ success: true, reply: formatAegisReply(intentReply), meta: { executedBy: 'intent-handler' } });
        }
      } catch (_) { /* fall through to LLM */ }
    }

    // Call external GROQ API
    const messages = [
      { role: 'system', content: process.env.CHAT_SYSTEM_PROMPT || AEGIS_CHAT_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

    const primaryModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const fallbackModel = primaryModel === 'llama-3.1-8b-instant' ? 'llama3-8b-8192' : 'llama-3.1-8b-instant';

    const callGroq = async (model, tokenField = 'max_tokens') => {
      const payload = {
        model,
        messages,
        temperature: 0.6,
        top_p: 0.9,
        stream: false
      };
      if (tokenField === 'max_output_tokens') {
        payload.max_output_tokens = 320;
      } else {
        payload.max_tokens = 320;
      }
      return axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          timeout: 60000,
        }
      );
    };

    const analyzeTokenField = (err, attemptedField) => {
      const message = err?.response?.data?.error?.message || '';
      if (!message) return null;
      const lower = message.toLowerCase();
      if (attemptedField === 'max_tokens' && lower.includes('max_output_tokens')) return 'max_output_tokens';
      if (attemptedField === 'max_output_tokens' && lower.includes('max_tokens')) return 'max_tokens';
      return null;
    };

    let axiosRes;
    let usedModel = primaryModel;
    let tokenField = 'max_tokens';
    try {
      axiosRes = await callGroq(primaryModel, tokenField);
    } catch (primaryErr) {
      const status = primaryErr?.response?.status;
      const errorBody = primaryErr?.response?.data;
      console.warn('[GROQ] primary model failed', { model: primaryModel, status, error: errorBody });
      const tokenRetry = analyzeTokenField(primaryErr, tokenField);
      if (tokenRetry) {
        tokenField = tokenRetry;
        console.info('[GROQ] retrying with alternate token field', tokenField);
        axiosRes = await callGroq(primaryModel, tokenField);
      } else if (fallbackModel && fallbackModel !== primaryModel && status && status < 500) {
        try {
          axiosRes = await callGroq(fallbackModel, tokenField);
          usedModel = fallbackModel;
        } catch (fallbackErr) {
          const fallbackTokenRetry = analyzeTokenField(fallbackErr, tokenField);
          if (fallbackTokenRetry) {
            tokenField = fallbackTokenRetry;
            console.info('[GROQ] retrying fallback model with alternate token field', tokenField);
            axiosRes = await callGroq(fallbackModel, tokenField);
            usedModel = fallbackModel;
          } else {
            console.warn('[GROQ] fallback model failed', { model: fallbackModel, status: fallbackErr?.response?.status, error: fallbackErr?.response?.data });
            throw fallbackErr;
          }
        }
      } else {
        throw primaryErr;
      }
    }

    const data = axiosRes.data;

    if (!data || !data.choices) {
      console.log('🔥 GROQ DEBUG RESPONSE:', data);
      return res.json({ success: false, message: 'Groq error', error: data });
    }

    let rawReply = data.choices[0]?.message?.content || '';
    // If the model returned a JSON action with action:none, convert to guidance
    try {
      const start = rawReply.indexOf('{');
      const end = rawReply.lastIndexOf('}');
      if (start !== -1 && end > start) {
        const obj = JSON.parse(rawReply.slice(start, end + 1));
        if (obj && obj.action === 'none') {
          rawReply = 'Hi! I can rename, delete, recover, favorite, share, summarize, or get info about files. Example: rename abhishek_resume.pdf to final_resume.pdf';
        }
      }
    } catch (_) {}
    // Also handle providers replying with the bare word "none"
    if (typeof rawReply === 'string' && rawReply.trim().toLowerCase() === 'none') {
      rawReply = 'Hi! I can rename, delete, recover, favorite, share, summarize, or get info about files. Example: rename abhishek_resume.pdf to final_resume.pdf';
    }

    // If the model returns an unsupported action (e.g., upload_file), replace with guidance
    try {
      const start = rawReply.indexOf('{');
      const end = rawReply.lastIndexOf('}');
      if (start !== -1 && end > start) {
        const obj = JSON.parse(rawReply.slice(start, end + 1));
        const allowed = new Set(['rename_file','delete_file','recover_file','favorite_file','share_file','summarize_file','get_info','none']);
        if (obj && typeof obj.action === 'string' && !allowed.has(obj.action)) {
          rawReply = 'To upload files, use the UI: click "Choose Files to Upload" or drag-and-drop in the main area. For file actions, try: rename myfile.pdf to final.pdf | delete old_report.pdf | get info invoice.pdf';
        }
      }
    } catch (_) {}
    // Optional auto-execution: if client requests auto and user is authenticated
    // auto variable defined earlier
    if (auto) {
      try {
        const actionObj = extractJsonAction(rawReply);
        const allowed = new Set(['rename_file','delete_file','recover_file','favorite_file','share_file','summarize_file','get_info','none']);
        if (!actionObj || !actionObj.action) {
          // No actionable JSON – reply as-is
          return res.json({ success: true, reply: formatAegisReply(rawReply), meta: { provider: 'grok', model: usedModel, tokenField } });
        }
        if (!allowed.has(String(actionObj.action))) {
          const guidance = 'To upload files, use the UI: click "Choose Files to Upload" or drag-and-drop in the main area. For file actions, try: rename myfile.pdf to final.pdf | delete old_report.pdf | get info invoice.pdf';
          return res.json({ success: true, reply: formatAegisReply(guidance), meta: { provider: 'grok', model: usedModel, tokenField, action: actionObj, executed: { ok: true, message: guidance } } });
        }
        if (actionObj.action === 'none') {
          const guidance = 'Hi! I can rename, delete, recover, favorite, share, summarize, or get info about files. Example: rename abhishek_resume.pdf to final_resume.pdf';
          return res.json({ success: true, reply: guidance, meta: { provider: 'grok', model: usedModel, tokenField, action: actionObj } });
        }
        if (!req.user || !req.user.id) {
          const msg = 'Sign in required to perform actions. Please log in and try again.';
          return res.status(401).json({ success: false, message: msg, meta: { provider: 'grok', model: usedModel, tokenField, action: actionObj } });
        }
        // Execute the action server-side
        let executed;
        try {
          executed = await executeAssistantAction(req.user.id, actionObj);
        } catch (e) {
          executed = { ok: false, message: e.message || 'Action execution failed.' };
        }
        const replyText = executed && executed.message ? executed.message : formatAegisReply(rawReply);
        return res.json({ success: true, reply: replyText, meta: { provider: 'grok', model: usedModel, tokenField, action: actionObj, executed } });
      } catch (_) {
        // Fall back to normal behavior
      }
    }

    return res.json({ success: true, reply: formatAegisReply(rawReply), meta: { provider: 'grok', model: usedModel, tokenField } });
  } catch (error) {
    if (error?.response?.data) {
      console.error('AI ERROR response:', error.response.data);
    }
    console.error('AI ERROR:', error.message || error);
    const errPayload = error?.response?.data || { message: error.message };
    return res.status(error?.response?.status || 500).json({ success: false, message: 'AI request failed', error: errPayload });
  }
};


// ===================================
// 🧠 FILE AI FEATURES (Realistic implementations)
// ===================================
const mongoose = require('mongoose');
const File = require('../models/File');

exports.analyzeFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findOne({ _id: fileId, ownerId: req.user.id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    const meta = file.metadata || {};
    const info = {
      _id: file._id,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      tags: file.tags || [],
      createdAt: file.createdAt,
      pages: meta.pages || null,
      duration: meta.duration || null,
      dimensions: (meta.width && meta.height) ? { width: meta.width, height: meta.height } : null,
    };
    return res.json({ success: true, data: { info } });
  } catch (err) {
    console.error('analyzeFile error', err);
    return res.status(500).json({ success: false, message: 'Analyze failed' });
  }
};

exports.suggestTags = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findOne({ _id: fileId, ownerId: req.user.id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    const name = (file.originalName || '').toLowerCase();
    const ext = name.split('.').pop();
    const baseTags = new Set();
    if (/invoice|bill|receipt/.test(name)) baseTags.add('finance');
    if (/resume|cv|profile/.test(name)) baseTags.add('resume');
    if (/presentation|slides|ppt/.test(name)) baseTags.add('presentation');
    if (/report|summary|overview/.test(name)) baseTags.add('report');
    if (/image|photo|pic|jpeg|jpg|png|gif/.test(name) || /image\//.test(file.mimeType)) baseTags.add('image');
    if (/pdf/.test(ext) || /pdf/.test(file.mimeType)) baseTags.add('pdf');
    if (/doc/.test(ext) || /word/.test(file.mimeType)) baseTags.add('document');
    const tags = Array.from(baseTags).filter(t => !(file.tags||[]).includes(t));
    return res.json({ success: true, data: { tags } });
  } catch (err) {
    console.error('suggestTags error', err);
    return res.status(500).json({ success: false, message: 'Suggest tags failed' });
  }
};

exports.getSimilarFiles = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findOne({ _id: fileId, ownerId: req.user.id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    const tags = file.tags || [];
    const type = file.type;
    const q = {
      ownerId: req.user.id,
      isDeleted: false,
      _id: { $ne: file._id },
      $or: [
        { tags: { $in: tags.slice(0, 5) } },
        { type: type }
      ]
    };
    const similar = await File.find(q).limit(10).select('originalName size tags createdAt');
    return res.json({ success: true, data: { similar } });
  } catch (err) {
    console.error('getSimilarFiles error', err);
    return res.status(500).json({ success: false, message: 'Similar files failed' });
  }
};

exports.getOrganizationSuggestions = async (req, res) => {
  try {
    // If DB not connected, return a harmless empty summary (keeps UI stable)
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { summary: { totalFiles: 0, totalSize: 0, topTags: [], typeDistribution: [] } } });
    }
    const ownerId = req.user.id;
    const files = await File.find({ ownerId, isDeleted: false }).select('size tags type mimeType');
    const totalFiles = files.length;
    const totalSize = files.reduce((a,f)=> a + (f.size||0), 0);
    const tagCount = new Map();
    const typeCount = new Map();
    for (const f of files) {
      (f.tags||[]).forEach(t => tagCount.set(t, (tagCount.get(t)||0)+1));
      const t = f.type || (f.mimeType||'').split('/')[0];
      if (t) typeCount.set(t, (typeCount.get(t)||0)+1);
    }
    const topTags = Array.from(tagCount.entries()).sort((a,b)=> b[1]-a[1]).slice(0,10).map(([tag,count])=>({ tag, count }));
    const typeDistribution = Array.from(typeCount.entries()).sort((a,b)=> b[1]-a[1]).map(([type,count])=>({ type, count }));
    return res.json({ success: true, data: { summary: { totalFiles, totalSize, topTags, typeDistribution } } });
  } catch (err) {
    console.error('getOrganizationSuggestions error', err);
    return res.status(500).json({ success: false, message: 'Organization suggestions failed' });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || req.body?.q || '').toString().trim();
    if (!q) return res.json({ success: true, data: { suggestions: [] } });
    const ownerId = req.user.id;
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const files = await File.find({ ownerId, isDeleted: false, $or: [ { originalName: { $regex: regex } }, { tags: { $elemMatch: { $regex: regex } } } ] })
      .limit(8).select('originalName tags');
    const suggestions = [];
    for (const f of files) {
      if (regex.test(f.originalName)) suggestions.push(f.originalName);
      (f.tags||[]).filter(t => regex.test(t)).forEach(t => suggestions.push(t));
    }
    return res.json({ success: true, data: { suggestions: Array.from(new Set(suggestions)).slice(0, 10) } });
  } catch (err) {
    console.error('getSearchSuggestions error', err);
    return res.status(500).json({ success: false, message: 'Search suggestions failed' });
  }
};

exports.applyTags = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { tags } = req.body || {};
    if (!Array.isArray(tags)) return res.status(400).json({ success: false, message: 'tags must be an array' });
    const file = await File.findOne({ _id: fileId, ownerId: req.user.id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    const incoming = (tags||[]).map(t => String(t).toLowerCase().trim()).filter(Boolean);
    const merged = Array.from(new Set([...(file.tags||[]), ...incoming]));
    file.tags = merged; await file.save();
    return res.json({ success: true, data: { fileId: file._id, tags: file.tags } });
  } catch (err) {
    console.error('applyTags error', err);
    return res.status(500).json({ success: false, message: 'Apply tags failed' });
  }
};

exports.autoApplyTags = async (req, res) => {
  try {
    const fileId = req.params.fileId || req.body?.fileId;
    if (!fileId) return res.status(400).json({ success: false, message: 'fileId required' });
    const limitRaw = parseInt(req.query.limit || req.body?.limit || '5', 10);
    const effectiveLimit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
    const file = await File.findOne({ _id: fileId, ownerId: req.user.id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    // Use suggestTags to propose and apply
    const name = (file.originalName || '').toLowerCase();
    const guesses = new Set();
    if (/invoice|bill|receipt/.test(name)) guesses.add('finance');
    if (/presentation|slides|ppt/.test(name)) guesses.add('presentation');
    if (/resume|cv|profile/.test(name)) guesses.add('resume');
    let toApply = Array.from(guesses).filter(t => !(file.tags||[]).includes(t));
    if (typeof effectiveLimit === 'number') {
      toApply = toApply.slice(0, effectiveLimit);
    }
    if (toApply.length) {
      file.tags = Array.from(new Set([...(file.tags||[]), ...toApply]));
      await file.save();
    }
    return res.json({ success: true, data: { fileId: file._id, tags: file.tags } });
  } catch (err) {
    console.error('autoApplyTags error', err);
    return res.status(500).json({ success: false, message: 'Auto apply tags failed' });
  }
};

exports.getDuplicates = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { duplicateGroups: [] } });
    }
    const ownerId = new mongoose.Types.ObjectId(req.user.id);
    const dupGroups = await File.aggregate([
      { $match: { ownerId, isDeleted: false, 'metadata.checksum': { $exists: true, $ne: null } } },
      { $group: { _id: '$metadata.checksum', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    const checksums = dupGroups.map(d => d._id);
    const files = await File.find({ ownerId, isDeleted: false, 'metadata.checksum': { $in: checksums } })
      .select('originalName size tags createdAt metadata.checksum')
      .lean();
    const groups = dupGroups.map(g => {
      const filesIn = files.filter(f => f.metadata?.checksum === g._id).map(f => ({
        _id: f._id,
        originalName: f.originalName,
        size: f.size,
        tags: f.tags||[],
        createdAt: f.createdAt
      }));
      return { _id: g._id, count: g.count, files: filesIn };
    });
    return res.json({ success: true, data: { duplicateGroups: groups } });
  } catch (err) {
    console.error('getDuplicates error', err);
    return res.status(500).json({ success: false, message: 'Duplicate detection failed' });
  }
};

exports.cleanupDuplicates = async (req, res) => {
  try {
    const { checksum, keepFileId, mergeTags } = req.body || {};
    if (!checksum || !keepFileId) return res.status(400).json({ success: false, message: 'checksum and keepFileId required' });
    const ownerId = req.user.id;
    const keep = await File.findOne({ _id: keepFileId, ownerId, isDeleted: false });
    if (!keep) return res.status(404).json({ success: false, message: 'Keep file not found' });
    const dupes = await File.find({ ownerId, isDeleted: false, 'metadata.checksum': checksum, _id: { $ne: keep._id } });
    let reclaim = 0;
    for (const f of dupes) {
      reclaim += f.size || 0;
      if (mergeTags && Array.isArray(f.tags) && f.tags.length) {
        keep.tags = Array.from(new Set([...(keep.tags||[]), ...f.tags]));
      }
      f.isDeleted = true; f.deletedAt = new Date();
      await f.save();
    }
    await keep.save();
    return res.json({ success: true, data: { removed: dupes.length, reclaimBytes: reclaim } });
  } catch (err) {
    console.error('cleanupDuplicates error', err);
    return res.status(500).json({ success: false, message: 'Duplicate cleanup failed' });
  }
};

exports.semanticSearch = async (req, res) => {
  try {
    const q = (req.query.q || req.body?.q || '').toString().trim();
    const limit = parseInt(req.query.limit || req.body?.limit || '20', 10);
    if (!q) return res.json({ success: true, data: { results: [] } });
    // simple text search using text index and tags
    const ownerId = req.user.id;
    const results = await File.find({ ownerId, isDeleted: false, $or: [
      { $text: { $search: q } },
      { originalName: { $regex: q, $options: 'i' } },
      { tags: { $elemMatch: { $regex: q, $options: 'i' } } }
    ]}).limit(Math.min(Math.max(limit||20,1),50)).select('originalName tags createdAt size');
    return res.json({ success: true, data: { results } });
  } catch (err) {
    console.error('semanticSearch error', err);
    return res.status(500).json({ success: false, message: 'Semantic search failed' });
  }
};
