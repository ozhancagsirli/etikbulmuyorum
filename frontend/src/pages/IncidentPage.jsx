import LikeButton from '../components/LikeButton';
import ShareButton from '../components/ShareButton';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MapPin, Calendar, Eye, ArrowLeft, Flag, MessageCircle, Clock, Building2, Tag, X } from 'lucide-react';
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
    Promise.all([apiFetch('/incidents/' + id), apiFetch('/comments?incidentId=' + id)])
      .then(([inc, cmts]) => { setIncident(inc); setComments(cmts); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function submitComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const newCmt = await apiFetch('/comments', { method: 'POST', body: JSON.stringify({ incidentId: id, content: comment, isAnonymous: anon }) });
      setComments(prev => [...prev, { ...newCmt, author_name: anon ? null : user?.name, author_avatar: anon ? null : user?.avatarUrl }]);
      setComment('');
      toast.success('Yorum eklendi.');
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  }

  async function report() {
    if (!user) return toast.error('Şikayet için giriş yapın.');
    try { await apiFetch('/users/report', { method: 'POST', body: JSON.stringify({ incidentId: id, reason: 'irrelevant' }) }); toast.success('Şikayetiniz alındı.'); }
    catch (e) { toast.error(e.message); }
  }

  if (loading) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb', color: '#9ca3af' }}>Yükleniyor...</div>
  );

  if (!incident) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb' }}>
      <p style={{ marginBottom: 16, color: '#6b7280' }}>Olay bulunamadı.</p>
      <Link to="/" style={{ color: '#dc2626', fontWeight: 600 }}>Ana sayfaya dön</Link>
    </div>
  );

  const total = incident.vote_ethical + incident.vote_unethical;
  const ethPct = total ? Math.round((incident.vote_ethical / total) * 100) : null;
  const images = incident.images || [];
  const tags = incident.tags || [];

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
        <ArrowLeft size={16} /> Geri
      </button>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 0' }}>

          {/* Meta üst */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {incident.category_name && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, background: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #fecaca' }}>
                {incident.category_icon} {incident.category_name}
              </span>
            )}
            {incident.subject && (
              <Link to={'/konu/' + encodeURIComponent(incident.subject)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #bfdbfe' }}>
                <Building2 size={11} /> {incident.subject}
              </Link>
            )}
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}
            </span>
            <button onClick={report} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#d1d5db' }}>
              <Flag size={13} /> Şikayet
            </button>
          </div>

          {/* Başlık */}
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.4, color: '#111827', letterSpacing: -0.3 }}>
            {incident.title}
          </h1>

          <div style={{ marginBottom: 16 }}>
            <ShareButton title={incident.title} url={'/olay/' + id} />
          </div>

          {/* Yazar + meta */}
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: '#6b7280', marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {incident.author_avatar && !incident.is_anonymous
                ? <img src={incident.author_avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                : null}
              <span style={{ fontWeight: 500, color: '#4b5563' }}>{incident.author_name || 'Anonim'}</span>
            </div>
            {incident.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {incident.location}
              </span>
            )}
            {incident.incident_date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> {format(new Date(incident.incident_date), 'd MMMM yyyy', { locale: tr })}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Eye size={13} /> {incident.view_count}
            </span>
            {votingEnds && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: votingActive ? '#6b7280' : '#ef4444', fontWeight: 500 }}>
                <Clock size={13} />
                {votingActive ? 'Oylama bitiyor: ' + format(votingEnds, 'd MMM HH:mm', { locale: tr }) : 'Oylama tamamlandı'}
              </span>
            )}
          </div>

          {/* Açıklama */}
          <div style={{ fontSize: 15, lineHeight: 1.85, color: '#374151', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {incident.description}
          </div>
        </div>

        {/* Fotoğraflar */}
        {images.length > 0 && (
          <div style={{ marginBottom: 16, padding: '0 20px' }}>
            <img src={images[0]} alt="" onClick={() => setLightbox(images[0])}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', display: 'block' }} />
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {images.slice(1).map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setLightbox(img)}
                    style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid #e5e7eb' }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Etiketler */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 20px', marginBottom: 16 }}>
            {tags.map(tag => (
              <Link key={tag} to={'/?search=' + encodeURIComponent('#' + tag)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3b82f6', background: '#eff6ff', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                <Tag size={11} /> {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Oy istatistik */}
        {total > 0 && (
          <div style={{ padding: '14px 20px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5 }}>✅ Güvenilir — {incident.vote_ethical} oy ({ethPct}%)</span>
              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 5 }}>❌ Güvenilmez — {incident.vote_unethical} oy ({100 - ethPct}%)</span>
            </div>
            <div style={{ height: 8, background: '#fecaca', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: ethPct + '%', height: '100%', background: '#22c55e', borderRadius: 4, transition: 'width 0.6s' }} />
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>{total} toplam oy</div>
          </div>
        )}

        {/* Oy butonları */}
        <div style={{ padding: '16px 20px' }}>
          {votingActive ? (
            <VoteBar incidentId={id} initialVotes={{ correct: incident.vote_correct || 0, wrong: incident.vote_wrong || 0, neutral: incident.vote_neutral || 0, insufficient: incident.vote_insufficient || 0, trustScore: incident.trust_score || 0 }} initialMyVote={incident.my_vote} />
          ) : votingEnds ? (
            <div style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 10, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              Oylama süresi doldu. {incident.verdict === 'ethical' ? '✅ Güvenilir bulundu.' : incident.verdict === 'unethical' ? '❌ Güvenilmez bulundu.' : ''}
            </div>
          ) : null}
        </div>
      </div>

      {/* Yorumlar */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={18} color="#374151" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Yorumlar</span>
          <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{comments.length}</span>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {user ? (
            <form onSubmit={submitComment} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0, overflow: 'hidden' }}>
                  {!anon && user.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : null}
                </div>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Görüşünüzü paylaşın..." rows={3}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', background: 'white', outline: 'none', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor='#dc2626'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 46 }}>
                <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', color: '#6b7280' }}>
                  <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ accentColor: '#16a34a' }} /> Anonim
                </label>
                <button type="submit" disabled={submitting || !comment.trim()} style={{
                  marginLeft: 'auto', padding: '7px 20px', borderRadius: 20, border: 'none',
                  background: !comment.trim() ? '#e5e7eb' : '#dc2626',
                  color: !comment.trim() ? '#9ca3af' : 'white',
                  fontWeight: 700, fontSize: 13, cursor: comment.trim() ? 'pointer' : 'not-allowed',
                }}>{submitting ? '...' : 'Yorum Yap'}</button>
              </div>
            </form>
          ) : (
            <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
              Yorum yapmak için <Link to="/giris" style={{ color: '#dc2626', fontWeight: 600 }}>giriş yapın</Link>
            </div>
          )}

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>
              <MessageCircle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div>Henüz yorum yok. İlk yorumu sen yap!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.author_avatar && !c.is_anonymous
                      ? <img src={c.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 16 }}>👤</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 14px', borderTopLeftRadius: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.is_anonymous || !c.author_name ? 'Anonim' : c.author_name}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDistanceToNow(new Date(c.created_at), { locale: tr, addSuffix: true })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: c.is_removed ? '#9ca3af' : '#374151', lineHeight: 1.6, fontStyle: c.is_removed ? 'italic' : 'normal' }}>
                        {c.content}
                      </p>
                      <LikeButton commentId={c.id} initialCount={c.like_count || 0} initialLiked={c.liked_by_me} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out', padding: 20 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
