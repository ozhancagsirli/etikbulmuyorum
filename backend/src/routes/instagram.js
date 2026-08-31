import { Router } from 'express';

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
    res.json({
      username: u.username,
      full_name: u.full_name,
      profile_pic_url: u.profile_pic_url_hd || u.profile_pic_url,
      is_verified: u.is_verified,
      biography: u.biography,
      follower_count: u.edge_followed_by?.count || u.follower_count || 0,
    });
  } catch (err) { next(err); }
});

export default router;
