import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

function getScoreStyle(score) {
  if (score === null || score === undefined) return { color: '#6b7280', emoji: '❔', bg: 'rgba(107,114,128,0.8)', label: 'Yeni' };
  if (score >= 850) return { color: '#16a34a', emoji: '😊', bg: 'rgba(22,163,74,0.85)', label: 'Güvenilir' };
  if (score >= 650) return { color: '#46A53E', emoji: '🙂', bg: 'rgba(70,165,62,0.85)', label: 'İyi' };
  if (score >= 450) return { color: '#d97706', emoji: '😐', bg: 'rgba(217,119,6,0.85)', label: 'Dikkat' };
  if (score >= 250) return { color: '#f97316', emoji: '😟', bg: 'rgba(249,115,22,0.85)', label: 'Riskli' };
  return { color: '#dc2626', emoji: '😠', bg: 'rgba(220,38,38,0.85)', label: 'Tehlike' };
}

const GRADIENTS = [
  'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f3460 100%)',
  'linear-gradient(160deg, #052e16 0%, #064e3b 60%, #065f46 100%)',
  'linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)',
  'linear-gradient(160deg, #1c1917 0%, #292524 60%, #44403c 100%)',
  'linear-gradient(160deg, #4a044e 0%, #701a75 60%, #86198f 100%)',
  'linear-gradient(160deg, #0c0a09 0%, #1c1917 60%, #292524 100%)',
];

