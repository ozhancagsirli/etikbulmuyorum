import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import { useNavigate } from 'react-router-dom';

function getPersonLabel(score) {
  if (score === null) return { label: 'Henüz değerlendirme yok', icon: '❔', color: '#9ca3af' };
  if (score >= 850) return { label: 'Söz tutar', icon: '🤝', color: '#16a34a' };
  if (score >= 650) return { label: 'Genelde güvenilir', icon: '👌', color: '#46A53E' };
  if (score >= 450) return { label: 'Bilmiyorum', icon: '🤷', color: '#d97706' };
  if (score >= 250) return { label: 'Dikkat et', icon: '⚠️', color: '#f97316' };
  return { label: 'Kaçın', icon: '🚫', color: '#dc2626' };
}

function getVerdictInfo(verdict, total) {
  if (total < 10) return { text: `${total}/10 oy · Karar için daha fazla oy gerekli`, color: '#9ca3af', bg: '#f9fafb' };
  if (verdict === 'positive') return { text: 'Topluluk bu olayı doğruladı ✓', color: '#16a34a', bg: '#f0fdf4' };
  if (verdict === 'negative') return { text: 'Topluluk bu olayı reddetti ✗', color: '#dc2626', bg: '#fef2f2' };
  return { text: 'Topluluk kararsız', color: '#d97706', bg: '#fffbeb' };
}

export default function SentimentBar({ incidentId }) {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [votes, setVotes] = useState({ correct: 0, wrong: 0, total: 0, verdict: 'pending', my_vote: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/sentiment/' + incidentId).then(setVotes).catch(() => {});
  }, [incidentId]);

  async function vote(type) {
    if (!user) return navigate('/giris');
    if (loading) return;
    setLoading(true);
    try {
      const result = await apiFetch('/sentiment/' + incidentId, {
        method: 'POST',
        body: JSON.stringify({ vote: type })
      });
      setVotes(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const total = votes.correct + votes.wrong;
  const correctPct = total ? Math.round(votes.correct / total * 100) : 0;
  const wrongPct = total ? 100 - correctPct : 0;
  const verdictInfo = getVerdictInfo(votes.verdict, total);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
        Bu olay hakkında ne düşünüyorsunuz?
      </div>

      {/* Oy butonları */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button onClick={() => vote('correct')} disabled={loading} style={{
          flex: 1, padding: '14px', borderRadius: 12,
          border: `2px solid ${votes.my_vote === 'correct' ? '#16a34a' : '#e5e7eb'}`,
          background: votes.my_vote === 'correct' ? '#16a34a' : '#f9fafb',
          color: votes.my_vote === 'correct' ? 'white' : '#374151',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: 24 }}>👍</span>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{votes.correct}</span>
        </button>

        <button onClick={() => vote('wrong')} disabled={loading} style={{
          flex: 1, padding: '14px', borderRadius: 12,
          border: `2px solid ${votes.my_vote === 'wrong' ? '#dc2626' : '#e5e7eb'}`,
          background: votes.my_vote === 'wrong' ? '#dc2626' : '#f9fafb',
          color: votes.my_vote === 'wrong' ? 'white' : '#374151',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: 24 }}>👎</span>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{votes.wrong}</span>
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 10, marginBottom: 6 }}>
            <div style={{ width: correctPct + '%', background: '#16a34a', transition: 'width 0.4s' }} />
            <div style={{ width: wrongPct + '%', background: '#dc2626', transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>👍 %{correctPct}</span>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>%{wrongPct} 👎</span>
          </div>
        </div>
      )}

      {/* Karar */}
      <div style={{ padding: '10px 14px', borderRadius: 8, background: verdictInfo.bg, fontSize: 13, color: verdictInfo.color, fontWeight: 600, textAlign: 'center' }}>
        {verdictInfo.text}
      </div>
    </div>
  );
}
