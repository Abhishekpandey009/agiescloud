import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import MovieIcon from '@mui/icons-material/Movie';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import React from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import { Shield } from 'lucide-react';

// Backend API imports
import { 
  uploadFile, 
  listFiles, 
  deleteFile,
  downloadFile,
  downloadFileHelper,
  searchFiles,
  toggleFavorite,
  restoreFile,
  getTrashFiles,
  permanentDeleteFile,
  emptyTrash,
  shareFile,
  unshareFile,
  getSharedFiles,
  getFilesSharedByMe
} from '../api/files';
import { getProfile } from '../api/auth';

// TODO: Update page components to use BackendFile type
// import MyFiles from './pages/MyFiles';
// import Favorites from './pages/Favorites';
// import Shared from './pages/Shared';
// import Trash from './pages/Trash';

// Types for backend file objects
interface BackendFile {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  lastModified: string;
  isFavorite: boolean;
  tags: string[];
  metadata: any;
  deletedAt?: string;
}



// Removed unused imports

const Dashboard: React.FC = () => {
  // Enhanced user management with profile data
  const getUserName = () => {
    const user = localStorage.getItem('userName');
    if (user && user.trim().length > 0) {
      return user.trim();
    }
    return 'User';
  };

  const getUserEmail = () => {
    const email = localStorage.getItem('userEmail');
    return email || 'user@aegiscloud.com';
  };

  // Storage state (in bytes)
  const [storageUsed, setStorageUsed] = React.useState<number | null>(null);
  const [storageLimit, setStorageLimit] = React.useState<number | null>(null);
  const [storageLoading, setStorageLoading] = React.useState(false);
  const [storageError, setStorageError] = React.useState<string | null>(null);

  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${val} ${sizes[i]}`;
  };

  const getStoragePercent = () => {
    if (!storageUsed || !storageLimit || storageLimit <= 0) return 0;
    return Math.min(100, Math.max(0, (storageUsed / storageLimit) * 100));
  };

  // New dropdown state
  const [showNewDropdown, setShowNewDropdown] = React.useState(false);
  
  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  
  // Profile editing modal state
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [activeProfileTab, setActiveProfileTab] = React.useState('general');
  const [profileEdit, setProfileEdit] = React.useState({
    name: getUserName(),
    email: getUserEmail(),
    phone: localStorage.getItem('userPhone') || '',
    bio: localStorage.getItem('userBio') || '',
    location: localStorage.getItem('userLocation') || '',
    website: localStorage.getItem('userWebsite') || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: localStorage.getItem('twoFactorEnabled') === 'true',
    notifications: {
      email: localStorage.getItem('emailNotifications') !== 'false',
      push: localStorage.getItem('pushNotifications') !== 'false',
      marketing: localStorage.getItem('marketingNotifications') === 'true'
    },
    privacy: {
      profilePublic: localStorage.getItem('profilePublic') === 'true',
      showActivity: localStorage.getItem('showActivity') !== 'false',
      allowMessages: localStorage.getItem('allowMessages') !== 'false'
    }
  });
  
  // Profile picture management
  const [profilePicture, setProfilePicture] = React.useState<string | null>(localStorage.getItem('profilePicture'));
  const [showProfilePictureModal, setShowProfilePictureModal] = React.useState(false);
  const profilePictureInputRef = React.useRef<HTMLInputElement>(null);
  const [profilePictureFile, setProfilePictureFile] = React.useState<File | null>(null);
  
  // Theme and Settings management
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
  );
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState('appearance');
  
  // Help & Support modal management
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [activeHelpTab, setActiveHelpTab] = React.useState('faq');
  const [settings, setSettings] = React.useState({
    appearance: {
      theme: localStorage.getItem('theme') || 'system',
      fontSize: localStorage.getItem('fontSize') || 'medium',
      language: localStorage.getItem('language') || 'en',
      animations: localStorage.getItem('animations') !== 'false'
    },
    accessibility: {
      screenReader: localStorage.getItem('screenReader') === 'true',
      highContrast: localStorage.getItem('highContrast') === 'true',
      reducedMotion: localStorage.getItem('reducedMotion') === 'true',
      keyboardNavigation: localStorage.getItem('keyboardNavigation') !== 'false'
    },
    system: {
      autoSave: localStorage.getItem('autoSave') !== 'false',
      syncSettings: localStorage.getItem('syncSettings') === 'true',
      dataCollection: localStorage.getItem('dataCollection') !== 'false',
      errorReporting: localStorage.getItem('errorReporting') !== 'false'
    }
  });
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  // Active navigation state
  const [activeNav, setActiveNav] = React.useState('Home');
  
  // Sharing functionality state
  const [shareActiveTab, setShareActiveTab] = React.useState('shared-by-me');
  const [sharedByMeFiles, setSharedByMeFiles] = React.useState<any[]>([]);
  const [sharedWithMeFiles, setSharedWithMeFiles] = React.useState<any[]>([]);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState<BackendFile | null>(null);
  const [shareEmails, setShareEmails] = React.useState('');
  const [sharePermissions, setSharePermissions] = React.useState('view');
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);

  // Trash functionality state
  const [trashFiles, setTrashFiles] = React.useState<BackendFile[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = React.useState(false);
  const [trashError, setTrashError] = React.useState<string | null>(null);

  // AI Assistant Panel State
  const [assistantCollapsed, setAssistantCollapsed] = React.useState(false);
  type AssistantMessage = { from: 'ai' | 'user'; text: string; temp?: boolean };
  const [assistantMessages, setAssistantMessages] = React.useState<AssistantMessage[]>([
    { from: 'ai', text: 'Find my last presentation.' },
    { from: 'ai', text: 'Summarize this PDF.' },
    { from: 'ai', text: 'Suggest files to delete.' },
  ]);
  const [assistantInput, setAssistantInput] = React.useState("");
  const [assistantSessionId, setAssistantSessionId] = React.useState<string | null>(null);
  const [assistantStreaming, setAssistantStreaming] = React.useState(false);
  const assistantAbortRef = React.useRef<AbortController | null>(null);

  const handleAssistantSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assistantInput.trim() || assistantStreaming) return;

    const userMessage = assistantInput.trim();
    setAssistantMessages((msgs) => [...msgs, { from: 'user', text: userMessage }]);
    setAssistantInput('');
    setAssistantMessages((msgs) => [...msgs, { from: 'ai', text: '(Thinking...)', temp: true }]);

    const sanitize = (text: string) => {
      if (!text) return '';
      const cleaned = text
        .replace(/\b(?:i\'?m|i am)\s+here to help!?/ig, '')
        .replace(/\bhere to help!?/ig, '')
        .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      // Anti-echo: if reply equals the user's prompt (case-insensitive), replace with guidance
      if (cleaned && cleaned.toLowerCase() === userMessage.toLowerCase()) {
        return 'Got it. Try: rename report.pdf to final.pdf, or ask me to find invoices from last month.';
      }
      return cleaned || "I couldn't generate a specific answer. Try rephrasing or adding details.";
    };

    try {
      setAssistantStreaming(true);
      const abortController = new AbortController();
      assistantAbortRef.current = abortController;
      const token = localStorage.getItem('token') || localStorage.getItem('userToken') || '';
      const tryHF = async () => {
        const doCall = async () => {
          const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, model: 'tiiuae/falcon-7b-instruct' })
          });
          const data = await resp.json().catch(() => ({} as any));
          return { resp, data } as const;
        };
        let { resp, data } = await doCall();
        if (resp.status === 503) {
          // Model might be loading; wait briefly and retry once
          await new Promise(r => setTimeout(r, 1500));
          ({ resp, data } = await doCall());
        }
        if (!resp.ok) throw new Error(data?.message || 'HF chat failed');
        return sanitize(data?.reply || '');
      };

      if (token) {
        // Get or create a session
        let sessionId = assistantSessionId;
        if (!sessionId) {
          const startRes = await fetch('/api/ai/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: 'Aegis AI', systemPrompt: "You are a helpful assistant for the user's file workspace. Be concise and practical." })
          });
          if (startRes.ok) {
            const startJson = await startRes.json();
            sessionId = startJson?.data?.session?._id || startJson?.session?._id || null;
            if (sessionId) setAssistantSessionId(sessionId);
          }
        }

        if (!sessionId) {
          const replyText = await tryHF();
          setAssistantMessages((msgs) => msgs.filter(m => !m.temp).concat({ from: 'ai', text: replyText || 'No reply.' }));
          setAssistantStreaming(false);
          assistantAbortRef.current = null;
          return;
        }

        // Use non-streaming endpoint so the server can execute file actions
        const sendRes = await fetch(`/api/ai/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: userMessage })
        });
        if (sendRes.ok) {
          const sendJson = await sendRes.json();
          const replyText = sanitize(sendJson?.data?.message?.content || sendJson?.message?.content || '');
          // Refresh files if an action was executed successfully
          const executedOk = !!(sendJson?.data?.message?.meta?.executed?.ok);
          setAssistantMessages((msgs) => msgs.filter(m => !m.temp).concat({ from: 'ai', text: replyText || 'No reply.' }));
          if (executedOk) {
            try { await loadFiles(); } catch {}
          }
        } else {
          let replyText = await tryHF();
          // Extra anti-echo for fallback
          if (replyText && replyText.toLowerCase() === userMessage.toLowerCase()) {
            replyText = 'Here are examples I can help with: summarize a PDF, find images from last week, or delete old drafts.';
          }
          setAssistantMessages((msgs) => msgs.filter(m => !m.temp).concat({ from: 'ai', text: replyText || 'No reply.' }));
        }
        setAssistantStreaming(false);
        assistantAbortRef.current = null;
        return;
      }

      // Not logged in: use HF
      const fallback = await tryHF();
      setAssistantMessages((msgs) => msgs.filter(m => !m.temp).concat({ from: 'ai', text: fallback || 'No reply.' }));
      setAssistantStreaming(false);
      assistantAbortRef.current = null;
    } catch (err) {
      // Handle aborts gracefully (including during model warm-up)
      const e = err as { name?: string; message?: string };
      const isAborted = e?.name === 'AbortError' || /aborted/i.test(e?.message || '');
      if (isAborted) {
        // Try to finalize with whatever we have shown so far
        const current = assistantMessages.find(m => (m as any).temp);
        const text = typeof current?.text === 'string' ? current.text : '';
        const trimmed = (text || '').trim();
        if (!trimmed || trimmed === '(Thinking...)') {
          // Quick fallback to HF if nothing meaningful was streamed
          try {
            const resp = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userMessage, model: 'tiiuae/falcon-7b-instruct' })
            });
            const data = await resp.json().catch(() => ({} as any));
            const hfText = resp.ok ? (data?.reply || '') : '';
            const sanitized = (hfText || '')
              .replace(/\b(?:i\'?m|i am)\s+here to help!?/ig, '')
              .replace(/\bhere to help!?/ig, '')
              .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
              .replace(/\s{2,}/g, ' ')
              .trim() || 'Stopped.';
            setAssistantMessages((msgs) => msgs.map(m => (m.temp ? { from: 'ai', text: sanitized } : m)));
          } catch {
            setAssistantMessages((msgs) => msgs.map(m => (m.temp ? { from: 'ai', text: 'Stopped.' } : m)));
          }
        } else {
          setAssistantMessages((msgs) => msgs.map(m => (m.temp ? { from: 'ai', text: trimmed } : m)));
        }
      } else {
        // Try HF fallback on generic errors as well
        try {
          const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, model: 'tiiuae/falcon-7b-instruct' })
          });
          const data = await resp.json().catch(() => ({} as any));
          const hf = resp.ok ? (data?.reply || '') : '';
          const sanitized = (hf || '')
            .replace(/\b(?:i\'?m|i am)\s+here to help!?/ig, '')
            .replace(/\bhere to help!?/ig, '')
            .replace(/^as an ai (?:assistant|language model)[^\.!?]*[\.!?]?\s*/i, '')
            .replace(/\s{2,}/g, ' ')
            .trim() || 'Sorry, I could not generate a response.';
          setAssistantMessages((msgs) => msgs.filter(m => !m.temp).concat({ from: 'ai', text: sanitized }));
        } catch {
          setAssistantMessages((msgs) => msgs.filter(m => !m.temp).concat({ from: 'ai', text: 'Sorry, I could not generate a response.' }));
        }
      }
      setAssistantStreaming(false);
      assistantAbortRef.current = null;
    }
  };

  const handleAssistantStop = () => {
    if (assistantStreaming && assistantAbortRef.current) {
      assistantAbortRef.current.abort();
    }
  };
  // --- Smart Search State and Handlers ---

  // Smart Search State and Handlers (single correct set)
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [searchResults, setSearchResults] = React.useState<BackendFile[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const suggestions = [
    'Find all PDFs',
    'Show images from last week',
    'Files larger than 10MB',
    'Recent presentations',
    'Shared with John',
    'Photos from 2024',
    'College_Assignment.pdf',
    'Resume.docx',
  ];

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.length > 0
  );

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);

    if (query.trim().length >= 2) {
      setIsSearching(true);
      setSearchError(null);
      try {
        const result = await searchFiles(query.trim(), selectedType || 'all');
        setSearchResults(result.data?.files || []);
      } catch (error: any) {
        console.error('Search failed:', error);
        setSearchError(error.message || 'Search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Clear the current search and suggestions
  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSearchResults([]);
  };

  // Apply a suggestion and run a search
  const handleSuggestionClick = async (s: string) => {
    const query = s || '';
    setSearchQuery(query);
    setShowSuggestions(false);
    if (query.trim().length >= 2) {
      setIsSearching(true);
      setSearchError(null);
      try {
        const result = await searchFiles(query.trim(), selectedType || 'all');
        setSearchResults(result.data?.files || []);
      } catch (error: any) {
        console.error('Search failed:', error);
        setSearchError(error.message || 'Search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const fileTypeFilters = [
    { type: null, label: "All", icon: <InsertDriveFileIcon sx={{ fontSize: 16 }} /> },
    { type: "pdf", label: "PDFs", icon: <PictureAsPdfIcon sx={{ fontSize: 16, color: '#e53935' }} /> },
    { type: "image", label: "Images", icon: <ImageIcon sx={{ fontSize: 16, color: '#8e24aa' }} /> },
    { type: "doc", label: "Docs", icon: <DescriptionIcon sx={{ fontSize: 16, color: '#1976d2' }} /> },
    { type: "ppt", label: "Slides", icon: <SlideshowIcon sx={{ fontSize: 16, color: '#fbc02d' }} /> },
  ];

  const handleTypeFilter = async (type: string | null) => {
    setSelectedType(type);
    
    // If there's a search query, re-trigger search with new type
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      setSearchError(null);
      try {
        const result = await searchFiles(searchQuery.trim(), type || 'all');
        setSearchResults(result.data?.files || []);
      } catch (error: any) {
        console.error('Search failed:', error);
        setSearchError(error.message);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };
  // Drag-and-drop state
  const [isDragging, setIsDragging] = React.useState(false);

  // Drag event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Check if user is authenticated
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        setUploadError('Please log in to upload files');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      
      try {
        // Validate files
        const validFiles = Array.from(files).filter(file => {
          if (file.size > 10 * 1024 * 1024) {
            setUploadError(`File "${file.name}" is too large. Maximum size is 10MB.`);
            return false;
          }
          return true;
        });
        
        if (validFiles.length === 0) {
          return;
        }

        // Upload each file to the backend
        const uploadPromises = validFiles.map(async (file, index) => {
          try {
            setUploadProgress((index / validFiles.length) * 100);
            const response = await uploadFile(file);
            return response.data.file;
          } catch (error: any) {
            console.error(`Failed to upload ${file.name}:`, error);
            throw error;
          }
        });

        await Promise.all(uploadPromises);
        setUploadProgress(100);
        
        // Reload files to get the updated list
        await loadFiles();
        
      } catch (error: any) {
        setUploadError(error.message || 'Upload failed. Please try again.');
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };
  // Helper to get icon component based on file extension
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ fontSize: 32, color: '#e53935' }} />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon sx={{ fontSize: 32, color: '#1976d2' }} />;
      case 'xls':
      case 'xlsx':
        return <TableChartIcon sx={{ fontSize: 32, color: '#388e3c' }} />;
      case 'ppt':
      case 'pptx':
        return <SlideshowIcon sx={{ fontSize: 32, color: '#fbc02d' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon sx={{ fontSize: 32, color: '#8e24aa' }} />;
      case 'mp3':
      case 'wav':
        return <AudiotrackIcon sx={{ fontSize: 32, color: '#6d4c41' }} />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <MovieIcon sx={{ fontSize: 32, color: '#0288d1' }} />;
      case 'zip':
      case 'rar':
        return <FolderZipIcon sx={{ fontSize: 32, color: '#ffa000' }} />;
      default:
        return <InsertDriveFileIcon sx={{ fontSize: 32, color: '#90a4ae' }} />;
    }
  };



  // Ref for hidden file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [userFiles, setUserFiles] = React.useState<BackendFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(true);
  const [filesError, setFilesError] = React.useState<string | null>(null);
  // const [frequentFiles, setFrequentFiles] = React.useState<File[]>([]); // (Unused)

  // Filter files based on search query and selected type
  const filteredFiles = React.useMemo(() => {
    // If there's an active search query, use search results
    if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
      return searchResults.filter(file => {
        if (!selectedType) return true;
        
        const ext = file.originalName.split('.').pop()?.toLowerCase();
        return (
          (selectedType === 'pdf' && ext === 'pdf') ||
          (selectedType === 'doc' && ['doc', 'docx'].includes(ext || '')) ||
          (selectedType === 'xls' && ['xls', 'xlsx'].includes(ext || '')) ||
          (selectedType === 'ppt' && ['ppt', 'pptx'].includes(ext || '')) ||
          (selectedType === 'image' && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || ''))
        );
      });
    }
    
    // Otherwise use regular filtering on all files
    return userFiles.filter(file => {
      const matchesSearch = searchQuery.length === 0 || 
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.filename.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!selectedType) return matchesSearch;
      
      const ext = file.originalName.split('.').pop()?.toLowerCase();
      const matchesType = 
        (selectedType === 'pdf' && ext === 'pdf') ||
        (selectedType === 'doc' && ['doc', 'docx'].includes(ext || '')) ||
        (selectedType === 'xls' && ['xls', 'xlsx'].includes(ext || '')) ||
        (selectedType === 'ppt' && ['ppt', 'pptx'].includes(ext || '')) ||
        (selectedType === 'image' && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || ''));
      
      return matchesSearch && matchesType;
    });
  }, [userFiles, searchResults, searchQuery, selectedType]);

  // File preview modal state
  const [previewFile, setPreviewFile] = React.useState<BackendFile | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // View mode state for grid/list toggle
  const [isGridView, setIsGridView] = React.useState(true);

  // Open modal and handle file preview
  const handleFilePreview = async (file: BackendFile) => {
    setPreviewFile(file);
    const ext = file.originalName.split('.').pop()?.toLowerCase();
    
    // For images and PDFs, we can try to load the file content
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf'].includes(ext || '')) {
      try {
        // Download the file to create a blob URL for preview
        const response = await downloadFile(file._id);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Failed to load file preview:', error);
        setPreviewUrl(null);
        // Provide gentle guidance for shared files
        const errAny = error as any;
        const msg = typeof errAny?.message === 'string' ? errAny.message : '';
        const hint = /unauthorized|forbidden|access/i.test(msg)
          ? 'You may not have permission to preview this file.'
          : 'Preview failed. Try downloading the file instead.';
        setAssistantMessages((msgs) => msgs.concat({ from: 'ai', text: hint }));
      }
    } else {
      setPreviewUrl(null);
    }
  };

  // Cleanup object URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const closePreview = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // Load files from backend
  const loadFiles = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        setFilesError('Please log in to view your files');
        window.location.href = '/login';
        return;
      }

      setIsLoadingFiles(true);
      setFilesError(null);
      const response = await listFiles();
      if (response.success && response.data?.files) {
        setUserFiles(response.data.files);
      } else {
        setUserFiles([]);
      }
    } catch (error: any) {
      console.error('Failed to load files:', error);
      setFilesError(error.message || 'Failed to load files');
      setUserFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Load files on component mount
  React.useEffect(() => {
    loadFiles();
    // Fetch profile to get storage stats
    const fetchStorage = async () => {
      try {
        setStorageLoading(true);
        setStorageError(null);
        const prof = await getProfile();
        // Support multiple possible shapes returned by getProfile(): { user }, { data: { user } }, or the user object directly
        const u = (prof as any)?.user ?? (prof as any)?.data?.user ?? (prof as any);
        // Expecting bytes from backend; if GB provided, convert if needed
        let used = u?.storageUsed ?? null;
        let limit = u?.storageLimit ?? null;
        // Backwards compatibility: if values look like small integers <= 100, assume GB
        const toBytesIfGB = (val: number | null) => {
          if (val === null) return null;
          if (val > 0 && val <= 1000) {
            // Heuristic: treat <=1000 as GB if no explicit unit
            return val * 1024 * 1024 * 1024;
          }
          return val;
        };
        used = toBytesIfGB(used);
        limit = toBytesIfGB(limit);
        setStorageUsed(typeof used === 'number' ? used : null);
        setStorageLimit(typeof limit === 'number' ? limit : null);
      } catch (e: any) {
        setStorageError(e?.message || 'Failed to load storage stats');
        // Fallback to localStorage cached GB values if present
        const usedGb = parseFloat(localStorage.getItem('storageUsed') || '0');
        const totalGb = parseFloat(localStorage.getItem('storageTotal') || '0');
        if (usedGb > 0 && totalGb > 0) {
          setStorageUsed(usedGb * 1024 * 1024 * 1024);
          setStorageLimit(totalGb * 1024 * 1024 * 1024);
        }
      } finally {
        setStorageLoading(false);
      }
    };
    fetchStorage();
  }, []);

  // Handler to trigger file input
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handler for file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Check if user is authenticated
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        setUploadError('Please log in to upload files');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      
      try {
        // Validate file sizes (10MB limit)
        const validFiles = Array.from(files).filter(file => {
          if (file.size > 10 * 1024 * 1024) {
            setUploadError(`File "${file.name}" is too large. Maximum size is 10MB.`);
            return false;
          }
          return true;
        });
        
        if (validFiles.length === 0) {
          return;
        }

        // Upload each file to the backend
        const uploadPromises = validFiles.map(async (file, index) => {
          try {
            setUploadProgress((index / validFiles.length) * 100);
            const response = await uploadFile(file);
            return response.data.file;
          } catch (error: any) {
            console.error(`Failed to upload ${file.name}:`, error);
            throw error;
          }
        });

        await Promise.all(uploadPromises);
        setUploadProgress(100);
        
        // Reload files to get the updated list
        await loadFiles();
        
      } catch (error: any) {
        setUploadError(error.message || 'Upload failed. Please try again.');
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Clear the input so the same file can be selected again
        event.target.value = '';
      }
    }
  };

  // Profile picture handling functions
  const handleProfilePictureClick = () => {
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.click();
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (2MB limit for profile pictures)
      if (file.size > 2 * 1024 * 1024) {
        alert('Profile picture must be less than 2MB');
        return;
      }

      setProfilePictureFile(file);
      
      // For future backend integration
      console.log('Profile picture file selected:', profilePictureFile?.name || file.name);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicture(result);
        setShowProfilePictureModal(true);
      };
      reader.readAsDataURL(file);
    }
    
    // Clear the input
    event.target.value = '';
  };

  const saveProfilePicture = () => {
    if (profilePicture) {
      localStorage.setItem('profilePicture', profilePicture);
      setShowProfilePictureModal(false);
      setProfilePictureFile(null);
      alert('Profile picture updated successfully!');
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    localStorage.removeItem('profilePicture');
    setShowProfilePictureModal(false);
    setProfilePictureFile(null);
    alert('Profile picture removed successfully!');
  };

  // Handler for creating new folder
  const handleNewFolder = () => {
    // Implementation - would integrate with actual folder creation logic
    const folderName = prompt("Enter folder name:");
    if (folderName && folderName.trim()) {
      alert(`Folder "${folderName.trim()}" would be created here`);
    }
    setShowNewDropdown(false);
  };

  // Handler for file deletion
  const handleFileDelete = async (fileToDelete: BackendFile, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening preview
    if (window.confirm(`Are you sure you want to delete "${fileToDelete.originalName}"?`)) {
      try {
        await deleteFile(fileToDelete._id);
        
        // Remove from local state
        setUserFiles(prev => prev.filter(file => file._id !== fileToDelete._id));
        
        // Close preview if the deleted file was being previewed
        if (previewFile?._id === fileToDelete._id) {
          closePreview();
        }
      } catch (error: any) {
        console.error('Failed to delete file:', error);
        alert(`Failed to delete file: ${error.message}`);
      }
    }
  };

  // Handler for file rename
  const handleFileRename = (fileToRename: BackendFile, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening preview
    const newName = prompt("Enter new file name:", fileToRename.originalName);
    if (newName && newName.trim() && newName.trim() !== fileToRename.originalName) {
      // TODO: Implement rename API endpoint
      alert(`File rename functionality will be implemented. Would rename "${fileToRename.originalName}" to "${newName.trim()}"`);
    }
  };

  // Handler for file download
  const handleFileDownload = async (fileToDownload: BackendFile, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening preview
    try {
      await downloadFileHelper(fileToDownload._id, fileToDownload.originalName);
    } catch (error: any) {
      console.error('Failed to download file:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  // Handler for toggle favorite
  const handleToggleFavorite = async (fileToToggle: BackendFile, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening preview
    try {
      await toggleFavorite(fileToToggle._id);
      // Update the file in the local state
      setUserFiles(prevFiles => 
        prevFiles.map(file => 
          file._id === fileToToggle._id 
            ? { ...file, isFavorite: !file.isFavorite }
            : file
        )
      );
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      alert(`Failed to toggle favorite: ${error.message}`);
    }
  };

  // Load shared files functions
  const loadSharedFiles = async () => {
    try {
      const [sharedByMe, sharedWithMe] = await Promise.all([
        getFilesSharedByMe(),
        getSharedFiles()
      ]);
      setSharedByMeFiles(sharedByMe.data.files);
      setSharedWithMeFiles(sharedWithMe.data.files);
    } catch (error: any) {
      console.error('Failed to load shared files:', error);
    }
  };

  // Handle sharing a file
  const handleShareFile = async (file: BackendFile, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setFileToShare(file);
    setShowShareModal(true);
    setShareEmails('');
    setSharePermissions('view');
    setShareError(null);
  };

  // Submit share form
  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToShare) return;

    const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);
    if (emails.length === 0) {
      setShareError('Please enter at least one email address');
      return;
    }

    setIsSharing(true);
    setShareError(null);

    try {
      // Normalize permissions to backend-supported enum values
      const allowedPerms = new Set(['view','edit']);
      const effectivePerms = allowedPerms.has(sharePermissions) ? sharePermissions : 'view';
      await shareFile(fileToShare._id, emails, effectivePerms);
      setShowShareModal(false);
      await loadSharedFiles(); // Reload shared files
      alert(`File shared with ${emails.length} user(s) successfully!`);
    } catch (error: any) {
      console.error('Share failed:', error);
      setShareError(error.message);
    } finally {
      setIsSharing(false);
    }
  };

  // Handle unsharing a file
  const handleUnshareFile = async (file: any, email: string) => {
    try {
      await unshareFile(file._id, [email]);
      await loadSharedFiles(); // Reload shared files
      alert(`File unshared from ${email} successfully!`);
    } catch (error: any) {
      console.error('Unshare failed:', error);
      alert(`Failed to unshare file: ${error.message}`);
    }
  };

  // Load trash files function
  const loadTrashFiles = async () => {
    try {
      setIsLoadingTrash(true);
      setTrashError(null);
      const response = await getTrashFiles();
      if (response.success && response.data?.files) {
        setTrashFiles(response.data.files);
      } else {
        setTrashFiles([]);
      }
    } catch (error: any) {
      console.error('Failed to load trash files:', error);
      setTrashError(error.message || 'Failed to load trash files');
      setTrashFiles([]);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  // Handle restoring a file from trash
  const handleRestoreFile = async (file: BackendFile, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      await restoreFile(file._id);
      // Remove from trash files and add back to user files
      setTrashFiles(prev => prev.filter(f => f._id !== file._id));
      await loadFiles(); // Reload main files list
      alert(`File "${file.originalName}" restored successfully!`);
    } catch (error: any) {
      console.error('Restore failed:', error);
      alert(`Failed to restore file: ${error.message}`);
    }
  };

  // Handle permanent deletion of a file
  const handlePermanentDelete = async (file: BackendFile, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (window.confirm(`Are you sure you want to permanently delete "${file.originalName}"? This action cannot be undone.`)) {
      try {
        await permanentDeleteFile(file._id);
        // Remove from trash files
        setTrashFiles(prev => prev.filter(f => f._id !== file._id));
        alert(`File "${file.originalName}" permanently deleted!`);
      } catch (error: any) {
        console.error('Permanent delete failed:', error);
        alert(`Failed to permanently delete file: ${error.message}`);
      }
    }
  };

  // Handle emptying entire trash
  const handleEmptyTrash = async () => {
    if (trashFiles.length === 0) {
      alert('Trash is already empty!');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete all ${trashFiles.length} files in trash? This action cannot be undone.`)) {
      try {
        const response = await emptyTrash();
        setTrashFiles([]);
        alert(response.message || 'Trash emptied successfully!');
      } catch (error: any) {
        console.error('Empty trash failed:', error);
        alert(`Failed to empty trash: ${error.message}`);
      }
    }
  };

  // Handler for dropdown toggle
  const handleNewDropdownToggle = () => {
    setShowNewDropdown(!showNewDropdown);
  };

  const isNewUser = userFiles.length === 0;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+U for upload
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        handleUploadClick();
      }
      // Ctrl+N for new folder
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewFolder();
      }
      // Escape to close modals/dropdowns
      if (e.key === 'Escape') {
        setShowNewDropdown(false);
        setShowProfileDropdown(false);
        setShowSuggestions(false);
        if (previewFile) {
          closePreview();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewFile]);

  // Handle paste for file upload
  // TODO: Implement paste functionality with backend upload
  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        // TODO: Upload pasted files to backend
        console.log('Paste functionality needs backend integration');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Theme detection and application
  React.useEffect(() => {
    const applyTheme = () => {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let shouldUseDark = false;
      if (theme === 'dark') {
        shouldUseDark = true;
      } else if (theme === 'light') {
        shouldUseDark = false;
      } else {
        shouldUseDark = systemPrefersDark;
      }
      
      setIsDarkMode(shouldUseDark);
      
      if (shouldUseDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // Load shared files when Shared tab is active
  React.useEffect(() => {
    if (activeNav === 'Shared') {
      loadSharedFiles();
    }
  }, [activeNav]);

  // Load trash files when Trash tab is active
  React.useEffect(() => {
    if (activeNav === 'Trash') {
      loadTrashFiles();
    }
  }, [activeNav]);

  // Auto-save functionality
  React.useEffect(() => {
    if (!settings.system.autoSave) return;
    
    const autoSaveInterval = setInterval(() => {
      try {
        // Save current user data and preferences
        localStorage.setItem('userFiles', JSON.stringify(userFiles));
        localStorage.setItem('settings', JSON.stringify(settings));
        localStorage.setItem('theme', theme);
        
        // Optional: Show brief auto-save notification in console for debugging
        console.log('Auto-save: Data saved successfully at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [settings.system.autoSave, userFiles, settings, theme]);

  // Sync settings functionality
  React.useEffect(() => {
    if (!settings.system.syncSettings) return;
    
    // Sync settings on change
    const syncData = {
      settings,
      theme,
      timestamp: Date.now(),
      deviceId: navigator.userAgent // Simple device identification
    };
    
    try {
      localStorage.setItem('aegis_sync_data', JSON.stringify(syncData));
      console.log('Settings synced successfully');
    } catch (error) {
      console.error('Settings sync failed:', error);
    }
  }, [settings, theme, settings.system.syncSettings]);

  // Load synced settings on component mount
  React.useEffect(() => {
    if (!settings.system.syncSettings) return;
    
    try {
      const syncedData = localStorage.getItem('aegis_sync_data');
      if (syncedData) {
        const parsed = JSON.parse(syncedData);
        // Only apply if data is recent (within last 7 days)
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          console.log('Loading synced settings from', new Date(parsed.timestamp));
        }
      }
    } catch (error) {
      console.error('Failed to load synced settings:', error);
    }
  }, []);

  // Analytics and error reporting functionality
  React.useEffect(() => {
    // Set up error reporting if enabled
    if (settings.system.errorReporting) {
      const handleError = (error: ErrorEvent) => {
        const errorData = {
          message: error.message,
          filename: error.filename,
          line: error.lineno,
          column: error.colno,
          stack: error.error?.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        // Store error locally (in real app, this would send to analytics service)
        const existingErrors = JSON.parse(localStorage.getItem('aegis_error_reports') || '[]');
        existingErrors.push(errorData);
        
        // Keep only last 10 errors
        if (existingErrors.length > 10) {
          existingErrors.splice(0, existingErrors.length - 10);
        }
        
        localStorage.setItem('aegis_error_reports', JSON.stringify(existingErrors));
        console.log('Error reported:', errorData);
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }
  }, [settings.system.errorReporting]);

  // Analytics data collection
  React.useEffect(() => {
    if (!settings.system.dataCollection) return;
    
    const collectAnalytics = () => {
      const analyticsData = {
        sessionStart: new Date().toISOString(),
        filesCount: userFiles.length,
        activeNav: activeNav,
        theme: theme,
        features: {
          searchUsed: searchQuery.length > 0,
          uploadUsed: userFiles.length > 0,
          settingsAccessed: showSettingsModal
        },
        timestamp: Date.now()
      };
      
      // Store analytics locally (in real app, this would send to analytics service)
      localStorage.setItem('aegis_analytics', JSON.stringify(analyticsData));
      console.log('Analytics collected:', analyticsData);
    };

    // Collect analytics on component mount and periodically
    collectAnalytics();
    const analyticsInterval = setInterval(collectAnalytics, 60000); // Every minute
    
    return () => clearInterval(analyticsInterval);
  }, [settings.system.dataCollection, userFiles.length, activeNav, theme, searchQuery, showSettingsModal]);

  // Apply initial font size and other appearance settings
  React.useEffect(() => {
    // Apply initial font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px'
    };
    const savedFontSize = settings.appearance.fontSize;
    document.documentElement.style.fontSize = fontSizeMap[savedFontSize as keyof typeof fontSizeMap] || '16px';
    
    // Apply initial animations setting
    document.documentElement.style.setProperty(
      '--animation-duration', 
      settings.appearance.animations ? '300ms' : '0ms'
    );
    
    // Apply initial accessibility settings
    document.documentElement.classList.toggle('high-contrast', settings.accessibility.highContrast);
    if (settings.accessibility.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0ms');
    }
  }, [settings.appearance.fontSize, settings.appearance.animations, settings.accessibility.highContrast, settings.accessibility.reducedMotion]);

  // Helper functions for settings
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, theme: newTheme }
    }));
  };

  const handleSettingsChange = (category: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
    
    // Save to localStorage
    localStorage.setItem(key, value.toString());
    
    // Handle special settings that need immediate action
    if (category === 'system') {
      switch (key) {
        case 'autoSave':
          console.log(`Auto-save ${value ? 'enabled' : 'disabled'}`);
          break;
        case 'syncSettings':
          console.log(`Settings sync ${value ? 'enabled' : 'disabled'}`);
          if (value) {
            // Trigger immediate sync
            const syncData = {
              settings: { ...settings, [category]: { ...settings[category], [key]: value } },
              theme,
              timestamp: Date.now()
            };
            localStorage.setItem('aegis_sync_data', JSON.stringify(syncData));
          }
          break;
        case 'dataCollection':
          console.log(`Analytics ${value ? 'enabled' : 'disabled'}`);
          break;
        case 'errorReporting':
          console.log(`Error reporting ${value ? 'enabled' : 'disabled'}`);
          break;
      }
    }
    
    // Handle appearance changes
    if (category === 'appearance') {
      if (key === 'theme') {
        handleThemeChange(value);
      } else if (key === 'fontSize') {
        const fontSizeMap = {
          'small': '14px',
          'medium': '16px',
          'large': '18px'
        };
        document.documentElement.style.fontSize = fontSizeMap[value as keyof typeof fontSizeMap] || '16px';
        localStorage.setItem('fontSize', value);
      } else if (key === 'animations') {
        document.documentElement.style.setProperty(
          '--animation-duration', 
          value ? '300ms' : '0ms'
        );
      }
    }
    
    // Handle accessibility changes
    if (category === 'accessibility') {
      if (key === 'highContrast') {
        document.documentElement.classList.toggle('high-contrast', value);
      } else if (key === 'reducedMotion') {
        document.documentElement.style.setProperty(
          '--animation-duration', 
          value ? '0ms' : '300ms'
        );
      }
    }
  };

  // Clear cache and temporary files function
  const handleClearCache = async () => {
    try {
      // Clear various cached data
      const cacheKeys = [
        'aegis_file_previews',
        'aegis_thumbnails',
        'aegis_temp_data',
        'aegis_search_history',
        'aegis_upload_temp'
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear browser cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      // Show success message
      alert('Cache cleared successfully! The application will refresh to apply changes.');
      
      // Refresh the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    }
  };

  // Storage calculation function
  const calculateStorageUsage = () => {
    try {
      let totalSize = 0;
      
      // Calculate localStorage usage
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      // Calculate user files size
      const filesSize = userFiles.reduce((total, file) => total + file.size, 0);
      
      return {
        files: Math.round((filesSize / (1024 * 1024)) * 100) / 100, // MB
        cache: Math.round((totalSize / (1024 * 1024)) * 100) / 100, // MB
        total: Math.round(((filesSize + totalSize) / (1024 * 1024)) * 100) / 100 // MB
      };
    } catch (error) {
      console.error('Storage calculation error:', error);
      return { files: 0, cache: 0, total: 0 };
    }
  };

  // Export settings function
  const exportSettings = () => {
    try {
      const exportData = {
        settings,
        theme,
        version: '1.0.0',
        exported: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegis-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Settings exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export settings');
    }
  };

  // Import settings function
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.settings && importData.theme) {
          setSettings(importData.settings);
          setTheme(importData.theme);
          
          // Save to localStorage
          localStorage.setItem('settings', JSON.stringify(importData.settings));
          localStorage.setItem('theme', importData.theme);
          
          alert('Settings imported successfully! Please refresh the page to apply all changes.');
          console.log('Settings imported from', importData.exported);
        } else {
          alert('Invalid settings file format');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import settings file');
      }
    };
    reader.readAsText(file);
  };


  return (
    <div
      className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-700'}`}
      style={{ fontFamily: 'Orbitron, Cedarville Cursive, sans-serif' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Left Sidebar */}
      <aside className={`w-64 h-screen ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky top-0 left-0 z-30`}>
        <div className={`flex items-center gap-4 p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            {/* Professional Logo Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md relative overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent"></div>
              <Shield className="w-7 h-7 text-white relative z-10" />
            </div>
            {/* Brand Identity */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.025em' }}>
                  Aegis
                </span>
                <span className={`text-2xl font-light ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Cloud
                </span>
              </div>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'} tracking-wide uppercase mt-0.5`} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px' }}>
                Enterprise Storage
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-6">
          <nav className="flex flex-col gap-2 text-lg">
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              activeNav === 'Home' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
            }`}
            onClick={() => setActiveNav('Home')}
          >
            <span className="text-xl">{activeNav === 'Home' ? '🏠' : '🏘️'}</span> 
            Home
          </button>
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              activeNav === 'My Files' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
            }`}
            onClick={() => setActiveNav('My Files')}
          >
            <span className="text-xl">{activeNav === 'My Files' ? '📁' : '📂'}</span> 
            My Files
          </button>
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              activeNav === 'Favorites' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
            }`}
            onClick={() => setActiveNav('Favorites')}
          >
            <span className="text-xl">{activeNav === 'Favorites' ? '⭐' : '☆'}</span> 
            Favorites
          </button>
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              activeNav === 'Shared' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
            }`}
            onClick={() => setActiveNav('Shared')}
          >
            <span className="text-xl">{activeNav === 'Shared' ? '🤝' : '👥'}</span> 
            Shared
          </button>
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              activeNav === 'Trash' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
            }`}
            onClick={() => setActiveNav('Trash')}
          >
            <span className="text-xl">{activeNav === 'Trash' ? '🗑️' : '🗂️'}</span> 
            Trash
          </button>
        </nav>
        </div>
        
        {/* Storage Usage */}
        <div className="mt-auto px-4 pb-6">
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Storage Usage</div>
          <div className={`w-full h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden`}>
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              style={{ width: `${getStoragePercent()}%` }}
            ></div>
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {storageLoading ? 'Loading…' : `${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`}
          </div>
          {storageError && (
            <div className={`text-[10px] mt-1 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>Using cached values</div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ml-0 md:ml-35 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Top Navigation Bar */}
        <header className={`flex items-center justify-between px-4 md:px-8 py-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-lg md:sticky md:top-0 md:z-20`} style={{ minHeight: '72px' }}>
          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Smart Search Bar with Suggestions and Filters */}
          <div className="flex flex-col gap-2 w-full md:w-2/3 relative mx-2 md:mx-0">
            <div className="flex gap-1 md:gap-2 items-center flex-wrap md:flex-nowrap">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="AI Search (e.g. 'Find resume.pdf')"
                  className={`w-full px-5 py-3 pl-10 pr-10 rounded-xl ${isDarkMode ? 'bg-gray-700 text-gray-100 placeholder-gray-400 focus:bg-gray-600 border-gray-600 focus:border-blue-400' : 'bg-gray-50 text-gray-700 placeholder-gray-500 focus:bg-white border-gray-200 focus:border-blue-500'} focus:outline-none focus:ring-3 focus:ring-blue-500 border-2 transition-all duration-200 font-medium`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {/* Quick file type filters */}
              <div className="hidden md:flex gap-1">
                {fileTypeFilters.map((filter) => (
                  <button
                    key={filter.type === null ? 'all' : filter.type}
                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 transform hover:scale-105 ${
                      selectedType === filter.type 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg' 
                        : `${isDarkMode ? 'bg-gray-700 text-blue-400 border-gray-600 hover:bg-gray-600 hover:border-blue-400' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400'} shadow-sm`
                    }`}
                    onMouseDown={() => handleTypeFilter(filter.type)}
                    type="button"
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className={`absolute left-0 top-12 w-full ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-300'} border rounded-lg shadow-xl z-40 animate-fadeIn`}>
                <ul className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                  {filteredSuggestions.map((s, idx) => (
                    <li
                      key={idx}
                      className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} cursor-pointer`}
                      onMouseDown={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Consolidated + New Button with Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-blue-500 relative overflow-hidden group"
                onClick={handleNewDropdownToggle}
                onBlur={() => setTimeout(() => setShowNewDropdown(false), 150)}
              >
                {/* Subtle animation background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <span className="text-xl font-bold relative z-10">+</span> 
                <span className="relative z-10 hidden md:inline">New</span>
                <svg className={`w-5 h-5 transition-transform duration-200 relative z-10 hidden md:inline ${showNewDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showNewDropdown && (
                <div className={`absolute top-full right-0 mt-3 w-52 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'} border-2 rounded-xl shadow-2xl z-50 animate-fadeIn overflow-hidden`}>
                  <div className="py-2">
                    <button
                      className={`flex items-center gap-4 w-full px-5 py-3 ${isDarkMode ? 'text-gray-200 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-blue-400' : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700'} transition-all duration-200 font-medium group`}
                      onClick={() => {
                        handleUploadClick();
                        setShowNewDropdown(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className={`p-2 ${isDarkMode ? 'bg-blue-700 group-hover:bg-blue-600' : 'bg-blue-100 group-hover:bg-blue-200'} rounded-lg transition-colors`}>
                        <UploadFileIcon sx={{ fontSize: 20, color: '#2563eb' }} />
                      </div>
                      <span className="flex-1 text-left">Upload Files</span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'}`}>Ctrl+U</span>
                    </button>
                    <button
                      className={`flex items-center gap-4 w-full px-5 py-3 ${isDarkMode ? 'text-gray-200 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-blue-400' : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700'} transition-all duration-200 font-medium group`}
                      onClick={handleNewFolder}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className={`p-2 ${isDarkMode ? 'bg-green-700 group-hover:bg-green-600' : 'bg-green-100 group-hover:bg-green-200'} rounded-lg transition-colors`}>
                        <CreateNewFolderIcon sx={{ fontSize: 20, color: '#16a34a' }} />
                      </div>
                      <span className="flex-1 text-left">New Folder</span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'}`}>Ctrl+N</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleFileChange} />
            
            {/* Enhanced Profile Icon with Advanced Dropdown */}
            <div className="relative ml-2">
              {/* Profile Avatar with Status Indicator */}
              <button 
                className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white shadow-lg group overflow-hidden"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                onBlur={() => setTimeout(() => setShowProfileDropdown(false), 150)}
                title={`${getUserName()}`}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                
                {/* User Avatar or Initial */}
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full relative z-10"
                  />
                ) : (
                  <span className="relative z-10 text-xl font-extrabold tracking-wide">
                    {getUserName().charAt(0).toUpperCase()}
                  </span>
                )}
                
                {/* Online Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                </div>
              </button>
              
              {/* Enhanced Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div className={`absolute top-full right-0 mt-4 w-72 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl z-50 animate-fadeIn overflow-hidden backdrop-blur-lg`}>
                  {/* Profile Header Section */}
                  <div className={`relative px-6 py-5 ${isDarkMode ? 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-gray-200'} border-b`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600"></div>
                    </div>
                    
                    <div className="relative flex items-center gap-4">
                      {/* Large Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg relative overflow-hidden">
                        {profilePicture ? (
                          <img 
                            src={profilePicture} 
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          getUserName().charAt(0).toUpperCase()
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{getUserName()}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getUserEmail()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Storage Usage Summary */}
                  <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Storage Used</span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatBytes(storageUsed)} / {formatBytes(storageLimit)}</span>
                    </div>
                    <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" 
                        style={{ width: `${getStoragePercent()}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {(() => {
                        const remaining = (storageLimit && storageUsed) ? (storageLimit - storageUsed) : null;
                        return remaining !== null ? `${formatBytes(remaining)} remaining` : '—';
                      })()}
                    </p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    {/* My Profile */}
                    <button
                      className="flex items-center gap-4 w-full px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200 font-medium group"
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg group-hover:from-blue-200 group-hover:to-purple-200 transition-all">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">My Profile</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Settings */}
                    <button
                      className="flex items-center gap-4 w-full px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-800 transition-all duration-200 font-medium group"
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowProfileDropdown(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="p-2 bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg group-hover:from-gray-200 group-hover:to-slate-200 transition-all">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Settings</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Preferences & privacy</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Help & Support */}
                    <button
                      className={`flex items-center gap-4 w-full px-6 py-3 ${isDarkMode ? 'text-gray-300 hover:bg-gradient-to-r hover:from-green-800 hover:to-emerald-800 hover:text-green-400' : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700'} transition-all duration-200 font-medium group`}
                      onClick={() => {
                        setShowHelpModal(true);
                        setShowProfileDropdown(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className={`p-2 bg-gradient-to-r ${isDarkMode ? 'from-green-800 to-emerald-800 group-hover:from-green-700 group-hover:to-emerald-700' : 'from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200'} rounded-lg transition-all`}>
                        <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Help & Support</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get help & contact us</div>
                      </div>
                      <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-400 group-hover:text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Divider */}
                    <hr className="my-3 mx-6 border-gray-200" />
                    
                    {/* Logout */}
                    <button
                      className="flex items-center gap-4 w-full px-6 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-200 font-medium group"
                      onClick={() => {
                        const confirmed = confirm('Are you sure you want to logout?');
                        if (confirmed) {
                          // Clear all authentication tokens
                          localStorage.removeItem('token');
                          localStorage.removeItem('userToken');
                          localStorage.removeItem('userName');
                          localStorage.removeItem('userEmail');
                          
                          // Trigger custom event to update authentication state immediately
                          window.dispatchEvent(new Event('userLoggedOut'));
                          
                          setShowProfileDropdown(false);
                          alert('Logged out successfully! Redirecting to login...');
                          setTimeout(() => {
                            window.location.href = '/login';
                          }, 1000);
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="p-2 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg group-hover:from-red-200 group-hover:to-pink-200 transition-all">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Logout</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign out of your account</div>
                      </div>
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </button>
                  </div>
                  
                  {/* Footer */}
                  <div className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t`}>
                    <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>Aegis Cloud v2.1.0</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>All systems operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
          <div className="h-2"></div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className={`mx-4 md:mx-8 mb-4 ${isDarkMode ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-200'} rounded-lg shadow-lg p-4 border`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Uploading files...</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{uploadProgress}%</span>
              </div>
              <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Error Display */}
          {uploadError && (
            <div className={`mx-4 md:mx-8 mb-4 ${isDarkMode ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'} border rounded-lg p-4 shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className="text-red-500">❌</div>
                <div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Upload Error</div>
                  <div className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{uploadError}</div>
                </div>
                <button 
                  onClick={() => setUploadError(null)}
                  className={`ml-auto ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} text-lg font-bold`}
                  title="Dismiss error"
                >
                  ×
                </button>
              </div>
            </div>
          )}

        {/* Main Dashboard Content */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-8 relative">
          {/* Drag-and-drop overlay */}
          {isDragging && (
            <div className={`absolute inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-500/20'} backdrop-blur-sm rounded-2xl pointer-events-none`}>
              <div className={`${isDarkMode ? 'bg-gray-800 border-blue-400' : 'bg-white border-blue-500'} rounded-2xl p-8 md:p-12 shadow-2xl border-4 border-dashed animate-pulse`}>
                <div className="flex flex-col items-center">
                  <div className={`p-4 ${isDarkMode ? 'bg-blue-800' : 'bg-blue-100'} rounded-full mb-4`}>
                    <UploadFileIcon sx={{ fontSize: 48, color: '#2563eb' }} />
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>Drop files here</div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-base md:text-lg`}>Release to upload your files</div>
                </div>
              </div>
            </div>
          )}
          {/* Main Section */}
          <section className="flex-1 flex flex-col gap-6 md:gap-8">
            {/* Conditional Page Rendering */}
            {activeNav === 'Home' && (
              <>
                {/* Recent Files Panel */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg p-4 md:p-6 border`}>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full"></div>
                      <h3 className={`text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent tracking-wide`}>Recent Files</h3>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className={`px-4 py-2 rounded-lg transition-all font-medium border ${
                          isGridView 
                            ? `bg-gradient-to-r ${isDarkMode ? 'from-blue-700 to-blue-800 text-white border-blue-600' : 'from-blue-600 to-blue-700 text-white border-blue-500'}` 
                            : `${isDarkMode ? 'from-gray-700 to-gray-800 text-blue-400 hover:from-gray-600 hover:to-gray-700 border-gray-600 hover:border-blue-400' : 'from-gray-100 to-gray-200 text-blue-600 hover:from-blue-50 hover:to-blue-100 border-gray-300 hover:border-blue-300'} bg-gradient-to-r`
                        }`}
                        onClick={() => setIsGridView(true)}
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Grid
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg transition-all font-medium border ${
                          !isGridView 
                            ? `bg-gradient-to-r ${isDarkMode ? 'from-blue-700 to-blue-800 text-white border-blue-600' : 'from-blue-600 to-blue-700 text-white border-blue-500'}` 
                            : `${isDarkMode ? 'from-gray-700 to-gray-800 text-blue-400 hover:from-gray-600 hover:to-gray-700 border-gray-600 hover:border-blue-400' : 'from-gray-100 to-gray-200 text-blue-600 hover:from-blue-50 hover:to-blue-100 border-gray-300 hover:border-blue-300'} bg-gradient-to-r`
                        }`}
                        onClick={() => setIsGridView(false)}
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        List
                      </button>
                    </div>
                  </div>
                  {isNewUser ? (
                    <div 
                      className={`flex flex-col items-center justify-center py-16 px-8 border-4 border-dashed ${isDarkMode ? 'border-blue-400 bg-blue-900/20 hover:bg-blue-900/30' : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50/50'} rounded-2xl transition-all duration-300 cursor-pointer group`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={handleDrop}
                      onClick={handleUploadClick}
                    >
                      {/* Large Upload Icon */}
                      <div className={`mb-6 p-6 ${isDarkMode ? 'bg-blue-800 group-hover:bg-blue-700' : 'bg-blue-100 group-hover:bg-blue-200'} rounded-full transition-colors`}>
                        <UploadFileIcon sx={{ fontSize: 60, color: '#2563eb' }} />
                      </div>
                      
                      {/* Main Message */}
                      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} mb-3 text-center`}>
                        Drop files here or click to upload
                      </h3>
                      
                      {/* Subtitle */}
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg mb-6 text-center max-w-md`}>
                        Get started by uploading your first files. Drag and drop files anywhere or click to browse.
                      </p>
                      
                      {/* Supported formats */}
                      <div className="flex flex-wrap gap-2 justify-center mb-6">
                        <span className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-300'} rounded-full text-xs font-medium border`}>PDF</span>
                        <span className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-300'} rounded-full text-xs font-medium border`}>DOC</span>
                        <span className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-300'} rounded-full text-xs font-medium border`}>Images</span>
                        <span className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-300'} rounded-full text-xs font-medium border`}>Videos</span>
                        <span className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-300'} rounded-full text-xs font-medium border`}>And more...</span>
                      </div>
                      
                      {/* Action Button */}
                      <button 
                        className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 transform border-2 border-blue-500 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadClick();
                        }}
                      >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center gap-3">
                          <UploadFileIcon sx={{ fontSize: 20 }} />
                          Choose Files to Upload
                        </span>
                      </button>
                      
                      {/* Helper Text */}
                      <div className="text-center mt-4">
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                          Maximum file size: 10MB per file
                        </p>
                        <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}>
                          Or press <kbd className={`px-2 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded text-xs font-mono`}>Ctrl+V</kbd> to paste files from clipboard
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Grid View */}
                      {isGridView ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                          {filteredFiles.map((file) => (
                            <div
                              key={file._id}
                              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'} rounded-lg p-4 border transition-all cursor-pointer hover:shadow-lg group min-h-[200px]`}
                              onClick={() => handleFilePreview(file)}
                            >
                              <div className="flex flex-col items-center text-center h-full">
                                <div className="mb-3 p-3 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600 text-3xl">
                                  {getFileIcon(file.originalName)}
                                </div>
                                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-sm mb-2 group-hover:text-blue-600 transition-colors leading-tight px-1`} 
                                    title={file.originalName}
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      wordBreak: 'break-word'
                                    }}>
                                  {file.originalName}
                                </h4>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                  {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : new Date(file.lastModified || Date.now()).toLocaleDateString('en-US', {
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                                  {file.size ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown size'}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                  <button
                                    onClick={(e) => handleToggleFavorite(file, e)}
                                    className={`p-1.5 text-xs ${file.isFavorite ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'} rounded hover:bg-yellow-200 transition-colors`}
                                    title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    {file.isFavorite ? '⭐' : '☆'}
                                  </button>
                                  <button
                                    onClick={(e) => handleShareFile(file, e)}
                                    className="p-1.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                    title="Share file"
                                  >
                                    🤝
                                  </button>
                                  <button
                                    onClick={(e) => handleFileRename(file, e)}
                                    className="p-1.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                    title="Rename file"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={(e) => handleFileDownload(file, e)}
                                    className="p-1.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                    title="Download file"
                                  >
                                    📥
                                  </button>
                                  <button
                                    onClick={(e) => handleFileDelete(file, e)}
                                    className="p-1.5 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                    title="Delete file"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Loading state for grid */}
                          {isSearching && (
                            <div className={`col-span-full p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Searching files...
                              </div>
                            </div>
                          )}
                          {/* Error state for grid */}
                          {searchError && (
                            <div className={`col-span-full p-8 text-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                              Search error: {searchError}{' '}
                              <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 underline">
                                Clear search
                              </button>
                            </div>
                          )}
                          {/* No results state for grid */}
                          {!isSearching && !searchError && filteredFiles.length === 0 && searchQuery.trim().length >= 2 && (
                            <div className={`col-span-full p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              No files found matching "{searchQuery}".{' '}
                              <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 underline">
                                Clear search
                              </button>
                            </div>
                          )}
                          {!isSearching && !searchError && filteredFiles.length === 0 && userFiles.length > 0 && searchQuery.trim().length < 2 && (
                            <div className={`col-span-full p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              No files match your search criteria.{' '}
                              <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 underline">
                                Clear search
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* List View */
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-blue-200'}`}>
                              <tr>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Name</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Uploaded</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Size</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredFiles.map((file) => (
                                <tr
                                  key={file._id}
                                  className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-blue-50'} transition-colors cursor-pointer`}
                                  onClick={() => handleFilePreview(file)}
                                >
                                  <td className="p-4 flex items-center gap-3">
                                    {getFileIcon(file.originalName)}
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{file.originalName}</span>
                                  </td>
                                  <td className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(file.lastModified).toLocaleDateString()}</td>
                                  <td className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(file.size / (1024 * 1024)).toFixed(2)} MB</td>
                                  <td className="p-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => handleToggleFavorite(file, e)}
                                        className={`px-2 py-1 text-xs ${file.isFavorite ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'} rounded hover:bg-yellow-200 transition-colors`}
                                        title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                      >
                                        {file.isFavorite ? '⭐' : '☆'}
                                      </button>
                                      <button
                                        onClick={(e) => handleShareFile(file, e)}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                        title="Share file"
                                      >
                                        🤝
                                      </button>
                                      <button
                                        onClick={(e) => handleFileRename(file, e)}
                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                        title="Rename file"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={(e) => handleFileDownload(file, e)}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                        title="Download file"
                                      >
                                        📥
                                      </button>
                                      <button
                                        onClick={(e) => handleFileDelete(file, e)}
                                        className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                        title="Delete file"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {isSearching && (
                                <tr>
                                  <td colSpan={4} className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                      Searching files...
                                    </div>
                                  </td>
                                </tr>
                              )}
                              {searchError && (
                                <tr>
                                  <td colSpan={4} className={`p-8 text-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                                    Search error: {searchError}{' '}
                                    <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 underline">
                                      Clear search
                                    </button>
                                  </td>
                                </tr>
                              )}
                              {!isSearching && !searchError && filteredFiles.length === 0 && searchQuery.trim().length >= 2 && (
                                <tr>
                                  <td colSpan={4} className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No files found matching "{searchQuery}".{' '}
                                    <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 underline">
                                      Clear search
                                    </button>
                                  </td>
                                </tr>
                              )}
                              {!isSearching && !searchError && filteredFiles.length === 0 && userFiles.length > 0 && searchQuery.trim().length < 2 && (
                                <tr>
                                  <td colSpan={4} className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No files match your search criteria.{' '}
                                    <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 underline">
                                      Clear search
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Smart Suggestions (AI-powered) */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg p-6 border mt-6`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
                      <span className="text-2xl">🤖</span>
                      Smart Suggestions
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    <li className={`flex items-center gap-3 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg px-4 py-3 border-l-4 border-blue-500 shadow-sm`}>You opened <span className="font-bold text-blue-600">College_Assignment.pdf</span> last week</li>
                    <li className={`flex items-center gap-3 ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'} rounded-lg px-4 py-3 border-l-4 border-orange-400 shadow-sm`}>Large files you may want to clean up</li>
                    <li className={`flex items-center gap-3 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'} rounded-lg px-4 py-3 border-l-4 border-red-400 shadow-sm`}>Duplicates detected</li>
                    <li className={`flex items-center gap-3 ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'} rounded-lg px-4 py-3 border-l-4 border-purple-500 shadow-sm`}>Important: <span className="font-bold text-purple-600">College_Assignment.pdf</span> due soon</li>
                  </ul>
                </div>
              </>
            )}

            {/* Page Components */}
            {activeNav === 'My Files' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border`}>
                {/* Header with controls */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>My Files</h2>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        {isLoadingFiles ? 'Loading files...' : `${userFiles.length} files • ${(userFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024 * 1024)).toFixed(2)} GB total`}
                      </p>
                    </div>
                    
                    {/* File management controls */}
                    <div className="flex items-center gap-3">
                      {/* Sort dropdown */}
                      <select className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}>
                        <option value="name">Sort by Name</option>
                        <option value="date">Sort by Date</option>
                        <option value="size">Sort by Size</option>
                        <option value="type">Sort by Type</option>
                      </select>
                      
                      {/* View toggle */}
                      <div className="flex border rounded-lg overflow-hidden">
                        <button 
                          className={`px-3 py-2 text-sm transition-colors ${
                            isGridView 
                              ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}` 
                              : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                          }`}
                          onClick={() => setIsGridView(true)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                        <button 
                          className={`px-3 py-2 text-sm transition-colors ${
                            !isGridView 
                              ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}` 
                              : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                          }`}
                          onClick={() => setIsGridView(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Upload button */}
                      <button
                        onClick={handleUploadClick}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* File content area */}
                <div className="p-6">
                  {filesError && (
                    <div className={`mb-4 p-4 ${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                      Error: {filesError}
                    </div>
                  )}
                  
                  {isLoadingFiles ? (
                    <div className="flex justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading your files...</p>
                      </div>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mb-6">
                        <div className={`w-24 h-24 mx-auto mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                          <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>No files yet</h3>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Upload your first file to get started</p>
                        <button
                          onClick={handleUploadClick}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
                        >
                          Upload Files
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Grid/List View */
                    <div>
                      {isGridView ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredFiles.map((file) => (
                            <div
                              key={file._id}
                              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'} rounded-lg p-4 border transition-all cursor-pointer hover:shadow-lg group min-h-[200px]`}
                              onClick={() => handleFilePreview(file)}
                            >
                              <div className="flex flex-col items-center text-center h-full">
                                <div className="mb-3 p-3 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600 text-3xl">
                                  {getFileIcon(file.originalName)}
                                </div>
                                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-sm mb-2 group-hover:text-blue-600 transition-colors leading-tight px-1`} 
                                    title={file.originalName}
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      wordBreak: 'break-word'
                                    }}>
                                  {file.originalName}
                                </h4>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                  {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : new Date(file.lastModified || Date.now()).toLocaleDateString('en-US', {
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                                  {file.size ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown size'}
                                  {file.isFavorite && ' • ⭐'}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                  <button
                                    onClick={(e) => handleToggleFavorite(file, e)}
                                    className={`p-1.5 text-xs ${file.isFavorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'} rounded hover:bg-yellow-200 transition-colors`}
                                    title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    {file.isFavorite ? '⭐' : '☆'}
                                  </button>
                                  <button
                                    onClick={(e) => handleFileRename(file, e)}
                                    className="p-1.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                    title="Rename file"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={(e) => handleFileDownload(file, e)}
                                    className="p-1.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                    title="Download file"
                                  >
                                    📥
                                  </button>
                                  <button
                                    onClick={(e) => handleFileDelete(file, e)}
                                    className="p-1.5 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                    title="Delete file"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                              <tr>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Size</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Modified</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</th>
                                <th className={`p-4 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredFiles.map((file) => (
                                <tr
                                  key={file._id}
                                  className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors cursor-pointer`}
                                  onClick={() => handleFilePreview(file)}
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="text-2xl">{getFileIcon(file.originalName)}</div>
                                      <div>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                          {file.originalName}
                                          {file.isFavorite && <span className="ml-2 text-yellow-500">⭐</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                                  </td>
                                  <td className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {new Date(file.lastModified).toLocaleDateString()}
                                  </td>
                                  <td className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {file.originalName.split('.').pop()?.toUpperCase() || 'Unknown'}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => handleToggleFavorite(file, e)}
                                        className={`px-3 py-1 text-xs ${file.isFavorite ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'} rounded hover:bg-yellow-200 transition-colors`}
                                        title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                      >
                                        {file.isFavorite ? '⭐' : '☆'}
                                      </button>
                                      <button
                                        onClick={(e) => handleFileRename(file, e)}
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                        title="Rename"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={(e) => handleFileDownload(file, e)}
                                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                        title="Download"
                                      >
                                        📥
                                      </button>
                                      <button
                                        onClick={(e) => handleFileDelete(file, e)}
                                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                        title="Delete"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeNav === 'Favorites' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Favorite Files</h2>
                  <p className="text-gray-600">Files you've marked as favorites</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {userFiles.filter(file => file.isFavorite).map((file) => (
                    <div 
                      key={file._id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleFilePreview(file)}
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.originalName)}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{file.originalName}</h3>
                          <p className="text-sm text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {new Date(file.lastModified).toLocaleDateString()}
                            • ⭐ Favorite
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {userFiles.filter(file => file.isFavorite).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No favorite files yet. Click the star icon on any file to add it to favorites!
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeNav === 'Shared' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Shared Files</h2>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        Files you've shared and files shared with you
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 mt-6">
                    <button 
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        shareActiveTab === 'shared-by-me'
                          ? 'bg-blue-600 text-white'
                          : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                      }`}
                      onClick={() => setShareActiveTab('shared-by-me')}
                    >
                      Shared by Me ({sharedByMeFiles.length})
                    </button>
                    <button 
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        shareActiveTab === 'shared-with-me'
                          ? 'bg-blue-600 text-white'
                          : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                      }`}
                      onClick={() => setShareActiveTab('shared-with-me')}
                    >
                      Shared with Me ({sharedWithMeFiles.length})
                    </button>
                  </div>
                </div>

                {/* Content area */}
                <div className="p-6">
                  {/* Shared by Me tab content */}
                  {shareActiveTab === 'shared-by-me' && (
                    <div className="space-y-4">
                      {sharedByMeFiles.length > 0 ? (
                        sharedByMeFiles.map((file) => (
                          <div key={file._id} className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getFileIcon(file.originalName)}</div>
                              <div className="flex-1">
                                <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {file.originalName}
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Shared with {file.sharedWith?.length || 0} user(s) • 
                                  {new Date(file.updatedAt).toLocaleDateString()}
                                </p>
                                {file.sharedWith?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {file.sharedWith.map((share: any, index: number) => (
                                      <span 
                                        key={index}
                                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                                          isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                                        }`}
                                      >
                                        {share.email}
                                        <button
                                          onClick={() => handleUnshareFile(file, share.email)}
                                          className={`hover:bg-red-200 hover:text-red-800 rounded-full p-0.5 transition-colors`}
                                          title="Unshare"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleShareFile(file)}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                  Share More
                                </button>
                                <button
                                  onClick={(e) => handleFileDownload(file, e)}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="mb-6">
                            <div className={`w-24 h-24 mx-auto mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                              <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            </div>
                            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>No shared files yet</h3>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                              Share files with others to collaborate effectively
                            </p>
                            <button 
                              onClick={() => {
                                if (userFiles.length > 0) {
                                  handleShareFile(userFiles[0]);
                                } else {
                                  alert('Please upload some files first to share them');
                                }
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md hover:shadow-lg"
                            >
                              Share Your First File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shared with Me tab content */}
                  {shareActiveTab === 'shared-with-me' && (
                    <div className="space-y-4">
                      {sharedWithMeFiles.length > 0 ? (
                        sharedWithMeFiles.map((file) => (
                          <div key={file._id} className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getFileIcon(file.originalName)}</div>
                              <div className="flex-1">
                                <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {file.originalName}
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Shared by {file.sharedBy?.email || 'Unknown'} • 
                                  {new Date(file.sharedAt).toLocaleDateString()} • 
                                  Permission: {file.sharePermissions}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {(() => {
                                  const canDownload = (file?.sharePermissions === 'edit');
                                  return canDownload ? (
                                    <button
                                      onClick={(e) => handleFileDownload(file, e)}
                                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                      Download
                                    </button>
                                  ) : null;
                                })()}
                                <button
                                  onClick={() => handleFilePreview(file)}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                  Preview
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="mb-6">
                            <div className={`w-24 h-24 mx-auto mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                              <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            </div>
                            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>No files shared with you</h3>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              When others share files with you, they'll appear here
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeNav === 'Trash' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Trash</h2>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        Files deleted within the last 30 days ({trashFiles.length} items)
                      </p>
                    </div>
                    
                    {/* Trash controls */}
                    {trashFiles.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button 
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                          onClick={handleEmptyTrash}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Empty Trash ({trashFiles.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content area */}
                <div className="p-6">
                  {/* Loading state */}
                  {isLoadingTrash && (
                    <div className="flex justify-center items-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading trash files...</span>
                    </div>
                  )}

                  {/* Error state */}
                  {trashError && (
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'} border`}>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{trashError}</span>
                      </div>
                    </div>
                  )}

                  {/* Trash files list */}
                  {!isLoadingTrash && !trashError && (
                    <>
                      {trashFiles.length > 0 ? (
                        <div className="space-y-4">
                          {trashFiles.map((file) => {
                            const deletedDaysAgo = file.deletedAt ? Math.floor((Date.now() - new Date(file.deletedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const fileSize = file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown size';
                            
                            return (
                              <div 
                                key={file._id} 
                                className={`${isDarkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700/70' : 'bg-red-50 border-red-200 hover:bg-red-100'} rounded-lg p-4 border transition-all cursor-pointer`}
                                onClick={() => handleFilePreview(file)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="opacity-60">
                                    {getFileIcon(file.originalName)}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} line-through`}>
                                      {file.originalName}
                                    </h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      Deleted {deletedDaysAgo} day{deletedDaysAgo !== 1 ? 's' : ''} ago • {fileSize}
                                      {file.deletedAt && (
                                        <span className="ml-2">
                                          • Deleted on {new Date(file.deletedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                                      onClick={(e) => handleRestoreFile(file, e)}
                                      title="Restore file"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Restore
                                    </button>
                                    <button 
                                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                                      onClick={(e) => handlePermanentDelete(file, e)}
                                      title="Delete permanently"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Delete Forever
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Empty trash message */
                        <div className="text-center py-16">
                          <div className="mb-6">
                            <div className={`w-24 h-24 mx-auto mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                              <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Trash is empty</h3>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Deleted files will appear here and can be restored for 30 days
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* File Preview Modal - Global for all pages */}
          {previewFile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className={`${isDarkMode ? 'bg-gray-800 border-blue-400' : 'bg-white border-blue-300'} rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative border-2 animate-fadeIn`}>
                <button
                  className={`absolute top-4 right-4 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-2xl font-bold`}
                  onClick={closePreview}
                  aria-label="Close preview"
                >
                  ×
                </button>
                <div className="mb-4 flex items-center gap-3">
                  {getFileIcon(previewFile.originalName)}
                  <span className={`font-semibold text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{previewFile.originalName}</span>
                </div>
                <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} rounded-xl p-4 flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-auto border`}>
                  {/* Preview logic */}
                  {(() => {
                    const ext = previewFile.originalName.split('.').pop()?.toLowerCase();
                    if (previewUrl && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) {
                      return <img src={previewUrl} alt={previewFile.originalName} className="max-h-[50vh] max-w-full rounded-lg shadow-lg" />;
                    } else if (previewUrl && ext === 'pdf') {
                      return <iframe src={previewUrl} title="PDF Preview" className="w-full h-[50vh] rounded-lg bg-white" />;
                    } else {
                      return <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>No preview available for this file type.</div>;
                    }
                  })()}
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  {(() => {
                    const canDownload = (previewFile as any)?.sharePermissions ? ((previewFile as any).sharePermissions === 'edit') : true;
                    return canDownload ? (
                      <button 
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:scale-105 transition-transform"
                        onClick={() => handleFileDownload(previewFile, { stopPropagation: () => {} } as React.MouseEvent)}
                      >
                        Download
                      </button>
                    ) : null;
                  })()}
                  <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:scale-105 transition-transform" onClick={closePreview}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Right Sidebar: Smart Assistant Panel (Interactive) */}
          <aside className={`w-full md:w-80 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border flex flex-col p-0 min-h-[100px] md:max-h-[90vh] md:sticky md:top-8 transition-all duration-300 ${assistantCollapsed ? 'h-16 overflow-hidden' : 'p-4 md:p-6 h-auto'}`}>
            <div className={`flex items-center gap-3 mb-2 p-5 pb-3 border-b-2 ${isDarkMode ? 'border-blue-400 bg-gradient-to-r from-gray-700 to-gray-800' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50'} rounded-t-2xl`}>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <span className="text-xl">🤖</span>
              </div>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-xl flex-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>Aegis AI</span>
              <button
                className={`ml-auto px-3 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:bg-gray-700 border-blue-400' : 'text-blue-600 hover:bg-blue-100 border-blue-300'} border transition-all duration-200`}
                onClick={() => setAssistantCollapsed((c) => !c)}
              >
                {assistantCollapsed ? 'Expand' : 'Collapse'}
              </button>
            </div>
            {!assistantCollapsed && (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 mb-2 pr-1" style={{ minHeight: 200 }}>
                  {assistantMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 text-sm ${msg.from === 'ai' ? `${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-200'} border` : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white self-end ml-auto'}`}
                      style={msg.from === 'user' ? { maxWidth: '80%', marginLeft: 'auto' } : { maxWidth: '80%' }}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
                <form className="flex gap-2 mt-auto" onSubmit={handleAssistantSend}>
                  <input
                  type="text"
                  className={`flex-1 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:ring-blue-400 border-gray-600' : 'bg-gray-100 text-gray-700 placeholder-gray-500 focus:ring-blue-500 border-gray-200'} focus:outline-none focus:ring-2 border`}
                  placeholder="Ask me anything..."
                  value={assistantInput}
                  onChange={e => setAssistantInput(e.target.value)}
                  disabled={assistantStreaming}
                  style={{ maxWidth: '180px' }}
                  />
                  {assistantStreaming ? (
                    <button
                      type="button"
                      onClick={handleAssistantStop}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow-lg hover:bg-red-700 transition-colors"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!assistantInput.trim()}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform disabled:opacity-60"
                    >
                      Send
                    </button>
                  )}
                </form>
              </>
            )}
          </aside>
        </main>
        
        {/* Profile Editing Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl max-w-4xl w-full mx-4 relative border animate-fadeIn max-h-[90vh] overflow-hidden`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        getUserName().charAt(0).toUpperCase()
                      )}
                    </div>
                    <button 
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700 transition-colors"
                      onClick={handleProfilePictureClick}
                      title="Change profile picture"
                    >
                      📷
                    </button>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Profile Settings</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your account, privacy, and preferences</p>
                  </div>
                </div>
                <button
                  className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} text-2xl font-bold transition-colors`}
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <div className="flex h-[calc(90vh-120px)]">
                {/* Sidebar Tabs */}
                <div className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r p-4`}>
                  <nav className="space-y-2">
                    {[
                      { id: 'general', icon: '👤', label: 'General Info', desc: 'Basic profile details' },
                      { id: 'security', icon: '🔒', label: 'Security', desc: 'Password & 2FA' },
                      { id: 'notifications', icon: '🔔', label: 'Notifications', desc: 'Email & push settings' },
                      { id: 'privacy', icon: '🛡️', label: 'Privacy', desc: 'Control your visibility' },
                      { id: 'activity', icon: '📊', label: 'Activity', desc: 'Usage statistics' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveProfileTab(tab.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          activeProfileTab === tab.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tab.icon}</span>
                          <div>
                            <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{tab.label}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{tab.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* General Info Tab */}
                  {activeProfileTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              value={profileEdit.name}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                              type="email"
                              value={profileEdit.email}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="your@email.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              value={profileEdit.phone}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                              type="text"
                              value={profileEdit.location}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, location: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="City, State, Country"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                            <input
                              type="url"
                              value={profileEdit.website}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, website: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                            <textarea
                              value={profileEdit.bio}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, bio: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                              rows={4}
                              placeholder="Tell us about yourself..."
                            />
                          </div>
                        </div>
                        
                        {/* Quick Save Button for General Info */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              // Validate required fields
                              if (!profileEdit.name.trim()) {
                                alert('Please enter your full name');
                                return;
                              }
                              if (!profileEdit.email.trim()) {
                                alert('Please enter your email address');
                                return;
                              }
                              
                              // Validate email format
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!emailRegex.test(profileEdit.email)) {
                                alert('Please enter a valid email address');
                                return;
                              }
                              
                              // Save basic profile info
                              localStorage.setItem('userName', profileEdit.name);
                              localStorage.setItem('userEmail', profileEdit.email);
                              localStorage.setItem('userPhone', profileEdit.phone);
                              localStorage.setItem('userBio', profileEdit.bio);
                              localStorage.setItem('userLocation', profileEdit.location);
                              localStorage.setItem('userWebsite', profileEdit.website);
                              
                              alert('Personal information saved successfully!');
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Personal Info
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeProfileTab === 'security' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Password & Security</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                              type="password"
                              value={profileEdit.currentPassword}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                              type="password"
                              value={profileEdit.newPassword}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                              type="password"
                              value={profileEdit.confirmPassword}
                              onChange={(e) => setProfileEdit(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-4">Two-Factor Authentication</h4>
                        <div className="space-y-4">
                          {/* 2FA Status */}
                          <div className={`border rounded-lg p-4 ${profileEdit.twoFactorEnabled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profileEdit.twoFactorEnabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                  {profileEdit.twoFactorEnabled ? '🔐' : '⚠️'}
                                </div>
                                <div>
                                  <div className={`font-medium ${profileEdit.twoFactorEnabled ? 'text-green-800' : 'text-yellow-800'}`}>
                                    {profileEdit.twoFactorEnabled ? '2FA is Active' : '2FA is Disabled'}
                                  </div>
                                  <div className={`text-sm ${profileEdit.twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {profileEdit.twoFactorEnabled ? 'Your account is secured with two-factor authentication' : 'Add an extra layer of security to your account'}
                                  </div>
                                </div>
                              </div>
                              <button 
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${profileEdit.twoFactorEnabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                onClick={() => {
                                  if (profileEdit.twoFactorEnabled) {
                                    const confirm = window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.');
                                    if (confirm) {
                                      setProfileEdit(prev => ({ ...prev, twoFactorEnabled: false }));
                                      localStorage.setItem('twoFactorEnabled', 'false');
                                      alert('2FA has been disabled. We recommend enabling it again for better security.');
                                    }
                                  } else {
                                    setProfileEdit(prev => ({ ...prev, twoFactorEnabled: true }));
                                    localStorage.setItem('twoFactorEnabled', 'true');
                                    alert('2FA has been enabled! Your account is now more secure. In a real app, you would configure your authenticator app.');
                                  }
                                }}
                              >
                                {profileEdit.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                              </button>
                            </div>
                          </div>

                          {/* 2FA Setup Options (when enabled) */}
                          {profileEdit.twoFactorEnabled && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h5 className="font-medium text-blue-800 mb-3">Authentication Methods</h5>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">📱</div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-800">Authenticator App</div>
                                      <div className="text-xs text-gray-600">Google Authenticator, Authy, etc.</div>
                                    </div>
                                  </div>
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">📧</div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-800">Email Verification</div>
                                      <div className="text-xs text-gray-600">Backup authentication method</div>
                                    </div>
                                  </div>
                                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Enable</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-semibold text-gray-800">Device & Login Management</h4>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All Sessions</button>
                        </div>
                        <div className="space-y-4">
                          {/* Active Sessions */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h5>
                            <div className="space-y-2">
                              {[
                                { 
                                  device: 'Chrome on Windows 11', 
                                  location: 'New York, NY, USA', 
                                  ip: '192.168.1.101',
                                  time: '2 hours ago', 
                                  current: true,
                                  icon: '💻',
                                  trusted: true,
                                  lastActivity: 'Active now'
                                },
                                { 
                                  device: 'Safari on iPhone 14 Pro', 
                                  location: 'New York, NY, USA', 
                                  ip: '192.168.1.102',
                                  time: '1 day ago', 
                                  current: false,
                                  icon: '📱',
                                  trusted: true,
                                  lastActivity: '6 hours ago'
                                }
                              ].map((session, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border ${session.current ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.current ? 'bg-green-100' : 'bg-blue-100'}`}>
                                      {session.icon}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-800">{session.device}</div>
                                        {session.current && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Current</span>}
                                        {session.trusted && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Trusted</span>}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {session.location} • IP: {session.ip}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Login: {session.time} • Last active: {session.lastActivity}
                                      </div>
                                    </div>
                                  </div>
                                  {!session.current && (
                                    <div className="flex gap-2">
                                      <button 
                                        className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-300 rounded hover:bg-blue-50"
                                        onClick={() => alert('Device marked as trusted')}
                                      >
                                        Trust
                                      </button>
                                      <button 
                                        className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium border border-red-300 rounded hover:bg-red-50"
                                        onClick={() => {
                                          if (confirm('Are you sure you want to terminate this session?')) {
                                            alert('Session terminated successfully');
                                          }
                                        }}
                                      >
                                        Terminate
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Security Events */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Security Events</h5>
                            <div className="space-y-2">
                              {[
                                { 
                                  type: 'login', 
                                  message: 'Successful login from new device', 
                                  time: '2 hours ago',
                                  severity: 'info',
                                  icon: '🔑'
                                },
                                { 
                                  type: 'password', 
                                  message: 'Password changed successfully', 
                                  time: '3 days ago',
                                  severity: 'success',
                                  icon: '🔐'
                                },
                                { 
                                  type: 'failed_login', 
                                  message: 'Failed login attempt detected', 
                                  time: '5 days ago',
                                  severity: 'warning',
                                  icon: '⚠️'
                                }
                              ].map((event, idx) => (
                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${
                                  event.severity === 'success' ? 'bg-green-50 border border-green-200' :
                                  event.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                                  'bg-blue-50 border border-blue-200'
                                }`}>
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                    {event.icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${
                                      event.severity === 'success' ? 'text-green-800' :
                                      event.severity === 'warning' ? 'text-yellow-800' :
                                      'text-blue-800'
                                    }`}>
                                      {event.message}
                                    </div>
                                    <div className="text-xs text-gray-600">{event.time}</div>
                                  </div>
                                  <button className="text-gray-400 hover:text-gray-600 text-sm">⋯</button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Security Settings */}
                          <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
                            <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Additional Security Options</h5>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-800">Login Notifications</div>
                                  <div className="text-xs text-gray-600">Get notified of new logins</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    defaultChecked={true}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-800">Suspicious Activity Alerts</div>
                                  <div className="text-xs text-gray-600">Alert for unusual account activity</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    defaultChecked={true}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Save Button for Security Settings */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            // Validate password if changing
                            if (profileEdit.newPassword || profileEdit.currentPassword || profileEdit.confirmPassword) {
                              if (!profileEdit.currentPassword) {
                                alert('Please enter your current password');
                                return;
                              }
                              if (!profileEdit.newPassword) {
                                alert('Please enter a new password');
                                return;
                              }
                              if (profileEdit.newPassword !== profileEdit.confirmPassword) {
                                alert('New passwords do not match');
                                return;
                              }
                              if (profileEdit.newPassword.length < 6) {
                                alert('New password must be at least 6 characters long');
                                return;
                              }
                            }
                            
                            // Save 2FA setting
                            localStorage.setItem('twoFactorEnabled', profileEdit.twoFactorEnabled.toString());
                            
                            // Handle password change
                            if (profileEdit.newPassword && profileEdit.currentPassword) {
                              // In a real app, you would validate the current password and update it on the server
                              localStorage.setItem('userPasswordLastChanged', new Date().toISOString());
                              
                              // Reset password fields
                              setProfileEdit(prev => ({
                                ...prev,
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              }));
                              
                              const securityUpdates = ['Password updated'];
                              if (profileEdit.twoFactorEnabled) securityUpdates.push('2FA enabled');
                              
                              alert(`Security settings updated successfully! Changes: ${securityUpdates.join(', ')}`);
                            } else {
                              const message = profileEdit.twoFactorEnabled 
                                ? 'Security settings saved! Two-factor authentication is enabled for enhanced protection.'
                                : 'Security settings saved!';
                              alert(message);
                            }
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Update Security
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeProfileTab === 'notifications' && (
                    <div className="space-y-6">
                      {/* Main Notification Settings */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Notification Preferences</h3>
                        <div className="space-y-4">
                          {/* Email Notifications */}
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-medium text-gray-800">Email Notifications</div>
                                <div className="text-sm text-gray-600">Receive updates via email</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={profileEdit.notifications.email}
                                  onChange={(e) => setProfileEdit(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, email: e.target.checked }
                                  }))}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            {profileEdit.notifications.email && (
                              <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-2">
                                <div className="text-sm text-gray-600 mb-2">Email Types:</div>
                                {[
                                  { key: 'security', label: 'Security alerts', desc: 'Login attempts, password changes' },
                                  { key: 'activity', label: 'Account activity', desc: 'File uploads, shares' },
                                  { key: 'system', label: 'System updates', desc: 'Maintenance, new features' }
                                ].map((type) => (
                                  <label key={type.key} className="flex items-center gap-3 text-sm">
                                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <div>
                                      <div className="font-medium text-gray-700">{type.label}</div>
                                      <div className="text-xs text-gray-500">{type.desc}</div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Push Notifications */}
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-medium text-gray-800">Push Notifications</div>
                                <div className="text-sm text-gray-600">Receive push notifications in browser</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={profileEdit.notifications.push}
                                  onChange={(e) => setProfileEdit(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, push: e.target.checked }
                                  }))}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            {profileEdit.notifications.push && (
                              <div className="ml-4 pl-4 border-l-2 border-green-200 space-y-2">
                                <div className="text-sm text-gray-600 mb-2">Push Settings:</div>
                                <label className="flex items-center gap-3 text-sm">
                                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                  <div>
                                    <div className="font-medium text-gray-700">Desktop notifications</div>
                                    <div className="text-xs text-gray-500">Show on desktop when browser is open</div>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 text-sm">
                                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                  <div>
                                    <div className="font-medium text-gray-700">Sound alerts</div>
                                    <div className="text-xs text-gray-500">Play notification sound</div>
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Marketing Communications */}
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-800">Marketing Communications</div>
                                <div className="text-sm text-gray-600">Product updates, tips, and promotions</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={profileEdit.notifications.marketing}
                                  onChange={(e) => setProfileEdit(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, marketing: e.target.checked }
                                  }))}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notification Frequency */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-4">Notification Frequency</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Summary</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="instant">Instant</option>
                              <option value="daily" selected>Daily digest</option>
                              <option value="weekly">Weekly summary</option>
                              <option value="never">Never</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quiet Hours</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="none">No quiet hours</option>
                              <option value="night" selected>10 PM - 8 AM</option>
                              <option value="work">9 AM - 5 PM</option>
                              <option value="custom">Custom range</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Notification History */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-semibold text-gray-800">Recent Notifications</h4>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Clear All</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {[
                            { type: 'security', title: 'New login detected', message: 'Signed in from Chrome on Windows', time: '2 hours ago', read: false },
                            { type: 'activity', title: 'File uploaded', message: 'Document.pdf was uploaded successfully', time: '1 day ago', read: true },
                            { type: 'system', title: 'System maintenance', message: 'Scheduled maintenance completed', time: '2 days ago', read: true },
                            { type: 'marketing', title: 'New feature available', message: 'Try our new AI-powered search', time: '3 days ago', read: true }
                          ].map((notification, idx) => (
                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                              notification.read 
                                ? `${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}` 
                                : `${isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`
                            }`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                notification.type === 'security' ? 'bg-red-100' :
                                notification.type === 'activity' ? 'bg-green-100' :
                                notification.type === 'system' ? 'bg-yellow-100' :
                                'bg-purple-100'
                              }`}>
                                {notification.type === 'security' && '🔒'}
                                {notification.type === 'activity' && '📁'}
                                {notification.type === 'system' && '⚙️'}
                                {notification.type === 'marketing' && '💡'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${notification.read ? 'text-gray-800' : 'text-blue-800'}`}>
                                  {notification.title}
                                  {!notification.read && <span className="w-2 h-2 bg-blue-600 rounded-full inline-block ml-2"></span>}
                                </div>
                                <div className="text-xs text-gray-600">{notification.message}</div>
                                <div className="text-xs text-gray-400 mt-1">{notification.time}</div>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600 text-sm">⋯</button>
                            </div>
                          ))}
                        </div>
                      </div>
                        
                        {/* Quick Save Button for Notifications */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              // Save notification preferences
                              localStorage.setItem('emailNotifications', profileEdit.notifications.email.toString());
                              localStorage.setItem('pushNotifications', profileEdit.notifications.push.toString());
                              localStorage.setItem('marketingNotifications', profileEdit.notifications.marketing.toString());
                              
                              const enabledTypes = [];
                              if (profileEdit.notifications.email) enabledTypes.push('Email');
                              if (profileEdit.notifications.push) enabledTypes.push('Push');
                              if (profileEdit.notifications.marketing) enabledTypes.push('Marketing');
                              
                              const message = enabledTypes.length > 0 
                                ? `Advanced notification preferences saved! Enabled: ${enabledTypes.join(', ')}. Granular controls and frequency settings have been applied.`
                                : 'Notification preferences saved! All notifications are disabled.';
                              
                              alert(message);
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 12.344l1.414 1.414M4 5a3 3 0 013-3h10a3 3 0 013 3v2" />
                            </svg>
                            Save Notifications
                          </button>
                        </div>
                    </div>
                  )}

                  {/* Privacy Tab */}
                  {activeProfileTab === 'privacy' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Privacy Controls</h3>
                        <div className="space-y-4">
                          <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                            <div>
                              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Public Profile</div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Make your profile visible to others</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileEdit.privacy.profilePublic}
                                onChange={(e) => setProfileEdit(prev => ({
                                  ...prev,
                                  privacy: { ...prev.privacy, profilePublic: e.target.checked }
                                }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                            <div>
                              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Show Activity Status</div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Let others see when you're online</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileEdit.privacy.showActivity}
                                onChange={(e) => setProfileEdit(prev => ({
                                  ...prev,
                                  privacy: { ...prev.privacy, showActivity: e.target.checked }
                                }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                            <div>
                              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Allow Messages</div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receive messages from other users</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileEdit.privacy.allowMessages}
                                onChange={(e) => setProfileEdit(prev => ({
                                  ...prev,
                                  privacy: { ...prev.privacy, allowMessages: e.target.checked }
                                }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Quick Save Button for Privacy */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              // Save privacy preferences
                              localStorage.setItem('profilePublic', profileEdit.privacy.profilePublic.toString());
                              localStorage.setItem('showActivity', profileEdit.privacy.showActivity.toString());
                              localStorage.setItem('allowMessages', profileEdit.privacy.allowMessages.toString());
                              
                              const privacySettings = [];
                              if (profileEdit.privacy.profilePublic) privacySettings.push('Public Profile');
                              if (profileEdit.privacy.showActivity) privacySettings.push('Activity Visible');
                              if (profileEdit.privacy.allowMessages) privacySettings.push('Messages Allowed');
                              
                              const message = privacySettings.length > 0 
                                ? `Privacy settings saved! Active: ${privacySettings.join(', ')}`
                                : 'Privacy settings saved! Maximum privacy mode enabled.';
                              
                              alert(message);
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Save Privacy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Tab */}
                  {activeProfileTab === 'activity' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Account Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">247</div>
                            <div className="text-sm text-blue-800">Files Uploaded</div>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">156</div>
                            <div className="text-sm text-green-800">Files Shared</div>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">89</div>
                            <div className="text-sm text-purple-800">Collaborations</div>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">23</div>
                            <div className="text-sm text-orange-800">Days Active</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-4">Recent Activity</h4>
                        <div className="space-y-3">
                          {[
                            { action: 'Uploaded presentation.pptx', time: '2 hours ago', type: 'upload' },
                            { action: 'Shared document with team', time: '5 hours ago', type: 'share' },
                            { action: 'Created new folder "Projects"', time: '1 day ago', type: 'create' },
                            { action: 'Downloaded report.pdf', time: '2 days ago', type: 'download' }
                          ].map((activity, idx) => (
                            <div key={idx} className={`flex items-center gap-3 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                activity.type === 'upload' ? 'bg-blue-500' :
                                activity.type === 'share' ? 'bg-green-500' :
                                activity.type === 'create' ? 'bg-purple-500' : 'bg-orange-500'
                              }`}>
                                {activity.type === 'upload' && '⬆️'}
                                {activity.type === 'share' && '🔗'}
                                {activity.type === 'create' && '📁'}
                                {activity.type === 'download' && '⬇️'}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800">{activity.action}</div>
                                <div className="text-xs text-gray-600">{activity.time}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className={`flex justify-between items-center p-6 border-t ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Validate required fields
                    if (!profileEdit.name.trim()) {
                      alert('Please enter your full name');
                      return;
                    }
                    if (!profileEdit.email.trim()) {
                      alert('Please enter your email address');
                      return;
                    }
                    
                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(profileEdit.email)) {
                      alert('Please enter a valid email address');
                      return;
                    }
                    
                    // Validate password if changing
                    if (profileEdit.newPassword && profileEdit.newPassword !== profileEdit.confirmPassword) {
                      alert('New passwords do not match');
                      return;
                    }
                    
                    // Save all profile changes
                    localStorage.setItem('userName', profileEdit.name);
                    localStorage.setItem('userEmail', profileEdit.email);
                    localStorage.setItem('userPhone', profileEdit.phone);
                    localStorage.setItem('userBio', profileEdit.bio);
                    localStorage.setItem('userLocation', profileEdit.location);
                    localStorage.setItem('userWebsite', profileEdit.website);
                    localStorage.setItem('emailNotifications', profileEdit.notifications.email.toString());
                    localStorage.setItem('pushNotifications', profileEdit.notifications.push.toString());
                    localStorage.setItem('marketingNotifications', profileEdit.notifications.marketing.toString());
                    localStorage.setItem('profilePublic', profileEdit.privacy.profilePublic.toString());
                    localStorage.setItem('showActivity', profileEdit.privacy.showActivity.toString());
                    localStorage.setItem('allowMessages', profileEdit.privacy.allowMessages.toString());
                    
                    // Handle password change
                    if (profileEdit.newPassword && profileEdit.currentPassword) {
                      // In a real app, you would validate the current password and update it on the server
                      localStorage.setItem('userPasswordLastChanged', new Date().toISOString());
                    }
                    
                    // Reset password fields
                    setProfileEdit(prev => ({
                      ...prev,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    }));
                    
                    // Show success message with more details
                    const updatedFields = [];
                    if (profileEdit.name !== getUserName()) updatedFields.push('name');
                    if (profileEdit.email !== getUserEmail()) updatedFields.push('email');
                    if (profileEdit.phone) updatedFields.push('phone');
                    if (profileEdit.bio) updatedFields.push('bio');
                    if (profileEdit.location) updatedFields.push('location');
                    if (profileEdit.website) updatedFields.push('website');
                    if (profileEdit.newPassword) updatedFields.push('password');
                    
                    const message = updatedFields.length > 0 
                      ? `Profile updated successfully! Updated: ${updatedFields.join(', ')}`
                      : 'Profile settings saved successfully!';
                    
                    alert(message);
                    setShowProfileModal(false);
                    
                    // Trigger a page refresh to reflect changes immediately
                    window.location.reload();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Picture Upload Modal */}
        {showProfilePictureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative border border-gray-200 animate-fadeIn">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Picture</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
                  onClick={() => setShowProfilePictureModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              {/* Profile Picture Preview */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden mb-4">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getUserName().charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* Upload Options */}
                <div className="flex gap-3">
                  <button
                    onClick={handleProfilePictureClick}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    Choose New Picture
                  </button>
                  
                  {profilePicture && (
                    <button
                      onClick={removeProfilePicture}
                      className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-600 mb-6">
                <p>Choose an image file (JPEG, PNG, GIF, or WebP)</p>
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 2MB</p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfilePictureModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfilePicture}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                  disabled={!profilePicture}
                >
                  Save Picture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl max-w-5xl w-full mx-4 relative border animate-fadeIn max-h-[90vh] overflow-hidden`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg`}>
                    ⚙️
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>System Settings</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customize your experience and preferences</p>
                  </div>
                </div>
                <button
                  className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} text-2xl font-bold transition-colors`}
                  onClick={() => setShowSettingsModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <div className="flex h-[calc(90vh-120px)]">
                {/* Settings Sidebar */}
                <div className={`w-64 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r p-4`}>
                  <nav className="space-y-2">
                    {[
                      { id: 'appearance', icon: '🎨', label: 'Appearance', desc: 'Theme, fonts, display' },
                      { id: 'accessibility', icon: '♿', label: 'Accessibility', desc: 'Screen reader, contrast' },
                      { id: 'system', icon: '💾', label: 'System', desc: 'Sync, backups, data' },
                      { id: 'about', icon: 'ℹ️', label: 'About', desc: 'Version, support, legal' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          activeSettingsTab === tab.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'
                            : `${isDarkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tab.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{tab.label}</div>
                            <div className={`text-xs ${activeSettingsTab === tab.id ? 'text-blue-600' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{tab.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Settings Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* Appearance Settings */}
                  {activeSettingsTab === 'appearance' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Theme & Display</h3>
                        
                        {/* Theme Selection */}
                        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 mb-6`}>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Color Theme</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'light', label: 'Light', icon: '☀️', desc: 'Clean and bright' },
                              { value: 'dark', label: 'Dark', icon: '🌙', desc: 'Easy on the eyes' },
                              { value: 'system', label: 'System', icon: '💻', desc: 'Match device settings' }
                            ].map((themeOption) => (
                              <button
                                key={themeOption.value}
                                onClick={() => handleThemeChange(themeOption.value as 'light' | 'dark' | 'system')}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                  theme === themeOption.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : `${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`
                                }`}
                              >
                                <div className="text-2xl mb-2">{themeOption.icon}</div>
                                <div className="font-medium">{themeOption.label}</div>
                                <div className={`text-xs mt-1 ${theme === themeOption.value ? 'text-blue-600' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {themeOption.desc}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Size */}
                        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 mb-6`}>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Font Size</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'small', label: 'Small', sample: 'Aa' },
                              { value: 'medium', label: 'Medium', sample: 'Aa' },
                              { value: 'large', label: 'Large', sample: 'Aa' }
                            ].map((sizeOption) => (
                              <button
                                key={sizeOption.value}
                                onClick={() => handleSettingsChange('appearance', 'fontSize', sizeOption.value)}
                                className={`p-3 rounded-lg border transition-all duration-200 ${
                                  settings.appearance.fontSize === sizeOption.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : `${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`
                                }`}
                              >
                                <div className={`${sizeOption.value === 'small' ? 'text-lg' : sizeOption.value === 'medium' ? 'text-xl' : 'text-2xl'} font-bold mb-1`}>
                                  {sizeOption.sample}
                                </div>
                                <div className="text-sm">{sizeOption.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Display Options */}
                        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Display Options</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Animations</div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enable smooth transitions and effects</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.appearance.animations}
                                  onChange={(e) => handleSettingsChange('appearance', 'animations', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Accessibility Settings */}
                  {activeSettingsTab === 'accessibility' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Accessibility Options</h3>
                        
                        <div className="space-y-4">
                          {[
                            { 
                              key: 'screenReader', 
                              label: 'Screen Reader Support', 
                              desc: 'Enhanced navigation for screen readers',
                              icon: '🔊'
                            },
                            { 
                              key: 'highContrast', 
                              label: 'High Contrast Mode', 
                              desc: 'Increase contrast for better visibility',
                              icon: '🌓'
                            },
                            { 
                              key: 'reducedMotion', 
                              label: 'Reduce Motion', 
                              desc: 'Minimize animations and transitions',
                              icon: '⏸️'
                            },
                            { 
                              key: 'keyboardNavigation', 
                              label: 'Keyboard Navigation', 
                              desc: 'Enhanced keyboard shortcuts and focus',
                              icon: '⌨️'
                            }
                          ].map((option) => (
                            <div key={option.key} className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{option.icon}</div>
                                <div>
                                  <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{option.label}</div>
                                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{option.desc}</div>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.accessibility[option.key as keyof typeof settings.accessibility]}
                                  onChange={(e) => handleSettingsChange('accessibility', option.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System Settings */}
                  {activeSettingsTab === 'system' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>System & Data</h3>
                        
                        <div className="space-y-4">
                          {[
                            { 
                              key: 'autoSave', 
                              label: 'Auto-Save', 
                              desc: 'Automatically save changes as you work',
                              icon: '💾'
                            },
                            { 
                              key: 'syncSettings', 
                              label: 'Sync Settings', 
                              desc: 'Sync preferences across devices',
                              icon: '🔄'
                            },
                            { 
                              key: 'dataCollection', 
                              label: 'Anonymous Analytics', 
                              desc: 'Help improve the app with usage data',
                              icon: '📊'
                            },
                            { 
                              key: 'errorReporting', 
                              label: 'Error Reporting', 
                              desc: 'Automatically report crashes and errors',
                              icon: '🐛'
                            }
                          ].map((option) => (
                            <div key={option.key} className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{option.icon}</div>
                                <div>
                                  <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{option.label}</div>
                                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{option.desc}</div>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.system[option.key as keyof typeof settings.system]}
                                  onChange={(e) => handleSettingsChange('system', option.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Storage Usage */}
                        <div className={`mt-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Storage Usage</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Files & Documents</span>
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{calculateStorageUsage().files} MB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Cache & Temporary</span>
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{calculateStorageUsage().cache} MB</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                              <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>Total Used</span>
                              <span className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>{calculateStorageUsage().total} MB</span>
                            </div>
                            <div className="pt-2">
                              <button 
                                onClick={handleClearCache}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Clear Cache & Temporary Files
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Settings Management */}
                        <div className={`mt-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Settings Management</h4>
                          <div className="space-y-3">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Export your settings to backup or import them on another device.
                            </p>
                            <div className="flex gap-3">
                              <button 
                                onClick={exportSettings}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                📤 Export Settings
                              </button>
                              <label className="flex-1">
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={importSettings}
                                  className="hidden"
                                />
                                <div className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium text-center cursor-pointer">
                                  📥 Import Settings
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* About Tab */}
                  {activeSettingsTab === 'about' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>About Aegis Cloud</h3>
                        
                        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-6`}>
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                              ☁️
                            </div>
                            <h4 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Aegis Cloud</h4>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Version 2.1.0</p>
                          </div>
                          
                          <div className="space-y-4 text-center">
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Your secure cloud storage and file management solution
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Check for Updates
                              </button>
                              <button className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}>
                                Release Notes
                              </button>
                            </div>
                            
                            <div className="pt-4 space-y-2 text-sm">
                              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                © 2025 Aegis Cloud. All rights reserved.
                              </p>
                              <div className="flex justify-center gap-4">
                                <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
                                <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
                                <a href="#" className="text-blue-600 hover:text-blue-700">Support</a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className={`px-6 py-2 border rounded-lg transition-all font-medium ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Settings saved successfully! Your preferences have been applied.');
                    setShowSettingsModal(false);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help & Support Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl max-w-5xl w-full mx-4 relative border animate-fadeIn max-h-[90vh] overflow-hidden`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg`}>
                    ❓
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Help & Support</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get help, find answers, and contact support</p>
                  </div>
                </div>
                <button
                  className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} text-2xl font-bold transition-colors`}
                  onClick={() => setShowHelpModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <div className="flex h-[calc(90vh-120px)]">
                {/* Help Sidebar */}
                <div className={`w-64 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r p-4`}>
                  <nav className="space-y-2">
                    {[
                      { id: 'faq', icon: '❓', label: 'FAQ', desc: 'Common questions' },
                      { id: 'guides', icon: '📚', label: 'User Guides', desc: 'Step-by-step tutorials' },
                      { id: 'troubleshooting', icon: '🔧', label: 'Troubleshooting', desc: 'Fix common issues' },
                      { id: 'contact', icon: '📧', label: 'Contact Us', desc: 'Get personalized help' },
                      { id: 'feedback', icon: '💬', label: 'Feedback', desc: 'Share your thoughts' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveHelpTab(tab.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          activeHelpTab === tab.id
                            ? `${isDarkMode ? 'bg-green-800 text-green-300 border border-green-600' : 'bg-green-100 text-green-700 border border-green-300'} shadow-sm`
                            : `${isDarkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tab.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{tab.label}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{tab.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Help Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* FAQ Tab */}
                  {activeHelpTab === 'faq' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Frequently Asked Questions</h3>
                        
                        <div className="space-y-4">
                          {[
                            {
                              question: "How do I upload files to Aegis Cloud?",
                              answer: "You can upload files by clicking the 'New' button in the top navigation, selecting 'Upload File', or by simply dragging and dropping files into the dashboard area."
                            },
                            {
                              question: "What file types are supported?",
                              answer: "Aegis Cloud supports all major file types including documents (PDF, DOCX, TXT), images (JPG, PNG, GIF), videos (MP4, AVI), audio files (MP3, WAV), and many more."
                            },
                            {
                              question: "How much storage space do I have?",
                              answer: "Your current storage usage is displayed in the sidebar. You can see both used and total available space. Upgrade your plan for more storage if needed."
                            },
                            {
                              question: "Can I share files with others?",
                              answer: "Yes! You can share files by right-clicking on them and selecting the share option. You can set permissions and generate shareable links."
                            },
                            {
                              question: "Is my data secure?",
                              answer: "Absolutely. Aegis Cloud uses enterprise-grade encryption, secure data centers, and follows industry best practices to keep your data safe."
                            },
                            {
                              question: "How do I enable dark mode?",
                              answer: "Click on your profile picture in the top right, go to Settings, and under Appearance you can choose between Light, Dark, or System theme."
                            }
                          ].map((faq, index) => (
                            <div key={index} className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                              <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>{faq.question}</h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Guides Tab */}
                  {activeHelpTab === 'guides' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>User Guides</h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          {[
                            {
                              title: "Getting Started",
                              description: "Learn the basics of using Aegis Cloud",
                              icon: "🚀",
                              topics: ["Account Setup", "First Upload", "Navigation"]
                            },
                            {
                              title: "File Management",
                              description: "Organize and manage your files effectively",
                              icon: "📁",
                              topics: ["Upload Files", "Create Folders", "File Organization"]
                            },
                            {
                              title: "Sharing & Collaboration",
                              description: "Share files and work with others",
                              icon: "🤝",
                              topics: ["Share Links", "Permissions", "Collaborative Editing"]
                            },
                            {
                              title: "Security & Privacy",
                              description: "Keep your data safe and secure",
                              icon: "🔒",
                              topics: ["Two-Factor Auth", "Privacy Settings", "Data Encryption"]
                            }
                          ].map((guide, index) => (
                            <div key={index} className={`border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{guide.icon}</span>
                                <div>
                                  <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-1`}>{guide.title}</h4>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{guide.description}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {guide.topics.map((topic, i) => (
                                      <span key={i} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Troubleshooting Tab */}
                  {activeHelpTab === 'troubleshooting' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Troubleshooting</h3>
                        
                        <div className="space-y-4">
                          {[
                            {
                              issue: "Files not uploading",
                              solutions: [
                                "Check your internet connection",
                                "Ensure file size is under the limit",
                                "Try refreshing the page",
                                "Clear browser cache"
                              ]
                            },
                            {
                              issue: "Can't see uploaded files",
                              solutions: [
                                "Refresh the page",
                                "Check if you're in the right folder",
                                "Verify your internet connection",
                                "Try logging out and back in"
                              ]
                            },
                            {
                              issue: "Theme not changing",
                              solutions: [
                                "Clear browser cache",
                                "Make sure JavaScript is enabled",
                                "Try a different browser",
                                "Check if ad blockers are interfering"
                              ]
                            },
                            {
                              issue: "Performance issues",
                              solutions: [
                                "Close unnecessary browser tabs",
                                "Update your browser",
                                "Check available storage space",
                                "Restart your browser"
                              ]
                            }
                          ].map((troubleshoot, index) => (
                            <div key={index} className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                              <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-3 flex items-center gap-2`}>
                                <span className="text-red-500">⚠️</span>
                                {troubleshoot.issue}
                              </h4>
                              <div className="ml-6">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Try these solutions:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {troubleshoot.solutions.map((solution, i) => (
                                    <li key={i} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {solution}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {activeHelpTab === 'contact' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Contact Support</h3>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className={`border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-6`}>
                            <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                              <span className="text-blue-500">📧</span>
                              Email Support
                            </h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                              Get detailed help via email. We typically respond within 24 hours.
                            </p>
                            <a href="mailto:support@aegiscloud.com" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Send Email
                            </a>
                          </div>

                          <div className={`border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-6`}>
                            <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                              <span className="text-green-500">💬</span>
                              Live Chat
                            </h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                              Chat with our support team for immediate assistance.
                            </p>
                            <button 
                              onClick={() => alert('Live chat would open here')}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Start Chat
                            </button>
                          </div>
                        </div>

                        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-6 mt-6`}>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Contact Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-blue-500">🌐</span>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Website: www.aegiscloud.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-green-500">📞</span>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone: +1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-purple-500">🕒</span>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Support Hours: Mon-Fri 9AM-6PM EST</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback Tab */}
                  {activeHelpTab === 'feedback' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>We Value Your Feedback</h3>
                        
                        <div className={`border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-6`}>
                          <form className="space-y-4">
                            <div>
                              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                Feedback Type
                              </label>
                              <select className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                                <option>Feature Request</option>
                                <option>Bug Report</option>
                                <option>General Feedback</option>
                                <option>User Experience</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                Subject
                              </label>
                              <input 
                                type="text"
                                className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="Brief description of your feedback"
                              />
                            </div>
                            
                            <div>
                              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                Message
                              </label>
                              <textarea 
                                rows={6}
                                className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="Please share your detailed feedback, suggestions, or issues..."
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  alert('Thank you for your feedback! We appreciate your input and will review it carefully.');
                                }}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
                              >
                                Submit Feedback
                              </button>
                              <button
                                type="button"
                                className={`px-6 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors font-medium`}
                              >
                                Save Draft
                              </button>
                            </div>
                          </form>
                        </div>
                        
                        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 mt-6`}>
                          <div className="flex items-start gap-3">
                            <span className="text-blue-500 text-xl">💡</span>
                            <div>
                              <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-1`}>Your feedback matters!</h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                We actively review all feedback and use it to improve Aegis Cloud. Thank you for helping us make it better!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className={`px-6 py-2 border rounded-lg transition-all font-medium ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Profile Picture Input */}
        <input 
          type="file" 
          ref={profilePictureInputRef} 
          style={{ display: 'none' }} 
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleProfilePictureChange} 
        />
        
        {/* Inline Dashboard Footer */}
        <footer className={`mt-4 px-4 md:px-8 py-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                © 2024 AegisCloud. All rights reserved.
              </span>
            </div>
            <div className={`flex items-center gap-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <a href="#" className={`${isDarkMode ? 'hover:text-gray-200' : 'hover:text-gray-700'} transition-colors`}>Privacy</a>
              <a href="#" className={`${isDarkMode ? 'hover:text-gray-200' : 'hover:text-gray-700'} transition-colors`}>Terms</a>
              <a href="#" className={`${isDarkMode ? 'hover:text-gray-200' : 'hover:text-gray-700'} transition-colors`}>Support</a>
              <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'}`}>
                Secure Connection
              </span>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setAssistantCollapsed(!assistantCollapsed)}
          className="group relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
          
          {/* AI Icon */}
          <div className="relative z-10 text-white">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                fill="currentColor"
                className="animate-pulse"
              />
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.7"/>
            </svg>
          </div>
          
          {/* Notification dot (optional) */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {assistantCollapsed ? 'Open AI Assistant' : 'AI Assistant Active'}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-800 rotate-45 transform -translate-y-1/2"></div>
          </div>
        </button>
        
        {/* Floating action indicators */}
        <div className="absolute -top-2 -left-2 flex items-center justify-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        </div>
      </div>

      {/* Share File Modal */}
      {showShareModal && fileToShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Share File
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl">{getFileIcon(fileToShare.originalName)}</div>
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {fileToShare.originalName}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(fileToShare.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleShareSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Share with (Email addresses)
                  </label>
                  <textarea
                    value={shareEmails}
                    onChange={(e) => setShareEmails(e.target.value)}
                    placeholder="Enter email addresses separated by commas..."
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Separate multiple emails with commas
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Permissions
                  </label>
                  <select
                    value={sharePermissions}
                    onChange={(e) => setSharePermissions(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value="view">View only</option>
                    <option value="edit">Edit (includes download)</option>
                  </select>
                </div>

                {shareError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{shareError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSharing}
                    className={`flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isSharing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        Share File
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className={`px-4 py-2 border rounded-lg transition-colors font-medium ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
