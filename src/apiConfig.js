// Centralized API base configuration
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
    ...options,
  });
  if (!resp.ok) {
    let detail;
    try { detail = await resp.text(); } catch { /* ignore */ }
    throw new Error(`API ${resp.status} ${resp.statusText}${detail ? ' - '+detail.slice(0,180) : ''}`);
  }
  const ct = resp.headers.get('content-type')||'';
  if (ct.includes('application/json')) return resp.json();
  return resp.text();
}
