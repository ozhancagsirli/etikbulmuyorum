import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Shield, LogOut, User, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';
import NotificationBell from './NotificationBell';
import { apiFetch } from '../lib/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) return;
    function initGoogle() {
      const el = document.getElementById('google-btn');
      if (!window.google || !el) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try { await loginWithGoogle(credential); toast.success('Hoş geldiniz!'); }
          catch (e) { toast.error(e.message); }
        },
      });
      window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'medium', text: 'signin_with', locale: 'tr' });
    }
    if (window.google) initGoogle();
    else { const t = setInterval(() => { if (window.google) { initGoogle(); clearInterval(t); } }, 200); return () => clearInterval(t); }
  }, [user]);

  return (
    <>
      {/* İstatistik bandı */}
      <div style={{ background: '#013C26', padding: '8px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#4BAB42' }}>{stats ? Number(stats.totals.total_incidents).toLocaleString('tr') : '—'}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>bildirim</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#4BAB42' }}>{stats ? Number(stats.totals.total_votes).toLocaleString('tr') : '—'}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>değerlendirme</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#4BAB42' }}>{stats ? Number(stats.totals.total_users).toLocaleString('tr') : '—'}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>kullanıcı</span>
        </div>
      </div>
