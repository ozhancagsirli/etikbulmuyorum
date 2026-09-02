import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

function getScoreStyle(s) {
  if (s >= 850) return { color: '#16a34a' };
  if (s >= 650) return { color: '#46A53E' };
  if (s >= 450) return { color: '#d97706' };
  if (s >= 250) return { color: '#f97316' };
  return { color: '#dc2626' };
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [personScore, setPersonScore] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const igUsername = user.instagram_username;
    if (!igUsername) return setLoading(false);

    Promise.all([
      apiFetch('/incidents?subject=' + encodeURIComponent(igUsername) + '&limit=50'),
      fetch(import.meta.env.VITE_API_URL + '/person-scores/' + encodeURIComponent(igUsername)).then(r => r.json()).catch(() => null),
      apiFetch('/appeals?subject=' + encodeURIComponent(igUsername)).catch(() => []),
    ]).then(([inc, score, app]) => {
      setIncidents(inc.data || []);
      if (score) setPersonScore(score.score);
      setAppeals(Array.isArray(app) ? app : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
      <Link to="/giris" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Giriş Yap</Link>
    </div>
  );

  if (!user.instagram_username || !user.instagram_verified) return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
      <h2 style={{ marginBottom: 8, fontSize: 18 }}>Instagram hesabınızı doğrulayın</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>Dashboard'u kullanmak için Instagram hesabınızı profilinizden doğrulayın.</p>
      <Link to="/profil" style={{ background: '#46A53E', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>Profili Doğrula</Link>
    </div>
  );

  const positive = incidents.filter(i => i.verdict === 'positive').length;
  const negative = incidents.filter(i => i.verdict === 'negative').length;
  const neutral = incidents.filter(i => i.verdict === 'neutral' || i.verdict === 'pending').length;
  const totalVotes = incidents.reduce((a, i) => a + (i.vote_correct_new||0) + (i.vote_wrong_new||0), 0);
  const { color: scoreColor } = getScoreStyle(personScore || 1000);
  const pendingAppeals = appeals.filter(a => a.status === 'pending');

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Profil başlık */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {user.instagram_avatar
            ? <img src={user.instagram_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>@{user.instagram_username}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {user.instagram_verified && (
              <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 20, border: '1px solid #bbf7d0', fontWeight: 600 }}>✅ Doğrulanmış</span>
            )}
            {user.instagram_followers > 0 && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{Number(user.instagram_followers).toLocaleString('tr')} takipçi</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{personScore || 1000}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Güven skoru</div>
        </div>
      </div>

      {/* Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { val: incidents.length, label: 'Toplam bildirim', color: '#0f172a' },
          { val: positive, label: 'Olumlu', color: '#16a34a' },
          { val: negative, label: 'Olumsuz', color: '#dc2626' },
          { val: totalVotes, label: 'Toplam oy', color: '#0f172a' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 10, border: '1px solid #f1f5f9', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Son bildirimler */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yükleniyor...</div>
      ) : incidents.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Son bildirimler</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {incidents.slice(0, 8).map((inc, i) => (
              <Link key={inc.id} to={'/olay/' + inc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 7 ? '1px solid #f8fafc' : 'none', color: 'inherit' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>
                  {inc.verdict === 'positive' ? '✅' : inc.verdict === 'negative' ? '❌' : '🤷'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {(inc.vote_correct_new||0) + (inc.vote_wrong_new||0)} oy · {formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, flexShrink: 0,
                  background: inc.verdict === 'positive' ? '#f0fdf4' : inc.verdict === 'negative' ? '#fef2f2' : '#fffbeb',
                  color: inc.verdict === 'positive' ? '#16a34a' : inc.verdict === 'negative' ? '#dc2626' : '#d97706'
                }}>
                  {inc.verdict === 'positive' ? 'Olumlu' : inc.verdict === 'negative' ? 'Olumsuz' : 'Kararsız'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bekleyen itirazlar */}
      {pendingAppeals.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            Bekleyen itirazlar
            <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{pendingAppeals.length}</span>
          </div>
          {pendingAppeals.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < pendingAppeals.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{a.message?.slice(0, 60)}...</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.reason} · {formatDistanceToNow(new Date(a.created_at), { locale: tr, addSuffix: true })}</div>
              </div>
              <span style={{ fontSize: 11, background: '#fffbeb', color: '#d97706', padding: '4px 10px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Bekliyor</span>
            </div>
          ))}
        </div>
      )}

      {incidents.length === 0 && !loading && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: 14 }}>Henüz hakkınızda bildirim yok.</p>
          <p style={{ color: '#64748b', fontSize: 13 }}>Müşterilerinizi <Link to={'/konu/' + user.instagram_username} style={{ color: '#46A53E', fontWeight: 600 }}>profilinize</Link> yönlendirin.</p>
        </div>
      )}
    </div>
  );
}
