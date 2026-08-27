import { useState } from 'react';
import { Heart } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import toast from 'react-hot-toast';

export default function LikeButton({ commentId, initialCount, initialLiked }) {
  const user = useAuthStore(s => s.user);
  const [liked, setLiked] = useState(initialLiked || false);
  const [count, setCount] = useState(initialCount || 0);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) return toast.error('Beğenmek için giriş yapın.');
    if (loading) return;
    setLoading(true);
    try {
      const data = await apiFetch('/comments/' + commentId + '/like', { method: 'POST' });
      setLiked(data.liked);
      setCount(data.likeCount);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <button onClick={toggle} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20, border: 'none',
      background: liked ? '#f0fdf4' : 'transparent',
      color: liked ? '#ef4444' : '#9ca3af',
      fontSize: 12, cursor: 'pointer', marginTop: 6,
      transition: 'all 0.15s',
    }}>
      <Heart size={13} fill={liked ? '#ef4444' : 'none'} />
      {count > 0 && count}
    </button>
  );
}
