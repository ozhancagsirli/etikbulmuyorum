import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

function getScoreStyle(score) {
  if (score >= 850) return { emoji: '😊', color: '#16a34a' };
  if (score >= 650) return { emoji: '🙂', color: '#46A53E' };
  if (score >= 450) return { emoji: '😐', color: '#d97706' };
  if (score >= 250) return { emoji: '😟', color: '#f97316' };
  return { emoji: '😠', color: '#dc2626' };
}

const CATEGORIES = [
  { id: 1,  slug: 'giyim-moda',           name: 'Giyim & Moda',                 icon: '👗' },
  { id: 2,  slug: 'kozmetik-guzellik',     name: 'Kozmetik & Güzellik',           icon: '💄' },
  { id: 3,  slug: 'ev-dekorasyon',         name: 'Ev & Dekorasyon',               icon: '🏠' },
  { id: 4,  slug: 'elektronik-aksesuar',   name: 'Elektronik & Aksesuar',         icon: '📱' },
  { id: 5,  slug: 'yemek-catering',        name: 'Yemek & Catering',              icon: '🍕' },
  { id: 6,  slug: 'spor-supplement',       name: 'Spor & Supplement',             icon: '💪' },
  { id: 7,  slug: 'dyetisyen-saglik',      name: 'Dyetisyen & Sağlık',            icon: '🥗' },
  { id: 8,  slug: 'arac-bakim',            name: 'Araç Bakım & Detailing',        icon: '🚗' },
  { id: 9,  slug: 'anne-bebek',            name: 'Anne & Bebek',                  icon: '👶' },
  { id: 10, slug: 'fotograf-organizasyon', name: 'Fotoğrafçı & Organizasyon',     icon: '📸' },
  { id: 11, slug: 'taki-aksesuar',         name: 'Takı & Aksesuar',               icon: '💎' },
  { id: 12, slug: 'influencer',            name: 'İçerik Üretici & Influencer',   icon: '🎙️' },
];

function ProfileCard({ profile, rank }) {
  const avatar = profile.instagram_avatar;

  return (
    <Link to={'/konu/' + encodeURIComponent(profile.instagram_username || profile.name)}
      style={{ display: 'block', color: 'inherit' }}>
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px 10px', textAlign: 'center', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>

        {/* Avatar */}
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {avatar
            ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>
        {/* İsim */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
          {profile.name || profile.instagram_username}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
          @{profile.instagram_username}
        </div>

      </div>
    </Link>
  );
}

function CategorySection({ category, profiles, loading }) {
  if (!loading && profiles.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{category.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{category.name}</span>
        </div>
        <Link to={'/kategori/' + category.slug} style={{ fontSize: 12, color: '#46A53E', fontWeight: 600 }}>
          Tümünü gör →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', minHeight: 120, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : (
          <>
            {profiles.map((p, i) => <ProfileCard key={p.instagram_username || i} profile={p} />)}
            {profiles.length < 5 && Array.from({ length: 5 - profiles.length }).map((_, i) => (
              <Link key={'empty-' + i} to={'/bildir'} style={{ display: 'block', color: 'inherit' }}>
                <div style={{ background: '#fafafa', borderRadius: 12, border: '1px dashed #e2e8f0', padding: '14px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 120 }}>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>👤</span>
                  <span style={{ fontSize: 10, color: '#d1d5db' }}>Siz olabilirsiniz</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [trending, setTrending] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [catLoading, setCatLoading] = useState(true);
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Tek endpoint ile tüm kategorileri çek
    setCatLoading(true);
    apiFetch('/homepage')
      .then(data => {
        const catMap = {};
        data.forEach(cat => { catMap[cat.slug] = cat.profiles; });
        setCategoryData(catMap);
        setCatLoading(false);
      })
      .catch(() => setCatLoading(false));

    apiFetch('/incidents?sort=most_voted&limit=8').then(d => setTrending(d.data || [])).catch(() => {});
    apiFetch('/incidents?sort=newest&limit=20').then(d => {
      const seen = new Set();
      const profiles = (d.data || []).filter(i => {
        if (!i.instagram_username || seen.has(i.instagram_username)) return false;
        seen.add(i.instagram_username);
        return true;
      }).slice(0, 6);
      setRecentProfiles(profiles);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @media(max-width:768px){
          .home-grid{grid-template-columns:1fr !important}
          .home-sidebar{display:none !important}
          .profiles-grid{grid-template-columns:repeat(3,1fr) !important}
        }
        @media(max-width:480px){
          .profiles-grid{grid-template-columns:repeat(2,1fr) !important}
        }
      `}</style>

      <div className="home-grid" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* ORTA — Kategori vitrini */}
        <div>
          {CATEGORIES.map(cat => (
            <CategorySection key={cat.slug} category={cat} profiles={categoryData[cat.slug] || []} loading={catLoading} />
          ))}
        </div>

        {/* SAĞ — Sabit */}
        <div className="home-sidebar" style={{ position: 'sticky', top: 70 }}>

          {/* Bu hafta gündemde */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Bu hafta gündemde</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {trending.slice(0, 8).map((inc, i) => {
                const total = (inc.vote_correct_new||0) + (inc.vote_wrong_new||0);
                return (
                  <Link key={inc.id} to={'/olay/' + inc.id} style={{ padding: '7px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 11, color: '#d1d5db', fontWeight: 600, width: 18, flexShrink: 0 }}>#{i+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
                      {inc.instagram_username && <div style={{ fontSize: 10, color: '#94a3b8' }}>@{inc.instagram_username}</div>}
                    </div>
                    {total > 0 && <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{total}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Son aktif profiller */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Hakkında konuşulanlar</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Son bildirimlerdeki kişiler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {recentProfiles.map((inc, i) => {
                const avatar = inc.instagram_avatar || inc.subject_avatar;
                return (
                  <Link key={i} to={'/konu/' + encodeURIComponent(inc.instagram_username)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 10, color: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.person_name || inc.instagram_username}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>@{inc.instagram_username}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Sen de listeye gir */}
            <div style={{ marginTop: 14, background: '#013C26', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4 }}>🤝 Sen de listeye gir</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>5+ olumlu değerlendirme al, kategorinde öne çık</div>
              <Link to="/bildir" style={{ display: 'block', background: '#46A53E', color: 'white', fontSize: 12, fontWeight: 700, padding: '7px', borderRadius: 8 }}>Nasıl çalışır?</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
