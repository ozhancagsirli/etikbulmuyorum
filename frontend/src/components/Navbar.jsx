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
      <div style={{ background: '#013C26', padding: '7px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#4BAB42' }}>
            {stats ? Number(stats.totals.total_incidents).toLocaleString('tr') : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>bildirim</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#4BAB42' }}>
            {stats ? Number(stats.totals.total_votes).toLocaleString('tr') : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>değerlendirme</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#4BAB42' }}>
            {stats ? Number(stats.totals.total_users).toLocaleString('tr') : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>kullanıcı</span>
        </div>
      </div>

      {/* Ana Navbar */}
      <nav style={{ background: 'white', position: 'relative', zIndex: 10, borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 32, width: 'auto', maxWidth: 140 }} />
          </Link>

          {/* Sağ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            {user ? (
              <>
                <Link to="/bildir" style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#46A53E', color: 'white',
                  padding: '8px 14px', borderRadius: 8,
                  fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  <Plus size={14} /> Bildir
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'white', border: '1.5px solid #e5e7eb',
                    borderRadius: 8, padding: '6px 10px 6px 6px', cursor: 'pointer',
                  }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#46A53E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} color="#9ca3af" />
                  </button>

                  {menuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 44, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, overflow: 'hidden', zIndex: 200 }}
                      onClick={() => setMenuOpen(false)}>
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <User size={18} color="#9ca3af" />}
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{user.name?.split(' ')[0]}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Profil</div></div>
                      </Link>
                      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                        <Plus size={14} color="#9ca3af" /> Olay Bildir
                      </Link>
                      {(user.role === 'moderator' || user.role === 'admin') && (
                        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                          <Shield size={14} color="#9ca3af" /> Moderasyon
                        </Link>
                      )}
                      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>
                        <LogOut size={14} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div id="google-btn" style={{ transform: 'scale(0.8)', transformOrigin: 'right center' }} />
                <Link to="/giris" style={{ color: '#374151', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', whiteSpace: 'nowrap' }}>Giriş</Link>
                <Link to="/giris?tab=register" style={{ background: '#46A53E', color: 'white', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}>Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
