import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';

export default function SubjectPage() {
  const [showAppeal, setShowAppeal] = useState(false);
  const [appeal, setAppeal] = useState({ name: '', email: '', message: '' });
  const [appealSent, setAppealSent] = useState(false);
  const { name } = useParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedName = decodeURIComponent(name);

  useEffect(() => {
    apiFetch('/incidents?subject=' + encodeURIComponent(decodedName) + '&limit=20')
      .then(data => { setIncidents(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  async function submitAppeal(e) {
    e.preventDefault();
    try {
      await apiFetch('/appeals', { method: 'POST', body: JSON.stringify({ subject_name: decodedName, ...appeal }) });
      setAppealSent(true);
    } catch (err) { alert(err.message); }
  }

  // Instagram bilgilerini ilk olaydan al
  const firstInc = incidents[0];
  const avatar = firstInc?.instagram_avatar || firstInc?.subject_avatar;
  const fullName = firstInc?.person_name || decodedName;
  const isVerified = firstInc?.instagram_verified;
  const followers = firstInc?.instagram_followers;
  const igUsername = firstInc?.instagram_username;

  const totalIncidents = incidents.length;
  const ts = incidents.length > 0 
    ? Math.round(incidents.reduce((a, i) => a + (i.trust_score || 0), 0) / incidents.length) 
    : 0;
  const tsColor = ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626';
  const tsBg = ts >= 50 ? '#f0fdf4' : ts >= -10 ? '#fffbeb' : '#fef2f2';
  const tsLabel = ts >= 50 ? 'Güvenilir' : ts >= -10 ? 'Dikkatli Ol' : 'Güvenilmez';
  const tsEmoji = ts >= 50 ? '😊' : ts >= -10 ? '😐' : '😠';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to="/" style={{ color: '#46A53E', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        ← Ana sayfaya dön
      </Link>

      {/* Instagram Profil Kartı */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
        
        {/* Üst banner */}
        <div style={{ height: 80, background: 'linear-gradient(135deg, #013C26 0%, #46A53E 100%)' }} />
        
        <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid white', background: '#e5e7eb', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {avatar 
                ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
              }
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#111827' }}>{fullName}</h1>
                {isVerified && <span style={{ fontSize: 16 }}>✅</span>}
              </div>
              {igUsername && (
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                  @{igUsername}
                  {followers > 0 && <span> · {Number(followers).toLocaleString('tr')} takipçi</span>}
                </div>
              )}
            </div>
          </div>

          {/* İstatistikler */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: '#f9fafb', borderRadius: 10, padding: '12px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{totalIncidents}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Bildirim</div>
            </div>
            {totalIncidents > 0 && (
              <div style={{ flex: 2, background: tsBg, borderRadius: 10, padding: '12px 16px', textAlign: 'center', border: `1px solid ${tsColor}30` }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: tsColor }}>{tsEmoji} {ts > 0 ? '+' : ''}{ts}</div>
                <div style={{ fontSize: 11, color: tsColor, fontWeight: 600, marginTop: 2 }}>{tsLabel}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* İtiraz */}
      {!showAppeal && !appealSent && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <button onClick={() => setShowAppeal(true)} style={{ fontSize: 12, color: '#9ca3af', background: 'white', border: '1px solid #e5e7eb', padding: '7px 16px', borderRadius: 8, cursor: 'pointer' }}>
            ⚖️ Bu kişiyim, itiraz etmek istiyorum
          </button>
        </div>
      )}

      {showAppeal && !appealSent && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>İtiraz Formu</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Bilgileriniz moderatörlerimiz tarafından incelenecek.</p>
          <form onSubmit={submitAppeal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={appeal.name} onChange={e => setAppeal(a => ({...a, name: e.target.value}))} placeholder="Adınız Soyadınız" required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }} />
            <input type="email" value={appeal.email} onChange={e => setAppeal(a => ({...a, email: e.target.value}))} placeholder="Email adresiniz" required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }} />
            <textarea value={appeal.message} onChange={e => setAppeal(a => ({...a, message: e.target.value}))} placeholder="İtiraz gerekçenizi açıklayın..." required rows={4} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAppeal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}>İptal</button>
              <button type="submit" style={{ flex: 2, padding: '10px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Gönder</button>
            </div>
          </form>
        </div>
      )}

      {appealSent && (
        <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: '14px 20px', marginBottom: 12, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
          ✅ İtirazınız alındı!
        </div>
      )}

      {/* Olaylar */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Yükleniyor...</div>
      ) : incidents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#9ca3af' }}>Bu kişi hakkında henüz bildirim yok.</p>
          <Link to="/bildir" style={{ color: '#46A53E', fontWeight: 600 }}>İlk bildirimi ekle →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
            {totalIncidents} bildirim
          </div>
          {incidents.map(inc => {
            const ts = inc.trust_score || 0;
            const tsColor = ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626';
            const images = inc.images || [];

            return (
              <Link key={inc.id} to={'/olay/' + inc.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', display: 'block', color: 'inherit' }}>
                {images.length > 0 && (
                  <img src={typeof images[0] === 'string' ? images[0] : images[0].url} alt="" 
                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#111827', lineHeight: 1.4, flex: 1 }}>{inc.title}</h3>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>
                      {ts >= 50 ? '😊' : ts >= -10 ? '😐' : '😠'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {inc.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: tsColor, fontWeight: 600 }}>
                      {ts > 0 ? '+' : ''}{ts} puan
                    </span>
                    <span style={{ color: '#9ca3af' }}>
                      {formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
