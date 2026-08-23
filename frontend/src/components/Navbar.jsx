import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuthStore();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) return;
    function initGoogle() {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try { await loginWithGoogle(credential); toast.success('Hoş geldiniz!'); }
          catch (e) { toast.error(e.message); }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline', size: 'medium', text: 'signin_with', locale: 'tr',
      });
    }
    if (window.google) initGoogle();
    else {
      const t = setInterval(() => { if (window.google) { initGoogle(); clearInterval(t); } }, 200);
      return () => clearInterval(t);
    }
  }, [user]);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) { navigate('/?search=' + encodeURIComponent(search.trim())); setSearch(''); }
  }

  return (
    <nav style={{
      background: '#fafafa',
      borderBottom: '1px solid #e5e7eb',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderBottom: '1px solid #e5e7eb',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 14 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ background: '#FF4500', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 6px rgba(255,69,0,0.3)' }}>⚖️</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.5, color: '#111827' }}>etikbulmuyorum</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, letterSpacing: 0.2 }}>Etik mi, değil mi?</div>
          </div>
        </Link>

        {/* Arama */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 440 }}>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Olay, marka veya konu ara..."
              style={{
                width: '100%', padding: '8px 38px 8px 14px',
                borderRadius: 25, border: '1.5px solid #e5e7eb',
                background: '#f9fafb', color: '#111827',
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#FF4500'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
            />
            <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 0 }}>🔍</button>
          </div>
        </form>

        {/* Sağ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {user ? (
            <>
              <Link to="/bildir" style={{
                background: '#FF4500', color: 'white', padding: '7px 16px',
                borderRadius: 25, fontWeight: 700, fontSize: 13, flexShrink: 0,
                boxShadow: '0 2px 6px rgba(255,69,0,0.3)',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='#e03d00'; }}
                onMouseLeave={e => { e.currentTarget.style.background='#FF4500'; }}
              >
                + Olay Bildir
              </Link>

              {(user.role === 'moderator' || user.role === 'admin') && (
                <Link to="/moderasyon" style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb' }}>
                  🛡 Mod
                </Link>
              )}

              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(m => !m)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: '#f4f5f7', border: '1.5px solid #e5e7eb',
                  borderRadius: 25, padding: '5px 12px 5px 5px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#FF4500'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#e5e7eb'}
                >
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                    : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user.name?.[0]?.toUpperCase()}</div>
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{user.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>▼</span>
                </button>

                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 46, background: '#f4f5f7', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, overflow: 'hidden', zIndex: 200 }}
                    onClick={() => setMenuOpen(false)}>
                    <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}>
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{user.name?.[0]?.toUpperCase()}</div>
                      }
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name?.split(' ')[0]}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Profili Görüntüle</div>
                      </div>
                    </Link>
                    <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>📢 Olay Bildir</Link>
                    {(user.role === 'moderator' || user.role === 'admin') && (
                      <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>🛡 Moderasyon</Link>
                    )}
                    <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>
                      🚪 Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div ref={btnRef} />
              <Link to="/giris" style={{ color: '#374151', fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 25, border: '1.5px solid #e5e7eb', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#FF4500'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#e5e7eb'}
              >
                Giriş Yap
              </Link>
              <Link to="/giris?tab=register" style={{ background: '#FF4500', color: 'white', fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 25, boxShadow: '0 2px 6px rgba(255,69,0,0.25)' }}>
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
