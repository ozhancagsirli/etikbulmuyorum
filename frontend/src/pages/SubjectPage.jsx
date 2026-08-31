import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export default function SubjectPage() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');
  const [showAppeal, setShowAppeal] = useState(false);
  const [appeal, setAppeal] = useState({ name: '', email: '', message: '' });
  const [appealSent, setAppealSent] = useState(false);
  const { name } = useParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedName = decodeURIComponent(name);

  async function submitAppeal(e) {
    e.preventDefault();
    try {
      await apiFetch('/appeals', { method: 'POST', body: JSON.stringify({ subject_name: decodedName, ...appeal }) });
      setAppealSent(true);
    } catch (err) { alert(err.message); }
  }

  useEffect(() => {
    apiFetch('/incidents?subject=' + encodeURIComponent(decodedName) + '&limit=15')
      .then(data => { setIncidents(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  const totalVotes = incidents.reduce((a, i) => a + i.vote_ethical + i.vote_unethical, 0);
  const totalEthical = incidents.reduce((a, i) => a + i.vote_ethical, 0);
  const overallPct = totalVotes ? Math.round((totalEthical / totalVotes) * 100) : null;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <Link to="/" style={{ color: '#46A53E', fontSize: 13 }}>← Ana sayfaya dön</Link>

      {(() => {
        const avatar = incidents[0]?.subject_avatar;
        const ts = incidents.length > 0 ? Math.round(incidents.reduce((a, i) => a + (i.trust_score || 0), 0) / incidents.length) : 0;
        const tsColor = ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626';
        const tsLabel = ts >= 50 ? '🟢 Güvenilir' : ts >= -10 ? '🟡 Dikkatli Ol' : '🔴 Güvenilmez';
        return (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '24px 28px', margin: '12px 0', display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
              {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>👤</span>}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>{decodedName}</h1>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: '#9ca3af' }}>
                <span>{incidents.length} olay</span>
                <span>{totalVotes} değerlendirme</span>
              </div>
            </div>
            {incidents.length > 0 && (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: tsColor, lineHeight: 1 }}>{ts > 0 ? '+' : ''}{ts}</div>
                <div style={{ fontSize: 12, color: tsColor, fontWeight: 700, marginTop: 4 }}>{tsLabel}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Güven Skoru</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* İtiraz butonu */}
      {!showAppeal && !appealSent && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <button onClick={() => setShowAppeal(true)} style={{ fontSize: 13, color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}>
            ⚖️ Bu kişiyim, itiraz etmek istiyorum
          </button>
        </div>
      )}

      {showAppeal && !appealSent && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 16 }}>
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
        <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: '16px 20px', marginBottom: 16, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
          ✅ İtirazınız alındı! Moderatörlerimiz inceleyecek.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Yükleniyor...</div>
      ) : incidents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#888' }}>Bu konu hakkında henüz olay yok.</p>
          <Link to="/bildir" style={{ color: '#46A53E', fontWeight: 600 }}>Şikayet Ekle →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {incidents.map(inc => {
            const total = inc.vote_ethical + inc.vote_unethical;
            const ethPct = total ? Math.round((inc.vote_ethical / total) * 100) : null;
            const isEthical = inc.verdict === 'ethical';
            const isUnethical = inc.verdict === 'unethical';

            if (isEthical) {
              return (
                <div key={inc.id} style={{ background: '#f0fdf4', borderRadius: 12, border: '1.5px solid #46d160', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <Link to={'/olay/' + inc.id} style={{ fontSize: 14, fontWeight: 600, color: '#1a7f37' }}>{inc.title}</Link>
                    <div style={{ fontSize: 11, color: '#86efac', marginTop: 2 }}>{ethPct}% Etik · {total} oy</div>
                  </div>
                </div>
              );
            }

            return (
              <div key={inc.id} style={{ background: 'white', borderRadius: 12, border: isUnethical ? '1.5px solid #f85149' : '1px solid #e0e0e0', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {isUnethical && <span style={{ fontSize: 11, background: '#ffeef0', color: '#cf222e', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>❌ Etik Dışı Sonuçlandı</span>}
                  {inc.category_name && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#46A53E', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{inc.category_icon} {inc.category_name}</span>}
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
                </div>
                <Link to={'/olay/' + inc.id}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#1c1c1c', lineHeight: 1.4 }}>{inc.title}</h3>
                </Link>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {inc.description}
                </p>
                {ethPct !== null && (
                  <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#46d160', fontWeight: 600 }}>✅ {ethPct}% Etik</span>
                    <span style={{ color: '#f85149', fontWeight: 600 }}>❌ {100-ethPct}% Güvenilmez</span>
                    <span style={{ color: '#aaa' }}>· {total} oy</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
