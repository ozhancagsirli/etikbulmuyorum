import { useState } from 'react';
import { Sparkles, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AIAnalysis({ incident }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Sen bir moderasyon asistanısın. Aşağıdaki şikayeti analiz et ve JSON formatında yanıt ver.

Şikayet:
- Başlık: ${incident.title}
- Açıklama: ${incident.description}
- Kategori: ${incident.category_name || 'Belirtilmemiş'}
- Kişi/Firma: ${incident.subject || 'Belirtilmemiş'}

Şu kriterlere göre değerlendir:
1. Spam mi? (reklam, alakasız içerik)
2. Hakaret/küfür var mı?
3. Yeterli detay var mı?
4. Gerçek bir deneyim gibi görünüyor mu?
5. Onaylanmalı mı?

Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "onay": true/false,
  "guven_skoru": 0-100,
  "spam": true/false,
  "hakaret": true/false,
  "yeterli_detay": true/false,
  "ozet": "kısa analiz",
  "oneri": "onayla veya reddet ve neden"
}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setResult({ hata: 'Analiz yapılamadı: ' + e.message });
    }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={analyze} disabled={loading} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 8, border: 'none',
        background: '#f0fdf4', color: '#16a34a', fontSize: 12,
        fontWeight: 600, cursor: 'pointer',
      }}>
        <Sparkles size={13} /> {loading ? 'Analiz ediliyor...' : 'AI Analiz'}
      </button>

      {result && !result.hata && (
        <div style={{ marginTop: 10, background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {result.onay
              ? <CheckCircle size={16} color="#16a34a" />
              : <XCircle size={16} color="#dc2626" />
            }
            <span style={{ fontWeight: 700, color: result.onay ? '#16a34a' : '#dc2626' }}>
              {result.onay ? 'Onaylanabilir' : 'Reddedilmeli'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, background: '#e5e7eb', padding: '2px 8px', borderRadius: 20 }}>
              Güven: {result.guven_skoru}/100
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {result.spam && <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 20 }}>⚠️ Spam</span>}
            {result.hakaret && <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 20 }}>⚠️ Hakaret</span>}
            {!result.yeterli_detay && <span style={{ fontSize: 11, background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 20 }}>⚠️ Yetersiz detay</span>}
            {result.onay && !result.spam && !result.hakaret && result.yeterli_detay && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 20 }}>✅ Temiz içerik</span>}
          </div>

          <div style={{ color: '#374151', marginBottom: 6 }}>{result.ozet}</div>
          <div style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 12 }}>💡 {result.oneri}</div>
        </div>
      )}

      {result?.hata && (
        <div style={{ marginTop: 8, color: '#dc2626', fontSize: 12 }}>{result.hata}</div>
      )}
    </div>
  );
}
