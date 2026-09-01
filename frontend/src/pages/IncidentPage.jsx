import LikeButton from '../components/LikeButton';
import ShareButton from '../components/ShareButton';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MapPin, Calendar, Eye, ArrowLeft, Flag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

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
  const [showAppeal, setShowAppeal] = useState(false);
  const [appeal, setAppeal] = useState({ name: '', email: '', message: '' });
  const [appealSent, setAppealSent] = useState(false);

  async function submitAppeal(e) {
    e.preventDefault();
    try {
      await apiFetch('/appeals', { method: 'POST', body: JSON.stringify({ 
        subject_name: incident.instagram_username || incident.subject,
        incident_id: id,
        ...appeal 
      })});
      setAppealSent(true);
      setShowAppeal(false);
      toast.success('İtirazınız alındı.');
    } catch(e) { toast.error(e.message); }
  }

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
      const c = await apiFetch('/comments', { method: 'POST', body: JSON.stringify({ incidentId: id, content: comment, isAnonymous: anon }) });
      setComments(prev => [c, ...prev]);
      setComment('');
      toast.success('Yorum eklendi.');
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  async function report() {
    if (!user) return toast.error('Şikayet için giriş yapın.');
    try {
      await apiFetch('/reports', { method: 'POST', body: JSON.stringify({ incidentId: id, reason: 'Uygunsuz içerik' }) });
      toast.success('Şikayet alındı.');
    } catch (e) { toast.error(e.message); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Yükleniyor...</div>;
  if (!incident) return <div style={{ textAlign: 'center', padding: 60 }}>Olay bulunamadı.</div>;

  const images = incident.images || [];
  const tags = incident.tags || [];
  const hasInstagram = incident.instagram_username;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#46A53E', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
        <ArrowLeft size={16} /> Geri
      </button>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

        {/* Instagram profil kartı */}
        {hasInstagram && (
          <Link to={'/konu/' + encodeURIComponent(incident.instagram_username)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
            background: '#fafafa', color: 'inherit',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e5e7eb', border: '2px solid #e5e7eb' }}>
              {incident.subject_avatar || incident.instagram_avatar
                ? <img src={incident.subject_avatar || incident.instagram_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>
                  {incident.person_name || incident.instagram_username}
                </span>
                {incident.instagram_verified && (
                  <span style={{ fontSize: 14 }}>✅</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                @{incident.instagram_username}
                {incident.instagram_followers > 0 && (
                  <span> · {Number(incident.instagram_followers).toLocaleString('tr')} takipçi</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#46A53E', fontWeight: 600 }}>Profili gör →</div>
          </Link>
        )}

        <div style={{ padding: '20px' }}>

          {/* Başlık */}
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.4, color: '#111827', letterSpacing: -0.3 }}>
            {incident.title}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af', marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {incident.author_avatar && !incident.is_anonymous
                ? <img src={incident.author_avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                : null}
              <span style={{ color: '#6b7280', fontWeight: 500 }}>{incident.is_anonymous ? 'Anonim' : incident.author_name}</span>
            </div>
            {incident.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {incident.location}</span>}
            {incident.incident_date && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {format(new Date(incident.incident_date), 'd MMMM yyyy', { locale: tr })}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {incident.view_count}</span>
            <span style={{ marginLeft: 'auto' }}>{formatDistanceToNow(new Date(incident.created_at), { locale: tr, addSuffix: true })}</span>
          </div>

          <ShareButton title={incident.title} url={'/olay/' + id} />

          {/* Açıklama */}
          <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: '16px 0', whiteSpace: 'pre-wrap' }}>
            {incident.description}
          </p>

          {/* Fotoğraflar */}
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {images.map((img, i) => {
                const url = typeof img === 'string' ? img : img.url;
                return (
                  <img key={i} src={url} alt="" onClick={() => setLightbox(url)}
                    style={{ width: images.length === 1 ? '100%' : 140, height: images.length === 1 ? 'auto' : 140, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: '1px solid #e5e7eb', maxHeight: 400 }}
                  />
                );
              })}
            </div>
          )}

          {/* Etiketler */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {tags.map(tag => (
                <span key={tag} style={{ fontSize: 12, background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Yorumlar */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
          💬 Yorumlar ({comments.length})
        </h3>

        {user ? (
          <form onSubmit={submitComment} style={{ marginBottom: 20 }}>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Görüşünüzü paylaşın..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
                <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ accentColor: '#46A53E' }} />
                Anonim
              </label>
              <button type="submit" disabled={submitting || !comment.trim()} style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {submitting ? '...' : 'Gönder'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
            Yorum yapmak için <Link to="/giris" style={{ color: '#46A53E', fontWeight: 600 }}>giriş yapın</Link>.
          </div>
        )}

        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: 14 }}>Henüz yorum yok. İlk yorumu yap!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.author_avatar && !c.is_anonymous
                    ? <img src={c.author_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 14 }}>👤</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 14px', borderTopLeftRadius: 4 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.is_anonymous || !c.author_name ? 'Anonim' : c.author_name}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDistanceToNow(new Date(c.created_at), { locale: tr, addSuffix: true })}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.content}</p>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <LikeButton commentId={c.id} initialLikes={c.like_count || 0} initialLiked={c.user_liked} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* İtiraz ve Şikayet */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingBottom: 8 }}>
        <button onClick={() => setShowAppeal(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af' }}>
          ⚖️ Bu bildiriye itiraz et
        </button>

      </div>

      {showAppeal && !appealSent && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>⚖️ Bildiriye İtiraz</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Bu bildirim hakkındaki görüşünüzü paylaşın. Moderatörlerimiz inceleyecek.</p>
          <form onSubmit={submitAppeal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={appeal.reason || ''} onChange={e => setAppeal(a => ({...a, reason: e.target.value}))} required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', background: 'white' }}>
              <option value="">İtiraz sebebini seçin...</option>
              <option value="yanlis_bilgi">Yanlış bilgi içeriyor</option>
              <option value="ben_degilim">Bu kişi ben değilim</option>
              <option value="spam">Spam veya sahte içerik</option>
              <option value="hakaret">Hakaret veya iftira içeriyor</option>
              <option value="diger">Diğer</option>
            </select>
            <input value={appeal.name} onChange={e => setAppeal(a => ({...a, name: e.target.value}))} placeholder="Adınız Soyadınız" required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit' }} />
            <input type="email" value={appeal.email} onChange={e => setAppeal(a => ({...a, email: e.target.value}))} placeholder="Email adresiniz" required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit' }} />
            <textarea value={appeal.message} onChange={e => setAppeal(a => ({...a, message: e.target.value}))} placeholder="İtiraz gerekçenizi açıklayın..." required rows={3} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAppeal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}>İptal</button>
              <button type="submit" style={{ flex: 2, padding: '10px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Gönder</button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer' }}>
            <X size={28} />
          </button>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
