import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 1,  name: '👗 Giyim & Moda' },
  { id: 2,  name: '💄 Kozmetik & Güzellik' },
  { id: 3,  name: '🏠 Ev & Dekorasyon' },
  { id: 4,  name: '📱 Elektronik & Aksesuar' },
  { id: 5,  name: '🍕 Yemek & Catering' },
  { id: 6,  name: '💪 Spor & Supplement' },
  { id: 7,  name: '🥗 Dyetisyen & Sağlık' },
  { id: 8,  name: '🚗 Araç Bakım & Detailing' },
  { id: 9,  name: '👶 Anne & Bebek' },
  { id: 10, name: '📸 Fotoğrafçı & Organizasyon' },
  { id: 11, name: '💎 Takı & Aksesuar' },
  { id: 12, name: '🎙️ İçerik Üretici & Influencer' },
  { id: 13, name: '📌 Diğer' },
];

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function CreateProfilePage() {
  const user = useAuthStore(s => s.user);
  const fetchMe = useAuthStore(s => s.fetchMe);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [igUsername, setIgUsername] = useState('');
  const [igProfile, setIgProfile] = useState(null);
  const [igLoading, setIgLoading] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>Giriş yapmanız gerekiyor</h2>
      <Link to="/giris" style={{ background: '#013C26', color: 'white', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>Giriş Yap</Link>
    </div>
  );

  async function lookupInstagram() {
    const username = igUsername.replace('@', '').trim();
    if (!username) return toast.error('Kullanıcı adı girin.');
    setIgLoading(true);
    setIgProfile(null);
    try {
      const data = await apiFetch('/instagram/lookup?username=' + encodeURIComponent(username));
      setIgProfile(data);
    } catch (e) {
      toast.error('Profil bulunamadı.');
    }
    setIgLoading(false);
  }

  async function verifyBio() {
    if (!igProfile) return;
    setVerifying(true);
    try {
      const r = await apiFetch('/instagram/verify', {
        method: 'POST',
        body: JSON.stringify({ username: igProfile.username })
      });
      if (r.verified) {
        setVerified(true);
        toast.success('Bio doğrulandı!');
      } else {
        toast.error(r.message || 'Bio kodu bulunamadı.');
      }
    } catch (e) {
      toast.error(e.message);
    }
    setVerifying(false);
  }

  async function createProfile() {
    if (!igProfile || !categoryId) return toast.error('Tüm alanları doldurun.');
    setSubmitting(true);
    try {
      await apiFetch('/subjects/create', {
        method: 'POST',
        body: JSON.stringify({
          instagram_username: igProfile.username,
          instagram_avatar: igProfile.profile_pic_url,
          instagram_verified: igProfile.is_verified,
          instagram_followers: igProfile.follower_count,
          name: igProfile.full_name || igProfile.username,
          category_id: categoryId,
          claimed: verified,
        })
      });
      await fetchMe();
      toast.success('Profiliniz oluşturuldu!');
      navigate('/konu/' + encodeURIComponent(igProfile.username));
    } catch (e) {
      toast.error(e.message);
    }
    setSubmitting(false);
  }

  // Progress
  const progress = [1, 2, 3];

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {progress.map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? '#013C26' : '#e5e7eb', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px' }}>

        {/* ADIM 1 — Instagram */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Instagram profiliniz</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Hangi Instagram sayfası sizin?</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Instagram Kullanıcı Adı</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontWeight: 600 }}>@</span>
                  <input value={igUsername} onChange={e => setIgUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookupInstagram()}
                    placeholder="kullanici_adi"
                    style={{ ...inp, paddingLeft: 30 }} />
                </div>
                <button onClick={lookupInstagram} disabled={igLoading} style={{ padding: '11px 20px', borderRadius: 8, background: '#013C26', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {igLoading ? '...' : 'Ara'}
                </button>
              </div>
            </div>

            {igProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f0fdf4', borderRadius: 12, border: '1.5px solid #46A53E', marginBottom: 20 }}>
                <img src={igProfile.profile_pic_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>@{igProfile.username}</span>
                    {igProfile.is_verified && <span>✅</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{igProfile.full_name}</div>
                  {igProfile.follower_count > 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{Number(igProfile.follower_count).toLocaleString('tr')} takipçi</div>
                  )}
                </div>
                <span style={{ fontSize: 20 }}>✓</span>
              </div>
            )}

            <button onClick={() => { if (!igProfile) return toast.error('Önce Instagram profilini arayın.'); setStep(2); }}
              style={{ width: '100%', padding: '12px', borderRadius: 8, background: '#013C26', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Devam Et →
            </button>
          </div>
        )}

        {/* ADIM 2 — Kategori */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Kategori seçin</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Hangi alanda hizmet veriyorsunuz?</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategoryId(String(cat.id))}
                  style={{
                    padding: '8px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    background: categoryId === String(cat.id) ? '#013C26' : 'white',
                    color: categoryId === String(cat.id) ? 'white' : '#374151',
                    border: categoryId === String(cat.id) ? '1.5px solid #013C26' : '1.5px solid #e5e7eb',
                    fontWeight: categoryId === String(cat.id) ? 700 : 400,
                  }}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>← Geri</button>
              <button onClick={() => { if (!categoryId) return toast.error('Kategori seçin.'); setStep(3); }}
                style={{ flex: 2, padding: '12px', borderRadius: 8, background: '#013C26', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Devam Et →
              </button>
            </div>
          </div>
        )}

        {/* ADIM 3 — Bio doğrulama */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Profilinizi doğrulayın</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Instagram bio'nuzda kod yazarak profilinizi sahiplenin.</p>

            {igProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 20 }}>
                <img src={igProfile.profile_pic_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <span style={{ fontWeight: 700 }}>@{igProfile.username}</span>
              </div>
            )}

            {!verified ? (
              <div style={{ background: '#fffbeb', borderRadius: 12, padding: '16px', border: '1px solid #fde68a', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>Bio'nuzda şunu yazın:</div>
                <code style={{ display: 'block', background: 'white', padding: '10px 14px', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#013C26', border: '1px solid #e5e7eb', marginBottom: 12 }}>
                  EB:{igProfile?.username}
                </code>
                <div style={{ fontSize: 12, color: '#92400e', marginBottom: 12 }}>Yazdıktan sonra "Doğruladım" butonuna basın.</div>
                <button onClick={verifyBio} disabled={verifying} style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#46A53E', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {verifying ? 'Kontrol ediliyor...' : '✓ Doğruladım, kontrol et'}
                </button>
              </div>
            ) : (
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px', border: '1px solid #bbf7d0', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>Bio doğrulandı!</div>
              </div>
            )}

            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20, textAlign: 'center' }}>
              Doğrulama yapmadan da devam edebilirsiniz — profil yayına girer ama sahiplenilmemiş olur.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>← Geri</button>
              <button onClick={createProfile} disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: 8, background: '#013C26', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {submitting ? 'Oluşturuluyor...' : '🚀 Profili Oluştur'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
