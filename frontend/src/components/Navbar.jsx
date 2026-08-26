import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Shield, LogOut, User, ChevronDown, X, Bell } from 'lucide-react';
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
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ background: '#dc2626', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(220,38,38,0.4)' }}>
              <span style={{ fontSize: 18 }}>⚖️</span>
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.5, color: 'white' }}>etikbulmuyorum</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>Güvenilir mi, değil mi?</div>
            </div>
          </Link>

          {/* Arama — desktop */}
          <form onSubmit={handleSearch} id="desktop-search" style={{ flex: 1, maxWidth: 420, display: 'none' }}>
            <div style={{ position: 'relative' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kişi, firma veya olay ara..."
                style={{ width: '100%', padding: '8px 38px 8px 14px', borderRadius: 25, border: '1.5px solid #334155', background: '#1e293b', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor='#dc2626'; }}
                onBlur={e => { e.target.style.borderColor='#334155'; }}
              />
              <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <Search size={14} color="#64748b" />
              </button>
            </div>
          </form>

          {/* Sağ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <button onClick={() => setMobileSearch(s => !s)} id="mobile-search-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'none', alignItems: 'center' }}>
              {mobileSearch ? <X size={20} color="white" /> : <Search size={20} color="#94a3b8" />}
            </button>

            {user ? (
              <>
                <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#dc2626', color: 'white', padding: '7px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, flexShrink: 0, boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                  <Plus size={14} /> Olay Bildir
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1e293b', border: '1.5px solid #334155', borderRadius: 25, padding: '5px 12px 5px 5px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='#334155'}
                  >
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #334155' }} />
                      : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} color="#64748b" />
                  </button>

                  {menuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 46, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 200, overflow: 'hidden', zIndex: 200 }}
                      onClick={() => setMenuOpen(false)}>
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', color: '#0f172a', fontSize: 14, borderBottom: '1px solid #f1f5f9' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{user.name?.[0]?.toUpperCase()}</div>}
                        <div><div style={{ fontWeight: 600, fontSize: 14 }}>{user.name?.split(' ')[0]}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Profil</div></div>
                      </Link>
                      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', color: '#334155', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                        <Plus size={15} color="#64748b" /> Olay Bildir
                      </Link>
                      {(user.role === 'moderator' || user.role === 'admin') && (
                        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', color: '#334155', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                          <Shield size={15} color="#64748b" /> Moderasyon
                        </Link>
                      )}
                      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>
                        <LogOut size={15} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div id="google-btn" style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }} />
                <Link to="/giris" style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 20, border: '1.5px solid #334155', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='white'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#334155'; e.currentTarget.style.color='#94a3b8'; }}
                >Giriş</Link>
                <Link to="/giris?tab=register" style={{ background: '#dc2626', color: 'white', fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 20, boxShadow: '0 2px 8px rgba(220,38,38,0.3)', whiteSpace: 'nowrap' }}>
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobil arama */}
        {mobileSearch && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
            <form onSubmit={handleSearch}>
              <div style={{ position: 'relative' }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Kişi, firma veya olay ara..."
                  style={{ width: '100%', padding: '10px 38px 10px 14px', borderRadius: 25, border: '1.5px solid #dc2626', background: '#1e293b', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <Search size={16} color="#dc2626" />
                </button>
              </div>
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
