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
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
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
          <span className="cat-header-text" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{category.name}</span>
        </div>
        <Link to={'/kategori/' + category.slug} style={{ fontSize: 12, color: '#46A53E', fontWeight: 600 }}>
          Tümünü gör →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8, overflow: 'hidden' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', minHeight: 120, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : (
          <>
            {profiles.map((p, i) => <ProfileCard key={p.instagram_username || i} profile={p} catIcon={category.icon} />)}
            {profiles.length < 5 && Array.from({ length: 5 - profiles.length }).map((_, i) => (
              <Link key={'empty-' + i} to={'/profil-olustur'} style={{ display: 'block', color: 'inherit' }}>
                <div style={{ background: '#fafafa', borderRadius: 12, border: '1px dashed #e2e8f0', padding: '14px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 120 }}>
                  <span style={{ fontSize: 28, opacity: 0.2 }}>{category.icon}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Siz olabilirsiniz</span>
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
    <div style={{ background: '#f8fafc', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media(max-width:768px){
          .home-grid{grid-template-columns:1fr !important}
          .home-sidebar{display:none !important}
          .profiles-grid{grid-template-columns:repeat(3,1fr) !important}
        }
        @media(max-width:480px){
          .profiles-grid{grid-template-columns:repeat(2,1fr) !important}
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px', overflowX: 'hidden' }}>

        {/* ORTA — Kategori vitrini */}
        <div>
          {CATEGORIES.map(cat => (
            <CategorySection key={cat.slug} category={cat} profiles={categoryData[cat.slug] || []} loading={catLoading} />
          ))}
        </div>

              </div>
    </div>
  );
}
