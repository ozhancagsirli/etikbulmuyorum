import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Vote, FileText, Building2, Tag } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Yükleniyor...</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>İstatistikler yüklenemedi.</div>;

  const { totals, topSubjects, topCategories } = stats;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: '#111827' }}>📊 İstatistikler</h1>
        <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Platformdaki genel veriler</p>
      </div>

      {/* Genel sayılar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'Toplam Olay', value: totals.total_incidents, icon: <FileText size={20} />, color: '#FF4500' },
          { label: 'Bu Hafta', value: totals.incidents_this_week, icon: <TrendingUp size={20} />, color: '#3b82f6' },
          { label: 'Toplam Oy', value: totals.total_votes, icon: <Vote size={20} />, color: '#22c55e' },
          { label: 'Kullanıcı', value: totals.total_users, icon: <Users size={20} />, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>{Number(s.value).toLocaleString('tr')}</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* En çok şikayet edilen markalar */}
      {topSubjects.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="#FF4500" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>En Çok Şikayet Edilen</span>
          </div>
          <div>
            {topSubjects.map((s, idx) => {
              const total = Number(s.ethical) + Number(s.unethical);
              const ethPct = total ? Math.round((Number(s.ethical) / total) * 100) : null;
              return (
                <Link key={s.subject} to={'/konu/' + encodeURIComponent(s.subject)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: idx < topSubjects.length - 1 ? '1px solid #f9fafb' : 'none', color: 'inherit', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#e5e7eb', minWidth: 28 }}>#{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>{s.subject}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1, height: 6, background: '#fecaca', borderRadius: 3, overflow: 'hidden', maxWidth: 120 }}>
                        {ethPct !== null && <div style={{ width: ethPct + '%', height: '100%', background: '#22c55e', borderRadius: 3 }} />}
                      </div>
                      {ethPct !== null && <span style={{ fontSize: 11, color: ethPct >= 50 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{ethPct}% Etik</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{s.count} olay</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Kategorilere göre dağılım */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={18} color="#FF4500" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Kategorilere Göre</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topCategories.map(c => {
            const maxCount = Math.max(...topCategories.map(x => Number(x.count)));
            const pct = maxCount ? Math.round((Number(c.count) / maxCount) * 100) : 0;
            return (
              <div key={c.name_tr} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{c.name_tr}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.count} olay</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: '#FF4500', borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
