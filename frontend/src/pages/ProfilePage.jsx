import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

const STATUS = {
  pending:  { label: 'Incelemede', color: '#856404', bg: '#fff3cd', dot: '#f0c040' },
  approved: { label: 'Yayinda',    color: '#155724', bg: '#d4edda', dot: '#46d160' },
  rejected: { label: 'Reddedildi', color: '#721c24', bg: '#f8d7da', dot: '#f85149' },
  removed:  { label: 'Kaldirildi', color: '#666',    bg: '#f0f0f0', dot: '#aaa' },
};

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    apiFetch('/users/me/incidents')
      .then(data => { setIncidents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e0e0e0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
      <p style={{ marginBottom: 16, color: '#555' }}>Giris yapmaniz gerekiyor.</p>
      <Link to="/" style={{ color: '#FF4500', fontWeight: 600 }}>Ana sayfaya don</Link>
    </div>
  );

  const tabs = [
    { key: 'all',      label: 'Tumu',        filter: () => true },
    { key: 'approved', label: 'Yayinda',      filter: i => i.status === 'approved' },
    { key: 'pending',  label: 'Incelemede',   filter: i => i.status === 'pending' },
    { key: 'rejected', label: 'Reddedildi',   filter: i => i.status === 'rejected' },
  ];

  const filtered = incidents.filter(tabs.find(t => t.key === activeTab)?.filter || (() => true));

  const stats = {
    total:      incidents.length,
    approved:   incidents.filter(i => i.status === 'approved').length,
    pending:    incidents.filter(i => i.status === 'pending').length,
    totalVotes: incidents.reduce((a, i) => a + i.vote_ethical + i.vote_unethical, 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <div style={{ height: 80, background: '#FF4500' }} />
        <div style={{ padding: '0 24px 20px', position: 'relative' }}>
          <img
            src={user.avatarUrl}
            alt=""
            style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid white', marginTop: -36, display: 'block' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{user.name}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{user.email}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: user.role === 'admin' ? '#fff3e0' : user.role === 'moderator' ? '#e8f5e9' : '#f0f0f0',
                  color: user.role === 'admin' ? '#e65100' : user.role === 'moderator' ? '#2e7d32' : '#555',
                }}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Moderator' : 'Uye'}
                </span>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} style={{
              padding: '7px 16px', borderRadius: 20, border: '1px solid #ddd',
              background: 'white', color: '#555', fontSize: 13, cursor: 'pointer',
            }}>Cikis Yap</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Toplam Olay', value: stats.total,      color: '#FF4500' },
          { label: 'Yayinda',     value: stats.approved,   color: '#46d160' },
          { label: 'Incelemede',  value: stats.pending,    color: '#f0c040' },
          { label: 'Toplam Oy',   value: stats.totalVotes, color: '#378ADD' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, border: '1px solid #e0e0e0', padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Paylastigim Olaylar</div>
          <Link to="/bildir" style={{ background: '#FF4500', color: 'white', padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            + Yeni Olay
          </Link>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 20px' }}>
          {tabs.map(t => {
            const count = incidents.filter(t.filter).length;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? '#FF4500' : '#666',
                borderBottom: activeTab === t.key ? '2px solid #FF4500' : '2px solid transparent',
                marginBottom: -1,
              }}>
                {t.label}{' '}
                <span style={{
                  fontSize: 11, background: activeTab === t.key ? '#FF4500' : '#f0f0f0',
                  color: activeTab === t.key ? 'white' : '#888',
                  padding: '1px 6px', borderRadius: 10, marginLeft: 4,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 32 }}>Yukleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ color: '#888', marginBottom: 12 }}>Bu kategoride olay yok.</div>
              <Link to="/bildir" style={{ color: '#FF4500', fontWeight: 600 }}>Ilk olayi bildir</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(inc => {
                const st = STATUS[inc.status] || {};
                const total = inc.vote_ethical + inc.vote_unethical;
                const ethPct = total ? Math.round((inc.vote_ethical / total) * 100) : null;
                return (
                  <div key={inc.id} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #eee', background: '#fafafa', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
                      {ethPct !== null ? (
                        <>
                          <span style={{ fontSize: 11, color: '#46d160', fontWeight: 700 }}>{ethPct}%</span>
                          <div style={{ width: 6, height: 40, background: '#fdb8c0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: ethPct + '%', background: '#46d160', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#f85149', fontWeight: 700 }}>{100 - ethPct}%</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 10, color: '#ccc', textAlign: 'center' }}>oy yok</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                          {st.label}
                        </span>
                        {inc.category_name && (
                          <span style={{ fontSize: 11, background: '#f0f0f0', padding: '2px 8px', borderRadius: 20, color: '#666' }}>
                            {inc.category_icon} {inc.category_name}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>
                          {formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}
                        </span>
                      </div>

                      {inc.status === 'approved' ? (
                        <Link to={'/olay/' + inc.id} style={{ fontWeight: 600, fontSize: 15, color: '#1c1c1c', display: 'block', marginBottom: 6 }}>
                          {inc.title}
                        </Link>
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{inc.title}</div>
                      )}

                      {inc.reject_reason && (
                        <div style={{ fontSize: 12, color: '#721c24', background: '#f8d7da', padding: '6px 10px', borderRadius: 6, marginBottom: 6 }}>
                          Red sebebi: {inc.reject_reason}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#888' }}>
                        <span>{total} oy</span>
                        {inc.status === 'approved' && (
                          <Link to={'/olay/' + inc.id} style={{ color: '#FF4500', fontWeight: 500 }}>Goruntule</Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
