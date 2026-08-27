import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Search, TrendingUp, AlertTriangle, Users, FileText } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topVoted, setTopVoted] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    apiFetch('/categories').then(setCategories).catch(() => {});
    apiFetch('/incidents?sort=most_voted&limit=10').then(d => setTopVoted(d.data || [])).catch(() => {});
    apiFetch('/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, sort: 'newest', limit: 15 });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    apiFetch('/incidents?' + params).then(data => {
      setIncidents(data.data);
      setPages(data.pages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, category, search]);

  function handleHeroSearch(e) {
    e.preventDefault();
    if (heroSearch.trim()) navigate('/?search=' + encodeURIComponent(heroSearch.trim()));
  }

  return (
    <div>
      {/* Hero arama kutusu */}
      {!search && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '32px 28px', marginBottom: 20, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', marginBottom: 6, letterSpacing: -0.5 }}>
            Birisiyle çalışmadan önce araştır
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            Usta, müteahhit, avukat... Kim olursa olsun, başkalarının deneyimlerine bak.
          </p>
          <form onSubmit={handleHeroSearch} style={{ maxWidth: 520, margin: '0 auto', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                placeholder="Kişi adı ile ara... ör: Ahmet Yılmaz"
                style={{ width: '100%', padding: '13px 16px 13px 40px', borderRadius: 8, border: '2px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#FF4500'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <button type="submit" style={{ background: '#FF4500', color: 'white', padding: '13px 24px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Ara
            </button>
          </form>
        </div>
      )}

      {/* İstatistik bandı */}
      {stats && !search && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Toplam Bildirim', value: Number(stats.totals.total_incidents).toLocaleString('tr'), icon: <FileText size={18} />, color: '#FF4500' },
            { label: 'Bu Hafta', value: Number(stats.totals.incidents_this_week).toLocaleString('tr'), icon: <TrendingUp size={18} />, color: '#3b82f6' },
            { label: 'Toplam Değerlendirme', value: Number(stats.totals.total_votes).toLocaleString('tr'), icon: <AlertTriangle size={18} />, color: '#dc2626' },
            { label: 'Kullanıcı', value: Number(stats.totals.total_users).toLocaleString('tr'), icon: <Users size={18} />, color: '#16a34a' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobil kategori */}
      <div id="mobile-cats" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <button onClick={() => { setCategory(''); setPage(1); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '1.5px solid', borderColor: !category ? '#FF4500' : '#e0e0e0', background: !category ? '#FF4500' : 'white', color: !category ? 'white' : '#555', fontSize: 13, fontWeight: !category ? 600 : 400, cursor: 'pointer' }}>🌐 Tümü</button>
        {categories.map(c => (
          <button key={c.slug} onClick={() => { setCategory(c.slug); setPage(1); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '1.5px solid', borderColor: category === c.slug ? '#FF4500' : '#e0e0e0', background: category === c.slug ? '#FF4500' : 'white', color: category === c.slug ? 'white' : '#555', fontSize: 13, fontWeight: category === c.slug ? 600 : 400, cursor: 'pointer' }}>{c.icon} {c.name_tr}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Sol sidebar */}
        <div style={{ width: 240, flexShrink: 0, display: 'none', flexDirection: 'column', gap: 12, position: 'sticky', top: 72 }} className="sidebar">

          {/* Kategoriler */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 14, color: '#111827' }}>🗂 Kategoriler</div>
            <button onClick={() => { setCategory(''); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: !category ? '#fff5f0' : 'white', cursor: 'pointer', fontSize: 13, textAlign: 'left', borderLeft: !category ? '3px solid #FF4500' : '3px solid transparent', color: !category ? '#FF4500' : '#374151', fontWeight: !category ? 600 : 400 }}>
              <span style={{ fontSize: 16 }}>🌐</span> Tümü
            </button>
            {categories.map(c => (
              <button key={c.slug} onClick={() => { setCategory(c.slug); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: category === c.slug ? '#fff5f0' : 'white', cursor: 'pointer', fontSize: 13, textAlign: 'left', borderLeft: category === c.slug ? '3px solid #FF4500' : '3px solid transparent', color: category === c.slug ? '#FF4500' : '#374151', fontWeight: category === c.slug ? 600 : 400, borderTop: '1px solid #f9fafb' }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span> <span>{c.name_tr}</span>
              </button>
            ))}
          </div>

          {/* En çok değerlendirilen */}
          {topVoted.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 14, color: '#111827' }}>🔍 En Çok Aranan</div>
              {topVoted.map((inc, idx) => {
                const total = (inc.vote_correct || 0) + (inc.vote_wrong || 0) + (inc.vote_neutral || 0) + (inc.vote_insufficient || 0);
                const ts = inc.trust_score || 0;
                const name = inc.subject || inc.title;
                return (
                  <Link key={inc.id} to={name ? '/konu/' + encodeURIComponent(name) : '/olay/' + inc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: idx > 0 ? '1px solid #f9fafb' : 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#d1d5db', minWidth: 20 }}>{idx + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      {total > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626' }}>
                          {ts >= 50 ? '🟢' : ts >= -10 ? '🟡' : '🔴'} {ts > 0 ? '+' : ''}{ts}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#111827' }}>Başkası zarar görmesin</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Yaşadığın deneyimi paylaş</div>
            <Link to="/bildir" style={{ background: '#FF4500', color: 'white', padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'inline-block' }}>
              + Olay Bildir
            </Link>
          </div>
        </div>

        {/* Ana içerik */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {search && (
            <div style={{ marginBottom: 12, color: '#374151', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <Search size={14} color="#9ca3af" />
              "<strong>{search}</strong>" için sonuçlar
              <a href="/" style={{ color: '#FF4500', fontSize: 12, marginLeft: 'auto' }}>× temizle</a>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} style={{ background: 'white', borderRadius: 12, height: 140, border: '1px solid #e5e7eb', opacity: 0.3+i*0.2 }} />)}
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Sonuç bulunamadı</div>
              <Link to="/bildir" style={{ color: '#FF4500', fontWeight: 600 }}>İlk olayı sen ekle →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incidents.map(inc => <IncidentCard key={inc.id} incident={inc} />)}
            </div>
          )}

          {pages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: page===1?'not-allowed':'pointer', color: page===1?'#ccc':'#374151', fontSize: 13 }}>← Önceki</button>
              {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{ width:36,height:36,borderRadius:8,border:'1.5px solid',borderColor:p===page?'#FF4500':'#e5e7eb',background:p===page?'#FF4500':'white',color:p===page?'white':'#374151',fontWeight:p===page?700:400,cursor:'pointer',fontSize:13 }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: page===pages?'not-allowed':'pointer', color: page===pages?'#ccc':'#374151', fontSize: 13 }}>Sonraki →</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .sidebar { display: flex !important; } #mobile-cats { display: none !important; } }
        @media (max-width: 767px) { .sidebar { display: none !important; } #mobile-cats { display: flex !important; } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  );
}

function IncidentCard({ incident: inc }) {
  const total = (inc.vote_correct || 0) + (inc.vote_wrong || 0) + (inc.vote_neutral || 0) + (inc.vote_insufficient || 0);
  const ts = inc.trust_score || 0;
  const images = inc.images || [];
  const isVerified = inc.verdict === 'ethical';
  const isDangerous = inc.verdict === 'unethical';

  if (isVerified) {
    return (
      <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1.5px solid #22c55e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🟢</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={'/olay/' + inc.id}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#15803d', display: 'block' }}>{inc.title}</span>
          </Link>
          <div style={{ fontSize: 11, color: '#86efac', marginTop: 2 }}>Güvenilir bulundu · {total} değerlendirme</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: isDangerous ? '1.5px solid #ef4444' : '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}
    >
      <div style={{ padding: '14px 16px' }}>
        {/* Üst meta */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {isDangerous && <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>🔴 Güvenilmez</span>}
          {inc.location && <span style={{ fontSize: 11, color: '#6b7280' }}>📍 {inc.location}</span>}
          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
        </div>

        {/* Kişi adı */}
        {inc.subject && (
          <Link to={'/konu/' + encodeURIComponent(inc.subject)}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 4, letterSpacing: -0.3 }}>{inc.subject}</div>
          </Link>
        )}

        {/* Başlık */}
        <Link to={'/olay/' + inc.id}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151', lineHeight: 1.4 }}>{inc.title}</h2>
        </Link>

        {/* Açıklama */}
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {inc.description}
        </p>

        {/* Resim */}
        {images.length > 0 && (
          <Link to={'/olay/' + inc.id}>
            <img src={images[0]} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', borderRadius: 8, marginBottom: 10 }} />
          </Link>
        )}

        {/* Kategori */}
        {inc.category_name && (
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, background: '#fff5f0', color: '#FF4500', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{inc.category_icon} {inc.category_name}</span>
          </div>
        )}

        {/* Alt satır */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {total > 0 ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: ts >= 50 ? '#16a34a' : ts >= -10 ? '#d97706' : '#dc2626' }}>
              {ts >= 50 ? '🟢' : ts >= -10 ? '🟡' : '🔴'} Güven: {ts > 0 ? '+' : ''}{ts} · {total} değerlendirme
            </span>
          ) : (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Henüz değerlendirme yok</span>
          )}
          <Link to={'/olay/' + inc.id} style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
            💬 {inc.comment_count} · 👁 {inc.view_count}
          </Link>
        </div>
      </div>
    </div>
  );
}
