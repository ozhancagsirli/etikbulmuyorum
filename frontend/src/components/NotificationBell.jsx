import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function NotificationBell() {
  const user = useAuthStore(s => s.user);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {}
  }

  async function markRead() {
    setOpen(o => !o);
    if (unread > 0) {
      try {
        await apiFetch('/notifications/read', { method: 'PUT' });
        setUnread(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch {}
    }
  }

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={markRead} style={{
        position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', display: 'flex', alignItems: 'center', color: '#6b7280',
      }}>
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, width: 16, height: 16,
            background: '#ef4444', color: 'white', borderRadius: '50%',
            fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, width: 320, background: 'white',
          borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden', zIndex: 200,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 14 }}>
            🔔 Bildirimler
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Henüz bildirim yok.
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.map(n => (
                <Link key={n.id} to={n.link || '/'} onClick={() => setOpen(false)} style={{
                  display: 'block', padding: '12px 16px', borderBottom: '1px solid #f9fafb',
                  background: n.is_read ? 'white' : '#fffbeb', color: 'inherit',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background=n.is_read ? 'white' : '#fffbeb'}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {formatDistanceToNow(new Date(n.created_at), { locale: tr, addSuffix: true })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
