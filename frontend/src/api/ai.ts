import axios from 'axios';

const API_BASE = '/api/ai/features';

export const analyzeFile = async (token: string, fileId: string) => {
  const res = await axios.post(`${API_BASE}/analyze/${fileId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const suggestTags = async (token: string, fileId: string) => {
  const res = await axios.post(`${API_BASE}/tags/${fileId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getSimilarFiles = async (token: string, fileId: string) => {
  const res = await axios.get(`${API_BASE}/similar/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getOrganizationSuggestions = async (token: string) => {
  const res = await axios.get(`${API_BASE}/organization/suggestions`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getSearchSuggestions = async (token: string, q: string) => {
  const res = await axios.get(`${API_BASE}/search/suggestions`, { params: { q }, headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const applyTags = async (token: string, fileId: string, tags: string[]) => {
  const res = await axios.post(`${API_BASE}/tags/${fileId}/apply`, { tags }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const autoApplyTags = async (token: string, fileId: string, limit = 5) => {
  const res = await axios.post(`${API_BASE}/tags/${fileId}/auto`, {}, { params: { limit }, headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getDuplicates = async (token: string) => {
  const res = await axios.get(`${API_BASE}/duplicates`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const cleanupDuplicates = async (token: string, params: { checksum: string; keepFileId: string; mergeTags?: boolean }) => {
  const res = await axios.post(`${API_BASE}/duplicates/cleanup`, params, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const semanticSearch = async (token: string, q: string, limit = 20) => {
  const res = await axios.get(`${API_BASE}/semantic/search`, { params: { q, limit }, headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export default {
  analyzeFile,
  suggestTags,
  getSimilarFiles,
  getOrganizationSuggestions,
  getSearchSuggestions,
  applyTags,
  autoApplyTags,
  getDuplicates,
  cleanupDuplicates,
  semanticSearch
};
