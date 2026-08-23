import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.get('/me/incidents', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.id, i.title, i.vote_ethical, i.vote_unethical, i.status, i.reject_reason, i.created_at,
             c.name_tr AS category_name, c.icon AS category_icon
      FROM incidents i LEFT JOIN categories c ON c.id = i.category_id
      WHERE i.author_id = $1 ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/report', authenticate, [
  body('incidentId').optional().isUUID(),
  body('commentId').optional().isUUID(),
  body('reason').isIn(['spam','false_info','harassment','hate_speech','irrelevant','other']),
  body('details').optional().isString().trim().isLength({ max: 500 }),
], validate, async (req, res, next) => {
  try {
    const { incidentId, commentId, reason, details } = req.body;
    if (!incidentId && !commentId) return res.status(400).json({ error: 'incidentId veya commentId gerekli.' });
    await pool.query(
      'INSERT INTO reports (reporter_id, incident_id, comment_id, reason, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, incidentId || null, commentId || null, reason, details || null]
    );
    res.status(201).json({ message: 'Şikayetiniz alındı.' });
  } catch (err) { next(err); }
});

export default router;
