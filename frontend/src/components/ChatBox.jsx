import React, { useState } from 'react';
import axios from 'axios';
import { searchFiles, renameFile as apiRenameFile, deleteFile as apiDeleteFile, restoreFile as apiRestoreFile, toggleFavorite as apiToggleFavorite, shareFile as apiShareFile } from '../api/files';

// ================================
// 🌐 AUTO SWITCH API BASE URL
// ================================
const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://testing-app-1.onrender.com";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [model, setModel] = useState('tiiuae/falcon-7b-instruct');
  const [attachedFile, setAttachedFile] = useState(null);

  const sanitizeReply = (text, userText) => {
    if (!text) return '';
    let out = String(text)
      .replace(/^(?:i'?m|i am) here to help!?\s*/i, '')
      .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
      .trim();
    // Anti-echo: avoid replying with the same user text
    if (out && userText && out.toLowerCase() === String(userText).toLowerCase()) {
      return 'I can help with file actions like rename, delete, share, or summarize. Try: rename report.pdf to final.pdf';
    }
    return out || 'I could not generate a specific answer. Try rephrasing or adding details.';
  };

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const id = Date.now().toString();
    setSessionId(id);
    return id;
  };

  // ================================
  // 📄 Upload + Summarize PDF
  // ================================
  const uploadAndSummarize = async (file, instruction = '') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('instruction', instruction);

    const resp = await axios.post(`${API_BASE}/api/ai/features/summarize`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });

    return resp.data;
  };

  const summarizeByFileId = async (fileId, instruction = '') => {
    const resp = await axios.post(
      `${API_BASE}/api/ai/features/summarize/${fileId}`,
      { instruction },
      { timeout: 120000 }
    );

    return resp.data;
  };

  // ================================
  // 💬 Main Chat Function
  // ================================
  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !attachedFile) return;

    setInput('');
    setError(null);

    // ------------ PDF Summarization -------------
    if (attachedFile) {
      setMessages(prev => [...prev, { role: 'user', content: `[file-upload] ${attachedFile.name}` }]);
      setLoading(true);

      try {
        const summaryResp = await uploadAndSummarize(attachedFile, 'auto');

        if (summaryResp.success) {
          const summaryText = summaryResp.summary ||
            summaryResp.chunkSummaries?.join('\n\n') ||
            'No summary returned.';
          setMessages(prev => [...prev, { role: 'bot', content: summaryText }]);
        } else {
          setMessages(prev => [...prev, { role: 'bot', content: `Summarization failed: ${summaryResp.message}` }]);
        }
      } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { role: 'bot', content: 'Summarization failed. Try again.' }]);
      } finally {
        setAttachedFile(null);
        setLoading(false);
      }

      return;
    }

    // ------------ Normal Chat -------------
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      await ensureSession();

      // Summarize file:<id> feature
      const fileRefMatch = text.match(/summarize\s+file[:\s]([0-9a-fA-F]{24}|[\w-]+)/i);
      if (fileRefMatch) {
        const fileId = fileRefMatch[1];
        const s = await summarizeByFileId(fileId, 'auto');
        const replyText = sanitizeReply(s.summary || 'No summary returned.', attachedFile?.name || '');
        setMessages(prev => [...prev, { role: 'bot', content: replyText }]);
        setLoading(false);
        return;
      }

      // --- FIXED URL HERE 🔥 ---
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, model }),
      });

      const data = await res.json();
      const replyRaw = data?.reply || 'No reply.';
      const reply = sanitizeReply(replyRaw, text);

      // Try to parse JSON action and execute via file APIs (stateless mode)
      const tryJson = (txt) => {
        if (!txt || typeof txt !== 'string') return null;
        const start = txt.indexOf('{');
        const end = txt.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) return null;
        try { return JSON.parse(txt.slice(start, end+1)); } catch { return null; }
      };
      const actionObj = tryJson(replyRaw);
      if (actionObj && actionObj.action) {
        try {
          const fileName = actionObj.file && String(actionObj.file).trim();
          const act = String(actionObj.action).toLowerCase();
          if (act === 'none') {
            setMessages(prev => [...prev, { role: 'bot', content: 'Hi! I can rename, delete, recover, favorite, share, summarize, or get info about files. Example: rename abhishek_resume.pdf to final_resume.pdf' }]);
            return;
          }
          if (fileName) {
            const result = await searchFiles(fileName, 'all');
            const files = result?.data?.files || [];
            if (files.length > 1) {
              setMessages(prev => [...prev, { role: 'bot', content: `Multiple files match "${fileName}". Please specify the exact name.` }]);
              return;
            }
            if (files.length === 0) {
              setMessages(prev => [...prev, { role: 'bot', content: `File "${fileName}" not found.` }]);
              return;
            }
            const fileId = files[0]._id;
            if (act === 'rename_file') {
              const newName = (actionObj.newName || '').toString().trim();
              if (!newName) {
                setMessages(prev => [...prev, { role: 'bot', content: 'Please provide newName to rename.' }]);
              } else {
                await apiRenameFile(fileId, newName);
                setMessages(prev => [...prev, { role: 'bot', content: `The file has been renamed to ${newName}.` }]);
              }
              return;
            }
            if (act === 'delete_file') {
              await apiDeleteFile(fileId);
              setMessages(prev => [...prev, { role: 'bot', content: `The file has been moved to trash.` }]);
              return;
            }
            if (act === 'recover_file') {
              await apiRestoreFile(fileId);
              setMessages(prev => [...prev, { role: 'bot', content: `The file has been restored from trash.` }]);
              return;
            }
            if (act === 'favorite_file') {
              await apiToggleFavorite(fileId);
              setMessages(prev => [...prev, { role: 'bot', content: `The file's favorite status was toggled.` }]);
              return;
            }
            if (act === 'share_file') {
              const shareWith = actionObj.shareWith;
              const emails = Array.isArray(shareWith) ? shareWith : (shareWith ? [shareWith] : []);
              if (!emails.length) {
                setMessages(prev => [...prev, { role: 'bot', content: 'Please provide shareWith email(s) to share the file.' }]);
              } else {
                await apiShareFile(fileId, emails, 'view');
                setMessages(prev => [...prev, { role: 'bot', content: `Shared with ${emails.join(', ')}.` }]);
              }
              return;
            }
            if (act === 'get_info') {
              const f = files[0];
              const info = `${f.originalName} • ${(f.size||0)} bytes • ${f.mimeType || 'unknown'}`;
              setMessages(prev => [...prev, { role: 'bot', content: info }]);
              return;
            }
            if (act === 'summarize_file') {
              setMessages(prev => [...prev, { role: 'bot', content: `I don’t have access to the file content yet. Please upload the file or request a backend summary.` }]);
              return;
            }
          }
        } catch (err) {
          console.error('Action execution failed:', err);
          setMessages(prev => [...prev, { role: 'bot', content: 'Could not execute the requested action.' }]);
          return;
        }
      }

      // Default: show model reply
      setMessages(prev => [...prev, { role: 'bot', content: reply }]);

    } catch (e) {
      console.error(e);
      setError(e.message);
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry — I could not get an answer.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">

      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>

      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm text-gray-600">Model</label>
        <select value={model} onChange={(e)=> setModel(e.target.value)} className="text-sm border px-2 py-1 rounded-md">
          <option value="tiiuae/falcon-7b-instruct">tiiuae/falcon-7b-instruct</option>
        </select>

        <label className="text-sm text-gray-600">Attach PDF</label>
        <input type="file" accept=".pdf" onChange={(e)=> setAttachedFile(e.target.files?.[0] ?? null)} />

        {attachedFile && <span className="text-sm text-gray-500">Attached: {attachedFile.name}</span>}
      </div>

      <div className="border p-4 rounded-xl h-[60vh] overflow-y-auto bg-white shadow-sm">
        {messages.length === 0 && <p className="text-sm text-gray-500">Start the conversation…</p>}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${m.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-2xl text-sm">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e)=> setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 border p-3 rounded-lg text-sm"
          rows={3}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading || (!input.trim() && !attachedFile)}
          className="px-5 h-11 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>

    </div>
  );
}
