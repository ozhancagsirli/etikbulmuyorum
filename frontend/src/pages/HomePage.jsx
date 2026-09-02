import { useState, useEffect, useCallback } from 'react';
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
    <Link to={'/olay/' + incident.id} style={{ display: 'block', color: 'inherit', marginBottom: 14 }}>
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>
        <div style={{ padding: '11px 13px 9px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            {incident.author_avatar && !incident.is_anonymous
              ? <img src={incident.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
              {incident.is_anonymous ? 'Anonim' : (incident.author_name || 'Kullanıcı')}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>
              {formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}
            </span>
          </div>
          {incident.instagram_username && (
            <div style={{ fontSize: 10, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 20 }}>
              @{incident.instagram_username}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: grad, overflow: 'hidden' }}>
          {imgUrl
            ? <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.8 }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.06)', fontSize: 48, fontWeight: 900, textAlign: 'center', lineHeight: 1.1, letterSpacing: -2 }}>
                  {incident.title?.toUpperCase()}
                </div>
              </div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
          {incident.instagram_username && (
            <div style={{ position: 'absolute', bottom: 11, left: 11, display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.45)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 13 }}>👤</span>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{incident.person_name || incident.instagram_username}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>@{incident.instagram_username}</div>
              </div>
            </div>
          )}
          {score !== null && (
            <div style={{ position: 'absolute', bottom: 11, right: 11, display: 'flex', alignItems: 'center', gap: 4, background: bg, padding: '4px 10px', borderRadius: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{score}</span>
              <span style={{ fontSize: 13 }}>{emoji}</span>
            </div>
          )}
        </div>

        <div style={{ padding: '11px 13px 12px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1.4 }}>{incident.title}</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {incident.description}
          </div>
          {total > 0 && (
            <>
              <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 3, marginBottom: 5, background: '#f1f5f9' }}>
                <div style={{ width: cPct + '%', background: '#22c55e' }} />
                <div style={{ width: wPct + '%', background: '#ef4444' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 9 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>👍 {cPct}%</span>
                <span style={{ color: '#94a3b8' }}>{total} oy</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>{wPct}% 👎</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', paddingTop: 8, borderTop: '1px solid #f8fafc', alignItems: 'center' }}>
            <span>💬 {incident.comment_count || 0}</span>
            <span>👁 {incident.view_count || 0}</span>
            {incident.verdict === 'positive' && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '2px 7px', borderRadius: 20 }}>✅ Onaylandı</span>}
            {incident.verdict === 'negative' && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#dc2626', fontWeight: 600, background: '#fef2f2', padding: '2px 7px', borderRadius: 20 }}>❌ Reddedildi</span>}
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
  const [tab, setTab] = useState('new');


  // Sabit: en çok değerlendirilen 3 post + trending + profiller
  useEffect(() => {
    apiFetch('/incidents?sort=most_voted&limit=20').then(d => {
      setTrending(d.data || []);
    }).catch(() => {});

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

  // Değişen: tab'a göre feed
  useEffect(() => {
    setLoading(true);
    const sortMap = { top: 'most_voted', new: 'newest', discover: 'newest' };
    apiFetch('/incidents?sort=' + (sortMap[tab] || 'newest') + '&limit=20')
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

  const tabs = [
    { key: 'new', label: 'Yeni' },
    { key: 'top', label: 'Trend' },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`@media(max-width:768px){.home-grid{grid-template-columns:1fr !important}.home-sidebar{position:static !important}}`}</style>


      {/* Ana içerik */}
      <div className="home-grid" style={{ maxWidth: 1000, margin: '0 auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* ORTA */}
        <div>
          {/* Kategoriler */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 2, scrollbarWidth: 'none' }}>
            {[
              { slug: 'giyim-moda', label: '👗 Giyim' },
              { slug: 'kozmetik-guzellik', label: '💄 Kozmetik' },
              { slug: 'ev-dekorasyon', label: '🏠 Ev' },
              { slug: 'elektronik-aksesuar', label: '📱 Elektronik' },
              { slug: 'yemek-catering', label: '🍕 Yemek' },
              { slug: 'spor-supplement', label: '💪 Spor' },
              { slug: 'dyetisyen-saglik', label: '🥗 Sağlık' },
              { slug: 'arac-bakim', label: '🚗 Araç' },
              { slug: 'anne-bebek', label: '👶 Bebek' },
              { slug: 'fotograf-organizasyon', label: '📸 Fotoğraf' },
              { slug: 'taki-aksesuar', label: '💎 Takı' },
              { slug: 'influencer', label: '🎙️ Influencer' },
            ].map(cat => (
              <Link key={cat.slug} to={'/kategori/' + cat.slug} style={{
                whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20,
                background: 'white', border: '1px solid #e2e8f0',
                fontSize: 12, fontWeight: 500, color: '#374151', flexShrink: 0,
              }}>
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', marginBottom: 14, overflow: 'hidden' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '12px 8px', fontSize: 13,
                fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? '#0f172a' : '#94a3b8',
                background: tab === t.key ? '#f8fafc' : 'white',
                border: 'none', borderBottom: tab === t.key ? '2px solid #013C26' : '2px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{t.label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Yükleniyor...</div>
          ) : incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Henüz içerik yok.</div>
              <Link to="/bildir" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 50, fontSize: 13, fontWeight: 600 }}>İlk bildirimi ekle</Link>
            </div>
          ) : (
            incidents.map(inc => <PostCard key={inc.id} incident={inc} personScores={personScores} />)
          )}
        </div>

        {/* SAĞ — sabit */}
        <div className="home-sidebar" style={{ position: 'sticky', top: 70 }}>



          {/* Bu hafta gündemde */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Bu hafta gündemde</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {trending.slice(0, 10).map((inc, i) => {
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

          {/* En çok değerlendirilen profiller */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: '14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Hakkında konuşulanlar</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Son bildirimlerdeki kişiler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {activeProfiles.map((inc, i) => {
                const score = personScores[inc.instagram_username] ?? null;
                const { emoji, color } = getScoreStyle(score);
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
                    {score !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
                        <span style={{ fontSize: 13 }}>{emoji}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            <div style={{ marginTop: 14, background: '#013C26', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4 }}>🤝 Sen de listeye gir</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>5+ olumlu değerlendirme al</div>
              <Link to="/bildir" style={{ display: 'block', background: '#46A53E', color: 'white', fontSize: 12, fontWeight: 700, padding: '7px', borderRadius: 8 }}>Nasıl çalışır?</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
