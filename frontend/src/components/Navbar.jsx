import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Shield, LogOut, User, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';
import NotificationBell from './NotificationBell';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuthStore();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);


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
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'relative', zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px', height: 120, display: 'flex', alignItems: 'center', gap: 10 }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 80, width: 'auto' }} />
            <div style={{ lineHeight: 1.1, display: 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.5, color: '#111827' }}>etikbulmuyorum</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500 }}>Güvenilir mi, değil mi?</div>
            </div>
          </Link>

          

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>


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


      </nav>
      <style>{`
        @media (min-width: 640px) { #desktop-search { display: block !important; } #mobile-search-btn { display: none !important; } }
        @media (max-width: 639px) { #mobile-search-btn { display: flex !important; } }
      `}</style>
    </>
  );
}
