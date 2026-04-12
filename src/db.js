// ===================================================================
// StyleVault Database Layer — MongoDB via REST API (Vercel Serverless)
// Includes Firebase Auth token in every request.
// ===================================================================

import { auth, isFirebaseConfigured } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function getAuthHeaders() {
  if (!isFirebaseConfigured || !auth || !auth.currentUser) {
    // Dev mode — send a dev token
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    };
  }
  const token = await auth.currentUser.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
    // Merge any custom headers (but auth always present)
    ...(options.body ? { body: options.body } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

// ===== Clothing CRUD =====

export async function addClothing(clothingData) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/clothes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(clothingData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to add clothing');
  }
  const item = await res.json();
  return item.id;
}

export async function getAllClothing() {
  return apiFetch('/clothes');
}

// Lightweight version — excludes full-resolution images for fast grid loading
export async function getAllClothingSummary() {
  return apiFetch('/clothes/summary');
}

// Batch fetch multiple clothing items by IDs in a single request
export async function getClothingBatch(ids) {
  if (!ids || ids.length === 0) return [];
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/clothes/batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to batch fetch clothing');
  }
  return res.json();
}

export async function getClothingById(id) {
  try {
    return await apiFetch(`/clothes/${id}`);
  } catch {
    return null;
  }
}

export async function updateClothing(id, updates) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/clothes/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to update clothing');
  }
  return res.json();
}

export async function deleteClothing(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/clothes/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to delete clothing');
  }
  return res.json();
}

export async function getClothingCount() {
  const data = await apiFetch('/clothes/count');
  return data.count;
}

// ===== Outfit CRUD =====

export async function saveOutfit(outfitData) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/outfits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(outfitData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to save outfit');
  }
  const outfit = await res.json();
  return outfit.id;
}

export async function getAllOutfits() {
  return apiFetch('/outfits');
}

export async function deleteOutfit(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/outfits/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to delete outfit');
  }
  return res.json();
}

// ===== Settings =====

export async function setSetting(key, value) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/settings/${key}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to set setting');
  }
  return res.json();
}

export async function getSetting(key) {
  const data = await apiFetch(`/settings/${key}`);
  return data.value;
}

// ===== Helpers =====

export async function clearAllData() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/data`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to clear data');
  }
  return res.json();
}

// Convert a File/Blob to a base64 data URL for storage
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Create a thumbnail from an image data URL
export function createThumbnail(dataUrl, maxSize = 480) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
  });
}
