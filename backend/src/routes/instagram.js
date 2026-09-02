import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

router.get('/lookup', async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username gerekli.' });

    const response = await fetch(
      `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user_info_web?username=${encodeURIComponent(username)}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
        }
      }
    );

    const data = await response.json();
    if (!data.data) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const u = data.data;
    // Profil fotoğrafını Cloudinary'e yükle
    let avatarUrl = u.profile_pic_url_hd || u.profile_pic_url;
    try {
      const upload = await cloudinary.uploader.upload(avatarUrl, {
        folder: 'etikbulmuyorum/instagram',
        public_id: 'ig_' + u.username,
        overwrite: true,
      });
      avatarUrl = upload.secure_url;
    } catch (e) {
      console.error('Cloudinary upload failed:', e.message);
    }

    // Person score başlat — yoksa 1000 ile ekle
    if (u.username) {
      const pool = (await import('../db/pool.js')).default;
      await pool.query(`
        INSERT INTO person_scores (instagram_username, score, total_votes)
        VALUES ($1, 1000, 0)
        ON CONFLICT (instagram_username) DO NOTHING
      `, [u.username]);
    }

    res.json({
      username: u.username,
      full_name: u.full_name,
      profile_pic_url: avatarUrl,
      is_verified: u.is_verified,
      biography: u.biography,
      follower_count: u.edge_followed_by?.count || u.follower_count || 0,
    });
  } catch (err) { next(err); }
});

// POST /api/instagram/verify - Bio kodu doğrulama
router.post('/verify', authenticate, async (req, res, next) => {
    console.log('VERIFY USER:', req.user?.id, 'HEADERS:', req.headers.authorization?.slice(0,20));
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username gerekli.' });

    const response = await fetch(
      `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user_info_web?username=${encodeURIComponent(username)}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
        }
      }
    );

    const data = await response.json();
    if (!data.data) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const u = data.data;
    const bio = u.biography || '';
    // Gizli karakterleri temizle
    const cleanBio = bio.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').toLowerCase().trim();
    const expectedCode = 'eb:' + username.toLowerCase().trim();
    console.log('CLEANBIO:', JSON.stringify(cleanBio), 'CODE:', expectedCode, 'MATCH:', cleanBio.includes(expectedCode));
    const verified = cleanBio.includes(expectedCode);

    if (verified) {
      // Cloudinary'e yükle
      let avatarUrl = u.profile_pic_url_hd || u.profile_pic_url;
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        const upload = await cloudinary.uploader.upload(avatarUrl, {
          folder: 'etikbulmuyorum/instagram',
          public_id: 'ig_' + username,
          overwrite: true,
        });
        avatarUrl = upload.secure_url;
      } catch (e) { console.error('Cloudinary:', e.message); }

      // Kullanıcıyı güncelle
      if (req.user) {
        const pool = (await import('../db/pool.js')).default;
        await pool.query(
          'UPDATE users SET instagram_username=$1, instagram_verified=true, instagram_avatar=$2, instagram_followers=$3 WHERE id=$4',
          [username, avatarUrl, u.edge_followed_by?.count || 0, req.user.id]
        );
        // subjects tablosunda claimed yap
        await pool.query(`
          UPDATE subjects SET claimed=true, claimed_user_id=$1 
          WHERE instagram_username=$2
        `, [req.user.id, username]);
        // subjects yoksa ekle
        await pool.query(`
          INSERT INTO subjects (name, instagram_username, instagram_avatar, instagram_verified, instagram_followers, claimed, claimed_user_id, score)
          VALUES ($1, $2, $3, true, $4, true, $5, 1000)
          ON CONFLICT (instagram_username) DO UPDATE SET 
            claimed=true, claimed_user_id=$5, instagram_avatar=$3, instagram_verified=true
        `, [u.full_name || username, username, avatarUrl, u.edge_followed_by?.count || 0, req.user.id]);
      }

      res.json({ verified: true, message: 'Instagram hesabı doğrulandı!' });
    } else {
      res.json({ 
        verified: false, 
        bio: bio,
        expectedCode,
        message: `Bio'nuzda "${expectedCode}" kodu bulunamadı.`
      });
    }
  } catch (err) { next(err); }
});

export default router;
