// API client for communicating with our PostgreSQL backend
// Replace Firebase calls with these API calls
import { UserProfile } from '../types';

const API_BASE = (typeof window !== 'undefined' && window.location.origin.startsWith('http'))
  ? '/api'
  : 'https://topfile.onrender.com/api';

let authToken: string | null = null;

// Load token from localStorage on startup
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('ownly_auth_token');
}

// Set auth token
export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('ownly_auth_token', token);
}

// Clear auth token
export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('ownly_auth_token');
}

// Generic API request
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ============ AUTH ============
export async function register(email: string, password: string, name: string) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  setAuthToken(data.token);
  return data.user;
}

export async function login(email: string, password: string) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data.user;
}

export async function logout() {
  clearAuthToken();
}

// ============ USER PROFILE ============
export async function getUserProfile() {
  const data = await apiRequest('/user/profile');
  return data.user;
}

export async function updateUserProfile(updates: Partial<UserProfile>) {
  const data = await apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.user;
}

// Helper to format DB note to frontend NoteItem
export function formatNote(n: any) {
  if (!n) return n;
  let attachments = n.attachments;
  if (typeof attachments === 'string') {
    try {
      attachments = JSON.parse(attachments);
    } catch {
      attachments = [];
    }
  }
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    category: n.category || 'General',
    colorTag: n.color_tag || n.colorTag || '#d9ad52',
    isPinned: n.is_pinned !== undefined ? n.is_pinned : n.isPinned,
    attachments: Array.isArray(attachments) ? attachments : [],
    createdAt: n.created_at || n.createdAt || new Date().toISOString(),
    updatedAt: n.updated_at || n.updatedAt || new Date().toISOString(),
  };
}

// Helper to format DB image to frontend UploadedImageItem
export function formatImage(img: any) {
  if (!img) return img;
  return {
    id: img.id,
    name: img.name,
    dataUrl: img.data_url || img.dataUrl,
    fileSize: img.file_size || img.fileSize,
    dimensions: img.dimensions,
    source: img.source || 'upload',
    notes: img.notes,
    createdAt: img.created_at || img.createdAt || new Date().toISOString(),
  };
}

// Helper to format DB link to frontend LinkItem
export function formatLink(l: any) {
  if (!l) return l;
  return {
    id: l.id,
    url: l.url,
    title: l.title,
    description: l.description,
    embedThumb: l.embed_thumb || l.embedThumb || '',
    linkHost: l.link_host || l.linkHost || 'web',
    embedProvider: l.embed_provider || l.embedProvider || 'generic',
    embedId: l.embed_id || l.embedId || null,
    isPlayable: l.is_playable !== undefined ? l.is_playable : l.isPlayable,
    createdAt: l.created_at || l.createdAt || new Date().toISOString(),
  };
}

// ============ NOTES ============
export async function getNotes() {
  const data = await apiRequest('/notes');
  return (data.notes || []).map(formatNote);
}

export async function createNote(note: any) {
  const data = await apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });
  return formatNote(data.note);
}

export async function updateNote(id: string, updates: any) {
  const data = await apiRequest(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return formatNote(data.note);
}

export async function deleteNote(id: string) {
  await apiRequest(`/notes/${id}`, { method: 'DELETE' });
}

// ============ IMAGES ============
export async function getImages() {
  const data = await apiRequest('/images');
  return (data.images || []).map(formatImage);
}

export async function createImage(image: any) {
  const data = await apiRequest('/images', {
    method: 'POST',
    body: JSON.stringify(image),
  });
  return formatImage(data.image);
}

export async function deleteImage(id: string) {
  await apiRequest(`/images/${id}`, { method: 'DELETE' });
}

// ============ LINKS ============
export async function getLinks() {
  const data = await apiRequest('/links');
  return (data.links || []).map(formatLink);
}

export async function createLink(link: any) {
  const data = await apiRequest('/links', {
    method: 'POST',
    body: JSON.stringify(link),
  });
  return formatLink(data.link);
}

export async function deleteLink(id: string) {
  await apiRequest(`/links/${id}`, { method: 'DELETE' });
}

// ============ OTHER ============
export async function testConnection() {
  return apiRequest('/test');
}

export async function parseLink(url: string) {
  return apiRequest('/parse-link', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}
