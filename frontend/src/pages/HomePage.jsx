import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => {});
    apiFetch('/incidents?sort=newest&limit=3').then(d => setRecentIncidents(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!search) { setLoading(false); return; }
    setLoading(true);
    apiFetch('/incidents?search=' + encodeURIComponent(search) + '&limit=15')
      .then(d => { setIncidents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  function handleHeroSearch(e) {
    e.preventDefault();
    if (heroSearch.trim()) navigate('/?search=' + encodeURIComponent(heroSearch.trim()));
  }

  if (search) {
    return (
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={15} color="#9ca3af" />
          <span style={{ fontSize: 14, color: '#374151' }}>"<strong>{search}</strong>" için sonuçlar</span>
          <a href="/" style={{ marginLeft: 'auto', fontSize: 12, color: '#013C26' }}>× temizle</a>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Aranıyor...</div>
        ) : incidents.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>"{search}" için sonuç bulunamadı</div>
            <Link to="/bildir" style={{ color: '#46A53E', fontWeight: 600 }}>İlk bildirimi sen ekle →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.map(inc => <IncidentCard key={inc.id} incident={inc} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>

      {/* BÖLÜM 1 — Hero = Navbar + Arama tam ekran */}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'white', position: 'relative', overflow: 'hidden' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 16px', textAlign: 'center' }}>
        {/* Arka plan doku */}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, width: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>Güven platformu</div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 38px)', fontWeight: 900, color: '#111827', lineHeight: 1.2, marginBottom: 14, letterSpacing: -1 }}>
            Birisiyle çalışmadan önce<br />araştır
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 36, lineHeight: 1.7 }}>
            Usta, müteahhit, avukat... Başkalarının yaşadıklarını oku, kendi deneyimini paylaş.
          </p>

          <form onSubmit={handleHeroSearch} style={{ display: 'flex', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <Search size={18} color="#9ca3af" style={{ alignSelf: 'center', marginLeft: 18, flexShrink: 0 }} />
            <input value={heroSearch} onChange={e => setHeroSearch(e.target.value)}
              placeholder="Kişi adı ile ara... örn: Ahmet Yılmaz"
              style={{ flex: 1, padding: '16px 16px', fontSize: 15, border: 'none', outline: 'none', fontFamily: 'inherit', color: '#111827', background: 'transparent' }}
            />
            <button type="submit" style={{ padding: '0 28px', background: '#111827', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: '0 10px 10px 0' }}>
              Ara
            </button>
          </form>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            {['Ahmet Y.', 'Mehmet Usta', 'Ali Kaya', 'Ayşe Av.'].map(name => (
              <button key={name} onClick={() => navigate('/?search=' + encodeURIComponent(name))}
                style={{ fontSize: 12, color: '#9ca3af', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit' }}>
                {name}
              </button>
            ))}
          </div>
        </div>

        </div>
        {/* Aşağı ok */}
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#d1d5db' }}>
          <span style={{ fontSize: 11, letterSpacing: 1 }}>Son bildirimler</span>
          <div style={{ width: 16, height: 16, borderRight: '1.5px solid #d1d5db', borderBottom: '1.5px solid #d1d5db', transform: 'rotate(45deg)', animation: 'bounce 1.5s infinite' }} />
        </div>
      </div>

      {/* BÖLÜM 2 — Son bildirimler */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Son eklenenler</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 28, letterSpacing: -0.5 }}>Yeni bildirimler</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {recentIncidents.length > 0 ? recentIncidents.map(inc => {
              const total = (inc.vote_correct || 0) + (inc.vote_wrong || 0) + (inc.vote_neutral || 0) + (inc.vote_insufficient || 0);
              const ts = inc.trust_score || 0;
              return (
                <Link key={inc.id} to={'/olay/' + inc.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px', display: 'block', color: 'inherit', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}
                >
                  {inc.subject && <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{inc.subject}</div>}
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{inc.category_name} {inc.location ? '· ' + inc.location : ''}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inc.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {total > 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ts >= 50 ? '#f0fdf4' : ts >= -10 ? '#fffbeb' : '#f0fdf4', color: ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626' }}>
                        {ts > 0 ? '+' : ''}{ts} {ts >= 50 ? 'Güvenilir' : ts >= -10 ? 'Dikkatli' : 'Güvenilmez'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#d1d5db' }}>Değerlendirme yok</span>
                    )}
                    <span style={{ fontSize: 11, color: '#d1d5db' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
                  </div>
                </Link>
              );
            }) : [1,2,3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px', height: 160, opacity: 0.4 }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/bildir" style={{ fontSize: 14, color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>Tüm bildirimleri gör →</Link>
          </div>
        </div>
      </div>

      {/* BÖLÜM 3 — İstatistikler */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 24px', background: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Platform istatistikleri</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 48, letterSpacing: -0.5 }}>Rakamlarla etikbulmuyorum</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Bildirim', value: stats ? Number(stats.totals.total_incidents).toLocaleString('tr') : '—' },
              { label: 'Bu hafta', value: stats ? Number(stats.totals.incidents_this_week).toLocaleString('tr') : '—' },
              { label: 'Değerlendirme', value: stats ? Number(stats.totals.total_votes).toLocaleString('tr') : '—' },
              { label: 'Kullanıcı', value: stats ? Number(stats.totals.total_users).toLocaleString('tr') : '—' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8fafc', borderRadius: 16, padding: '32px 16px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1, marginBottom: 10 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BÖLÜM 4 — CTA */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 24px', background: '#111827', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4b5563', marginBottom: 16 }}>Deneyimini paylaş</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: 'white', marginBottom: 16, letterSpacing: -1, lineHeight: 1.2 }}>Başkası zarar görmesin</h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 40, lineHeight: 1.7 }}>
            Yaşadığın olumsuz ya da olumlu deneyimi anlat.<br />Topluluk bilsin, başkaları karar versin.
          </p>
          <Link to="/bildir" style={{ display: 'inline-block', background: 'white', color: '#111827', padding: '14px 36px', borderRadius: 8, fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>
            Olay Bildir
          </Link>
          <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[['⚖️', 'Güven Skoru'], ['🔍', 'Kişi Arama'], ['💬', 'Değerlendirme'], ['🔔', 'Bildirimler']].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, color: '#4b5563', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(5px); }
        }
      `}</style>
    </div>
  );
}

function IncidentCard({ incident: inc }) {
  const total = (inc.vote_correct || 0) + (inc.vote_wrong || 0) + (inc.vote_neutral || 0) + (inc.vote_insufficient || 0);
  const ts = inc.trust_score || 0;
  const images = inc.images || [];

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {images.length > 0 && (
        <Link to={'/olay/' + inc.id}>
          <img src={images[0]} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
        </Link>
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {inc.location && <span style={{ fontSize: 11, color: '#9ca3af' }}>📍 {inc.location}</span>}
          <span style={{ fontSize: 11, color: '#d1d5db', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
        </div>
        {inc.subject && (
          <Link to={'/konu/' + encodeURIComponent(inc.subject)}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 4, letterSpacing: -0.3 }}>{inc.subject}</div>
          </Link>
        )}
        <Link to={'/olay/' + inc.id}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151', lineHeight: 1.4 }}>{inc.title}</h2>
        </Link>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inc.description}</p>
        {inc.category_name && <div style={{ marginBottom: 10 }}><span style={{ fontSize: 11, background: '#f0fdf4', color: '#46A53E', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{inc.category_icon} {inc.category_name}</span></div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {total > 0 ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626' }}>
              {ts >= 50 ? '🟢' : ts >= -10 ? '🟡' : '🔴'} Güven: {ts > 0 ? '+' : ''}{ts} · {total} değerlendirme
            </span>
          ) : <span style={{ fontSize: 12, color: '#9ca3af' }}>Henüz değerlendirme yok</span>}
          <Link to={'/olay/' + inc.id} style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>💬 {inc.comment_count} · 👁 {inc.view_count}</Link>
        </div>
      </div>
    </div>
  );
}
