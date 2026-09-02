import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Shield, LogOut, User, ChevronDown, Search } from 'lucide-react';
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
      <nav style={{ background: 'white', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          
          <Link to="/" style={{ flexShrink: 0 }}>
            <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 26, width: 'auto' }} />
          </Link>

          {/* Arama */}
          <form onSubmit={e => { e.preventDefault(); if (search.trim()) navigate('/?search=' + encodeURIComponent(search.trim())); }}
            style={{ flex: 1, maxWidth: 360 }}>
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 50, alignItems: 'center', padding: '0 14px', border: '1px solid #e2e8f0' }}>
              <Search size={13} color="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="@kullanıcı adı ara..."
                style={{ flex: 1, padding: '8px 0', fontSize: 13, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
            </div>
          </form>

          {/* Sağ */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {user ? (
              <>
                <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#013C26', color: 'white', padding: '8px 16px', borderRadius: 50, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                  <Plus size={14} /> Bildir
                </Link>
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e2e8f0', borderRadius: 50, padding: '5px 10px 5px 5px', cursor: 'pointer' }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                      : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#46A53E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{user.name?.[0]?.toUpperCase()}</div>
                    }
                    <span className="hide-mobile" style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} color="#9ca3af" />
                  </button>

                  {menuOpen && (
                    <div style={{ position: 'fixed', right: 16, top: 64, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 220, overflow: 'hidden', zIndex: 1000 }}
                      onClick={() => setMenuOpen(false)}>
                      {user.instagram_verified && (
                        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                          <span>🌟</span>
                          <div><div style={{ fontWeight: 600 }}>Sayfam</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Skor ve bildirimler</div></div>
                        </Link>
                      )}
                      <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#374151', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <User size={18} color="#9ca3af" />}
                        <div><div style={{ fontWeight: 600 }}>{user.name?.split(' ')[0]}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Profil</div></div>
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
                <Link to="/giris" style={{ color: '#374151', fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 50, border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Giriş</Link>
                <Link to="/giris?tab=register" style={{ background: '#46A53E', color: 'white', fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 50, whiteSpace: 'nowrap' }}>Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <style>{`@media (max-width: 480px) { .hide-mobile { display: none !important; } }`}</style>
    </>
  );
}
