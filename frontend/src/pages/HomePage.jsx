import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow, formatDistance } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [incidents,   setIncidents]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [topVoted,    setTopVoted]    = useState([]);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const search = searchParams.get('search') || '';

  useEffect(() => {
    apiFetch('/categories').then(setCategories).catch(() => {});
    apiFetch('/incidents?sort=most_voted&limit=5').then(d => setTopVoted(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, sort: 'newest', limit: 15 });
    if (category) params.set('category', category);
    if (search)   params.set('search', search);
    apiFetch('/incidents?' + params).then(data => {
      setIncidents(data.data);
      setPages(data.pages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, category, search]);

  function updateVote(id, voteEthical, voteUnethical, myVote) {
    setIncidents(prev => prev.map(inc =>
      inc.id === id ? { ...inc, vote_ethical: voteEthical, vote_unethical: voteUnethical, my_vote: myVote } : inc
    ));
  }

  const selectedCat = categories.find(c => c.slug === category);

  return (
    <div>
      {/* Mobil kategori filtresi */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <button onClick={() => { setCategory(''); setPage(1); }} style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
          borderColor: !category ? '#FF4500' : '#e0e0e0',
          background: !category ? '#FF4500' : 'white',
          color: !category ? 'white' : '#555', fontSize: 13, fontWeight: !category ? 600 : 400, cursor: 'pointer',
        }}>🌐 Tümü</button>
        {categories.map(c => (
          <button key={c.slug} onClick={() => { setCategory(c.slug); setPage(1); }} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
            borderColor: category === c.slug ? '#FF4500' : '#e0e0e0',
            background: category === c.slug ? '#FF4500' : 'white',
            color: category === c.slug ? 'white' : '#555', fontSize: 13, fontWeight: category === c.slug ? 600 : 400, cursor: 'pointer',
          }}>{c.icon} {c.name_tr}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Sol sidebar — sadece desktop */}
        <div style={{ width: 220, flexShrink: 0, display: 'none', flexDirection: 'column', gap: 12, position: 'sticky', top: 68 }} className="sidebar">
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14 }}>🗂 Kategoriler</div>
            <button onClick={() => { setCategory(''); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: !category ? '#fff5f0' : 'white', cursor: 'pointer', fontSize: 13, textAlign: 'left', borderLeft: !category ? '3px solid #FF4500' : '3px solid transparent', color: !category ? '#FF4500' : '#333', fontWeight: !category ? 600 : 400 }}>
              <span style={{ fontSize: 16 }}>🌐</span> Tümü
            </button>
            {categories.map(c => (
              <button key={c.slug} onClick={() => { setCategory(c.slug); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: category === c.slug ? '#fff5f0' : 'white', cursor: 'pointer', fontSize: 13, textAlign: 'left', borderLeft: category === c.slug ? '3px solid #FF4500' : '3px solid transparent', color: category === c.slug ? '#FF4500' : '#333', fontWeight: category === c.slug ? 600 : 400, borderTop: '1px solid #f8f8f8' }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span> <span>{c.name_tr}</span>
              </button>
            ))}
          </div>

          {topVoted.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14 }}>🔥 En Çok Oylanan</div>
              {topVoted.map((inc, idx) => {
                const total = inc.vote_ethical + inc.vote_unethical;
                const ethPct = total ? Math.round((inc.vote_ethical / total) * 100) : null;
                return (
                  <Link key={inc.id} to={'/olay/' + inc.id} style={{ display: 'block', padding: '10px 14px', borderTop: idx > 0 ? '1px solid #f8f8f8' : 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#ddd', minWidth: 18 }}>{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inc.title}</div>
                        {ethPct !== null && <div style={{ fontSize: 11, color: ethPct >= 50 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{ethPct >= 50 ? '✅ ' + ethPct + '% Etik' : '❌ ' + (100 - ethPct) + '% Etik Değil'} · {total} oy</div>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚖️</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#111827' }}>Tanık olduğun bir olayı paylaş</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Toplum karar versin</div>
            <Link to="/bildir" style={{ background: '#FF4500', color: 'white', padding: '8px 20px', borderRadius: 20, fontWeight: 700, fontSize: 13, display: 'inline-block', boxShadow: '0 2px 8px rgba(255,69,0,0.25)' }}>
              + Olay Bildir
            </Link>
          </div>
        </div>

        {/* Ana içerik */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {search && (
            <div style={{ marginBottom: 10, color: '#555', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔍 "<strong>{search}</strong>" için sonuçlar
              <a href="/" style={{ color: '#FF4500', fontSize: 12 }}>× temizle</a>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} style={{ background: 'white', borderRadius: 12, height: 140, border: '1px solid #e0e0e0', opacity: 0.3+i*0.2 }} />)}
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Sonuç bulunamadı</div>
              <Link to="/bildir" style={{ color: '#FF4500', fontWeight: 600 }}>İlk olayı sen bildir →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incidents.map(inc => <IncidentCard key={inc.id} incident={inc} onVote={updateVote} />)}
            </div>
          )}

          {pages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: 'white', cursor: page===1?'not-allowed':'pointer', color: page===1?'#ccc':'#555', fontSize: 13 }}>← Önceki</button>
              {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{ width:36,height:36,borderRadius:8,border:'1.5px solid',borderColor:p===page?'#FF4500':'#e0e0e0',background:p===page?'#FF4500':'white',color:p===page?'white':'#333',fontWeight:p===page?700:400,cursor:'pointer',fontSize:13 }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: 'white', cursor: page===pages?'not-allowed':'pointer', color: page===pages?'#ccc':'#555', fontSize: 13 }}>Sonraki →</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function IncidentCard({ incident: inc, onVote }) {
  const user = useAuthStore(s => s.user);
  const [voting, setVoting] = useState(false);

  const total = inc.vote_ethical + inc.vote_unethical;
  const ethPct = total ? Math.round((inc.vote_ethical / total) * 100) : null;
  const hasVoted = inc.my_vote !== null && inc.my_vote !== undefined;
  const images = inc.images || [];
  const tags = inc.tags || [];
  const isEthical = inc.verdict === 'ethical';
  const isUnethical = inc.verdict === 'unethical';
  const votingEnds = inc.voting_ends_at ? new Date(inc.voting_ends_at) : null;
  const votingActive = votingEnds && votingEnds > new Date();

  async function vote(verdict) {
    if (!user) return toast.error('Oy vermek için giriş yapın.');
    if (voting) return;
    setVoting(true);
    try {
      if (inc.my_vote === verdict) {
        const data = await apiFetch('/votes/' + inc.id, { method: 'DELETE' });
        onVote(inc.id, data.voteEthical, data.voteUnethical, null);
      } else {
        const data = await apiFetch('/votes/' + inc.id, { method: 'POST', body: JSON.stringify({ verdict }) });
        onVote(inc.id, data.voteEthical, data.voteUnethical, verdict);
      }
    } catch (e) { toast.error(e.message); }
    finally { setVoting(false); }
  }

  if (isEthical) {
    return (
      <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1.5px solid #46d160', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={'/olay/' + inc.id}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a7f37', lineHeight: 1.4, display: 'block' }}>{inc.title}</span>
          </Link>
          <div style={{ fontSize: 11, color: '#86efac', marginTop: 2 }}>Etik bulundu · {ethPct}% · {total} oy</div>
        </div>
        {inc.category_icon && <span style={{ fontSize: 16, opacity: 0.5, flexShrink: 0 }}>{inc.category_icon}</span>}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: isUnethical ? '1.5px solid #f85149' : '1px solid #e0e0e0', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {isUnethical && <span style={{ fontSize: 11, background: '#ffeef0', color: '#cf222e', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>❌ Etik Dışı</span>}
          {inc.category_name && <span style={{ fontSize: 11, background: '#fff5f0', color: '#FF4500', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{inc.category_icon} {inc.category_name}</span>}
          {inc.location && <span style={{ fontSize: 11, color: '#aaa' }}>📍 {inc.location}</span>}
          <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(inc.created_at), { locale: tr, addSuffix: true })}</span>
        </div>

        <Link to={'/olay/' + inc.id}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1c1c1c', lineHeight: 1.4 }}>{inc.title}</h2>
        </Link>

        <p style={{ fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {inc.description}
        </p>

        {images.length > 0 && (
          <Link to={'/olay/' + inc.id}>
            <img src={images[0]} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', borderRadius: 8, marginBottom: 10 }} />
          </Link>
        )}

        {(inc.subject || tags.length > 0) && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {inc.subject && <Link to={'/konu/' + encodeURIComponent(inc.subject)} style={{ fontSize: 11, background: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>📌 {inc.subject}</Link>}  

            {tags.map(tag => <Link key={tag} to={'/?search=' + encodeURIComponent('#' + tag)} style={{ fontSize: 11, color: '#378ADD', background: '#e8f4fd', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>#{tag}</Link>)}
          </div>
        )}

        {votingEnds && (
          <div style={{ fontSize: 11, color: votingActive ? '#888' : '#f85149', marginBottom: 8 }}>
            {votingActive ? '⏱️ ' + formatDistance(votingEnds, new Date(), { locale: tr, addSuffix: true }) + ' bitiyor' : '⏱️ Oylama tamamlandı'}
          </div>
        )}

        {hasVoted || isUnethical ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#46d160', fontWeight: 700 }}>✅ {ethPct}%</span>
              <span style={{ color: '#f85149', fontWeight: 700 }}>❌ {100-ethPct}%</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {hasVoted && <span style={{ fontSize: 12, color: '#888' }}>Oyunuz: <strong style={{ color: inc.my_vote === 'ethical' ? '#46d160' : '#f85149' }}>{inc.my_vote === 'ethical' ? 'Etik' : 'Etik Değil'}</strong> · {total} oy</span>}
              {hasVoted && votingActive && <button onClick={() => vote(inc.my_vote)} style={{ fontSize: 11, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>geri al</button>}
              <Link to={'/olay/' + inc.id} style={{ fontSize: 12, color: '#aaa', marginLeft: 'auto' }}>💬 {inc.comment_count}</Link>
            </div>
          </div>
        ) : votingActive ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => vote('ethical')} disabled={voting} style={{ flex: 1, padding: '8px', borderRadius: 20, border: '1.5px solid #46d160', background: 'white', color: '#1a7f37', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✅ Etik</button>
            <button onClick={() => vote('unethical')} disabled={voting} style={{ flex: 1, padding: '8px', borderRadius: 20, border: '1.5px solid #f85149', background: 'white', color: '#cf222e', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>❌ Etik Değil</button>
            <Link to={'/olay/' + inc.id} style={{ fontSize: 12, color: '#aaa' }}>💬 {inc.comment_count}</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#aaa' }}>Oylama bitti · {total} oy</span>
            <Link to={'/olay/' + inc.id} style={{ color: '#aaa' }}>💬 {inc.comment_count}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
