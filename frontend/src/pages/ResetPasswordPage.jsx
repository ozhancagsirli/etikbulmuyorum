import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
      toast.success('Email gönderildi!');
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    if (password !== password2) return toast.error('Şifreler eşleşmiyor.');
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      toast.success('Şifreniz güncellendi!');
      navigate('/giris');
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '32px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
            {token ? 'Yeni Şifre Belirle' : 'Şifremi Unuttum'}
          </h1>
        </div>

        {token ? (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Yeni şifre" required minLength={6} style={inp} />
            <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
              placeholder="Şifre tekrar" required style={inp} />
            <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        ) : sent ? (
          <div style={{ textAlign: 'center', color: '#46A53E', fontWeight: 600 }}>
            ✅ Email gönderildi! Gelen kutunuzu kontrol edin.
          </div>
        ) : (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Email adresinizi girin, şifre sıfırlama linki gönderelim.</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email adresiniz" required style={inp} />
            <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {loading ? 'Gönderiliyor...' : 'Link Gönder'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
