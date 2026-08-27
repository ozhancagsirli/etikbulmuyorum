import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Scale, Plus, Shield, LogOut, User, ChevronDown } from 'lucide-react';
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
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'relative', zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ background: '#FF4500', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={18} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.5, color: '#111827' }}>etikbulmuyorum</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500 }}>Güvenilir mi, değil mi?</div>
            </div>
          </Link>

          <form onSubmit={handleSearch} id="desktop-search" style={{ flex: 1, maxWidth: 400, display: 'none' }}>
            <div style={{ position: 'relative' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Olay, marka veya konu ara..."
                style={{ width: '100%', padding: '7px 36px 7px 12px', borderRadius: 20, border: '1.5px solid #e5e7eb', background: '#f9fafb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor='#FF4500'; e.target.style.background='white'; }}
                onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; }}
              />
              <button type="submit" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <Search size={14} color="#9ca3af" />
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
            <button onClick={() => setMobileSearch(s => !s)} id="mobile-search-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', display: 'none', alignItems: 'center' }}>
              {mobileSearch ? <X size={20} /> : <Search size={20} />}
            </button>

            {user ? (
              <>
                <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FF4500', color: 'white', padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  <Plus size={14} /> Bildir
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '4px 10px 4px 4px', cursor: 'pointer' }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} color="#9ca3af" />
                  </button>
                  {menuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 42, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden', zIndex: 200 }}
                      onClick={() => setMenuOpen(false)}>
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <User size={20} color="#9ca3af" />}
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{user.name?.split(' ')[0]}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Profil</div></div>
                      </Link>
                      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                        <Plus size={15} color="#6b7280" /> Şikayet Ekle
                      </Link>
                      {(user.role === 'moderator' || user.role === 'admin') && (
                        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                          <Shield size={15} color="#6b7280" /> Moderasyon
                        </Link>
                      )}
                      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>
                        <LogOut size={15} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link to="/giris" style={{ color: '#374151', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, border: '1.5px solid #e5e7eb', whiteSpace: 'nowrap' }}>Giriş</Link>
                <Link to="/giris?tab=register" style={{ background: '#FF4500', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>Kayıt</Link>
              </div>
            )}
          </div>
        </div>

        {mobileSearch && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid #f3f4f6' }}>
            <form onSubmit={handleSearch}>
              <div style={{ position: 'relative' }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
                  style={{ width: '100%', padding: '9px 36px 9px 14px', borderRadius: 20, border: '1.5px solid #FF4500', background: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <Search size={16} color="#FF4500" />
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
