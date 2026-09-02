import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';

function getScoreStyle(score) {
  if (score === null || score === undefined) return { color: '#9ca3af', emoji: '❔', bg: 'rgba(0,0,0,0.5)' };
  if (score >= 850) return { color: '#16a34a', emoji: '😊', bg: 'rgba(22,163,74,0.85)' };
  if (score >= 650) return { color: '#46A53E', emoji: '🙂', bg: 'rgba(70,165,62,0.85)' };
  if (score >= 450) return { color: '#d97706', emoji: '😐', bg: 'rgba(217,119,6,0.85)' };
  if (score >= 250) return { color: '#f97316', emoji: '😟', bg: 'rgba(249,115,22,0.85)' };
  return { color: '#dc2626', emoji: '😠', bg: 'rgba(220,38,38,0.85)' };
}

function PostCard({ incident, personScores }) {
  const images = incident.images || [];
  const imgUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null;
  const correctPct = incident.vote_correct_new || 0;
  const wrongPct = incident.vote_wrong_new || 0;
  const total = correctPct + wrongPct;
  const cPct = total ? Math.round(correctPct / total * 100) : 0;
  const wPct = total ? 100 - cPct : 0;
  const score = personScores?.[incident.instagram_username] ?? null;
  const { color, emoji, bg } = getScoreStyle(score);

  // Gradient colors based on score
  const gradients = [
    'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    'linear-gradient(135deg, #064e3b, #065f46, #047857)',
    'linear-gradient(135deg, #3b0764, #4c1d95, #5b21b6)',
    'linear-gradient(135deg, #1c1917, #292524, #44403c)',
    'linear-gradient(135deg, #0c1a0c, #14532d, #166534)',
  ];
  const grad = gradients[Math.abs(incident.id?.charCodeAt(0) || 0) % gradients.length];

  return (
    <Link to={'/olay/' + incident.id} style={{ display: 'block', color: 'inherit', borderBottom: '0.5px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
          {incident.author_avatar && !incident.is_anonymous
            ? <img src={incident.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            {incident.is_anonymous ? 'Anonim' : incident.author_name || 'Kullanıcı'}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>
            · {formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}
          </span>
        </div>
        {incident.instagram_username && (
          <div style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', border: '0.5px solid #e5e7eb', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            @{incident.instagram_username} hakkında
          </div>
        )}
      </div>

      {/* Görsel */}
      <div style={{ width: '100%', height: 220, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {imgUrl && (
          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.7 }} />
        )}
        {!imgUrl && (
          <div style={{ color: 'rgba(255,255,255,0.06)', fontSize: 56, fontWeight: 800, letterSpacing: -2, userSelect: 'none' }}>
            {incident.title?.split(' ').slice(0, 2).join(' ').toUpperCase()}
          </div>
        )}
        {/* Kişi bilgisi alt sol */}
        {incident.instagram_username && (
          <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              {incident.instagram_avatar || incident.subject_avatar
                ? <img src={incident.instagram_avatar || incident.subject_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 12 }}>👤</span>
              }
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>@{incident.instagram_username}</span>
          </div>
        )}
        {/* Skor alt sağ */}
        {score !== null && (
          <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: bg, padding: '3px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{score}</span>
            <span style={{ fontSize: 13 }}>{emoji}</span>
          </div>
        )}
      </div>

      {/* İçerik */}
      <div style={{ padding: '10px 16px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{incident.title}</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {incident.description}
        </div>

        {/* Oy barı */}
        {total > 0 && (
          <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 3, marginBottom: 8 }}>
            <div style={{ width: cPct + '%', background: '#16a34a', transition: 'width 0.3s' }} />
            <div style={{ width: wPct + '%', background: '#dc2626', transition: 'width 0.3s' }} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#9ca3af' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>💬 {incident.comment_count || 0}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>👁 {incident.view_count || 0}</span>
          {total > 0 && (
            <>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>👍 {cPct}%</span>
              <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 'auto' }}>%{wPct} 👎</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState([]);
  const [personScores, setPersonScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('discover');
  const [search, setSearch] = useState('');
  const searchQ = searchParams.get('search') || '';

  useEffect(() => {
    setLoading(true);
    const sortMap = { discover: 'newest', trending: 'most_voted', debated: 'newest', new: 'newest' };
    apiFetch('/incidents?sort=' + (sortMap[tab] || 'newest') + '&limit=20')
      .then(async d => {
        const data = d.data || [];
        // Shuffle for discover
        const list = tab === 'discover' ? data.sort(() => Math.random() - 0.5) : data;
        setIncidents(list);

        // Kişi skorlarını çek
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
      })
      .catch(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    // Trending titles
    apiFetch('/incidents?sort=most_voted&limit=7').then(d => setTrending(d.data || [])).catch(() => {});
    // Active profiles
    apiFetch('/incidents?sort=newest&limit=20').then(d => {
      const seen = new Set();
      const profiles = (d.data || []).filter(i => {
        if (!i.instagram_username || seen.has(i.instagram_username)) return false;
        seen.add(i.instagram_username);
        return true;
      }).slice(0, 6);
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
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 220px', minHeight: 'calc(100vh - 108px)', maxWidth: 960, margin: '0 auto' }}>

      {/* SOL — Gündemde */}
      <div style={{ borderRight: '0.5px solid #e5e7eb', padding: '16px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Bu hafta gündemde</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {trending.map((inc, i) => (
            <Link key={inc.id} to={'/olay/' + inc.id} style={{
              padding: '8px 10px', borderRadius: 8, display: 'block', color: 'inherit',
              background: i === 0 ? '#f3f4f6' : 'transparent',
            }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{inc.category_name} {i < 3 ? '🔥' : ''}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', lineHeight: 1.3 }}>{inc.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ORTA — Feed */}
      <div style={{ borderRight: '0.5px solid #e5e7eb' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, textAlign: 'center', padding: '13px 8px',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#111827' : '#9ca3af',
              borderBottom: tab === t.key ? '2px solid #013C26' : '2px solid transparent',
              background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #013C26' : 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Arama */}
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #e5e7eb' }}>
          <form onSubmit={e => { e.preventDefault(); if (search.trim()) navigate('/?search=' + encodeURIComponent(search)); }}>
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 20, alignItems: 'center', padding: '0 14px' }}>
              <span style={{ color: '#9ca3af', fontSize: 14, marginRight: 8 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="@kullanıcı adı veya konu ara..."
                style={{ flex: 1, padding: '9px 0', fontSize: 13, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: '#111827' }}
              />
            </div>
          </form>
        </div>

        {/* Posts */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Yükleniyor...</div>
        ) : incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Henüz içerik yok.</div>
        ) : (
          incidents.map(inc => <PostCard key={inc.id} incident={inc} personScores={personScores} />)
        )}
      </div>

      {/* SAĞ — Bu sıra neler oluyor */}
      <div style={{ padding: '16px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Bu sıra neler oluyor?</div>
        <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {activeProfiles.map((inc, i) => (
            <Link key={inc.id} to={'/konu/' + encodeURIComponent(inc.instagram_username)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', color: 'inherit',
              borderBottom: i < activeProfiles.length - 1 ? '0.5px solid #f3f4f6' : 'none',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {inc.instagram_avatar || inc.subject_avatar
                  ? <img src={inc.instagram_avatar || inc.subject_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 16 }}>👤</span>
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inc.person_name || inc.instagram_username}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>@{inc.instagram_username}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
