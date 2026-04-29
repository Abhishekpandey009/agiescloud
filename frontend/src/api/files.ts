// Type definitions for files API
interface ListFilesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  status?: string;
}

// Dynamic API base: prefer VITE_API_URL, else rely on Vite proxy via relative path
const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || '';
const FILES_URL = `${API_BASE}/api/files`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (!token) throw new Error('No token found');
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

export async function uploadFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${FILES_URL}/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "File upload failed");
  return data;
}

export async function listFiles(params: ListFilesParams = {}): Promise<any> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    type = 'all',
    status = 'active'
  } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    type,
    status
  });
  
  const res = await fetch(`${FILES_URL}/list?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to list files");
  return data;
}

export async function searchFiles(query: string, type: string = 'all'): Promise<any> {
  const queryParams = new URLSearchParams({
    q: query,
    type,
    limit: '50'
  });
  
  const res = await fetch(`${FILES_URL}/search?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    console.error('Search API error:', {
      status: res.status,
      statusText: res.statusText,
      data
    });
    throw new Error(data.message || "Search failed");
  }
  
  return data;
}

export async function downloadFile(fileId: string): Promise<Response> {
  const res = await fetch(`${FILES_URL}/download/${fileId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Download failed");
  }
  
  return res; // Return the response for blob handling
}

export async function deleteFile(fileId: string): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
}

export async function toggleFavorite(fileId: string): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}/favorite`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle favorite");
  return data;
}

export async function restoreFile(fileId: string): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}/restore`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to restore file");
  return data;
}

export async function renameFile(fileId: string, newName: string): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}/rename`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ newName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to rename file");
  return data;
}

// Get trash files
export async function getTrashFiles(): Promise<any> {
  const res = await fetch(`${FILES_URL}/trash`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get trash files");
  return data;
}

// Permanently delete a file
export async function permanentDeleteFile(fileId: string): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}/permanent`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to permanently delete file");
  return data;
}

// Empty trash (permanently delete all trash files)
export async function emptyTrash(): Promise<any> {
  const res = await fetch(`${FILES_URL}/trash/empty`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to empty trash");
  return data;
}

// Share a file with users
export async function shareFile(fileId: string, emails: string[], permissions: string = 'view'): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ emails, permissions }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to share file");
  return data;
}

// Unshare a file from users
export async function unshareFile(fileId: string, emails: string[]): Promise<any> {
  const res = await fetch(`${FILES_URL}/${fileId}/unshare`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ emails }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to unshare file");
  return data;
}

// Get files shared with current user
export async function getSharedFiles(): Promise<any> {
  const res = await fetch(`${FILES_URL}/shared`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get shared files");
  return data;
}

// Get files shared by current user
export async function getFilesSharedByMe(): Promise<any> {
  const res = await fetch(`${FILES_URL}/shared-by-me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get files shared by me");
  return data;
}

// Get favorite files
export async function getFavoriteFiles(): Promise<any> {
  const res = await fetch(`${FILES_URL}/favorites`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get favorite files");
  return data;
}

// Helper function to handle file download
export const downloadFileHelper = async (fileId: string, filename: string): Promise<void> => {
  try {
    const response = await downloadFile(fileId);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};