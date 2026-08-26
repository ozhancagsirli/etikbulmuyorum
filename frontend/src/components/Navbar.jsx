import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Shield, LogOut, ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';
import NotificationBell from './NotificationBell';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

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

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) { navigate('/?search=' + encodeURIComponent(search.trim())); setSearch(''); setMobileSearch(false); }
  }

  return (
    <>
      <nav style={{
        background: '#0a0a0a',
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid #1a1a1a',
        boxShadow: '0 1px 0 0 transparent',
      }}>
        {/* Gradient çizgi */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e8ff00 30%, #ff3333 70%, transparent)' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e8ff00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚖️</div>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 15, letterSpacing: -0.8, lineHeight: 1.1 }}>etikbulmuyorum</div>
              <div style={{ color: '#3d3d3d', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Hesap Vakti</div>
            </div>
          </Link>

          {/* Arama desktop */}
          <form onSubmit={handleSearch} id="desktop-search" style={{ flex: 1, maxWidth: 400, display: 'none', position: 'relative' }}>
            <Search size={14} color="#444" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kişi veya firma ara..."
              style={{ width: '100%', padding: '9px 16px 9px 36px', borderRadius: 6, border: '1px solid #1e1e1e', background: '#141414', color: '#ccc', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#e8ff00'}
              onBlur={e => e.target.style.borderColor = '#1e1e1e'}
            />
          </form>

          {/* Sağ */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* Mobil arama */}
            <button onClick={() => setMobileSearch(s => !s)} id="mobile-search-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'none', alignItems: 'center' }}>
              {mobileSearch ? <X size={20} color="#ccc" /> : <Search size={20} color="#555" />}
            </button>

            {user ? (
              <>
                <Link to="/bildir" style={{ background: '#e8ff00', color: '#0a0a0a', padding: '9px 18px', borderRadius: 6, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  Olay Bildir
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#141414', border: '1px solid #222', borderRadius: 6, padding: '7px 12px 7px 7px', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#e8ff00'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                  >
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e8ff00', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ccc', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} color="#444" />
                  </button>

                  {menuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 46, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden', zIndex: 200 }}
                      onClick={() => setMenuOpen(false)}>
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', color: '#0a0a0a', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} /> : <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e8ff00', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{user.name?.[0]?.toUpperCase()}</div>}
                        <div><div style={{ fontWeight: 700, fontSize: 13 }}>{user.name?.split(' ')[0]}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Profil</div></div>
                      </Link>
                      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                        <Plus size={14} color="#9ca3af" /> Olay Bildir
                      </Link>
                      {(user.role === 'moderator' || user.role === 'admin') && (
                        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                          <Shield size={14} color="#9ca3af" /> Moderasyon
                        </Link>
                      )}
                      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>
                        <LogOut size={14} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div id="google-btn" style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }} />
                <div style={{ width: 1, height: 20, background: '#222' }} />
                <Link to="/giris" style={{ color: '#555', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Giriş Yap</Link>
                <Link to="/giris?tab=register" style={{ background: '#e8ff00', color: '#0a0a0a', fontSize: 13, fontWeight: 800, padding: '9px 18px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobil arama */}
        {mobileSearch && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #1a1a1a', background: '#0a0a0a' }}>
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
              <Search size={14} color="#444" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Kişi veya firma ara..."
                style={{ width: '100%', padding: '10px 16px 10px 36px', borderRadius: 6, border: '1px solid #e8ff00', background: '#141414', color: '#ccc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </form>
          </div>
        )}
      </nav>

      <style>{`
        @media (min-width: 640px) { #desktop-search { display: block !important; } #mobile-search-btn { display: none !important; } }
        @media (max-width: 639px) { #mobile-search-btn { display: flex !important; } }
      `}</style>
    </>
  );
}
