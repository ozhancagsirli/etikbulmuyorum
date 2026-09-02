import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

function getScoreStyle(score) {
  if (score === null || score === undefined) return { color: '#9ca3af', emoji: '❔', bg: 'rgba(156,163,175,0.85)' };
  if (score >= 850) return { color: '#16a34a', emoji: '😊', bg: 'rgba(22,163,74,0.85)' };
  if (score >= 650) return { color: '#46A53E', emoji: '🙂', bg: 'rgba(70,165,62,0.85)' };
  if (score >= 450) return { color: '#d97706', emoji: '😐', bg: 'rgba(217,119,6,0.85)' };
  if (score >= 250) return { color: '#f97316', emoji: '😟', bg: 'rgba(249,115,22,0.85)' };
  return { color: '#dc2626', emoji: '😠', bg: 'rgba(220,38,38,0.85)' };
}

const GRADIENTS = [
  'linear-gradient(160deg,#0f172a,#1e3a5f)',
  'linear-gradient(160deg,#052e16,#065f46)',
  'linear-gradient(160deg,#1e1b4b,#3730a3)',
  'linear-gradient(160deg,#1c1917,#44403c)',
  'linear-gradient(160deg,#4a044e,#86198f)',
  'linear-gradient(160deg,#150a0a,#431407)',
];

