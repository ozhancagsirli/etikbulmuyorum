import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/authStore';

const API = import.meta.env.VITE_API_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuthStore();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '' });
  const googleBtnRef = useRef(null);

  useEffect(() => {
    function initGoogle() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try { await loginWithGoogle(credential); toast.success('Hoş geldiniz!'); navigate('/'); }
          catch (e) { toast.error(e.message); }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline', size: 'large', text: 'signin_with', locale: 'tr', width: 360,
      });
    }
    if (window.google) initGoogle();
    else {
      const t = setInterval(() => { if (window.google) { initGoogle(); clearInterval(t); } }, 200);
      return () => clearInterval(t);
    }
  }, []);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (tab === 'register' && form.password !== form.password2) return toast.error('Şifreler eşleşmiyor.');
    if (tab === 'register' && form.password.length < 6) return toast.error('Şifre en az 6 karakter olmalı.');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/${tab === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu.');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      useAuthStore.setState({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast.success(tab === 'login' ? 'Hoş geldiniz!' : 'Hesabınız oluşturuldu!');
      navigate('/');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const inp = (extra = {}) => ({
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
    color: '#111827', transition: 'border-color 0.15s, background 0.15s',
    ...extra,
  });

  return (
    <div style={{ maxWidth: 400, margin: '48px auto', padding: '0 16px' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 20, letterSpacing: -0.4 }}>
          <span style={{ fontSize: 28 }}>⚖️</span>
          <span style={{ color: '#dc2626' }}>etik</span><span style={{ color: '#111827' }}>bulmuyorum</span>
        </Link>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          {tab === 'login' ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Google */}
        <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }} />
        </div>

        {/* Ayraç */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px' }}>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>veya</span>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', margin: '0 24px', background: '#f9fafb', borderRadius: 10, padding: 4 }}>
          {[['login', 'Giriş Yap'], ['register', 'Kayıt Ol']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: tab === key ? 700 : 500,
              color: tab === key ? '#dc2626' : '#6b7280',
              background: tab === key ? 'white' : 'transparent',
              boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ad Soyad</label>
              <input value={form.name} onChange={set('name')} placeholder="Adınızı girin" required
                style={inp()}
                onFocus={e => { e.target.style.borderColor='#dc2626'; e.target.style.background='white'; }}
                onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="ornek@email.com" required
              style={inp()}
              onFocus={e => { e.target.style.borderColor='#dc2626'; e.target.style.background='white'; }}
              onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Şifre</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder={tab === 'register' ? 'En az 6 karakter' : 'Şifrenizi girin'} required
                style={inp({ paddingRight: 42 })}
                onFocus={e => { e.target.style.borderColor='#dc2626'; e.target.style.background='white'; }}
                onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Şifre Tekrar</label>
              <input type="password" value={form.password2} onChange={set('password2')} placeholder="Şifrenizi tekrar girin" required
                style={inp()}
                onFocus={e => { e.target.style.borderColor='#dc2626'; e.target.style.background='white'; }}
                onBlur={e => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; }}
              />
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 10, border: 'none',
            background: loading ? '#e5e7eb' : '#dc2626',
            color: loading ? '#9ca3af' : 'white',
            fontWeight: 700, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(255,69,0,0.3)',
            transition: 'all 0.15s', marginTop: 4,
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background='#e03d00'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background='#dc2626'; }}
          >
            {loading ? 'Bekleyin...' : tab === 'login' ? '→ Giriş Yap' : '→ Hesap Oluştur'}
          </button>

          {tab === 'login' && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              Hesabınız yok mu?{' '}
              <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Kayıt Ol
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
