import axios from 'axios';

const BASE = '/api/ai/chat';

export const listSessions = async (token: string) => {
  const res = await axios.get(`${BASE}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const startSession = async (token: string, payload: { title?: string; systemPrompt?: string; model?: string }) => {
  const res = await axios.post(`${BASE}/sessions`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getSession = async (token: string, id: string) => {
  const res = await axios.get(`${BASE}/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const sendMessage = async (token: string, id: string, content: string) => {
  const res = await axios.post(`${BASE}/sessions/${id}/messages`, { content }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export default { listSessions, startSession, getSession, sendMessage };
