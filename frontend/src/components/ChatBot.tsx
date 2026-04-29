import { useEffect, useState, useRef } from 'react';
import { listSessions, startSession, getSession, sendMessage } from '../api/aiChat';
import { Brain, PlusCircle, Loader2, Send, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatMessage { role: string; content: string; tokens?: number; createdAt?: string; }
interface ChatSession { _id: string; title: string; messages?: ChatMessage[]; }

const ChatBot = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken') || '';
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const loadSessions = async () => {
    setLoadingSessions(true); setError(null);
    try {
      const res = await listSessions(token);
      setSessions(res.data.sessions);
      if (!activeId && res.data.sessions[0]) {
        selectSession(res.data.sessions[0]._id);
      }
    } catch (e:any) {
      setError(e?.response?.data?.message || 'Failed to load sessions');
    } finally { setLoadingSessions(false); }
  };

  const selectSession = async (id: string) => {
    setActiveId(id); setLoadingMessages(true); setError(null);
    try {
      const res = await getSession(token, id);
      setMessages(res.data.session.messages || []);
    } catch (e:any) {
      setError(e?.response?.data?.message || 'Failed to load session');
    } finally { setLoadingMessages(false); }
  };

  const newSession = async () => {
    try {
      const res = await startSession(token, { title: 'Chat ' + new Date().toLocaleTimeString(), systemPrompt, model });
      await loadSessions();
      selectSession(res.data.session._id);
    } catch (e:any) {
      setError(e?.response?.data?.message || 'Failed to start session');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeId) return;
    const userText = input.trim();
    setInput('');
    const optimistic = [...messages, { role: 'user', content: userText }];
    setMessages(optimistic);
    setSending(true);
    setError(null);
    try {
      // Use non-streaming API to enable server-side action execution
      const data = await sendMessage(token, activeId, userText);
      const txt = data?.data?.message?.content || data?.message?.content || 'No reply.';
      // Attempt JSON parse for action detection
      let guidanceOverride: string | null = null;
      try {
        const start = txt.indexOf('{');
        const end = txt.lastIndexOf('}');
        if (start !== -1 && end > start) {
          const obj = JSON.parse(txt.slice(start, end + 1));
          if (obj && obj.action === 'none') {
            guidanceOverride = 'Hi! I can manage files. Try: rename resume.pdf to final_resume.pdf | delete old_report.pdf | get info invoice.pdf | share project.docx with alice@example.com';
          }
        }
      } catch (_) {}
      let cleanTxt = guidanceOverride || txt
        .replace(/\b(?:i\'?m|i am)\s+here to help!?/ig, '')
        .replace(/\bhere to help!?/ig, '')
        .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      // Anti-echo: avoid replying with the same user text
      if (cleanTxt && cleanTxt.toLowerCase() === userText.toLowerCase()) {
        cleanTxt = 'I can help manage files: rename, delete, recover, favorite, share, summarize, or get info. Example: rename resume.pdf to final_resume.pdf';
      }
      setMessages([...optimistic, { role: 'assistant', content: cleanTxt }]);
    } catch (e:any) {
      setMessages([...messages, { role: 'user', content: userText }, { role: 'assistant', content: 'Error processing message.' }]);
    } finally { setSending(false); setIsStreaming(false); abortRef.current = null; }
  };

  const handleStop = () => {
    if (isStreaming && abortRef.current) {
      abortRef.current.abort();
    }
  };

  useEffect(() => { loadSessions(); }, []); // eslint-disable-line

  return (
    <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
          <Brain className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Chat</h1>
          <p className="text-gray-500 text-sm">Conversational assistant for your file workspace.</p>
        </div>
      </div>
      <button onClick={() => navigate('/ai')} className="text-xs text-blue-600 hover:underline mb-4">← Back to AI Insights</button>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Sessions</h2>
            <button onClick={newSession} className="text-xs flex items-center gap-1 text-blue-600 hover:underline"><PlusCircle className="w-4 h-4" /> New</button>
          </div>
          <div className="space-y-2 p-3 rounded-md border border-gray-200 bg-white">
            <label className="block text-xs text-gray-600 mb-1">Model</label>
            <select value={model} onChange={e=> setModel(e.target.value)} className="w-full text-sm border border-gray-300 rounded-md px-2 py-1">
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
            <label className="block text-xs text-gray-600 mt-2 mb-1">System prompt</label>
            <textarea value={systemPrompt} onChange={e=> setSystemPrompt(e.target.value)} className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 h-20" />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {loadingSessions && <p className="text-xs text-gray-500">Loading...</p>}
            {sessions.map(s => (
              <button key={s._id} onClick={() => selectSession(s._id)} className={`w-full text-left px-3 py-2 rounded-md border text-sm truncate ${activeId===s._id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>{s.title || 'Untitled'}</button>
            ))}
            {!loadingSessions && sessions.length === 0 && <p className="text-xs text-gray-400">No sessions yet.</p>}
          </div>
        </div>
        <div className="md:col-span-3 flex flex-col h-[70vh]">
          <div className="flex-1 rounded-xl border border-gray-200 p-4 bg-white overflow-y-auto space-y-4">
            {loadingMessages && <p className="text-sm text-gray-500">Loading conversation...</p>}
            {!loadingMessages && messages.map((m,i)=>(
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role==='user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>{m.content}</div>
              </div>
            ))}
            {!loadingMessages && messages.length===0 && <p className="text-sm text-gray-400">Select or start a session to begin.</p>}
            {sending && !isStreaming && (
              <div className="flex justify-start"><div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</div></div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <textarea
              className="flex-1 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm p-3 resize-none h-20"
              placeholder="Ask something..."
              value={input}
              onChange={e=> setInput(e.target.value)}
              onKeyDown={e=> { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button onClick={handleStop} className="h-10 px-5 rounded-lg bg-red-600 text-white text-sm font-medium flex items-center gap-2">
                Stop
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim() || !activeId || sending} className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Send className="w-4 h-4" /> Send
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
