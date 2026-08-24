import SEO from '../components/SEO';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import VoteBar from '../components/VoteBar';

export default function IncidentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/incidents/' + id),
      apiFetch('/comments?incidentId=' + id),
    ]).then(([inc, cmts]) => {
      setIncident(inc);
      setComments(cmts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function submitComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const newCmt = await apiFetch('/comments', {
        method: 'POST',
        body: JSON.stringify({ incidentId: id, content: comment, isAnonymous: anon }),
      });
      setComments(prev => [...prev, {
        ...newCmt,
        author_name: anon ? null : user?.name,
        author_avatar: anon ? null : user?.avatarUrl,
      }]);
      setComment('');
      toast.success('Yorum eklendi.');
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  }

  async function report() {
    if (!user) return toast.error('Şikayet için giriş yapın.');
    try {
      await apiFetch('/users/report', { method: 'POST', body: JSON.stringify({ incidentId: id, reason: 'irrelevant' }) });
      toast.success('Şikayetiniz alındı.');
    } catch (e) { toast.error(e.message); }
  }

  if (loading) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e0e0e0', color: '#888' }}>
      Yükleniyor...
    </div>
  );

  if (!incident) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e0e0e0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <p style={{ marginBottom: 16, color: '#555' }}>Olay bulunamadı.</p>
      <Link to="/" style={{ color: '#FF4500', fontWeight: 600 }}>Ana sayfaya dön</Link>
    </div>
  );

  const total = incident.vote_ethical + incident.vote_unethical;
  const ethPct = total ? Math.round((incident.vote_ethical / total) * 100) : null;
  const images = incident.images || [];
  const tags = incident.tags || [];
  const votingEnds = incident.voting_ends_at ? new Date(incident.voting_ends_at) : null;
  const votingActive = votingEnds && votingEnds > new Date();

  return (
<SEO
  title={incident?.title}
  description={incident?.description?.slice(0, 160)}
  url={'/olay/' + id}
  image={incident?.images?.[0]}
/>
    <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

      <Link to="/" style={{ color: '#FF4500', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        ← Ana sayfaya dön
      </Link>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px' }}>

          {/* Kategori + meta */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {incident.category_name && (
              <span style={{ fontSize: 12, background: '#fff5f0', color: '#FF4500', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #ffd5c2' }}>
                {incident.category_icon} {incident.category_name}
              </span>
            )}
            {/* Şirket/Marka/Kişi — tıklanabilir */}
            {incident.subject && (
              <Link to={'/konu/' + encodeURIComponent(incident.subject)} style={{
                fontSize: 12, background: '#f0f4ff', color: '#378ADD',
                padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                border: '1px solid #c8d8f8', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                🏢 {incident.subject}
              </Link>
            )}
            <span style={{ fontSize: 12, color: '#aaa' }}>
              {formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}
            </span>
            <button onClick={report} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ccc' }}>
              🚩 Şikayet
            </button>
          </div>

          {/* Başlık */}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.4, color: '#1c1c1c', letterSpacing: -0.3 }}>
            {incident.title}
          </h1>

          {/* Yazar + konum + tarih */}
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: '#888', marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {incident.author_avatar && !incident.is_anonymous && (
                <img src={incident.author_avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
              )}
              <span style={{ fontWeight: 500, color: '#555' }}>{incident.author_name || 'Anonim'}</span>
            </div>
            {incident.location && <span>📍 {incident.location}</span>}
            {incident.incident_date && (
              <span>📅 {format(new Date(incident.incident_date), 'd MMMM yyyy', { locale: tr })}</span>
            )}
            <span>👁 {incident.view_count} görüntülenme</span>
            {votingEnds && (
              <span style={{ color: votingActive ? '#888' : '#f85149', fontWeight: 500 }}>
                {votingActive
                  ? `⏱️ Oylama bitiyor: ${format(votingEnds, 'd MMM yyyy HH:mm', { locale: tr })}`
                  : '⏱️ Oylama tamamlandı'}
              </span>
            )}
          </div>

          {/* Açıklama */}
          <div style={{ fontSize: 15, lineHeight: 1.85, color: '#333', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {incident.description}
          </div>

          {/* Fotoğraflar */}
          {images.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <img
                src={images[0]}
                alt=""
                onClick={() => setLightbox(images[0])}
                style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', display: 'block' }}
              />
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {images.slice(1).map((img, i) => (
                    <img key={i} src={img} alt="" onClick={() => setLightbox(img)}
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid #ddd' }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Etiketler */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {tags.map(tag => (
                <span key={tag} style={{ fontSize: 12, color: '#378ADD', background: '#e8f4fd', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Oy istatistik — sadece gri içi olan */}
          {total > 0 && (
            <div style={{ padding: '14px 16px', background: '#f8f9fa', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                <span style={{ color: '#46d160' }}>✅ Etik — {incident.vote_ethical} oy ({ethPct}%)</span>
                <span style={{ color: '#f85149' }}>❌ Etik Değil — {incident.vote_unethical} oy ({100 - ethPct}%)</span>
              </div>
              <div style={{ height: 10, background: '#fdb8c0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: ethPct + '%', height: '100%', background: '#46d160', borderRadius: 5, transition: 'width 0.6s' }} />
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 6, textAlign: 'center' }}>{total} toplam oy</div>
            </div>
          )}

          {/* Oy ver */}
          {votingActive && (
            <VoteBar
              incidentId={id}
              initialEthical={incident.vote_ethical}
              initialUnethical={incident.vote_unethical}
              initialMyVote={incident.my_vote}
            />
          )}

          {!votingActive && votingEnds && (
            <div style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: 10, textAlign: 'center', fontSize: 13, color: '#888' }}>
              Oylama süresi doldu. {incident.verdict === 'ethical' ? '✅ Etik bulundu.' : incident.verdict === 'unethical' ? '❌ Etik dışı bulundu.' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Yorumlar */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>💬 Yorumlar</span>
          <span style={{ background: '#f0f0f0', color: '#666', fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{comments.length}</span>
        </div>

        <div style={{ padding: '16px 24px' }}>
          {user ? (
            <form onSubmit={submitComment} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <img src={anon ? null : user.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #f0f0f0', flexShrink: 0, background: '#f0f0f0' }} />
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Görüşünüzü paylaşın..."
                  rows={3}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e0e0e0', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', background: 'white', outline: 'none', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#FF4500'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 46 }}>
                <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', color: '#666' }}>
                  <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ accentColor: '#FF4500' }} />
                  Anonim
                </label>
                <button type="submit" disabled={submitting || !comment.trim()} style={{
                  marginLeft: 'auto', padding: '7px 20px', borderRadius: 20, border: 'none',
                  background: !comment.trim() ? '#e0e0e0' : '#FF4500',
                  color: !comment.trim() ? '#aaa' : 'white',
                  fontWeight: 700, fontSize: 13, cursor: comment.trim() ? 'pointer' : 'not-allowed',
                }}>
                  {submitting ? '...' : 'Yorum Yap'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f8f9fa', borderRadius: 12, textAlign: 'center', fontSize: 14, color: '#666' }}>
              Yorum yapmak için <Link to="/" style={{ color: '#FF4500', fontWeight: 600 }}>giriş yapın</Link>
            </div>
          )}

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💭</div>
              <div>Henüz yorum yok. İlk yorumu sen yap!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0, overflow: 'hidden' }}>
                    {c.author_avatar && !c.is_anonymous
                      ? <img src={c.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '10px 14px', borderTopLeftRadius: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.is_anonymous || !c.author_name ? 'Anonim' : c.author_name}</span>
                        <span style={{ fontSize: 11, color: '#aaa' }}>{formatDistanceToNow(new Date(c.created_at), { locale: tr, addSuffix: true })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: c.is_removed ? '#aaa' : '#333', lineHeight: 1.6, fontStyle: c.is_removed ? 'italic' : 'normal' }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out', padding: 20 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  );
}
