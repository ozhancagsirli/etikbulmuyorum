import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import toast from 'react-hot-toast';

function getScoreStyle(s) {
  if (s === null) return { emoji: '❔', color: '#9ca3af' };
  if (s >= 850) return { emoji: '😊', color: '#16a34a' };
  if (s >= 650) return { emoji: '🙂', color: '#46A53E' };
  if (s >= 450) return { emoji: '😐', color: '#d97706' };
  if (s >= 250) return { emoji: '😟', color: '#f97316' };
  return { emoji: '😠', color: '#dc2626' };
}

export default function SubjectPage() {
  const { name } = useParams();
  const user = useAuthStore(s => s.user);
  const fetchMe = useAuthStore(s => s.fetchMe);
  const [incidents, setIncidents] = useState([]);
  const [personScore, setPersonScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const decodedName = decodeURIComponent(name);

  useEffect(() => {
    Promise.all([
      apiFetch('/incidents?subject=' + encodeURIComponent(decodedName) + '&limit=20'),
      apiFetch('/subjects/' + encodeURIComponent(decodedName)).catch(() => null),
      fetch(import.meta.env.VITE_API_URL + '/person-scores/' + encodeURIComponent(decodedName)).then(r => r.json()).catch(() => null)
    ]).then(([data, score, subject]) => {
      setIncidents(data.data || []);
      if (score) setPersonScore(score.score);
      if (subject?.claimed) setClaimed(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [name]);

  const firstInc = incidents[0];
  const avatar = firstInc?.instagram_avatar || firstInc?.subject_avatar;
  const fullName = firstInc?.person_name || decodedName;
  const igUsername = firstInc?.instagram_username;
  const isVerified = firstInc?.instagram_verified;
  const followers = firstInc?.instagram_followers;
  const { emoji: tsEmoji, color: tsColor } = getScoreStyle(personScore);

  const getStyle = (verdict, total) => {
    if (!total || total < 10) return { bg: 'white', border: '#e5e7eb', emoji: '❔', label: 'Oylanıyor' };
    if (verdict === 'positive') return { bg: '#f0fdf4', border: '#86efac', emoji: '✅', label: 'Doğrulandı' };
    if (verdict === 'negative') return { bg: '#fef2f2', border: '#fca5a5', emoji: '❌', label: 'Reddedildi' };
    return { bg: '#fffbeb', border: '#fde68a', emoji: '🤷', label: 'Kararsız' };
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Link to="/" style={{ color: '#9ca3af', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        ← Geri
      </Link>

      {/* Profil kartı */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{fullName}</span>
              {isVerified && <span>✅</span>}
              {claimed && <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 20, border: '1px solid #bfdbfe', fontWeight: 600 }}>🏷️ Sahiplenildi</span>}
            </div>
            {igUsername && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                @{igUsername}{followers > 0 && <span> · {Number(followers).toLocaleString('tr')} takipçi</span>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{incidents.length} bildirim</span>
              {personScore !== null && (
                <span style={{ fontSize: 12, fontWeight: 700, color: tsColor }}>
                  {personScore} {tsEmoji}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profili sahiplen */}
        {!claimed && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            {!user ? (
              <Link to="/giris" style={{ fontSize: 12, color: '#46A53E', fontWeight: 600 }}>
                🏷️ Bu profil size mi ait? Giriş yapın →
              </Link>
            ) : claiming ? (
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 8 }}>📸 Instagram Bio Doğrulama</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
                  Instagram bio'nuzda şunu yazın:<br/>
                  <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 13 }}>
                    EB:{igUsername || decodedName}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    try {
                      const r = await apiFetch('/instagram/verify', { method: 'POST', body: JSON.stringify({ username: igUsername || decodedName }), requireAuth: true });
                      if (r.verified) { setClaimed(true); setClaiming(false); fetchMe(); toast && toast.success && toast.success('Profil doğrulandı!'); }
                      else alert(r.message);
                    } catch(e) { alert(e.message); }
                  }} style={{ flex: 2, padding: '8px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Doğruladım, kontrol et
                  </button>
                  <button onClick={() => setClaiming(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setClaiming(true)} style={{ fontSize: 12, color: '#46A53E', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                🏷️ Bu profil size mi ait? Sahiplenin →
              </button>
            )}
          </div>
        )}
        {claimed && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
            ✅ Profil doğrulandı!
          </div>
        )}
      </div>

      {/* Bildirimler */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Yükleniyor...</div>
      ) : incidents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#9ca3af', marginBottom: 12 }}>Henüz bildirim yok.</p>
          <Link to="/bildir" style={{ color: '#46A53E', fontWeight: 600, fontSize: 14 }}>İlk görüşü ekle →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incidents.map(inc => {
            const vTotal = (inc.vote_correct_new||0) + (inc.vote_wrong_new||0);
            const { bg, border, emoji, label } = getStyle(inc.verdict, vTotal);
            const images = inc.images || [];
            const imgUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null;
            return (
              <Link key={inc.id} to={'/olay/' + inc.id} style={{ background: bg, borderRadius: 12, border: '1.5px solid ' + border, display: 'block', color: 'inherit', overflow: 'hidden' }}>
                {imgUrl && <img src={imgUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</span>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{label} {vTotal > 0 && `· ${vTotal} oy`}</span>
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
