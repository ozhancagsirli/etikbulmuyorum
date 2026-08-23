import { useState } from 'react';
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
        setEthical(data.voteEthical);
        setUnethical(data.voteUnethical);
        setMyVote(null);
      } else {
        const data = await apiFetch('/votes/' + incidentId, {
          method: 'POST',
          body: JSON.stringify({ verdict }),
        });
        setEthical(data.voteEthical);
        setUnethical(data.voteUnethical);
        setMyVote(verdict);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button
        onClick={() => vote('ethical')}
        disabled={loading}
        style={{
          flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
          border: myVote === 'ethical' ? '2px solid #46d160' : '1.5px solid #e0e0e0',
          background: myVote === 'ethical' ? '#e6f9eb' : 'white',
          color: myVote === 'ethical' ? '#1a7f37' : '#333',
        }}
      >
        ✅ {myVote === 'ethical' ? 'Etik Oyladınız' : 'Etik'}
      </button>
      <button
        onClick={() => vote('unethical')}
        disabled={loading}
        style={{
          flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
          border: myVote === 'unethical' ? '2px solid #f85149' : '1.5px solid #e0e0e0',
          background: myVote === 'unethical' ? '#ffeef0' : 'white',
          color: myVote === 'unethical' ? '#cf222e' : '#333',
        }}
      >
        ❌ {myVote === 'unethical' ? 'Etik Değil Oyladınız' : 'Etik Değil'}
      </button>
    </div>
  );
}
