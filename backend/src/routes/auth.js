import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import pool from '../db/pool.js';
import { authenticate, generateTokens } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Cok fazla giris denemesi.' },
});

router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Google token gerekli.' });
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name, picture } = ticket.getPayload();
    const { rows } = await pool.query(
      `INSERT INTO users (google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
       RETURNING id, role, is_banned`,
      [googleId, email, name, picture]
    );
    const user = rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'Hesabiniz askiya alinmistir.' });
    const { access, refresh } = generateTokens(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query('INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)', [user.id, refresh, expiresAt]);
    res.json({ accessToken: access, refreshToken: refresh, user: { id: user.id, role: user.role, name, email, avatarUrl: picture } });
  } catch (err) { next(err); }
});

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Ad, email ve sifre gerekli.' });
    if (password.length < 6) return res.status(400).json({ error: 'Sifre en az 6 karakter olmali.' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Bu email zaten kayitli.' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (email, name, password_hash, email_verified) VALUES ($1,$2,$3,true) RETURNING id, role',
      [email.toLowerCase().trim(), name.trim(), hash]
    );
    const { access, refresh } = generateTokens(rows[0].id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query('INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1,$2,$3)', [rows[0].id, refresh, expiresAt]);
    res.status(201).json({ accessToken: access, refreshToken: refresh, user: { id: rows[0].id, role: rows[0].role, name: name.trim(), email: email.toLowerCase().trim(), avatarUrl: null } });
  } catch (err) { next(err); }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email ve sifre gerekli.' });
    const { rows } = await pool.query('SELECT id, role, is_banned, name, password_hash FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!rows.length || !rows[0].password_hash) return res.status(401).json({ error: 'Email veya sifre hatali.' });
    if (rows[0].is_banned) return res.status(403).json({ error: 'Hesabiniz askiya alinmistir.' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Email veya sifre hatali.' });
    const { access, refresh } = generateTokens(rows[0].id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query('INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1,$2,$3)', [rows[0].id, refresh, expiresAt]);
    res.json({ accessToken: access, refreshToken: refresh, user: { id: rows[0].id, role: rows[0].role, name: rows[0].name, email: email.toLowerCase().trim(), avatarUrl: null } });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token gerekli.' });
    let payload;
    try { payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); }
    catch { return res.status(401).json({ error: 'Gecersiz refresh token.' }); }
    const { rows } = await pool.query(
      `SELECT s.id, u.id AS user_id, u.role, u.is_banned FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
      [refreshToken]
    );
    if (!rows.length || rows[0].is_banned) return res.status(401).json({ error: 'Oturum gecersiz.' });
    const { access, refresh: newRefresh } = generateTokens(rows[0].user_id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query('UPDATE sessions SET refresh_token = $1, expires_at = $2 WHERE id = $3', [newRefresh, expiresAt, rows[0].id]);
    res.json({ accessToken: access, refreshToken: newRefresh });
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    res.json({ message: 'Cikis yapildi.' });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, email, name, avatar_url, role, created_at, instagram_username, instagram_verified, instagram_avatar, instagram_followers FROM users WHERE id = $1', [req.user.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
