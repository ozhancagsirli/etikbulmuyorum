import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export default function ModerationPage() {
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        apiFetch('/moderation/pending'),
        apiFetch('/moderation/reports'),
      ]);
      setPending(p);
      setReports(r);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return (
      <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <p style={{ color: '#555' }}>Bu sayfaya erisim yetkiniz yok.</p>
      </div>
    );
  }

  async function approve(id) {
    try {
      await apiFetch('/moderation/incidents/' + id + '/approve', { method: 'POST' });
      setPending(p => p.filter(i => i.id !== id));
      toast.success('Olay onaylandi ve yayinlandi.');
    } catch (e) { toast.error(e.message); }
  }

  async function reject(id) {
    if (!rejectReason.trim()) return toast.error('Red sebebi yazin.');
    try {
      await apiFetch('/moderation/incidents/' + id + '/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setPending(p => p.filter(i => i.id !== id));
      setRejectId(null);
      setRejectReason('');
      toast.success('Olay reddedildi.');
    } catch (e) { toast.error(e.message); }
  }

  async function resolveReport(id) {
    try {
      await apiFetch('/moderation/reports/' + id + '/resolve', { method: 'POST' });
      setReports(r => r.filter(x => x.id !== id));
      toast.success('Sikayet cozumlendi.');
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', padding: '20px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Moderasyon Paneli</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
          {user.role === 'admin' ? 'Admin' : 'Moderator'} olarak giris yapildi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e0e0e0', padding: '16px 20px', textAlign: 'center', cursor: 'pointer', borderColor: tab === 'pending' ? '#FF4500' : '#e0e0e0' }}
          onClick={() => setTab('pending')}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#FF4500' }}>{pending.length}</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Bekleyen Olay</div>
        </div>
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e0e0e0', padding: '16px 20px', textAlign: 'center', cursor: 'pointer', borderColor: tab === 'reports' ? '#FF4500' : '#e0e0e0' }}
          onClick={() => setTab('reports')}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f85149' }}>{reports.length}</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Acik Sikayet</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          {[
            { key: 'pending', label: 'Bekleyen Olaylar', count: pending.length },
            { key: 'reports', label: 'Sikayetler',        count: reports.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#FF4500' : '#666',
              borderBottom: tab === t.key ? '2px solid #FF4500' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {t.label}
              <span style={{
                fontSize: 12, padding: '2px 8px', borderRadius: 20,
                background: tab === t.key ? '#FF4500' : '#f0f0f0',
                color: tab === t.key ? 'white' : '#888',
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Yukleniyor...</div>
          ) : tab === 'pending' ? (
            pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ color: '#888' }}>Inceleme bekleyen olay yok!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pending.map(inc => (
                  <div key={inc.id} style={{ borderRadius: 10, border: '1px solid #eee', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
                        {inc.category_name && <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 20 }}>{inc.category_name}</span>}
                        <span>Gonderen: <strong style={{ color: '#333' }}>{inc.author_name}</strong></span>
                        <span>{inc.author_email}</span>
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#1c1c1c' }}>{inc.title}</h3>

                      <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6,
                        maxHeight: expanded === inc.id ? 'none' : 80,
                        overflow: 'hidden', position: 'relative' }}>
                        {inc.description}
                      </div>
                      {inc.description?.length > 200 && (
                        <button onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
                          style={{ background: 'none', border: 'none', color: '#FF4500', cursor: 'pointer', fontSize: 13, padding: '4px 0', marginTop: 4 }}>
                          {expanded === inc.id ? 'Daha az goster' : 'Tamamini goster'}
                        </button>
                      )}
                    </div>

                    <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', background: 'white' }}>
                      {rejectId === inc.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Red sebebini yazin..."
                            rows={2}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none' }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => reject(inc.id)} style={{
                              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                              background: '#f85149', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                            }}>Reddet</button>
                            <button onClick={() => { setRejectId(null); setRejectReason(''); }} style={{
                              flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #ddd',
                              background: 'white', color: '#555', cursor: 'pointer', fontSize: 13,
                            }}>Iptal</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => approve(inc.id)} style={{
                            flex: 1, padding: '9px', borderRadius: 8, border: 'none',
                            background: '#46d160', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                          }}>
                            Onayla ve Yayinla
                          </button>
                          <button onClick={() => setRejectId(inc.id)} style={{
                            flex: 1, padding: '9px', borderRadius: 8, border: '1px solid #f85149',
                            background: 'white', color: '#f85149', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                          }}>
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ color: '#888' }}>Acik sikayet yok!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #eee', background: '#fafafa' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
                      <span style={{ background: '#ffeef0', color: '#cf222e', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                        {r.reason}
                      </span>
                      <span>Sikayet eden: <strong style={{ color: '#333' }}>{r.reporter_name}</strong></span>
                    </div>
                    {r.incident_title && (
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Olay: {r.incident_title}</div>
                    )}
                    {r.comment_content && (
                      <div style={{ fontSize: 13, color: '#555', background: '#f8f9fa', padding: '8px 12px', borderRadius: 6, marginBottom: 8 }}>
                        Yorum: {r.comment_content}
                      </div>
                    )}
                    {r.details && (
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Not: {r.details}</div>
                    )}
                    <button onClick={() => resolveReport(r.id)} style={{
                      padding: '7px 16px', borderRadius: 20, border: '1px solid #ddd',
                      background: 'white', color: '#555', cursor: 'pointer', fontSize: 13,
                    }}>
                      Cozumlendi olarak isaretle
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
