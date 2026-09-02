import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { testConnection } from './db/pool.js';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import voteRoutes from './routes/votes.js';
import commentRoutes from './routes/comments.js';
import categoryRoutes from './routes/categories.js';
import moderationRoutes from './routes/moderation.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import sitemapRoutes from './routes/sitemap.js';
import statsRoutes from './routes/stats.js';
import notificationRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import aiRoutes from './routes/ai.js';
import appealsRoutes from './routes/appeals.js';
import instagramRoutes from './routes/instagram.js';
import sentimentRoutes from './routes/sentiment.js';
import passwordResetRoutes from './routes/passwordReset.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/appeals', appealsRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/sentiment', sentimentRoutes);

// Tüm kategorileri profilleriyle birlikte getir
app.get('/api/homepage', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { rows: cats } = await pool.query('SELECT * FROM categories WHERE id != 13 ORDER BY id');
    
    const result = await Promise.all(cats.map(async cat => {
      const { rows: profiles } = await pool.query(`
        SELECT 
          s.name, s.instagram_username, s.instagram_avatar, s.instagram_verified,
          s.instagram_followers, s.count, s.claimed,
          COALESCE(ps.score, 1000) as person_score
        FROM subjects s
        LEFT JOIN person_scores ps ON ps.instagram_username = s.instagram_username
        WHERE s.category_id = $1
        ORDER BY COALESCE(ps.score, 1000) DESC
        LIMIT 5
      `, [cat.id]);
      return { ...cat, profiles };
    }));
    
    res.json(result.filter(cat => cat.profiles.length > 0));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Kategori sayfası endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/categories/:slug', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { rows: cats } = await pool.query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
    if (!cats.length) return res.status(404).json({ error: 'Kategori bulunamadı.' });
    const cat = cats[0];
    
    const { rows: profiles } = await pool.query(`
      SELECT 
        s.name, s.instagram_username, s.instagram_avatar, s.instagram_verified, 
        s.instagram_followers, s.count, s.score, s.claimed,
        COALESCE(ps.score, 1000) as person_score,
        COALESCE(ps.total_votes, 0) as total_votes
      FROM subjects s
      LEFT JOIN person_scores ps ON ps.instagram_username = s.instagram_username
      WHERE s.category_id = $1
      ORDER BY COALESCE(ps.score, 1000) DESC, s.count DESC
    `, [cat.id]);
    
    res.json({ category: cat, profiles });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Instagram doğrulama kontrolü — her gün çalışır
async function checkInstagramVerifications() {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { rows: users } = await pool.query(
      'SELECT id, instagram_username FROM users WHERE instagram_verified = true AND instagram_username IS NOT NULL'
    );
    
    console.log(`Instagram kontrolü başladı: ${users.length} kullanıcı`);
    
    for (const user of users) {
      try {
        const res = await fetch(
          `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user_info_web?username=${encodeURIComponent(user.instagram_username)}`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
            }
          }
        );
        const data = await res.json();
        
        if (!data.data) {
          // Profil bulunamadı — doğrulamayı kaldır
          await pool.query(
            'UPDATE users SET instagram_verified = false WHERE id = $1',
            [user.id]
          );
          console.log(`${user.instagram_username} profili bulunamadı, doğrulama kaldırıldı`);
          continue;
        }

        const bio = data.data.biography || '';
        const expectedCode = 'eb:' + user.instagram_username.toLowerCase();
        const cleanBio = bio.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').toLowerCase().trim();
        
        if (!cleanBio.includes(expectedCode)) {
          // Bio kodu kaldırılmış — doğrulamayı kaldır
          await pool.query(
            'UPDATE users SET instagram_verified = false WHERE id = $1',
            [user.id]
          );
          console.log(`${user.instagram_username} bio kodu kaldırılmış, doğrulama kaldırıldı`);
        }
        
        // Rate limit için bekle
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`${user.instagram_username} kontrol hatası:`, e.message);
      }
    }
    console.log('Instagram kontrolü tamamlandı');
  } catch (e) {
    console.error('Instagram kontrol hatası:', e.message);
  }
}

