import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Shield, CheckCircle, XCircle, BarChart2, Trophy, Users, FileText, ThumbsUp, Eye, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export default function ModerationPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, tab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (tab === 'pending') {
        const data = await apiFetch('/moderation/pending');
        setIncidents(data);
      } else if (tab === 'approved' || tab === 'rejected') {
        const data = await apiFetch('/moderation/incidents?status=' + tab);
        setIncidents(data);
      } else if (tab === 'stats') {
        const data = await apiFetch('/stats');
        setStats(data);
      } else if (tab === 'leaderboard') {
        const data = await apiFetch('/leaderboard');
        setLeaders(data);
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function approve(id) {
    try {
      await apiFetch('/moderation/incidents/' + id + '/approve', { method: 'POST' });
      setIncidents(prev => prev.filter(i => i.id !== id));
      toast.success('Olay onaylandı.');
    } catch (e) { toast.error(e.message); }
  }

  async function reject(id) {
    const reason = rejectReason[id] || '';
    try {
      await apiFetch('/moderation/incidents/' + id + '/reject', { method: 'POST', body: JSON.stringify({ reason }) });
      setIncidents(prev => prev.filter(i => i.id !== id));
      toast.success('Olay reddedildi.');
    } catch (e) { toast.error(e.message); }
  }

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) return null;

  const tabs = [
    { key: 'pending',     label: '⏳ Bekleyenler', icon: <Shield size={15} /> },
    { key: 'approved',    label: '✅ Onaylananlar', icon: <CheckCircle size={15} /> },
    { key: 'rejected',    label: '❌ Reddedilenler', icon: <XCircle size={15} /> },
    { key: 'stats',       label: '📊 İstatistikler', icon: <BarChart2 size={15} /> },
    { key: 'leaderboard', label: '🏆 Liderboard',    icon: <Trophy size={15} /> },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shield size={22} color="#FF4500" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Moderasyon Paneli</h1>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Admin görünümü</p>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 16, display: 'flex', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? '#FF4500' : '#6b7280',
            borderBottom: tab === t.key ? '2px solid #FF4500' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</div>
      ) : (

        /* Olay listesi */
        (tab === 'pending' || tab === 'approved' || tab === 'rejected') ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                Bu kategoride olay yok.
              </div>
            ) : incidents.map(inc => (
              <div key={inc.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {inc.category_name && <span style={{ fontSize: 11, background: '#fff5f0', color: '#FF4500', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{inc.category_icon} {inc.category_name}</span>}
                  {inc.subject && <span style={{ fontSize: 11, background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: 20 }}>📌 {inc.subject}</span>}
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
                </div>
                <Link to={'/olay/' + inc.id}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>{inc.title}</h3>
                </Link>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {inc.description}
                </p>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                  👤 {inc.author_name || 'Anonim'} · {inc.vote_ethical + inc.vote_unethical} oy · 👁 {inc.view_count}
                </div>
                {tab === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      placeholder="Red sebebi (isteğe bağlı)..."
                      value={rejectReason[inc.id] || ''}
                      onChange={e => setRejectReason(r => ({ ...r, [inc.id]: e.target.value }))}
                      style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 150 }}
                    />
                    <button onClick={() => approve(inc.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      <CheckCircle size={14} /> Onayla
                    </button>
                    <button onClick={() => reject(inc.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      <XCircle size={14} /> Reddet
                    </button>
                  </div>
                )}
                {tab === 'rejected' && inc.reject_reason && (
                  <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: 6 }}>
                    Red sebebi: {inc.reject_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) :

        /* İstatistikler */
        tab === 'stats' && stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { label: 'Toplam Olay', value: stats.totals.total_incidents, color: '#FF4500', icon: <FileText size={20} /> },
                { label: 'Bu Hafta', value: stats.totals.incidents_this_week, color: '#3b82f6', icon: <BarChart2 size={20} /> },
                { label: 'Toplam Oy', value: stats.totals.total_votes, color: '#22c55e', icon: <ThumbsUp size={20} /> },
                { label: 'Kullanıcı', value: stats.totals.total_users, color: '#f59e0b', icon: <Users size={20} /> },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>{Number(s.value).toLocaleString('tr')}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {stats.topSubjects.length > 0 && (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={16} color="#FF4500" /> En Çok Şikayet Edilen
                </div>
                {stats.topSubjects.map((s, idx) => {
                  const total = Number(s.ethical) + Number(s.unethical);
                  const ethPct = total ? Math.round((Number(s.ethical) / total) * 100) : null;
                  return (
                    <Link key={s.subject} to={'/konu/' + encodeURIComponent(s.subject)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #f9fafb', color: 'inherit' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#e5e7eb', minWidth: 24 }}>#{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.subject}</div>
                        {ethPct !== null && <div style={{ fontSize: 12, color: ethPct >= 50 ? '#16a34a' : '#dc2626' }}>{ethPct}% Etik</div>}
                      </div>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>{s.count} olay</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 15 }}>📂 Kategorilere Göre</div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.topCategories.map(c => {
                  const maxCount = Math.max(...stats.topCategories.map(x => Number(x.count)));
                  const pct = maxCount ? Math.round((Number(c.count) / maxCount) * 100) : 0;
                  return (
                    <div key={c.name_tr} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20, width: 28 }}>{c.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name_tr}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.count} olay</span>
                        </div>
                        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: pct + '%', height: '100%', background: '#FF4500', borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) :

        /* Liderboard */
        tab === 'leaderboard' ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {leaders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Henüz kullanıcı yok.</div>
            ) : leaders.map((u, idx) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: idx < leaders.length - 1 ? '1px solid #f9fafb' : 'none', background: idx === 0 ? '#fffbeb' : 'white' }}>
                <span style={{ fontSize: idx < 3 ? 22 : 14, fontWeight: 700, color: '#d1d5db', minWidth: 30, textAlign: 'center' }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </span>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#FF4500' }}>{u.name?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    <span><FileText size={11} style={{ display: 'inline' }} /> {u.incident_count} olay</span>
                    <span><ThumbsUp size={11} style={{ display: 'inline' }} /> {u.total_votes} oy</span>
                    <span><Eye size={11} style={{ display: 'inline' }} /> {u.total_views} görüntülenme</span>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#FF4500' }}>{u.total_votes}</div>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}
