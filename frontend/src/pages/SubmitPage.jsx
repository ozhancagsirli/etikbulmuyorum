import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import ImageUploader from '../components/ImageUploader';
import TagInput from '../components/TagInput';

export default function SubmitPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [step, setStep] = useState(1);
  const [igUsername, setIgUsername] = useState('');
  const [igProfile, setIgProfile] = useState(null);
  const [igLoading, setIgLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    location: '',
    incidentDate: '',
    isAnonymous: false,
    images: [],
    tags: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function lookupInstagram() {
    const username = igUsername.replace('@', '').trim();
    if (!username) return toast.error('Instagram kullanıcı adı girin.');
    setIgLoading(true);
    setIgProfile(null);
    try {
      const data = await apiFetch('/instagram/lookup?username=' + encodeURIComponent(username));
      setIgProfile(data);
    } catch (e) {
      toast.error('Kullanıcı bulunamadı. Kullanıcı adını kontrol edin.');
    }
    setIgLoading(false);
  }

  function nextStep() {
    if (step === 1) {
      if (!igProfile) return toast.error('Lütfen önce Instagram profilini arayın.');
      if (!form.title || form.title.length < 3) return toast.error('Başlık en az 3 karakter olmalı.');
    }
    if (step === 2) {
      if (form.description.length < 30) return toast.error('Açıklama en az 30 karakter olmalı.');
      if (!form.images || form.images.length === 0) return toast.error('Lütfen en az 1 kanıt fotoğrafı yükleyin.');
    }
    setStep(s => s + 1);
  }

  async function submit() {
    setSubmitting(true);
    try {
      await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          subject: igProfile.username,
          person_name: igProfile.full_name,
          instagram_username: igProfile.username,
          instagram_avatar: igProfile.profile_pic_url,
          instagram_verified: igProfile.is_verified,
          instagram_followers: igProfile.follower_count,
        }),
      });
      toast.success('Bildiriminiz alındı, moderasyon bekliyor.');
      navigate('/');
    } catch (e) {
      toast.error(e.message);
    }
    setSubmitting(false);
  }

  if (!user) return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <h2 style={{ marginBottom: 8 }}>Giriş yapmanız gerekiyor</h2>
      <button onClick={() => navigate('/giris')} style={{ background: '#46A53E', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        Giriş Yap
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? '#46A53E' : '#e5e7eb', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 28px' }}>

        {/* ADIM 1 — Instagram profili + başlık */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#111827' }}>Kim hakkında bildiri yapıyorsunuz?</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Instagram kullanıcı adını girin, profil otomatik çekilecek.</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Instagram Kullanıcı Adı <span style={{ color: '#46A53E' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontWeight: 600 }}>@</span>
                  <input
                    value={igUsername}
                    onChange={e => setIgUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookupInstagram()}
                    placeholder="kullanici_adi"
                    style={{ ...inp, paddingLeft: 30 }}
                  />
                </div>
                <button onClick={lookupInstagram} disabled={igLoading} style={{
                  padding: '11px 20px', borderRadius: 8, background: '#46A53E', color: 'white',
                  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {igLoading ? '...' : 'Ara'}
                </button>
              </div>
            </div>

            {/* Instagram profil önizleme */}
            {igProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1.5px solid #46A53E', marginBottom: 20 }}>
                <img src={igProfile.profile_pic_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>@{igProfile.username}</span>
                    {igProfile.is_verified && <span style={{ fontSize: 14 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{igProfile.full_name}</div>
                  {igProfile.follower_count > 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {igProfile.follower_count.toLocaleString('tr')} takipçi
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 20 }}>✓</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Başlık <span style={{ color: '#46A53E' }}>*</span></label>
              <input value={form.title} onChange={set('title')} placeholder="Ne yaşandı? Kısaca özetle..." style={inp} />
            </div>
          </div>
        )}

        {/* ADIM 2 — Detaylar + kanıt */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#111827' }}>Ne yaşandı?</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Detaylı anlat. Kanıt eklemen zorunlu.</p>

            {igProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                <img src={igProfile.profile_pic_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>@{igProfile.username}</span>
                {igProfile.is_verified && <span>✅</span>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Açıklama <span style={{ color: '#46A53E' }}>*</span></label>
                <textarea value={form.description} onChange={set('description')} rows={5}
                  placeholder="Ne söz verdi, ne yaptı? Ayrıntılı anlat..."
                  style={{ ...inp, resize: 'vertical' }}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{form.description.length} karakter (min 30)</div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  📎 Kanıt Fotoğrafı <span style={{ color: '#46A53E' }}>*</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>Dekont, mesaj, sözleşme vb.</span>
                </label>
                <ImageUploader value={form.images || []} onChange={imgs => setForm(f => ({ ...f, images: Array.isArray(imgs) ? imgs : [] }))} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Etiketler</label>
                <TagInput value={form.tags || []} onChange={tags => setForm(f => ({ ...f, tags: Array.isArray(tags) ? tags : [] }))} />
              </div>
            </div>
          </div>
        )}

        {/* ADIM 3 — Konum + tarih + anonim */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#111827' }}>Son bilgiler</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>İsteğe bağlı ek bilgiler.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>📍 Konum</label>
                <input value={form.location} onChange={set('location')} placeholder="İl, İlçe" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>📅 Tarih</label>
                <input type="date" value={form.incidentDate} onChange={set('incidentDate')} style={inp} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#46A53E' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Anonim paylaş</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Adın görünmez</div>
                </div>
              </label>

              {/* Özet */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>Özet</div>
                {igProfile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <img src={igProfile.profile_pic_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>@{igProfile.username}</span>
                    {igProfile.is_verified && <span>✅</span>}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}><strong>{form.title}</strong></div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{form.images.length} fotoğraf · {form.tags.length} etiket</div>
              </div>
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#374151' }}>
              ← Geri
            </button>
          )}
          {step < 3 ? (
            <button onClick={nextStep} style={{ flex: 2, padding: '12px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Devam Et →
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {submitting ? 'Gönderiliyor...' : '🚀 Bildir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
