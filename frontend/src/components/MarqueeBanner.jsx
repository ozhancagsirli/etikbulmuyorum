import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function MarqueeBanner() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => {});
  }, []);

  const items = [
    { text: 'Instagram sayfanı doğrula, kategorinde öne çık', link: '/profil-olustur', linkText: 'Başla →', emoji: '🌟' },
    { text: stats ? `Bu hafta ${Number(stats.totals?.total_incidents || 0).toLocaleString('tr')} yeni görüş eklendi` : 'Yeni görüşler eklendi', emoji: '🔥' },
    { text: stats ? `${Number(stats.totals?.total_users || 0).toLocaleString('tr')}+ kullanıcı` : 'Büyüyen topluluk', emoji: '👥' },
    { text: 'Güven skorunu öğren', link: '/nasil-calisir', linkText: 'Öğren →', emoji: '📊' },
    { text: 'Topluluk kararıyla şekillenen güven sistemi', emoji: '⚡' },
    { text: 'Profilini oluştur, müşterilerine güven ver', link: '/profil-olustur', linkText: 'Hemen başla →', emoji: '🚀' },
    { text: stats ? `${Number(stats.totals?.total_votes || 0).toLocaleString('tr')}+ değerlendirme yapıldı` : 'Binlerce değerlendirme', emoji: '✅' },
  ];

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 32s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 28px;
          font-size: 12px;
          font-weight: 500;
          color: #4b5563;
          white-space: nowrap;
          border-right: 1px solid #f1f5f9;
          height: 36px;
        }
      `}</style>
      <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', overflow: 'hidden', position: 'relative' }}>
        {/* Sol fade */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 48, background: 'linear-gradient(to right, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        {/* Sağ fade */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, background: 'linear-gradient(to left, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />

        <div className="marquee-track">
          {[...items, ...items].map((item, i) => (
            <div key={i} className="marquee-item">
              <span>{item.emoji}</span>
              <span>{item.text}</span>
              {item.link && (
                <Link to={item.link} style={{ color: '#46A53E', fontWeight: 700 }}>{item.linkText}</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
