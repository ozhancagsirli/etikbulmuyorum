import { Router } from 'express';
import pool from '../db/pool.js';
import { optionalAuth } from '../middleware/auth.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/appeals
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { subject_name, name, email, message, incident_id } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Tüm alanlar gerekli.' });

    await pool.query(
      'INSERT INTO appeals (subject_name, user_id, name, email, message, incident_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [subject_name || null, req.user?.id || null, name, email, message, incident_id || null]
    );
    res.json({ message: 'İtirazınız alındı, incelenecek.' });
  } catch (err) { next(err); }
});

// GET /api/appeals - admin
router.get('/', authenticate, requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM appeals ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT /api/appeals/:id - admin
router.put('/:id', authenticate, requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE appeals SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Güncellendi.' });
  } catch (err) { next(err); }
});

export default router;
