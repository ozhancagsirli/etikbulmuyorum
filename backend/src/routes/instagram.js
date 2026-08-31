import { Router } from 'express';
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

export default router;
