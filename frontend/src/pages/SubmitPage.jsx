import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import LocationPicker from '../components/LocationPicker';
import ImageUploader from '../components/ImageUploader';
import TagInput from '../components/TagInput';

export default function SubmitPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const subjectRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '',
    location: '', incidentDate: '', isAnonymous: false,
    subject: '', votingDays: 3,
  });

  useEffect(() => { apiFetch('/categories').then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    function handleClick(e) {
      if (subjectRef.current && !subjectRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return (
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e0e0e0', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
      <p style={{ fontSize: 16, color: '#444', marginBottom: 20 }}>Olay bildirmek için giriş yapmanız gerekiyor.</p>
      <Link to="/" style={{ color: '#FF4500', fontWeight: 600, fontSize: 15 }}>Ana sayfaya dön</Link>
    </div>
  );

  const set = field => e => setForm(f => ({
    ...f,
    [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  async function handleSubjectChange(e) {
    const val = e.target.value;
    setForm(f => ({ ...f, subject: val }));
    if (val.length >= 2) {
      try {
        const data = await apiFetch('/incidents/subjects/search?q=' + encodeURIComponent(val));
        setSubjectSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch { setShowSuggestions(false); }
    } else {
      setShowSuggestions(false);
    }
  }

  function selectSubject(name) {
    setForm(f => ({ ...f, subject: name }));
    setShowSuggestions(false);
  }

  function nextStep() {
    if (step === 1) {
      if (!form.categoryId) return toast.error('Lütfen bir kategori seçin.');
      if (form.title.length < 3) return toast.error('Kişi/Firma Adı ve Yaşananlar en az 3 karakter olmalı.');
    }
    if (step === 2) {
      if (form.description.length < 50) return toast.error('Ne Yaşandı? en az 50 karakter olmalı.');
    }
    setStep(s => s + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          categoryId: Number(form.categoryId),
          votingDays: Number(form.votingDays),
          incidentDate: form.incidentDate || undefined,
          images: images.map(i => i.url),
          tags,
        }),
      });
      toast.success('Olayınız alındı! İnceleme sonrası yayınlanacak.');
      navigate('/profil');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1.5px solid #e0e0e0', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', background: 'white',
  };

  const selectedCategory = categories.find(c => String(c.id) === String(form.categoryId));

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', padding: '20px 24px', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🚨 Şikayet Ekle</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Deneyimini paylaş, başkalarını koru.</p>
      </div>

      {/* Adım göstergesi */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', padding: '16px 24px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: n < 3 ? 1 : 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= n ? '#FF4500' : '#f0f0f0',
              color: step >= n ? 'white' : '#888', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>{step > n ? '✓' : n}</div>
            <span style={{ fontSize: 13, color: step >= n ? '#1c1c1c' : '#aaa', fontWeight: step === n ? 600 : 400 }}>
              {n === 1 ? 'Temel Bilgiler' : n === 2 ? 'Olay Detayı' : 'Son Ayarlar'}
            </span>
            {n < 3 && <div style={{ flex: 1, height: 2, background: step > n ? '#FF4500' : '#f0f0f0', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e0e0', padding: '24px 28px' }}>

        {/* ADIM 1 — Kategori + Kişi/Firma Adı ve Yaşananlar + Şirket/Kişi/Marka */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Kategori <span style={{ color: '#FF4500' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {categories.map(c => (
                  <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, categoryId: c.id }))} style={{
                    padding: '10px 8px', borderRadius: 8, border: '1.5px solid',
                    borderColor: String(form.categoryId) === String(c.id) ? '#FF4500' : '#e0e0e0',
                    background: String(form.categoryId) === String(c.id) ? '#fff5f0' : 'white',
                    color: String(form.categoryId) === String(c.id) ? '#FF4500' : '#444',
                    fontWeight: String(form.categoryId) === String(c.id) ? 600 : 400,
                    fontSize: 13, cursor: 'pointer', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                    <div>{c.name_tr}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Kişi/Firma Adı ve Yaşananlar <span style={{ color: '#FF4500' }}>*</span>
              </label>
              <input
                value={form.title}
                onChange={set('title')}
                maxLength={500}
                placeholder="Kimin hakkında şikayet ediyorsunuz?"
                style={inp}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {form.title.length > 0 && form.title.length < 3 && (
                  <span style={{ fontSize: 11, color: '#f85149' }}>En az 3 karakter gerekli</span>
                )}
                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{form.title.length}/500</span>
              </div>
            </div>

            {/* Şirket / Kişi / Marka — autocomplete */}
            <div ref={subjectRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                🏢 Şirket / Kişi / Marka <span style={{ color: '#888', fontWeight: 400 }}>(isteğe bağlı)</span>
              </label>
              <input
                value={form.subject}
                onChange={handleSubjectChange}
                onFocus={() => form.subject.length >= 2 && setShowSuggestions(subjectSuggestions.length > 0)}
                placeholder="ör. Migros, Turkcell, Ali Yılmaz..."
                style={inp}
              />
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                Daha önce girilen isimler önerilecek, yeni isim de yazabilirsiniz.
              </div>
              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'white', borderRadius: 8, border: '1px solid #e0e0e0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden',
                }}>
                  {subjectSuggestions.map(s => (
                    <button key={s.name} type="button" onClick={() => selectSubject(s.name)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '10px 14px', border: 'none', background: 'white',
                      cursor: 'pointer', fontSize: 13, textAlign: 'left', borderBottom: '1px solid #f8f8f8',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <span>{s.name}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{s.count} olay</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={nextStep} style={{
              padding: '12px', borderRadius: 8, border: 'none',
              background: '#FF4500', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>Devam Et →</button>
          </div>
        )}

        {/* ADIM 2 — Ne Yaşandı? + Etiket + Fotoğraf */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {selectedCategory && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff5f0', borderRadius: 8, border: '1px solid #ffd5c2' }}>
                <span style={{ fontSize: 20 }}>{selectedCategory.icon}</span>
                <span style={{ fontSize: 14, color: '#FF4500', fontWeight: 600 }}>{selectedCategory.name_tr}</span>
                <span style={{ fontSize: 13, color: '#888' }}>— {form.title}</span>
                {form.subject && <span style={{ fontSize: 12, background: '#f0f0f0', padding: '2px 8px', borderRadius: 20, color: '#555' }}>📌 {form.subject}</span>}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Ne Yaşandı? <span style={{ color: '#FF4500' }}>*</span>
              </label>
              <textarea value={form.description} onChange={set('description')} rows={7} maxLength={5000}
                placeholder="Ne söz verdi, ne yaptı? Kanıt var mı? Ayrıntılı anlatın..."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {form.description.length > 0 && form.description.length < 50 && (
                  <span style={{ fontSize: 11, color: '#f85149' }}>En az 50 karakter gerekli</span>
                )}
                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{form.description.length}/5000</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                🏷️ Etiketler <span style={{ color: '#888', fontWeight: 400 }}>(isteğe bağlı, max 5)</span>
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            <ImageUploader images={images} onChange={setImages} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{
                flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e0e0e0',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer',
              }}>← Geri</button>
              <button type="button" onClick={nextStep} style={{
                flex: 2, padding: '12px', borderRadius: 8, border: 'none',
                background: '#FF4500', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>Devam Et →</button>
            </div>
          </div>
        )}

        {/* ADIM 3 — Son Ayarlar */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #eee' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{form.title}</div>
              <div style={{ fontSize: 12, color: '#888', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>{selectedCategory?.icon} {selectedCategory?.name_tr}</span>
                {form.subject && <span>📌 {form.subject}</span>}
                <span>· {form.description.length} karakter</span>
                {images.length > 0 && <span>· {images.length} fotoğraf</span>}
                {tags.length > 0 && <span>· {tags.map(t => '#'+t).join(' ')}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>📍 Şehir / İlçe</label>
                <LocationPicker value={form.location} onChange={val => setForm(f => ({ ...f, location: val }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>📅 Olay Tarihi</label>
                <input type="date" value={form.incidentDate} onChange={set('incidentDate')}
                  max={new Date().toISOString().slice(0, 10)} style={inp} />
              </div>
            </div>

            {/* Oylama süresi */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                ⏱️ Oylama Süresi
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, votingDays: d }))} style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid',
                    borderColor: form.votingDays === d ? '#FF4500' : '#e0e0e0',
                    background: form.votingDays === d ? '#fff5f0' : 'white',
                    color: form.votingDays === d ? '#FF4500' : '#555',
                    fontWeight: form.votingDays === d ? 700 : 400,
                    fontSize: 14, cursor: 'pointer', textAlign: 'center',
                  }}>
                    {d} Gün
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                Süre bitince oylar sayılır. Etik dışı sonuçlanırsa olay tam görünür kalır. Etik sonuçlanırsa başlık yeşile döner ve detaylar gizlenir.
              </div>
            </div>

            <label style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', padding: '14px 16px', background: '#f8f9fa', borderRadius: 8, border: '1.5px solid', borderColor: form.isAnonymous ? '#FF4500' : '#eee' }}>
              <input type="checkbox" checked={form.isAnonymous} onChange={set('isAnonymous')} style={{ width: 18, height: 18, accentColor: '#FF4500' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>🎭 Anonim olarak paylaş</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Adınız gösterilmez, kimliğiniz gizlenir</div>
              </div>
            </label>

            <div style={{ background: '#fff8e6', border: '1px solid #f0c040', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#7a5800' }}>
              ⚠️ Gerçek kişilerin adlarını paylaşmayın. Hukuki sorumluluk size aittir.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(2)} style={{
                flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e0e0e0',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer',
              }}>← Geri</button>
              <button type="submit" disabled={submitting} style={{
                flex: 2, padding: '13px', borderRadius: 8, border: 'none',
                background: submitting ? '#ccc' : '#FF4500',
                color: 'white', fontWeight: 700, fontSize: 16,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? 'Gönderiliyor...' : '📤 Olayı Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
