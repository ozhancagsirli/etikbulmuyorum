import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import { useNavigate } from 'react-router-dom';

export default function SentimentBar({ incidentId, initialVotes = {} }) {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [votes, setVotes] = useState({ positive: 0, neutral: 0, negative: 0, my_vote: null, ...initialVotes });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/sentiment/' + incidentId).then(setVotes).catch(() => {});
  }, [incidentId]);

  async function vote(sentiment) {
    if (!user) return navigate('/giris');
    if (loading) return;
    setLoading(true);
    try {
      const result = await apiFetch('/sentiment/' + incidentId, {
        method: 'POST',
        body: JSON.stringify({ vote: sentiment })
      });
      setVotes(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const total = votes.positive + votes.neutral + votes.negative;
  const posPct = total ? Math.round(votes.positive / total * 100) : 0;
  const neuPct = total ? Math.round(votes.neutral / total * 100) : 0;
  const negPct = total ? Math.round(votes.negative / total * 100) : 0;

  const buttons = [
    { key: 'positive', emoji: '😊', label: 'Olumlu', color: '#16a34a', bg: '#f0fdf4', activeBg: '#16a34a', count: votes.positive },
    { key: 'neutral',  emoji: '😐', label: 'Nötr',   color: '#d97706', bg: '#fffbeb', activeBg: '#d97706', count: votes.neutral },
    { key: 'negative', emoji: '😠', label: 'Olumsuz', color: '#dc2626', bg: '#fef2f2', activeBg: '#dc2626', count: votes.negative },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
        Bu bildirim hakkında ne düşünüyorsunuz?
        {total > 0 && <span style={{ fontWeight: 400, marginLeft: 6 }}>{total} değerlendirme</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {buttons.map(btn => {
          const isActive = votes.my_vote === btn.key;
          return (
            <button key={btn.key} onClick={() => vote(btn.key)} disabled={loading}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 10,
                border: `2px solid ${isActive ? btn.activeBg : '#e5e7eb'}`,
                background: isActive ? btn.activeBg : btn.bg,
                color: isActive ? 'white' : btn.color,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s', fontWeight: isActive ? 700 : 500,
                opacity: loading ? 0.7 : 1,
              }}>
              <span style={{ fontSize: 24 }}>{btn.emoji}</span>
              <span style={{ fontSize: 12 }}>{btn.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{btn.count}</span>
            </button>
          );
        })}
      </div>

      {total > 0 && (
        <div style={{ borderRadius: 8, overflow: 'hidden', height: 8, display: 'flex', gap: 1 }}>
          {posPct > 0 && <div style={{ width: posPct + '%', background: '#16a34a', transition: 'width 0.3s' }} title={`Olumlu: ${posPct}%`} />}
          {neuPct > 0 && <div style={{ width: neuPct + '%', background: '#d97706', transition: 'width 0.3s' }} title={`Nötr: ${neuPct}%`} />}
          {negPct > 0 && <div style={{ width: negPct + '%', background: '#dc2626', transition: 'width 0.3s' }} title={`Olumsuz: ${negPct}%`} />}
        </div>
      )}
    </div>
  );
}
