const ChatSession = require('../models/ChatSession');
const { Types } = require('mongoose');
const axios = require('axios');
const { handleAssistantIntent } = require('../services/assistantIntents');
const { extractJsonAction, executeAssistantAction } = require('../services/assistantActions');

// Simple token estimation (naive)
const estimateTokens = (text) => Math.ceil(text.length / 4);

// Optional OpenAI integration (lazy require)
let openaiClient = null;
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    try {
      const { OpenAI } = require('openai');
      openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch (e) {
      console.warn('OpenAI package not installed or failed to init. Falling back to stub responses.');
      return null;
    }
  }
  return openaiClient;
};

// xAI Grok support via axios
const getGrokClient = () => {
  const key = process.env.GROK_API_KEY;
  if (!key) return null;
  const instance = axios.create({
    baseURL: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '30000'),
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  return instance;
};

// Hugging Face Inference API client
const getHFClient = () => {
  const key = process.env.HF_API_KEY;
  if (!key) return null;
  const instance = axios.create({
    baseURL: process.env.HF_BASE_URL || 'https://api-inference.huggingface.co',
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '30000'),
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  return instance;
};

// Anthropic Messages API client (Claude)
const getAnthropicClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const instance = axios.create({
    baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '30000'),
    headers: {
      'x-api-key': key,
      'anthropic-version': process.env.ANTHROPIC_VERSION || '2023-06-01',
      'content-type': 'application/json'
    }
  });
  return instance;
};

// Persona and limits
const DEFAULT_SYSTEM_PROMPT = `You are Aegis AI, the assistant of AegisCloud.

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
- Do NOT invent actions beyond VALID ACTIONS. Never output "upload_file" or similar. If the user asks how to upload, explain UI steps: Click "Choose Files to Upload" or drag-and-drop; auth required; typical size/type limits.`;

const MAX_RESPONSE_WORDS = (() => {
  const raw = parseInt(process.env.AEGIS_MAX_RESPONSE_WORDS || '120', 10);
  return Number.isFinite(raw) && raw > 20 ? raw : 120;
})();

// Promise timeout helper
const withTimeout = (p, ms, fallbackError = new Error('LLM timeout')) => {
  return Promise.race([
    p,
    new Promise((_, reject) => setTimeout(() => reject(fallbackError), ms))
  ]);
};

