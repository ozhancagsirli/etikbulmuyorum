import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';
import NotificationBell from './NotificationBell';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

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
    }
    if (window.google) initGoogle();
    else { const t = setInterval(() => { if (window.google) { initGoogle(); clearInterval(t); } }, 200); return () => clearInterval(t); }
  }, [user]);

  return (
    <>
      <div id="google-btn" style={{ display: 'none' }} />
      <style>{`
        @media(max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
        @media(min-width: 641px) {
          .nav-mobile-btn { display: none !important; }
          .nav-desktop { display: flex !important; }
        }
      `}</style>

      <nav style={{ background: 'white', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 14px', height: 54, display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0 }}>
            <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 24, width: 'auto' }} />
          </Link>

          {/* Desktop: Arama */}
          <form className="nav-desktop" onSubmit={e => { e.preventDefault(); if (search.trim()) navigate('/?search=' + encodeURIComponent(search.trim())); }}
            style={{ flex: 1, maxWidth: 300 }}>
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 50, alignItems: 'center', padding: '0 14px', border: '1px solid #e2e8f0', height: 36 }}>
              <span style={{ color: '#94a3b8', fontSize: 13, marginRight: 8 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="@kullanıcı adı ara..."
                style={{ flex: 1, fontSize: 13, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
            </div>
          </form>

          {/* Desktop: Sağ butonlar */}
          <div className="nav-desktop" style={{ marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
            {!user ? (
              <>
                <Link to="/bildir" style={{ fontSize: 13, color: '#374151', padding: '7px 14px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>✏️ Görüş Bildir</Link>
                <Link to="/giris" style={{ fontSize: 13, color: '#374151', padding: '7px 14px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>Giriş Yap</Link>
                <Link to="/giris?tab=register" style={{ fontSize: 13, color: 'white', background: '#013C26', padding: '7px 14px', borderRadius: 50, fontWeight: 700, whiteSpace: 'nowrap' }}>Kayıt Ol</Link>
              </>
            ) : (
              <>
                <Link to="/bildir" style={{ fontSize: 13, color: '#374151', padding: '7px 14px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>✏️ Görüş Bildir</Link>
                {user.instagram_verified
                  ? <Link to="/dashboard" style={{ fontSize: 13, color: 'white', background: '#013C26', padding: '7px 14px', borderRadius: 50, fontWeight: 700, whiteSpace: 'nowrap' }}>🌟 Sayfam</Link>
                  : <Link to="/profil-olustur" style={{ fontSize: 13, color: '#92400e', background: '#fffbeb', padding: '7px 14px', borderRadius: 50, border: '1px solid #fde68a', fontWeight: 700, whiteSpace: 'nowrap' }}>🌟 Profilini Oluştur</Link>
                }
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#46A53E', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, overflow: 'hidden', flexShrink: 0 }}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
                  </button>
                  {menuOpen && <DropdownMenu user={user} logout={logout} navigate={navigate} close={() => setMenuOpen(false)} />}
                </div>
              </>
            )}
          </div>

          {/* Mobile: Sağ */}
          <div className="nav-mobile-btn" style={{ marginLeft: 'auto', alignItems: 'center', gap: 8, display: 'none' }}>
            <Link to="/bildir" style={{ width: 36, height: 36, borderRadius: 50, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✏️</Link>
            {user ? (
              <>
                <NotificationBell />
                <button onClick={() => setMobileOpen(m => !m)} style={{ width: 36, height: 36, borderRadius: 50, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </>
            ) : (
              <>
                <Link to="/giris" style={{ fontSize: 12, color: '#374151', padding: '7px 12px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>Giriş</Link>
                <Link to="/giris?tab=register" style={{ fontSize: 12, color: 'white', background: '#013C26', padding: '7px 12px', borderRadius: 50, fontWeight: 700, whiteSpace: 'nowrap' }}>Kayıt</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menü */}
        {mobileOpen && user && (
          <div style={{ borderTop: '1px solid #f1f5f9', background: 'white', padding: '8px 0' }} onClick={() => setMobileOpen(false)}>
            <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14 }}>
              <User size={16} color="#9ca3af" /> Profil
            </Link>
            {user.instagram_verified
              ? <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14 }}>🌟 Sayfam</Link>
              : <Link to="/profil-olustur" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#92400e', fontSize: 14, background: '#fffbeb' }}>🌟 Profilini Oluştur</Link>
            }
            <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14 }}>✏️ Görüş Bildir</Link>
            {(user.role === 'moderator' || user.role === 'admin') && (
              <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 14 }}>🛡 Moderasyon</Link>
            )}
            <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#dc2626', fontSize: 14, cursor: 'pointer' }}>
              <LogOut size={16} /> Çıkış Yap
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

function DropdownMenu({ user, logout, navigate, close }) {
  return (
    <div style={{ position: 'fixed', right: 16, top: 62, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 220, overflow: 'hidden', zIndex: 1000 }}
      onClick={close}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#46A53E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, overflow: 'hidden', flexShrink: 0 }}>
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.instagram_username ? '@' + user.instagram_username : user.email}</div>
        </div>
      </div>
      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
        <User size={14} color="#9ca3af" /> Profil
      </Link>
      {user.instagram_verified && (
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>🌟 Sayfam</Link>
      )}
      {!user.instagram_verified && (
        <Link to="/profil-olustur" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#92400e', fontSize: 13, borderBottom: '1px solid #f3f4f6', background: '#fffbeb' }}>🌟 Profilini Oluştur</Link>
      )}
      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>✏️ Görüş Bildir</Link>
      {(user.role === 'moderator' || user.role === 'admin') && (
        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>🛡 Moderasyon</Link>
      )}
      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>
        <LogOut size={14} /> Çıkış Yap
      </button>
    </div>
  );
}
