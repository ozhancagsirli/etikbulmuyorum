import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';

export default function SubjectPage() {
  const { name } = useParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedName = decodeURIComponent(name);

  useEffect(() => {
    apiFetch('/incidents?subject=' + encodeURIComponent(decodedName) + '&limit=15')
      .then(data => { setIncidents(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  const totalVotes = incidents.reduce((a, i) => a + i.vote_ethical + i.vote_unethical, 0);
  const totalEthical = incidents.reduce((a, i) => a + i.vote_ethical, 0);
  const overallPct = totalVotes ? Math.round((totalEthical / totalVotes) * 100) : null;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <Link to="/" style={{ color: '#FF4500', fontSize: 13 }}>← Ana sayfaya dön</Link>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e0e0', padding: '24px 28px', margin: '12px 0', display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
          🏢
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{decodedName}</h1>
          <div style={{ fontSize: 13, color: '#888', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{incidents.length} olay</span>
            <span>{totalVotes} toplam oy</span>
            {overallPct !== null && (
              <span style={{ color: overallPct >= 50 ? '#46d160' : '#f85149', fontWeight: 600 }}>
                {overallPct >= 50 ? `✅ Genel olarak ${overallPct}% Etik bulundu` : `❌ Genel olarak ${100-overallPct}% Etik Dışı bulundu`}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Yükleniyor...</div>
      ) : incidents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#888' }}>Bu konu hakkında henüz olay yok.</p>
          <Link to="/bildir" style={{ color: '#FF4500', fontWeight: 600 }}>Olay Bildir →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {incidents.map(inc => {
            const total = inc.vote_ethical + inc.vote_unethical;
            const ethPct = total ? Math.round((inc.vote_ethical / total) * 100) : null;
            const isEthical = inc.verdict === 'ethical';
            const isUnethical = inc.verdict === 'unethical';

            if (isEthical) {
              return (
                <div key={inc.id} style={{ background: '#f0fdf4', borderRadius: 12, border: '1.5px solid #46d160', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <Link to={'/olay/' + inc.id} style={{ fontSize: 14, fontWeight: 600, color: '#1a7f37' }}>{inc.title}</Link>
                    <div style={{ fontSize: 11, color: '#86efac', marginTop: 2 }}>{ethPct}% Etik · {total} oy</div>
                  </div>
                </div>
              );
            }

            return (
              <div key={inc.id} style={{ background: 'white', borderRadius: 12, border: isUnethical ? '1.5px solid #f85149' : '1px solid #e0e0e0', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {isUnethical && <span style={{ fontSize: 11, background: '#ffeef0', color: '#cf222e', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>❌ Etik Dışı Sonuçlandı</span>}
                  {inc.category_name && <span style={{ fontSize: 11, background: '#fff5f0', color: '#FF4500', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{inc.category_icon} {inc.category_name}</span>}
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
                </div>
                <Link to={'/olay/' + inc.id}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#1c1c1c', lineHeight: 1.4 }}>{inc.title}</h3>
                </Link>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {inc.description}
                </p>
                {ethPct !== null && (
                  <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#46d160', fontWeight: 600 }}>✅ {ethPct}% Etik</span>
                    <span style={{ color: '#f85149', fontWeight: 600 }}>❌ {100-ethPct}% Etik Değil</span>
                    <span style={{ color: '#aaa' }}>· {total} oy</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
