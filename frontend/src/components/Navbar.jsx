import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';
import NotificationBell from './NotificationBell';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
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
        @media(max-width:640px){
          .nav-search{max-width:140px !important;}
          .nav-btn-text{display:none !important;}
          .nav-extra{display:none !important;}
        }
        @media(max-width:480px){
          .nav-search{display:none !important;}
        }
      `}</style>
      <nav style={{ background: 'white', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0 }}>
            <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 26, width: 'auto' }} />
          </Link>

          {/* Arama */}
          <form onSubmit={e => { e.preventDefault(); if (search.trim()) navigate('/?search=' + encodeURIComponent(search.trim())); }}
            className="nav-search" style={{ flex: 1, maxWidth: 320 }}>
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 50, alignItems: 'center', padding: '0 14px', border: '1px solid #e2e8f0', height: 36 }}>
              <span style={{ color: '#94a3b8', fontSize: 13, marginRight: 8 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="@kullanıcı adı ara..."
                style={{ flex: 1, fontSize: 13, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
            </div>
          </form>

          {/* Sağ */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

            {!user ? (
              // Giriş yapılmamış
              <>
                <Link to="/bildir" style={{ fontSize: 13, color: '#374151', padding: '7px 16px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  ✏️ <span className="nav-btn-text">Görüş Bildir</span>
                </Link>
                <Link to="/giris" className="nav-extra" style={{ fontSize: 13, color: '#374151', padding: '7px 16px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Giriş Yap
                </Link>
                <Link to="/giris?tab=register" style={{ fontSize: 13, color: 'white', background: '#013C26', padding: '7px 16px', borderRadius: 50, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Kayıt Ol
                </Link>
              </>
            ) : user.instagram_verified ? (
              // Giriş yapılmış + Instagram doğrulandı
              <>
                <Link to="/bildir" style={{ fontSize: 13, color: '#374151', padding: '7px 16px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  ✏️ <span className="nav-btn-text">Görüş Bildir</span>
                </Link>
                <Link to="/dashboard" style={{ fontSize: 13, color: 'white', background: '#013C26', padding: '7px 16px', borderRadius: 50, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  🌟 <span className="nav-btn-text">Sayfam</span>
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#46A53E', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, overflow: 'hidden' }}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
                  </button>
                  {menuOpen && <DropdownMenu user={user} logout={logout} navigate={navigate} close={() => setMenuOpen(false)} />}
                </div>
              </>
            ) : (
              // Giriş yapılmış, Instagram yok
              <>
                <Link to="/bildir" style={{ fontSize: 13, color: '#374151', padding: '7px 16px', borderRadius: 50, border: '1px solid #e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  ✏️ <span className="nav-btn-text">Görüş Bildir</span>
                </Link>
                <Link to="/profil-olustur" style={{ fontSize: 13, color: '#92400e', background: '#fffbeb', padding: '7px 16px', borderRadius: 50, border: '1px solid #fde68a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  🌟 <span className="nav-btn-text">Profilini Oluştur</span>
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#46A53E', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, overflow: 'hidden' }}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
                  </button>
                  {menuOpen && <DropdownMenu user={user} logout={logout} navigate={navigate} close={() => setMenuOpen(false)} />}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function DropdownMenu({ user, logout, navigate, close }) {
  return (
    <div style={{ position: 'fixed', right: 16, top: 62, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 220, overflow: 'hidden', zIndex: 1000 }}
      onClick={close}>
      {/* Kullanıcı bilgisi */}
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
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 14 }}>🌟</span> Sayfam
        </Link>
      )}
      {!user.instagram_verified && (
        <Link to="/profil-olustur" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#92400e', fontSize: 13, borderBottom: '1px solid #f3f4f6', background: '#fffbeb' }}>
          <span style={{ fontSize: 14 }}>🌟</span> Profilini Oluştur
        </Link>
      )}
      <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: 14 }}>✏️</span> Görüş Bildir
      </Link>
      {(user.role === 'moderator' || user.role === 'admin') && (
        <Link to="/moderasyon" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 14 }}>🛡</span> Moderasyon
        </Link>
      )}
      <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>
        <LogOut size={14} /> Çıkış Yap
      </button>
    </div>
  );
}
