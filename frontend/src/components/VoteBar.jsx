import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

const VOTES = [
  { key: 'correct',      label: 'Doğru',           icon: <ThumbsUp size={16} />,    color: '#16a34a', bg: '#f0fdf4', border: '#22c55e' },
  { key: 'wrong',        label: 'Yanlış',           icon: <ThumbsDown size={16} />,  color: '#013C26', bg: '#f0fdf4', border: '#ef4444' },
  { key: 'neutral',      label: 'Nötr',             icon: <Minus size={16} />,       color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
  { key: 'insufficient', label: 'Yetersiz Bilgi',   icon: <HelpCircle size={16} />,  color: '#d97706', bg: '#fffbeb', border: '#fbbf24' },
];

export default function VoteBar({ incidentId, initialVotes, initialMyVote }) {
  const user = useAuthStore(s => s.user);
  const [votes, setVotes] = useState(initialVotes || { correct: 0, wrong: 0, neutral: 0, insufficient: 0 });
  const [myVote, setMyVote] = useState(initialMyVote || null);
  const [trustScore, setTrustScore] = useState(initialVotes?.trustScore || 0);
  const [loading, setLoading] = useState(false);

  async function vote(verdict) {
    if (!user) return toast.error('Oy vermek için giriş yapın.');
    if (loading) return;
    setLoading(true);
    try {
      if (myVote === verdict) {
        const data = await apiFetch('/votes/' + incidentId, { method: 'DELETE' });
        setVotes({ correct: data.voteCorrect, wrong: data.voteWrong, neutral: data.voteNeutral, insufficient: data.voteInsufficient });
        setTrustScore(data.trustScore);
        setMyVote(null);
      } else {
        const data = await apiFetch('/votes/' + incidentId, { method: 'POST', body: JSON.stringify({ verdict }) });
        setVotes({ correct: data.voteCorrect, wrong: data.voteWrong, neutral: data.voteNeutral, insufficient: data.voteInsufficient });
        setTrustScore(data.trustScore);
        setMyVote(verdict);
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  const total = votes.correct + votes.wrong + votes.neutral + votes.insufficient;

  return (
    <div>
      {/* Güven Skoru */}
      {total > 0 && (
        <div style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 10, marginBottom: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: trustScore >= 50 ? '#16a34a' : trustScore >= -10 ? '#d97706' : '#dc2626' }}>
            {trustScore > 0 ? '+' : ''}{trustScore}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Güven Skoru · {total} değerlendirme
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: trustScore >= 50 ? '#16a34a' : trustScore >= -10 ? '#d97706' : '#dc2626' }}>
            {trustScore >= 50 ? '🟢 Güvenilir' : trustScore >= -10 ? '🟡 Dikkatli Ol' : '🔴 Güvenilmez'}
          </div>
        </div>
      )}

      {/* Oy butonları */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {VOTES.map(v => (
          <button key={v.key} onClick={() => vote(v.key)} disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
            border: `1.5px solid ${myVote === v.key ? v.border : '#e5e7eb'}`,
            background: myVote === v.key ? v.bg : 'white',
            color: myVote === v.key ? v.color : '#374151',
            transition: 'all 0.15s',
          }}>
            {v.icon} {v.label}
            {votes[v.key] > 0 && <span style={{ fontSize: 11, color: '#9ca3af' }}>({votes[v.key]})</span>}
          </button>
        ))}
      </div>

      {myVote && (
        <button onClick={() => vote(myVote)} style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
          Oyumu geri al
        </button>
      )}
    </div>
  );
}
