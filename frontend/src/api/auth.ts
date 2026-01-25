// Type definitions
export interface LoginParams {
  email: string;
  password: string;
}

export interface SignupParams {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      storageUsed: number;
      storageLimit: number;
      storagePercentage: number;
    };
  };
}

// Determine API base dynamically:
// 1. Use Vite env if provided (VITE_API_URL)
// 2. Otherwise rely on same-origin + Vite dev proxy (relative /api)
// We keep a full origin only if explicitly set via environment.
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || '';
// Build endpoints preferring relative paths when API_BASE_URL is empty
const prefix = API_BASE_URL ? `${API_BASE_URL}/api/auth` : '/api/auth';
const SIGNUP_URL = `${prefix}/signup`;
const LOGIN_URL = `${prefix}/login`;
const PROFILE_URL = `${prefix}/profile`;
const VERIFY_URL = `${prefix}/verify`;

export async function signup({ username, email, password }: SignupParams): Promise<AuthResponse> {
  const res = await fetch(SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((err: any) => err.msg).join('; ');
      throw new Error(errorMessages);
    }
    throw new Error(data.message || "Signup failed");
  }
  return data; // { token, user }
}

export async function login({ email, password }: LoginParams): Promise<AuthResponse> {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((err: any) => err.msg).join('; ');
      throw new Error(errorMessages);
    }
    throw new Error(data.message || "Login failed");
  }
  return data; // { token, user }
}

export async function getProfile(): Promise<{ user: any }> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const res = await fetch(PROFILE_URL, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get profile");
  return data; // { user }
}

export async function verifyToken(): Promise<{ valid: boolean; user: any }> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const res = await fetch(VERIFY_URL, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Token verification failed");
  return data; // { valid: true, user }
}

// File sharing functions
export async function shareFile(fileId: string, emails: string[], permissions = 'view'): Promise<any> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const base = API_BASE_URL || '';
  const res = await fetch(`${base}/api/files/${fileId}/share`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ emails, permissions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to share file");
  return data;
}

export async function unshareFile(fileId: string, emails: string[]): Promise<any> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const base = API_BASE_URL || '';
  const res = await fetch(`${base}/api/files/${fileId}/unshare`, {
    method: "DELETE",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ emails }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to unshare file");
  return data;
}

export async function getSharedFiles(): Promise<{ data: { files: any[]; count: number } }> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const base = API_BASE_URL || '';
  const res = await fetch(`${base}/api/files/shared`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get shared files");
  return data;
}

export async function getFilesSharedByMe(): Promise<{ data: { files: any[]; count: number } }> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const base = API_BASE_URL || '';
  const res = await fetch(`${base}/api/files/shared-by-me`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get files shared by me");
  return data;
}

export async function updateShareSettings(fileId: string, settings: any): Promise<any> {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  const res = await fetch(`${API_BASE_URL}/api/files/${fileId}/share-settings`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update share settings");
  return data;
}
