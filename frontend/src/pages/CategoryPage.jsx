import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function getScoreStyle(score) {
  if (score >= 850) return { emoji: '😊', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  if (score >= 650) return { emoji: '🙂', color: '#46A53E', bg: '#f7fef0', border: '#d9f99d' };
  if (score >= 450) return { emoji: '😐', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  if (score >= 250) return { emoji: '😟', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' };
  return { emoji: '😠', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/categories/' + slug)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Yükleniyor...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 60 }}>Kategori bulunamadı.</div>;

  const { category, profiles } = data;

  return (
    <>
    <style>{`
      @media(max-width:600px){ .cat-grid{grid-template-columns:repeat(2,1fr) !important;} }
    `}</style>
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Başlık */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>{category.icon}</span>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{category.name_tr}</h1>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              {profiles.length} profil · Skora göre sıralı
            </div>
          </div>
        </div>
      </div>

      {/* Profil listesi */}
      {profiles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Bu kategoride henüz profil yok.</div>
          <Link to="/bildir" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            İlk bildirimi ekle
          </Link>
        </div>
      ) : (
        <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {profiles.map((profile, i) => {
            const score = profile.person_score || 1000;
            const { emoji, color, bg, border } = getScoreStyle(score);
            return (
              <Link key={profile.instagram_username || i} 
                to={'/konu/' + encodeURIComponent(profile.instagram_username || profile.name)}
                style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, color: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>
                
                {/* Sıra */}
                <div style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? '#013C26' : '#d1d5db', width: 24, flexShrink: 0, textAlign: 'center' }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                </div>

                {/* Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {profile.instagram_avatar
                    ? <img src={profile.instagram_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👤'}
                </div>

                {/* Bilgi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.name || profile.instagram_username}
                    </span>
                    {profile.instagram_verified && <span style={{ fontSize: 13 }}>✅</span>}
                    {profile.claimed && <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 20, border: '1px solid #bbf7d0', fontWeight: 600 }}>Doğrulandı</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    @{profile.instagram_username}
                    {profile.instagram_followers > 0 && <span> · {Number(profile.instagram_followers).toLocaleString('tr')} takipçi</span>}
                    <span> · {profile.count} bildirim</span>
                  </div>
                </div>

                {/* Skor */}
                <div style={{ flexShrink: 0, textAlign: 'center', background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color }}>{score}</div>
                  <div style={{ fontSize: 16 }}>{emoji}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
