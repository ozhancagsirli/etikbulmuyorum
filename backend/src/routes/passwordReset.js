import { Router } from 'express';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db/pool.js';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Şifre sıfırlama tablosu oluştur
await pool.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email gerekli.' });

    const { rows } = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.json({ message: 'Email gönderildi.' }); // Güvenlik için aynı mesaj

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [rows[0].id, token, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/sifre-sifirla?token=${token}`;

    await resend.emails.send({
      from: 'EtikBulmuyorum <noreply@etikbulmuyorum.com>',
      to: email,
      subject: 'Şifre Sıfırlama',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #013C26;">Şifre Sıfırlama</h2>
          <p>Merhaba ${rows[0].name},</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Link 1 saat geçerlidir.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #46A53E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Şifremi Sıfırla
          </a>
          <p style="color: #9ca3af; font-size: 12px;">Bu emaili siz istemediyseniz dikkate almayın.</p>
        </div>
      `
    });

    res.json({ message: 'Email gönderildi.' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token ve şifre gerekli.' });
    if (password.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });

    const { rows } = await pool.query(
      'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link.' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, rows[0].user_id]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [rows[0].user_id]);

    res.json({ message: 'Şifre güncellendi.' });
  } catch (err) { next(err); }
});

export default router;
