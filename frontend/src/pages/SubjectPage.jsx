import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';

export default function SubjectPage() {
  const { name } = useParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedName = decodeURIComponent(name);

  useEffect(() => {
    apiFetch('/incidents?subject=' + encodeURIComponent(decodedName) + '&limit=20')
      .then(data => { setIncidents(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  const firstInc = incidents[0];
  const avatar = firstInc?.instagram_avatar || firstInc?.subject_avatar;
  const fullName = firstInc?.person_name || decodedName;
  const isVerified = firstInc?.instagram_verified;
  const followers = firstInc?.instagram_followers;
  const igUsername = firstInc?.instagram_username;
  const ts = incidents.length > 0
    ? Math.round(incidents.reduce((a, i) => a + (i.trust_score || 0), 0) / incidents.length)
    : null;
  const tsColor = ts === null ? '#9ca3af' : ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626';
  const tsEmoji = ts === null ? '—' : ts >= 50 ? '😊' : ts >= -10 ? '😐' : '😠';
  const tsLabel = ts === null ? 'Değerlendirme yok' : ts >= 50 ? 'Güvenilir' : ts >= -10 ? 'Dikkatli Ol' : 'Güvenilmez';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Link to="/" style={{ color: '#9ca3af', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        ← Geri
      </Link>

      {/* Profil kartı - minimal */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
          {avatar
            ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{fullName}</span>
            {isVerified && <span title="Doğrulanmış">✅</span>}
          </div>
          {igUsername && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              @{igUsername}{followers > 0 && <span> · {Number(followers).toLocaleString('tr')} takipçi</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{incidents.length} bildirim</span>
            {ts !== null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: tsColor }}>
                {tsEmoji} {tsLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bildirimler */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Yükleniyor...</div>
      ) : incidents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#9ca3af', marginBottom: 12 }}>Henüz bildirim yok.</p>
          <Link to="/bildir" style={{ color: '#46A53E', fontWeight: 600, fontSize: 14 }}>İlk bildirimi ekle →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incidents.map(inc => {
            const score = inc.trust_score || 0;
            const sColor = score >= 50 ? '#16a34a' : score >= -10 ? '#d97706' : '#dc2626';
            const emoji = score >= 50 ? '😊' : score >= -10 ? '😐' : '😠';
            const images = inc.images || [];
            const imgUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null;
            return (
              <Link key={inc.id} to={'/olay/' + inc.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', color: 'inherit', alignItems: 'center', overflow: 'hidden' }}>
                {imgUrl && <img src={imgUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</span>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                    <span style={{ color: sColor, fontWeight: 600 }}>{score > 0 ? '+' : ''}{score} puan</span>
                    <span style={{ color: '#d1d5db' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
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