function PostCard({ incident, personScores, rank }) {
  const images = incident.images || [];
  const imgUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null;
  const cV = incident.vote_correct_new || 0;
  const wV = incident.vote_wrong_new || 0;
  const total = cV + wV;
  const cPct = total ? Math.round(cV / total * 100) : 0;
  const wPct = total ? 100 - cPct : 0;
  const score = personScores?.[incident.instagram_username] ?? null;
  const { color, emoji, bg, label } = getScoreStyle(score);
  const grad = GRADIENTS[(incident.id?.charCodeAt(0) || 0) % GRADIENTS.length];
  const avatar = incident.instagram_avatar || incident.subject_avatar;

  return (
    <Link to={'/olay/' + incident.id} style={{ display: 'block', color: 'inherit', borderBottom: '1px solid #f1f5f9' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
          {incident.author_avatar && !incident.is_anonymous
            ? <img src={incident.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            {incident.is_anonymous ? 'Anonim' : (incident.author_name || 'Kullanıcı')}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}
          </div>
        </div>
        {incident.instagram_username && (
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 20 }}>
            @{incident.instagram_username} hakkında
          </div>
        )}
      </div>

      {/* Görsel */}
      <div style={{ margin: '10px 0', position: 'relative', overflow: 'hidden', height: 240, background: grad }}>
        {imgUrl && (
          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, display: 'block' }} />
        )}
        {!imgUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.05)', fontSize: 72, fontWeight: 900, letterSpacing: -4, userSelect: 'none', textAlign: 'center', padding: '0 20px', lineHeight: 1.1 }}>
              {incident.title?.toUpperCase()}
            </div>
          </div>
        )}
        {/* Bottom bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 14px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {/* Kişi */}
          {incident.instagram_username && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 13 }}>👤</span>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{incident.person_name || incident.instagram_username}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>@{incident.instagram_username}</div>
              </div>
            </div>
          )}
          {/* Skor */}
          {score !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: bg, padding: '5px 12px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{score}</span>
              <span style={{ fontSize: 15 }}>{emoji}</span>
            </div>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 5, lineHeight: 1.4 }}>{incident.title}</div>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {incident.description}
        </div>

        {/* Oy barı */}
        {total > 0 && (
          <>
            <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 4, marginBottom: 6, background: '#f1f5f9' }}>
              <div style={{ width: cPct + '%', background: '#16a34a' }} />
              <div style={{ width: wPct + '%', background: '#ef4444' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 10 }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>👍 {cPct}% doğru ({cV})</span>
              <span style={{ color: '#94a3b8' }}>{total} değerlendirme</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>({wV}) {wPct}% yanlış 👎</span>
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#94a3b8', paddingTop: 8, borderTop: '1px solid #f8fafc' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <span style={{ fontSize: 15 }}>💬</span> {incident.comment_count || 0} yorum
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 15 }}>👁</span> {incident.view_count || 0}
          </span>
          {incident.verdict === 'positive' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '2px 8px', borderRadius: 20 }}>✅ Doğrulandı</span>}
          {incident.verdict === 'negative' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#dc2626', fontWeight: 600, background: '#fef2f2', padding: '2px 8px', borderRadius: 20 }}>❌ Reddedildi</span>}
          {incident.verdict === 'neutral' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#d97706', fontWeight: 600, background: '#fffbeb', padding: '2px 8px', borderRadius: 20 }}>🤷 Kararsız</span>}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);
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
      }).slice(0, 8);
      setActiveProfiles(profiles);
    }).catch(() => {});
  }, []);

  const tabs = [
    { key: 'discover', label: 'Keşfet' },
    { key: 'trending', label: 'Trend' },
    { key: 'debated', label: 'Tartışmalı' },
    { key: 'new', label: 'Yeni' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 260px', minHeight: '100vh', maxWidth: 1000, margin: '0 auto' }}>

      {/* SOL */}
      <div style={{ borderRight: '1px solid #f1f5f9', padding: '20px 16px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' }}>Bu hafta gündemde</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {trending.map((inc, i) => (
            <Link key={inc.id} to={'/olay/' + inc.id} style={{ padding: '10px 12px', borderRadius: 10, display: 'block', color: 'inherit', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{i < 3 ? '🔥' : '#' + (i + 1)}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{inc.category_name}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', lineHeight: 1.4 }}>{inc.title}</div>
              {inc.instagram_username && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>@{inc.instagram_username}</div>}
            </Link>
          ))}
        </div>

        {user && (
          <div style={{ marginTop: 24, padding: '14px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 4 }}>Deneyimini paylaş</div>
            <div style={{ fontSize: 12, color: '#4ade80', marginBottom: 10 }}>Instagram'da çalıştığın kişiyi bil, skor kazan</div>
            <Link to="/bildir" style={{ display: 'block', textAlign: 'center', background: '#16a34a', color: 'white', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 8 }}>+ Bildir</Link>
          </div>
        )}
      </div>

      {/* ORTA */}
      <div style={{ borderRight: '1px solid #f1f5f9' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, textAlign: 'center', padding: '15px 8px',
              fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#0f172a' : '#94a3b8',
              background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid #013C26' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Arama */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <form onSubmit={e => { e.preventDefault(); if (search.trim()) navigate('/?search=' + encodeURIComponent(search)); }}>
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 24, alignItems: 'center', padding: '0 16px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#94a3b8', fontSize: 15, marginRight: 10 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="@kullanıcı adı veya konu ara..."
                style={{ flex: 1, padding: '10px 0', fontSize: 13, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}
              />
              {search && (
                <button type="submit" style={{ background: '#013C26', color: 'white', border: 'none', borderRadius: 16, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ara</button>
              )}
            </div>
          </form>
        </div>

        {/* Posts */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Yükleniyor...</div>
          </div>
        ) : incidents.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>Henüz içerik yok.</div>
            <Link to="/bildir" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>İlk bildirimi ekle</Link>
          </div>
        ) : (
          incidents.map((inc, i) => <PostCard key={inc.id} incident={inc} personScores={personScores} rank={i + 1} />)
        )}
      </div>

      {/* SAĞ */}
      <div style={{ padding: '20px 16px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' }}>Bu sıra neler oluyor?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeProfiles.map((inc, i) => {
            const score = personScores[inc.instagram_username] ?? null;
            const { emoji, color } = getScoreStyle(score);
            const avatar = inc.instagram_avatar || inc.subject_avatar;
            return (
              <Link key={i} to={'/konu/' + encodeURIComponent(inc.instagram_username)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: 'inherit', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.person_name || inc.instagram_username}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>@{inc.instagram_username}</div>
                </div>
                {score !== null && <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>}
              </Link>
            );
          })}
        </div>

        {!user && (
          <div style={{ marginTop: 24, padding: '16px', background: '#0f172a', borderRadius: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 6 }}>Platforma katıl</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>Deneyimini paylaş, topluluğun güvenini oluştur.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/giris" style={{ flex: 1, textAlign: 'center', background: 'transparent', color: 'white', border: '1px solid #334155', fontSize: 12, fontWeight: 600, padding: '8px', borderRadius: 8 }}>Giriş</Link>
              <Link to="/giris?tab=register" style={{ flex: 1, textAlign: 'center', background: '#46A53E', color: 'white', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 8 }}>Kayıt Ol</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
