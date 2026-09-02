import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function getScoreStyle(s) {
  if (s >= 850) return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  if (s >= 650) return { color: '#46A53E', bg: '#f7fef0', border: '#d9f99d' };
  if (s >= 450) return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  if (s >= 250) return { color: '#f97316', bg: '#fff7ed', border: '#fed7aa' };
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
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
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Başlık */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 40 }}>{category.icon}</span>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{category.name_tr}</h1>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            {profiles.length} profil · Güven skoruna göre sıralı
          </div>
        </div>
        <Link to="/bildir" style={{ marginLeft: 'auto', background: '#013C26', color: 'white', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
          + Görüş Bildir
        </Link>
      </div>

      {/* Profil listesi */}
      {profiles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Bu kategoride henüz profil yok.</div>
          <Link to="/profil-olustur" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
            Profilini Oluştur
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profiles.map((profile, i) => {
            const score = profile.person_score || 1000;
            const { color, bg, border } = getScoreStyle(score);
            const avatar = profile.instagram_avatar;

            return (
              <Link key={profile.instagram_username || i}
                to={'/konu/' + encodeURIComponent(profile.instagram_username || profile.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px 16px', color: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>

                {/* Sıra */}
                <div style={{ fontSize: 16, fontWeight: 700, color: i < 3 ? '#013C26' : '#d1d5db', width: 28, textAlign: 'center', flexShrink: 0 }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                </div>

                {/* Avatar */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                </div>

                {/* Bilgi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{profile.name || profile.instagram_username}</span>
                    {profile.instagram_verified && <span style={{ fontSize: 13 }}>✅</span>}
                    {profile.claimed && <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: 20, border: '1px solid #bbf7d0', fontWeight: 600 }}>Doğrulandı</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    @{profile.instagram_username}
                    {profile.instagram_followers > 0 && <span> · {Number(profile.instagram_followers).toLocaleString('tr')} takipçi</span>}
                    {profile.count > 0 && <span> · {profile.count} görüş</span>}
                  </div>
                </div>

                {/* Skor */}
                <div style={{ textAlign: 'center', background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 14px', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
