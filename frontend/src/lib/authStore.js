import { create } from 'zustand';

const API = import.meta.env.VITE_API_URL;

export const useAuthStore = create((set, get) => ({
  user:         null,
  accessToken:  localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading:      true,

  // Called after Google sign-in returns idToken
  async loginWithGoogle(idToken) {
    const res = await fetch(`${API}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Giriş başarısız.');
    }
    const data = await res.json();
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
  },

  async fetchMe() {
    const token = get().accessToken;
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        set({ user, loading: false });
      } else {
        await get().refreshAccessToken();
      }
    } catch {
      set({ loading: false });
    }
  },

  async refreshAccessToken() {
    const refreshToken = get().refreshToken;
    if (!refreshToken) { set({ loading: false, user: null }); return; }
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem('accessToken',  data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      await get().fetchMe();
    } catch {
      get().logout();
    }
  },

  async logout() {
    const refreshToken = get().refreshToken;
    const accessToken  = get().accessToken;
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch { /* best-effort */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