// Response formatting helpers
const stripBoilerplate = (text = '') => {
  if (!text) return '';
  return text
    .replace(/\b(?:i'?m|i am)\s+here to help!?/ig, '')
    .replace(/\bhere to help!?/ig, '')
    .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
    .replace(/^i am an ai[^\.!?]*[\.!?]?\s*/i, '')
    .replace(/^as a language model[^\.!?]*[\.!?]?\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const enforceConcise = (text = '') => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  if (words.length <= MAX_RESPONSE_WORDS) return trimmed;
  return `${words.slice(0, MAX_RESPONSE_WORDS).join(' ')} ...`;
};

const formatAssistantResponse = (text = '') => {
  const stripped = stripBoilerplate(text);
  const concise = enforceConcise(stripped);
  return concise || 'Sorry, I could not generate a response.';
};

const resolveSystemPrompt = (overridePrompt) => {
  const fromEnv = process.env.CHAT_SYSTEM_PROMPT;
  const prompt = (overridePrompt && overridePrompt.trim()) || (fromEnv && fromEnv.trim()) || DEFAULT_SYSTEM_PROMPT;
  return prompt;
};

const ensureSystemPrompt = (session, overridePrompt) => {
  const prompt = resolveSystemPrompt(overridePrompt);
  const tokenCount = estimateTokens(prompt);
  if (!session.messages || !session.messages.length || session.messages[0].role !== 'system') {
    session.messages = [
      { role: 'system', content: prompt, tokens: tokenCount },
      ...(session.messages || [])
    ];
  } else if (session.messages[0].content !== prompt) {
    session.messages[0].content = prompt;
    session.messages[0].tokens = tokenCount;
  }
  return prompt;
};

const listSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title model updatedAt meta.totalTokens');
    res.json({ success: true, data: { sessions } });
  } catch (err) {
    console.error('List sessions error', err);
    res.status(500).json({ success: false, message: 'Error listing sessions' });
  }
};

const startSession = async (req, res) => {
  try {
    const { title, systemPrompt, model } = req.body || {};
    const provider = (process.env.CHAT_PROVIDER || 'openai').toLowerCase();
    let defaultModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    if (provider === 'huggingface') defaultModel = process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct';
    else if (provider === 'grok') defaultModel = process.env.GROK_MODEL || 'grok-2-latest';
    else if (provider === 'anthropic') defaultModel = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

    const session = new ChatSession({
      userId: req.user.id,
      title: title?.trim() || 'New Chat',
      model: (model && String(model).trim()) || defaultModel,
      messages: []
    });
    ensureSystemPrompt(session, systemPrompt);
    await session.save();
    res.status(201).json({ success: true, data: { session } });
  } catch (err) {
    console.error('Start session error', err);
    res.status(500).json({ success: false, message: 'Error starting session' });
  }
};

const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid session id' });
    const session = await ChatSession.findOne({ _id: id, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: { session } });
  } catch (err) {
    console.error('Get session error', err);
    res.status(500).json({ success: false, message: 'Error fetching session' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid session id' });
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Message content required' });
    const session = await ChatSession.findOne({ _id: id, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    ensureSystemPrompt(session);
    const userMessage = { role: 'user', content: content.trim(), tokens: estimateTokens(content) };
    session.messages.push(userMessage);

    // Tooling: attempt to handle file-aware intents first (centralized service)
    // Augment simple two-step commands like: "rename" then next message "foo.pdf to bar.pdf"
    let augmented = content;
    try {
      const msgs = session.messages;
      const prevUser = [...msgs].reverse().find(m => m.role === 'user' && m !== userMessage);
      const renameTail = content.match(/^"?([^"'\n]+)"?\s+(?:to|as)\s+"?([^"'\n]+)"?$/i);
      if (prevUser && /\b(rename|change\s+name)\b/i.test(prevUser.content) && renameTail) {
        const from = renameTail[1].trim();
        const to = renameTail[2].trim();
        augmented = `rename ${from} to ${to}`;
      }
    } catch (_) {}

    let assistantContent = await handleAssistantIntent(req.user.id, augmented);

    // Attempt AI reply if no tool intent matched
    if (!assistantContent) {
      const provider = (process.env.CHAT_PROVIDER || 'openai').toLowerCase();
      try {
        if (provider === 'grok') {
          const grok = getGrokClient();
          if (!grok) throw new Error('GROK_API_KEY missing');
          const payload = {
            model: session.model || process.env.GROK_MODEL || 'grok-2-latest',
            messages: session.messages.map(m => ({ role: m.role, content: m.content })).slice(-20)
          };
          const resp = await withTimeout(grok.post('/chat/completions', payload), parseInt(process.env.LLM_TIMEOUT_MS || '30000'));
          assistantContent = resp.data?.choices?.[0]?.message?.content || '';
        } else if (provider === 'huggingface') {
          const hf = getHFClient();
          if (!hf) throw new Error('HF_API_KEY missing');
          const isHF = typeof session.model === 'string' && session.model.includes('/') && !/^gpt/i.test(session.model);
          const primaryModel = isHF ? session.model : (process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct');
          const fallbackModel = process.env.HF_FALLBACK_MODEL && process.env.HF_FALLBACK_MODEL !== primaryModel ? process.env.HF_FALLBACK_MODEL : null;
          const recent = session.messages.slice(-10);
          const chatPrompt = recent.map(m => `${m.role === 'assistant' ? 'Assistant' : (m.role === 'system' ? 'System' : 'User')}: ${m.content}`).join('\n');
          const inputs = `${chatPrompt}\nAssistant:`;
          const payload = {
            inputs,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false
            }
          };
          const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || '30000');
          async function invoke(modelName) {
            const started = Date.now();
            try {
              const resp = await withTimeout(hf.post(`/models/${encodeURIComponent(modelName)}`, payload), timeoutMs);
              const latency = Date.now() - started;
              let text = '';
              const data = resp.data;
              if (Array.isArray(data) && data.length) text = data[0].generated_text || '';
              else if (data && typeof data === 'object') text = data.generated_text || data.summary_text || '';
              if (typeof text === 'string') {
                text = text
                  .replace(/\b(?:i\'?m|i am)\s+here to help!?/ig, '')
                  .replace(/\bhere to help!?/ig, '')
                  .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
              }
              console.info(`[HF] model=${modelName} latency=${latency}ms length=${text.length}`);
              return text || 'Sorry, I could not generate a response.';
            } catch (err) {
              const latency = Date.now() - started;
              if (err.response) {
                const { status, data } = err.response;
                const snippet = typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200);
                console.warn(`[HF] error model=${modelName} status=${status} latency=${latency}ms bodySnippet=${snippet}`);
                if (status === 401 || status === 403) throw new Error(`HF auth failure (status ${status}). Check HF_API_KEY.`);
              } else {
                console.warn(`[HF] request error model=${modelName} latency=${latency}ms msg=${err.message}`);
              }
              throw err;
            }
          }
          try {
            assistantContent = await invoke(primaryModel);
          } catch (primaryErr) {
            if (fallbackModel) {
              console.info(`[HF] attempting fallback model ${fallbackModel}`);
              try {
                assistantContent = await invoke(fallbackModel);
              } catch (fallbackErr) {
                console.warn('[HF] fallback failed:', fallbackErr.message);
                throw fallbackErr;
              }
            } else {
              throw primaryErr;
            }
          }
        } else if (provider === 'anthropic') {
          const anthropic = getAnthropicClient();
          if (!anthropic) throw new Error('ANTHROPIC_API_KEY missing');
          const model = session.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
          const systemMsg = (session.messages && session.messages[0] && session.messages[0].role === 'system') ? session.messages[0].content : resolveSystemPrompt();
          const recent = session.messages.filter(m => m.role !== 'system').slice(-20).map(m => ({ role: m.role, content: m.content }));
          const payload = {
            model,
            temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
            max_tokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '512'),
            system: systemMsg,
            messages: recent
          };
          const resp = await withTimeout(anthropic.post('/v1/messages', payload), parseInt(process.env.LLM_TIMEOUT_MS || '30000'));
          const parts = resp.data && Array.isArray(resp.data.content) ? resp.data.content : [];
          let text = '';
          for (const p of parts) {
            if (p && (p.type === 'text') && typeof p.text === 'string') text += p.text;
          }
          assistantContent = text || '';
        } else {
          const openai = getOpenAI();
          if (!openai) throw new Error('OPENAI_API_KEY missing or client not available');
          const completion = await withTimeout(
            openai.chat.completions.create({
            model: session.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: session.messages.map(m => ({ role: m.role, content: m.content })).slice(-20)
            }),
            parseInt(process.env.LLM_TIMEOUT_MS || '30000')
          );
          assistantContent = completion.choices[0].message.content;
        }
      } catch (apiErr) {
        if (apiErr && apiErr.message && /HF auth failure/.test(apiErr.message)) {
          assistantContent = 'Authentication with Hugging Face failed. Please verify the HF_API_KEY on the server.';
        } else {
          console.warn('LLM API error, fallback to guidance:', apiErr.message);
          assistantContent = 'I can help manage your files: rename, delete, recover, favorite, share, summarize, or get info. Try: rename resume.pdf to final_resume.pdf | delete old_report.pdf | get info invoice.pdf';
        }
      }
    }

    // Try to parse and execute JSON action from model output
    let executed = null;
    let actionObj = extractJsonAction(assistantContent);
    if (actionObj && actionObj.action) {
      // Rename override: trust user's explicit target over model auto-correction
      if (actionObj.action === 'rename_file' && typeof userMessage.content === 'string') {
        const renamePattern = /rename\s+([^\n"']+)\s+to\s+([^\n"']+)/i;
        const match = userMessage.content.match(renamePattern);
        if (match) {
          const desired = match[2].trim().replace(/\s+$/,'');
          if (desired && actionObj.newName && desired !== actionObj.newName) {
            actionObj.newName = desired; // use user-specified new name verbatim
          }
        }
      }
      try {
        const allowed = new Set(['rename_file','delete_file','recover_file','favorite_file','share_file','summarize_file','get_info','none']);
        if (!allowed.has(String(actionObj.action))) {
          executed = { ok: true, message: 'To upload or add files, use the UI: click "Choose Files to Upload" or drag-and-drop in the main area. For actions I can perform, try: rename resume.pdf to final_resume.pdf | delete old_report.pdf | get info invoice.pdf' };
        } else {
          executed = await executeAssistantAction(req.user.id, actionObj);
        }
      } catch (e) {
        executed = { ok: false, message: e.message || 'Action execution failed.' };
      }
    }

    let finalText;
    // If model returned the bare word 'none', show guidance instead of leaking it to UI
    if (!actionObj && typeof assistantContent === 'string' && assistantContent.trim().toLowerCase() === 'none') {
      actionObj = { action: 'none' };
    }
    if (actionObj && actionObj.action === 'none') {
      finalText = 'Hi! I can rename, delete, recover, favorite, share, summarize, or get info about files. Example: rename abhishek_resume.pdf to final_resume.pdf';
    } else {
      finalText = (executed && executed.ok && executed.message)
        ? executed.message
        : formatAssistantResponse(assistantContent);
    }

    const assistantMsg = { role: 'assistant', content: finalText, tokens: estimateTokens(finalText), meta: { action: actionObj || null, executed } };
    session.messages.push(assistantMsg);
    session.meta.totalTokens = session.messages.reduce((acc,m)=> acc + (m.tokens||0),0);
    session.meta.lastMessageAt = new Date();
    await session.save();

    res.json({ success: true, data: { message: assistantMsg, sessionId: session._id } });
  } catch (err) {
    console.error('Send message error', err);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

module.exports = { listSessions, startSession, getSession, sendMessage };

// --- Streaming endpoint (chunked text) ---
const streamMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid session id' });
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Message content required' });

    const session = await ChatSession.findOne({ _id: id, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    ensureSystemPrompt(session);
    // Append user message
    const userMsg = { role: 'user', content: content.trim(), tokens: estimateTokens(content) };
    session.messages.push(userMsg);

    // Prepare provider
    const provider = (process.env.CHAT_PROVIDER || 'huggingface').toLowerCase();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders?.();

    let assistantText = '';
    try {
      if (provider === 'huggingface') {
        const hf = getHFClient();
        if (!hf) throw new Error('HF_API_KEY missing');
        const model = session.model || process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct';
        const recent = session.messages.slice(-10);
        const chatPrompt = recent.map(m => `${m.role === 'assistant' ? 'Assistant' : (m.role === 'system' ? 'System' : 'User')}: ${m.content}`).join('\n');
        const inputs = `${chatPrompt}\nAssistant:`;
        const payload = {
          inputs,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false
          }
        };
        const started = Date.now();
        try {
          const resp = await withTimeout(hf.post(`/models/${encodeURIComponent(model)}`, payload), parseInt(process.env.LLM_TIMEOUT_MS || '30000'));
          const latency = Date.now() - started;
          const data = resp.data;
          if (Array.isArray(data) && data.length) assistantText = data[0].generated_text || '';
          else if (data && typeof data === 'object') assistantText = data.generated_text || data.summary_text || '';
          if (typeof assistantText === 'string') {
            assistantText = assistantText
              .replace(/\b(?:i\'?m|i am)\s+here to help!?/ig, '')
              .replace(/\bhere to help!?/ig, '')
              .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
              .replace(/\s{2,}/g, ' ')
              .trim();
          }
          if (!assistantText) assistantText = 'Sorry, I could not generate a response.';
          console.info(`[HF][stream] model=${model} latency=${latency}ms length=${assistantText.length}`);
        } catch (hfErr) {
          if (hfErr.response) {
            const { status, data } = hfErr.response;
            const snippet = typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200);
            console.warn(`[HF][stream] error status=${status} bodySnippet=${snippet}`);
            if (status === 401 || status === 403) assistantText = 'Error generating response: Hugging Face authentication failed.';
            else assistantText = 'Error generating response.';
          } else {
            console.warn('[HF][stream] request error:', hfErr.message);
            assistantText = 'Error generating response.';
          }
        }
      } else {
        // Fallback: provide helpful guidance instead of echoing user input
        assistantText = 'I can help manage files: rename, delete, recover, favorite, share, summarize, or get info. Example: rename report.pdf to final.pdf';
      }
    } catch (e) {
      if (!assistantText) assistantText = 'Error generating response.';
    }

    // Pseudo-stream the text in chunks
    const chunkSize = 40;
    for (let i = 0; i < assistantText.length; i += chunkSize) {
      const chunk = assistantText.slice(i, i + chunkSize);
      res.write(chunk);
      await new Promise(r => setTimeout(r, 30));
    }
    res.end();

    // Persist assistant message after streaming completes
    const assistantMsg = { role: 'assistant', content: assistantText, tokens: estimateTokens(assistantText) };
    session.messages.push(assistantMsg);
    session.meta.totalTokens = session.messages.reduce((acc,m)=> acc + (m.tokens||0),0);
    session.meta.lastMessageAt = new Date();
    await session.save();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Stream failed' });
    } else {
      try { res.end(); } catch (_) {}
    }
  }
};

module.exports.streamMessage = streamMessage;
