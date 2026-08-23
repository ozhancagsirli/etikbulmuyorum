// Wraps fetch with automatic JWT injection and token refresh
const API = import.meta.env.VITE_API_URL;

export async function apiFetch(path, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  let res = await fetch(`${API}${path}`, { ...options, headers });

  // Try token refresh once on 401
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const rRes = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (rRes.ok) {
        const { accessToken: newAccess, refreshToken: newRefresh } = await rRes.json();
        localStorage.setItem('accessToken',  newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        headers.Authorization = `Bearer ${newAccess}`;
        res = await fetch(`${API}${path}`, { ...options, headers });
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}
