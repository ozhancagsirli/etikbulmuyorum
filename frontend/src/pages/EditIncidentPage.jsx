import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export default function EditIncidentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [form, setForm] = useState({ title: '', description: '', location: '', subject: '', tags: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/incidents/' + id).then(inc => {
      setForm({
        title: inc.title || '',
        description: inc.description || '',
        location: inc.location || '',
        subject: inc.subject || '',
        tags: inc.tags || [],
      });
      setLoading(false);
    }).catch(() => { toast.error('Olay bulunamadı.'); navigate('/profil'); });
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    if (form.title.length < 3) return toast.error('Başlık en az 3 karakter olmalı.');
    if (form.description.length < 20) return toast.error('Açıklama en az 20 karakter olmalı.');
    setSaving(true);
    try {
      await apiFetch('/incidents/' + id, { method: 'PUT', body: JSON.stringify(form) });
      toast.success('Görüş güncellendi, moderasyon bekliyor.');
      navigate('/profil');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 32px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: '#111827' }}>✏️ Görüşü Düzenle</h1>
        <p style={{ fontSize: 13, color: '#f59e0b', background: '#fffbeb', padding: '8px 12px', borderRadius: 8, marginBottom: 20, border: '1px solid #fde68a' }}>
          ⚠️ Düzenleme sonrası olay moderasyon onayına gönderilecek.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Başlık</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} required />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Açıklama</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              style={{ ...inp, minHeight: 140, resize: 'vertical' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Konum</label>
            <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="İl, İlçe" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate('/profil')} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              İptal
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
