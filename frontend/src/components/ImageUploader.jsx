import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function ImageUploader({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const form = new FormData();
        form.append('image', file);
        const res = await fetch(import.meta.env.VITE_API_URL + '/upload', {
          method: 'POST',
          body: form,
          headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') }
        });
        const data = await res.json();
        if (data.url) uploaded.push(data.url);
      }
      onChange([...(value || []), ...uploaded]);
    } catch (e) { console.error(e); }
    setUploading(false);
  }

  function remove(idx) {
    onChange((value || []).filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {(value || []).map((url, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <button onClick={() => remove(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1.5px dashed #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#6b7280', background: '#f9fafb' }}>
        <input type="file" accept="image/*" multiple onChange={handleFile} style={{ display: 'none' }} />
        {uploading ? '⏳ Yükleniyor...' : '📎 Fotoğraf ekle'}
      </label>
    </div>
  );
}
