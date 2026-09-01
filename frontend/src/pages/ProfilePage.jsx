import { apiFetch } from '../lib/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LogOut, Plus, CheckCircle, Clock, XCircle, Trash2, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';

const STATUS = {
  pending:  { label: 'İncelemede', color: '#92400e', bg: '#fef3c7', icon: <Clock size={12} /> },
  approved: { label: 'Yayında',    color: '#065f46', bg: '#d1fae5', icon: <CheckCircle size={12} /> },
  rejected: { label: 'Reddedildi', color: '#7f1d1d', bg: '#fee2e2', icon: <XCircle size={12} /> },
  removed:  { label: 'Kaldırıldı', color: '#6b7280', bg: '#f3f4f6', icon: <Trash2 size={12} /> },
};

export default function ProfilePage() {
  const [igUsername, setIgUsername] = useState('');
  const [igVerifying, setIgVerifying] = useState(false);
  const [igResult, setIgResult] = useState(null);

  async function verifyInstagram() {
    if (!igUsername.trim()) return;
    setIgVerifying(true);
    setIgResult(null);
    try {
      const { apiFetch } = await import('../lib/api');
      const result = await apiFetch('/instagram/verify', { method: 'POST', body: JSON.stringify({ username: igUsername.replace('@','').trim() }) });
      setIgResult(result);
    } catch(e) { setIgResult({ verified: false, message: e.message }); }
    setIgVerifying(false);
  }
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  async function deleteIncident(id) {
    if (!window.confirm('Bu şikayeti silmek istediğinize emin misiniz?')) return;
    try {
      await apiFetch('/incidents/' + id, { method: 'DELETE' });
      setIncidents(prev => prev.filter(i => i.id !== id));
      toast.success('Şikayet silindi.');
    } catch (e) { toast.error(e.message); }
  }

  useEffect(() => {
    if (!user) return;
    apiFetch('/users/me/incidents').then(data => { setIncidents(data); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb' }}>
      <p style={{ marginBottom: 16, color: '#6b7280' }}>Giriş yapmanız gerekiyor.</p>
      <Link to="/giris" style={{ color: '#46A53E', fontWeight: 600 }}>Giriş Yap</Link>
    </div>
  );

  const tabs = [
    { key: 'all',      label: 'Tümü',       filter: () => true },
    { key: 'approved', label: 'Yayında',     filter: i => i.status === 'approved' },
    { key: 'pending',  label: 'İncelemede',  filter: i => i.status === 'pending' },
    { key: 'rejected', label: 'Reddedildi',  filter: i => i.status === 'rejected' },
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

      {/* Profil kartı */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ height: 72, background: '#46A53E' }} />
        <div style={{ padding: '0 20px 20px', position: 'relative' }}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt="" style={{ width: 68, height: 68, borderRadius: '50%', border: '4px solid white', marginTop: -34, display: 'block' }} />
            : <div style={{ width: 68, height: 68, borderRadius: '50%', border: '4px solid white', marginTop: -34, background: '#46A53E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28 }}>{user.name?.[0]?.toUpperCase()}</div>
          }
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{user.name}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{user.email}</div>
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: user.role === 'admin' ? '#fff7ed' : user.role === 'moderator' ? '#f0fdf4' : '#f3f4f6', color: user.role === 'admin' ? '#c2410c' : user.role === 'moderator' ? '#15803d' : '#6b7280' }}>
                {user.role === 'admin' ? '👑 Admin' : user.role === 'moderator' ? '🛡 Moderatör' : '👤 Üye'}
              </span>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
              <LogOut size={14} /> Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Toplam Olay', value: stats.total,      color: '#46A53E', icon: <BarChart2 size={18} /> },
          { label: 'Yayında',     value: stats.approved,   color: '#22c55e', icon: <CheckCircle size={18} /> },
          { label: 'İncelemede',  value: stats.pending,    color: '#f59e0b', icon: <Clock size={18} /> },
          { label: 'Toplam Oy',   value: stats.totalVotes, color: '#3b82f6', icon: <BarChart2 size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ color: s.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Olaylar */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Paylaştığım Olaylar</div>
          <Link to="/bildir" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#46A53E', color: 'white', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> Yeni
          </Link>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px', overflowX: 'auto' }}>
          {tabs.map(t => {
            const count = incidents.filter(t.filter).length;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: activeTab === t.key ? 600 : 400, color: activeTab === t.key ? '#46A53E' : '#6b7280',
                borderBottom: activeTab === t.key ? '2px solid #46A53E' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap',
              }}>
                {t.label} <span style={{ fontSize: 11, background: activeTab === t.key ? '#46A53E' : '#f3f4f6', color: activeTab === t.key ? 'white' : '#9ca3af', padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              <div style={{ color: '#9ca3af', marginBottom: 12 }}>Bu kategoride olay yok.</div>
              <Link to="/bildir" style={{ color: '#46A53E', fontWeight: 600 }}>İlk olayı bildir</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(inc => {
                const st = STATUS[inc.status] || {};
                const total = inc.vote_ethical + inc.vote_unethical;
                const ethPct = total ? Math.round((inc.vote_ethical / total) * 100) : null;
                return (
                  <div key={inc.id} style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>
                          {st.icon} {st.label}
                        </span>
                        {inc.category_name && <span style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 8px', borderRadius: 20, color: '#6b7280' }}>{inc.category_icon} {inc.category_name}</span>}
                        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
                      </div>
                      {inc.status === 'approved'
                        ? <Link to={'/olay/' + inc.id} style={{ fontWeight: 600, fontSize: 15, color: '#111827', display: 'block', marginBottom: 4 }}>{inc.title}</Link>
                        : <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{inc.title}</div>
                      }
                      {inc.reject_reason && <div style={{ fontSize: 12, color: '#013C26', background: '#f0fdf4', padding: '6px 10px', borderRadius: 6, marginTop: 4 }}>Red: {inc.reject_reason}</div>}
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af', marginTop: 6, alignItems: 'center' }}>
                        <Link to={'/olay-duzenle/' + inc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid #e5e7eb', color: '#374151', fontSize: 12, padding: '6px 12px', borderRadius: 8, marginLeft: 'auto', background: 'white', fontWeight: 500 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Düzenle
                        </Link>
                        <span>{total} oy</span>
                        {ethPct !== null && <span style={{ color: ethPct >= 50 ? '#16a34a' : '#dc2626' }}>{ethPct}% Güvenilir</span>}
                        <button onClick={() => deleteIncident(inc.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: 12, padding: '6px 12px', borderRadius: 8, fontWeight: 500 }}>
                          <Trash2 size={12} /> Sil
                        </button>
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
