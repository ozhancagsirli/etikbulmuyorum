import { useState } from 'react';
import { Share2, Copy, Check, Twitter, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareButton({ title, url }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const fullUrl = `https://etikbulmuyorum.com${url}`;

  function copyLink() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  }

  function shareWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + fullUrl)}`, '_blank');
    setOpen(false);
  }

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`, '_blank');
    setOpen(false);
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({ title, url: fullUrl });
    } else {
      setOpen(o => !o);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={nativeShare} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e5e7eb',
        background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#FF4500'; e.currentTarget.style.color='#FF4500'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.color='#6b7280'; }}
      >
        <Share2 size={15} /> Paylaş
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 42, left: 0, background: 'white',
          borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 180, overflow: 'hidden', zIndex: 100,
        }}>
          <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
            {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} color="#6b7280" />}
            {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
          </button>
          <button onClick={shareWhatsapp} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
            <MessageCircle size={16} color="#25d366" /> WhatsApp
          </button>
          <button onClick={shareTwitter} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
            <Twitter size={16} color="#1da1f2" /> Twitter/X
          </button>
        </div>
      )}
    </div>
  );
}