function PostCard({ incident, personScores }) {
  const images = incident.images || [];
  const imgUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null;
  const cV = incident.vote_correct_new || 0;
  const wV = incident.vote_wrong_new || 0;
  const total = cV + wV;
  const cPct = total ? Math.round(cV / total * 100) : 0;
  const wPct = total ? 100 - cPct : 0;
  const score = personScores?.[incident.instagram_username] ?? null;
  const { emoji, bg } = getScoreStyle(score);
  const grad = GRADIENTS[(incident.id?.charCodeAt(0) || 0) % GRADIENTS.length];
  const avatar = incident.instagram_avatar || incident.subject_avatar;

  return (
    <Link to={'/olay/' + incident.id} style={{ display: 'block', color: 'inherit', marginBottom: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
        
        {/* Header — bildiren */}
        <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            {incident.author_avatar && !incident.is_anonymous
              ? <img src={incident.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {incident.is_anonymous ? 'Anonim' : (incident.author_name || 'Kullanıcı')}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>
              {formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}
            </span>
          </div>
          {incident.verdict === 'positive' && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '3px 8px', borderRadius: 20, border: '1px solid #bbf7d0' }}>✅ Onaylandı</span>}
          {incident.verdict === 'negative' && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, background: '#fef2f2', padding: '3px 8px', borderRadius: 20, border: '1px solid #fecaca' }}>❌ Reddedildi</span>}
        </div>

        {/* Görsel — Instagram post tarzı */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: grad, overflow: 'hidden' }}>
          {imgUrl
            ? <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ color: 'rgba(255,255,255,0.08)', fontSize: 52, fontWeight: 900, textAlign: 'center', lineHeight: 1.15, letterSpacing: -2, userSelect: 'none' }}>
                  {incident.title?.toUpperCase()}
                </div>
              </div>
            )
          }
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 50%)' }} />
          
          {/* Kişi kartı — sol alt */}
          {incident.instagram_username && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 14 }}>👤</span>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                  {incident.person_name || incident.instagram_username}
                  {incident.instagram_verified && ' ✅'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>@{incident.instagram_username}</div>
              </div>
            </div>
          )}

          {/* Skor — sağ alt */}
          {score !== null && (
            <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: bg, padding: '5px 12px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{score}</span>
              <span style={{ fontSize: 15 }}>{emoji}</span>
            </div>
          )}
        </div>

        {/* Alt kısım — beyaz */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 5, lineHeight: 1.4 }}>{incident.title}</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {incident.description}
          </div>

          {/* Oy barı */}
          {total > 0 && (
            <>
              <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 4, marginBottom: 6, background: '#f1f5f9' }}>
                <div style={{ width: cPct + '%', background: '#22c55e' }} />
                <div style={{ width: wPct + '%', background: '#ef4444' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>👍 {cPct}%</span>
                <span>{total} oy</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>{wPct}% 👎</span>
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', paddingTop: 8, borderTop: '1px solid #f8fafc' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>💬 {incident.comment_count || 0}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>👁 {incident.view_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { logout } = useAuthStore();
  const [incidents, setIncidents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState([]);
  const [personScores, setPersonScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('discover');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch('/incidents?sort=newest&limit=20')
      .then(async d => {
        const data = d.data || [];
        const list = tab === 'discover' ? [...data].sort(() => Math.random() - 0.5) : data;
        setIncidents(list);
        const usernames = [...new Set(list.map(i => i.instagram_username).filter(Boolean))];
        const scores = {};
        await Promise.all(usernames.map(async u => {
          try {
            const r = await fetch(import.meta.env.VITE_API_URL + '/person-scores/' + u);
            const d = await r.json();
            scores[u] = d.score;
          } catch {}
        }));
        setPersonScores(scores);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    apiFetch('/incidents?sort=most_voted&limit=8').then(d => setTrending(d.data || [])).catch(() => {});
    apiFetch('/incidents?sort=newest&limit=20').then(d => {
      const seen = new Set();
      const profiles = (d.data || []).filter(i => {
        if (!i.instagram_username || seen.has(i.instagram_username)) return false;
        seen.add(i.instagram_username);
        return true;
      }).slice(0, 7);
      setActiveProfiles(profiles);
    }).catch(() => {});
  }, []);

  const tabs = [
    { key: 'discover', label: 'Keşfet' },
    { key: 'trending', label: 'Trend' },
    { key: 'new', label: 'Yeni' },
  ];

  const navItems = [
    { icon: '🏠', label: 'Ana Sayfa', path: '/' },
    { icon: '🔍', label: 'Ara', path: '/?search=' },
    { icon: '📝', label: 'Bildir', path: '/bildir' },
    { icon: '🔔', label: 'Bildirimler', path: '/profil' },
    { icon: '👤', label: 'Profil', path: '/profil' },
  ];

  return (
    <div>
      {/* Üst Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <Link to="/">
          <img src="/logo.png" alt="etikbulmuyorum" style={{ height: 32, width: 'auto' }} />
        </Link>
        {/* Arama */}
        <form onSubmit={e => { e.preventDefault(); if (search.trim()) navigate('/?search=' + encodeURIComponent(search)); }} style={{ flex: 1, maxWidth: 400 }}>
          <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 50, alignItems: 'center', padding: '0 16px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#94a3b8', fontSize: 14, marginRight: 8 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="@kullanıcı adı veya konu ara..."
              style={{ flex: 1, padding: '9px 0', fontSize: 13, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
          </div>
        </form>
        {/* Sağ kısım */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#013C26', color: 'white', padding: '8px 18px', borderRadius: 50, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            + Bildir
          </Link>
          {user ? (
            <div onClick={() => navigate('/profil')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#46A53E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/giris" style={{ padding: '8px 16px', borderRadius: 50, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151', fontWeight: 600 }}>Giriş</Link>
              <Link to="/giris?tab=register" style={{ padding: '8px 16px', borderRadius: 50, background: '#46A53E', color: 'white', fontSize: 13, fontWeight: 700 }}>Kayıt Ol</Link>
            </div>
          )}
        </div>
      </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', maxWidth: 1000, margin: '0 auto' }}>

      {/* ORTA — Feed */}
      <div style={{ borderRight: '1px solid #f1f5f9' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, textAlign: 'center', padding: '16px 8px',
              fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#0f172a' : '#94a3b8',
              background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid #013C26' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>



        {/* Posts */}
        <div style={{ padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Yükleniyor...</div>
          ) : incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Henüz içerik yok.</div>
              <Link to="/bildir" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>İlk bildirimi ekle</Link>
            </div>
          ) : (
            incidents.map(inc => <PostCard key={inc.id} incident={inc} personScores={personScores} />)
          )}
        </div>
      </div>

      {/* SAĞ */}
      <div style={{ padding: '16px 16px', height: '100vh', overflowY: 'auto', position: 'sticky', top: 0 }}>



        {/* Bu hafta gündemde */}
        <div style={{ background: 'white', borderRadius: 16, padding: '14px', marginBottom: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Bu hafta gündemde</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {trending.slice(0, 6).map((inc, i) => (
              <Link key={inc.id} to={'/olay/' + inc.id} style={{ padding: '7px 8px', borderRadius: 8, display: 'block', color: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                  {i < 3 ? '🔥' : `#${i+1}`} {inc.instagram_username ? '@' + inc.instagram_username : ''}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', lineHeight: 1.35 }}>{inc.title}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Değerli Profiller */}
        <div style={{ background: 'white', borderRadius: 16, padding: '14px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>En Çok Değerlendirilen</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Hakkında en fazla bildirim yapılan kişiler</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            {activeProfiles.map((inc, i) => {
              const score = personScores[inc.instagram_username] ?? null;
              const { emoji, color } = getScoreStyle(score);
              const avatar = inc.instagram_avatar || inc.subject_avatar;
              return (
                <Link key={i} to={'/konu/' + encodeURIComponent(inc.instagram_username)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 10, color: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                    {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.person_name || inc.instagram_username}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>@{inc.instagram_username}</div>
                  </div>
                  {score !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: color }}>{score}</span>
                      <span style={{ fontSize: 14 }}>{emoji}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          {/* Sen de listeye gir */}
          <div style={{ background: '#013C26', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>🤝</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4 }}>Sen de listeye gir</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>
              5+ olumlu değerlendirme al, değerli profiller arasına gir
            </div>
            <Link to="/bildir" style={{ display: 'block', background: '#46A53E', color: 'white', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 8 }}>
              Nasıl çalışır?
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
