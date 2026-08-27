import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, FileText, Eye, ThumbsUp } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/leaderboard').then(setLeaders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trophy size={22} color="#46A53E" />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Liderboard</h1>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>En aktif kullanıcılar</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</div>
        ) : leaders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Henüz kullanıcı yok.</div>
        ) : (
          leaders.map((u, idx) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              borderBottom: idx < leaders.length - 1 ? '1px solid #f9fafb' : 'none',
              background: idx === 0 ? '#fffbeb' : idx === 1 ? '#f8fafc' : idx === 2 ? '#fff8f5' : 'white',
            }}>
              <span style={{ fontSize: idx < 3 ? 24 : 16, fontWeight: 700, color: '#d1d5db', minWidth: 32, textAlign: 'center' }}>
                {idx < 3 ? medals[idx] : idx + 1}
              </span>
              <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontWeight: 700, color: '#46A53E', fontSize: 16 }}>{u.name?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{u.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af', marginTop: 2, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={11} /> {u.incident_count} olay</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ThumbsUp size={11} /> {u.total_votes} oy</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {u.total_views} görüntülenme</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#46A53E' }}>{u.total_votes}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>toplam oy</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
