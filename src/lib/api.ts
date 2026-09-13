// API client for communicating with our PostgreSQL backend
// Replace Firebase calls with these API calls

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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

export async function updateUserProfile(name: string, avatarUrl?: string) {
  const data = await apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, avatarUrl }),
  });
  return data.user;
}

// ============ NOTES ============
export async function getNotes() {
  const data = await apiRequest('/notes');
  return data.notes;
}

export async function createNote(note: any) {
  const data = await apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });
  return data.note;
}

export async function updateNote(id: string, updates: any) {
  const data = await apiRequest(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.note;
}

export async function deleteNote(id: string) {
  await apiRequest(`/notes/${id}`, { method: 'DELETE' });
}

// ============ IMAGES ============
export async function getImages() {
  const data = await apiRequest('/images');
  return data.images;
}

export async function createImage(image: any) {
  const data = await apiRequest('/images', {
    method: 'POST',
    body: JSON.stringify(image),
  });
  return data.image;
}

export async function deleteImage(id: string) {
  await apiRequest(`/images/${id}`, { method: 'DELETE' });
}

// ============ LINKS ============
export async function getLinks() {
  const data = await apiRequest('/links');
  return data.links;
}

export async function createLink(link: any) {
  const data = await apiRequest('/links', {
    method: 'POST',
    body: JSON.stringify(link),
  });
  return data.link;
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

export async function askAssistant(prompt: string, context: any) {
  return apiRequest('/assistant', {
    method: 'POST',
    body: JSON.stringify({ prompt, context }),
  });
}