// Her 24 saatte bir çalıştır
setInterval(checkInstagramVerifications, 24 * 60 * 60 * 1000);
// Başlangıçta 5 dakika sonra ilk kontrolü yap
setTimeout(checkInstagramVerifications, 5 * 60 * 1000);

// Manuel tetikleme endpoint'i (admin)
app.get('/api/admin/check-instagram', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.JWT_SECRET) return res.status(401).json({ error: 'Yetkisiz' });
  checkInstagramVerifications();
  res.json({ message: 'Kontrol başlatıldı' });
});

// Profil oluştur
app.post('/api/subjects/create', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { instagram_username, instagram_avatar, instagram_verified, instagram_followers, name, category_id, claimed } = req.body;
    if (!instagram_username) return res.status(400).json({ error: 'instagram_username gerekli.' });
    
    // Kullanıcı zaten profil oluşturmuş mu?
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        const { rows: existing } = await pool.query(
          'SELECT id FROM subjects WHERE claimed_user_id = $1',
          [decoded.userId]
        );
        if (existing.length > 0) {
          return res.status(400).json({ error: 'Zaten bir profiliniz var. Tek profil oluşturabilirsiniz.' });
        }
      } catch(e) {}
    }

    const { rows } = await pool.query(`
      INSERT INTO subjects (name, instagram_username, instagram_avatar, instagram_verified, instagram_followers, category_id, claimed, score, count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1000, 0)
      ON CONFLICT (instagram_username) DO UPDATE SET
        category_id = COALESCE($6, subjects.category_id),
        instagram_avatar = COALESCE($3, subjects.instagram_avatar),
        instagram_verified = COALESCE($4, subjects.instagram_verified),
        instagram_followers = COALESCE($5, subjects.instagram_followers),
        claimed = CASE WHEN $7 THEN true ELSE subjects.claimed END
      RETURNING *
    `, [name || instagram_username, instagram_username, instagram_avatar, instagram_verified, instagram_followers, category_id, claimed || false]);

    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Owner response endpoint
app.post('/api/incidents/:id/owner-response', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { response } = req.body;
    const jwt = await import('jsonwebtoken');
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Giriş yapın.' });
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    const { rows: userRows } = await pool.query('SELECT instagram_username FROM users WHERE id=$1', [decoded.userId]);
    const igUsername = userRows[0]?.instagram_username;
    if (!igUsername) return res.status(403).json({ error: 'Instagram doğrulaması gerekli.' });

    const { rows: incRows } = await pool.query('SELECT instagram_username FROM incidents WHERE id=$1', [req.params.id]);
    if (incRows[0]?.instagram_username !== igUsername) return res.status(403).json({ error: 'Bu görüşe yanıt verme yetkiniz yok.' });

    await pool.query('UPDATE incidents SET owner_response=$1 WHERE id=$2', [response, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Subject endpoint
app.get('/api/subjects/:name', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { rows } = await pool.query(
      'SELECT * FROM subjects WHERE instagram_username=$1 OR name=$1 LIMIT 1',
      [decodeURIComponent(req.params.name)]
    );
    if (!rows.length) return res.json({ claimed: false });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Person scores endpoint
app.get('/api/person-scores/:username', async (req, res) => {
  try {
    const pool = (await import('./db/pool.js')).default;
    const { rows } = await pool.query(
      'SELECT score, total_votes FROM person_scores WHERE instagram_username = $1',
      [req.params.username]
    );
    if (!rows.length) return res.json({ score: 1000, total_votes: 0 });
    res.json(rows[0]);
  } catch (e) { res.json({ score: 1000, total_votes: 0 }); }
});
app.use('/api/auth', passwordResetRoutes);
app.use('/', sitemapRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));
app.use((_req, res) => res.status(404).json({ error: 'Endpoint bulunamadi.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Sunucu hatasi.' });
});

(async () => {
  await testConnection();
  app.listen(PORT, () => console.log('API running on port ' + PORT));
})();
