import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

export default function ImageUploader({ images, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    if (!file.type.startsWith('image/')) return toast.error('Sadece resim yüklenebilir.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Dosya 5MB\'dan küçük olmalı.');
    if (images.length >= 3) return toast.error('En fazla 3 fotoğraf eklenebilir.');

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Yükleme başarısız.');
      }

      const data = await res.json();
      onChange([...images, { url: data.url, publicId: data.publicId }]);
      toast.success('Fotoğraf yüklendi!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files) {
    Array.from(files).slice(0, 3 - images.length).forEach(uploadFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeImage(idx) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
        📷 Fotoğraf Ekle <span style={{ color: '#888', fontWeight: 400 }}>(isteğe bağlı, max 3 adet)</span>
      </label>

      {/* Yükleme alanı */}
      {images.length < 3 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#FF4500' : '#ddd'}`,
            borderRadius: 12,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragging ? '#fff5f0' : uploading ? '#fafafa' : 'white',
            transition: 'all 0.2s',
            marginBottom: images.length > 0 ? 12 : 0,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 14, color: '#888' }}>Yükleniyor...</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{dragging ? '📂' : '📷'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                {dragging ? 'Bırakın!' : 'Fotoğraf sürükleyin veya tıklayın'}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                PNG, JPG, WEBP · Max 5MB · En fazla {3 - images.length} fotoğraf daha
              </div>
            </div>
          )}
        </div>
      )}

      {/* Önizleme */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', width: 100, height: 100 }}>
              <img
                src={img.url}
                alt=""
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                style={{
                  position: 'absolute', top: -8, right: -8,
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#f85149', color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: 13, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              >×</button>
            </div>
          ))}
          {images.length < 3 && (
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                width: 100, height: 100, borderRadius: 8,
                border: '2px dashed #ddd', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#aaa', fontSize: 28,
                background: 'white',
              }}
            >+</div>
          )}
        </div>
      )}
    </div>
  );
}
