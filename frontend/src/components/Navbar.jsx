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
      {/* Ana Navbar */}
      <nav style={{ background: 'white', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 100, display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 64, width: 'auto' }} />
          </Link>

          {/* Sağ taraf */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
            <div id="google-btn" style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }} />

            {user ? (
              <>
                <Link to="/bildir" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#46A53E', color: 'white',
                  padding: '9px 18px', borderRadius: 8,
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  <Plus size={15} /> Olay Bildir
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'white', border: '1.5px solid #e5e7eb',
                    borderRadius: 8, padding: '7px 12px 7px 7px', cursor: 'pointer',
                  }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                      : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#46A53E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} color="#9ca3af" />
                  </button>

                  {menuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 46, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, overflow: 'hidden', zIndex: 200 }}
                      onClick={() => setMenuOpen(false)}>
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', color: '#374151', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} /> : <User size={20} color="#9ca3af" />}
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{user.name?.split(' ')[0]}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Profil</div></div>
                      </Link>
                      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                        <Plus size={15} color="#6b7280" /> Olay Bildir
                      </Link>
                      {(user.role === 'moderator' || user.role === 'admin') && (
                        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                          <Shield size={15} color="#6b7280" /> Moderasyon
                        </Link>
                      )}
                      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#013C26', fontSize: 13, cursor: 'pointer' }}>
                        <LogOut size={15} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/giris" style={{ color: '#374151', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', whiteSpace: 'nowrap' }}>Giriş Yap</Link>
                <Link to="/giris?tab=register" style={{ background: '#46A53E', color: 'white', fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 8, whiteSpace: 'nowrap' }}>Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* İstatistik bandı */}
      <div style={{ background: '#013C26', padding: '0 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 50, display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#4BAB42' }}>
                {stats ? Number(stats.totals.total_incidents).toLocaleString('tr') : '—'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>toplam bildirim</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#4BAB42' }}>
                {stats ? Number(stats.totals.total_votes).toLocaleString('tr') : '—'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>değerlendirme</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#4BAB42' }}>
                {stats ? Number(stats.totals.total_users).toLocaleString('tr') : '—'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>kullanıcı</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            Hesap Vakti
          </div>
        </div>
      </div>
    </>
  );
}
