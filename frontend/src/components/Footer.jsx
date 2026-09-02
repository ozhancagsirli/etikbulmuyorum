import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#0f172a', color: 'white', padding: '40px 24px 24px', marginTop: 40 }}>
      <style>{`
        @media(max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, marginBottom: 32 }}>

          {/* Brand */}
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
              etik <span style={{ color: '#46A53E' }}>bulmuyorum</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
              Instagram satıcıları ve içerik üreticileri hakkında topluluk kaynaklı güven platformu.
            </div>
          </div>

          {/* Platform */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 }}>Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/" style={{ fontSize: 13, color: '#cbd5e1' }}>Ana Sayfa</Link>
              <Link to="/bildir" style={{ fontSize: 13, color: '#cbd5e1' }}>Görüş Bildir</Link>
              <Link to="/profil-olustur" style={{ fontSize: 13, color: '#cbd5e1' }}>Profil Oluştur</Link>
              <Link to="/giris" style={{ fontSize: 13, color: '#cbd5e1' }}>Giriş Yap</Link>
            </div>
          </div>

          {/* Kategoriler */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 }}>Kategoriler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/kategori/giyim-moda" style={{ fontSize: 13, color: '#cbd5e1' }}>👗 Giyim & Moda</Link>
              <Link to="/kategori/kozmetik-guzellik" style={{ fontSize: 13, color: '#cbd5e1' }}>💄 Kozmetik</Link>
              <Link to="/kategori/arac-bakim" style={{ fontSize: 13, color: '#cbd5e1' }}>🚗 Araç Bakım</Link>
              <Link to="/kategori/influencer" style={{ fontSize: 13, color: '#cbd5e1' }}>🎙️ Influencer</Link>
              <Link to="/" style={{ fontSize: 13, color: '#46A53E', fontWeight: 600 }}>Tümünü gör →</Link>
            </div>
          </div>

          {/* Yasal */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 }}>Yasal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/kullanim-sartlari" style={{ fontSize: 13, color: '#cbd5e1' }}>Kullanım Şartları</Link>
              <Link to="/gizlilik" style={{ fontSize: 13, color: '#cbd5e1' }}>Gizlilik Politikası</Link>
              <Link to="/kvkk" style={{ fontSize: 13, color: '#cbd5e1' }}>KVKK</Link>
              <a href="mailto:info@etikbulmuyorum.com" style={{ fontSize: 13, color: '#cbd5e1' }}>İletişim</a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#475569' }}>© 2026 etikbulmuyorum.com · Tüm hakları saklıdır.</div>
          <div style={{ fontSize: 12, color: '#475569' }}>Topluluk kararıyla şekillenen güven platformu</div>
        </div>
      </div>
    </footer>
  );
}
