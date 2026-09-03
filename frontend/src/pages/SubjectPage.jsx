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

function getStyle(verdict, total) {
  if (!total || total < 10) return { emoji: '❔', label: 'Oylanıyor', color: '#9ca3af' };
  if (verdict === 'positive') return { emoji: '✅', label: 'Doğrulandı', color: '#16a34a' };
  if (verdict === 'negative') return { emoji: '❌', label: 'Reddedildi', color: '#dc2626' };
  return { emoji: '🤷', label: 'Kararsız', color: '#d97706' };
}

export default function SubjectPage() {
  const { name } = useParams();
  const user = useAuthStore(s => s.user);
  const fetchMe = useAuthStore(s => s.fetchMe);
  const [incidents, setIncidents] = useState([]);
  const [personScore, setPersonScore] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(true);
  const decodedName = decodeURIComponent(name);

  useEffect(() => {
    Promise.all([
      apiFetch('/incidents?subject=' + encodeURIComponent(decodedName) + '&limit=50'),
      fetch(import.meta.env.VITE_API_URL + '/person-scores/' + encodeURIComponent(decodedName)).then(r => r.json()).catch(() => null),
      apiFetch('/subjects/' + encodeURIComponent(decodedName)).catch(() => null),
      fetch(import.meta.env.VITE_API_URL + '/portfolio/' + encodeURIComponent(decodedName)).then(r => r.json()).catch(() => []),
    ]).then(([data, score, subject, port]) => {
      setIncidents(data.data || []);
      if (score) setPersonScore(score.score);
      if (subject?.claimed) setClaimed(true);
      setPortfolio(Array.isArray(port) ? port : []);
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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Link to="/" style={{ color: '#9ca3af', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>← Geri</Link>

      {/* Profil kartı */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{fullName}</span>
              {isVerified && <span title="Instagram doğrulandı">✅</span>}
              {claimed && <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 20, border: '1px solid #bbf7d0', fontWeight: 600 }}>🛡️ Doğrulandı</span>}
            </div>
            {igUsername && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                @{igUsername}{followers > 0 && <span> · {Number(followers).toLocaleString('tr')} takipçi</span>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{incidents.length} görüş</span>
              {personScore !== null && (
                <span style={{ fontSize: 13, fontWeight: 700, color: tsColor }}>{personScore} {tsEmoji}</span>
              )}
            </div>
          </div>
        </div>

        {/* Profili sahiplen */}
        {!claimed && user?.instagram_username !== igUsername && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            {!user ? (
              <Link to="/giris" style={{ fontSize: 12, color: '#46A53E', fontWeight: 600 }}>🏷️ Bu profil size mi ait? Giriş yapın →</Link>
            ) : claiming ? (
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 8 }}>📸 Instagram Bio Doğrulama</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
                  Instagram bio'nuzda şunu yazın:<br/>
                  <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 13 }}>EB:{igUsername || decodedName}</code>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    try {
                      const r = await apiFetch('/instagram/verify', { method: 'POST', body: JSON.stringify({ username: igUsername || decodedName }) });
                      if (r.verified) { setClaimed(true); setClaiming(false); fetchMe(); toast.success('Profil doğrulandı!'); }
                      else toast.error(r.message);
                    } catch(e) { toast.error(e.message); }
                  }} style={{ flex: 2, padding: '8px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Doğruladım, kontrol et
                  </button>
                  <button onClick={() => setClaiming(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 13, cursor: 'pointer' }}>İptal</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setClaiming(true)} style={{ fontSize: 12, color: '#46A53E', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                🏷️ Bu profil size mi ait? Sahiplenin →
              </button>
            )}
          </div>
        )}
        {claimed && user?.instagram_username === igUsername && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✅ Bu profil size ait</div>
        )}
      </div>

      {/* Portfolyo */}
      {portfolio.length > 0 && (
        <div style={{ marginBottom: 12, background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Portfolyo</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {portfolio.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)}
                style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', background: '#f1f5f9', position: 'relative' }}>
                <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {item.price && (
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                    ₺{Number(item.price).toLocaleString('tr')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Görüşler accordion */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 12 }}>
        <button onClick={() => setReviewsOpen(o => !o)}
          style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Görüşler ({incidents.length})</span>
          <span style={{ fontSize: 18, color: '#94a3b8', transform: reviewsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </button>

        {reviewsOpen && (
          <div style={{ borderTop: '1px solid #f1f5f9' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</div>
            ) : incidents.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Henüz görüş yok. <Link to={"/bildir?username=" + encodeURIComponent(igUsername || decodedName)} style={{ color: '#46A53E', fontWeight: 600 }}>İlk görüşü ekle →</Link>
              </div>
            ) : (
              incidents.map((inc, i) => {
                const vTotal = (inc.vote_correct_new||0) + (inc.vote_wrong_new||0);
                const { emoji, label, color } = getStyle(inc.verdict, vTotal);
                return (
                  <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < incidents.length-1 ? '1px solid #f8fafc' : 'none' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
                    <Link to={'/olay/' + inc.id} style={{ flex: 1, minWidth: 0, color: 'inherit' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        <span style={{ color, fontWeight: 500 }}>{label}</span>
                        <span> · {formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f8fafc' }}>
              <Link to={"/bildir?username=" + encodeURIComponent(igUsername || decodedName)} style={{ fontSize: 13, color: '#46A53E', fontWeight: 600 }}>+ Görüş Bildir</Link>
            </div>
          </div>
        )}
      </div>

      {/* Portfolyo modal */}
      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', maxWidth: 480, width: '100%' }}>
            <img src={selectedItem.image_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            {(selectedItem.title || selectedItem.description || selectedItem.price) && (
              <div style={{ padding: '16px' }}>
                {selectedItem.title && <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{selectedItem.title}</div>}
                {selectedItem.description && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 10 }}>{selectedItem.description}</div>}
                {selectedItem.price && <div style={{ fontSize: 16, fontWeight: 800, color: '#013C26' }}>₺{Number(selectedItem.price).toLocaleString('tr')}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Şikayet */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <button style={{ fontSize: 12, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}>
          Bu profili şikayet et
        </button>
      </div>
    </div>
  );
}
 
