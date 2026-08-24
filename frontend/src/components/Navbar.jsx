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
  const [mobileSearch, setMobileSearch] = useState(false);

  useEffect(() => {
    if (user) return;
    function initGoogle() {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try { await loginWithGoogle(credential); toast.success('Hos geldiniz!'); }
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
    if (search.trim()) { navigate('/?search=' + encodeURIComponent(search.trim())); setSearch(''); setMobileSearch(false); }
  }

  return (
    <>
      <nav style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ background: '#FF4500', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚖️</div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.5, color: '#111827' }}>etikbulmuyorum</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500 }}>Etik mi, değil mi?</div>
            </div>
          </Link>

          {/* Arama — desktop */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 400, display: 'none' }} className="desktop-search">
            <div style={{ position: 'relative' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Olay, marka veya konu ara..."
                style={{ width: '100%', padding: '7px 36px 7px 12px', borderRadius: 20, border: '1.5px solid #e5e7eb', background: '#f9fafb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor='#FF4500'; e.target.style.background='white'; }}
                onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; }}
              />
              <button type="submit" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 0 }}>🔍</button>
            </div>
          </form>

          {/* Sağ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
            {/* Mobil arama */}
            <button onClick={() => setMobileSearch(s => !s)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280', padding: '4px' }}>🔍</button>

            {user ? (
              <>
                <Link to="/bildir" style={{ background: '#FF4500', color: 'white', padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: '0 2px 6px rgba(255,69,0,0.3)' }}>
                  + Bildir
                </Link>

                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '4px 10px 4px 4px', cursor: 'pointer' }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                  </button>

                  {menuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 42, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden', zIndex: 200 }}
                      onClick={() => setMenuOpen(false)}>
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user.name?.[0]?.toUpperCase()}</div>}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name?.split(' ')[0]}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>Profil</div>
                        </div>
                      </Link>
                      <Link to="/bildir" style={{ display: 'block', padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>📢 Olay Bildir</Link>
                      {(user.role === 'moderator' || user.role === 'admin') && (
                        <Link to="/moderasyon" style={{ display: 'block', padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>🛡 Moderasyon</Link>
                      )}
                      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>
                        🚪 Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div ref={btnRef} style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }} />
                <Link to="/giris?tab=register" style={{ background: '#FF4500', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 20 }}>
                  Kayıt
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobil arama kutusu */}
        {mobileSearch && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid #f3f4f6', background: 'white' }}>
            <form onSubmit={handleSearch}>
              <div style={{ position: 'relative' }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Olay, marka veya konu ara..."
                  style={{ width: '100%', padding: '9px 36px 9px 14px', borderRadius: 20, border: '1.5px solid #FF4500', background: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#FF4500', fontSize: 16, padding: 0 }}>🔍</button>
              </div>
            </form>
          </div>
        )}
      </nav>

      <style>{`
        @media (min-width: 640px) {
          .desktop-search { display: block !important; }
        }
      `}</style>
    </>
  );
}
