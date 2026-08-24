// Basit spam filtresi middleware
const SPAM_WORDS = ['casino', 'bahis', 'seks', 'porn', 'xxx', 'kumar', 'iddaa', 'bitcoin kazan', 'para kazan', 'kredi'];
const recentRequests = new Map();

export function spamFilter(req, res, next) {
  const text = [
    req.body?.title || '',
    req.body?.description || '',
    req.body?.content || '',
  ].join(' ').toLowerCase();

  // Spam kelime kontrolü
  const foundSpam = SPAM_WORDS.find(w => text.includes(w));
  if (foundSpam) {
    return res.status(400).json({ error: 'İçeriğiniz uygunsuz kelimeler içeriyor.' });
  }

  // Çok kısa içerik
  if (req.body?.description && req.body.description.trim().length < 20) {
    return res.status(400).json({ error: 'Açıklama çok kısa.' });
  }

  // Aynı IP'den rate limit (5 dakikada 3 olay)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const key = `incident:${ip}`;
  const now = Date.now();
  const requests = recentRequests.get(key) || [];
  const recent = requests.filter(t => now - t < 5 * 60 * 1000);

  if (recent.length >= 3) {
    return res.status(429).json({ error: 'Çok fazla olay gönderdiniz. 5 dakika bekleyin.' });
  }

  recent.push(now);
  recentRequests.set(key, recent);

  next();
}
