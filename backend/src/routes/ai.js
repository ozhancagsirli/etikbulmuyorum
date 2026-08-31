import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/analyze', authenticate, requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const { title, description, category_name, subject } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Sen bir moderasyon asistanısın. Aşağıdaki şikayeti analiz et ve JSON formatında yanıt ver.

Şikayet:
- Başlık: ${title}
- Açıklama: ${description}
- Kategori: ${category_name || 'Belirtilmemiş'}
- Kişi/Firma: ${subject || 'Belirtilmemiş'}

Şu kriterlere göre değerlendir:
1. Spam mi?
2. Hakaret/küfür var mı?
3. Yeterli detay var mı?
4. Gerçek bir deneyim gibi görünüyor mu?
5. Onaylanmalı mı?

Sadece şu JSON formatında yanıt ver:
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
    res.json(parsed);
  } catch (err) { next(err); }
});

export default router;
