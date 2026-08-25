import { useState } from 'react';
import { ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export default function VoteBar({ incidentId, initialEthical, initialUnethical, initialMyVote }) {
  const user = useAuthStore(s => s.user);
  const [ethical,   setEthical]   = useState(initialEthical);
  const [unethical, setUnethical] = useState(initialUnethical);
  const [myVote,    setMyVote]    = useState(initialMyVote || null);
  const [loading,   setLoading]   = useState(false);

  async function vote(verdict) {
    if (!user) return toast.error('Oy vermek için giriş yapın.');
    if (loading) return;
    setLoading(true);
    try {
      if (myVote === verdict) {
        const data = await apiFetch('/votes/' + incidentId, { method: 'DELETE' });
        setEthical(data.voteEthical); setUnethical(data.voteUnethical); setMyVote(null);
      } else {
        const data = await apiFetch('/votes/' + incidentId, { method: 'POST', body: JSON.stringify({ verdict }) });
        setEthical(data.voteEthical); setUnethical(data.voteUnethical); setMyVote(verdict);
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button onClick={() => vote('ethical')} disabled={loading} style={{
        flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
        border: myVote === 'ethical' ? '2px solid #22c55e' : '1.5px solid #e5e7eb',
        background: myVote === 'ethical' ? '#f0fdf4' : 'white',
        color: myVote === 'ethical' ? '#16a34a' : '#374151',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.15s',
      }}>
        <ThumbsUp size={18} strokeWidth={myVote === 'ethical' ? 2.5 : 2} />
        {myVote === 'ethical' ? 'Güvenilir Oyladınız' : 'Etik'}
      </button>
      <button onClick={() => vote('unethical')} disabled={loading} style={{
        flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
        border: myVote === 'unethical' ? '2px solid #ef4444' : '1.5px solid #e5e7eb',
        background: myVote === 'unethical' ? '#fef2f2' : 'white',
        color: myVote === 'unethical' ? '#dc2626' : '#374151',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.15s',
      }}>
        <ThumbsDown size={18} strokeWidth={myVote === 'unethical' ? 2.5 : 2} />
        {myVote === 'unethical' ? 'Güvenilmez Oyladınız' : 'Etik Değil'}
      </button>
    </div>
  );
}
