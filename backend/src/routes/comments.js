import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.get('/', optionalAuth, [query('incidentId').isUUID()], validate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.parent_id, c.content, c.is_removed, c.is_anonymous, c.created_at,
        CASE WHEN c.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN c.is_anonymous THEN NULL ELSE u.avatar_url END AS author_avatar
      FROM comments c LEFT JOIN users u ON u.id = c.author_id
      WHERE c.incident_id = $1 ORDER BY c.created_at ASC
    `, [req.query.incidentId]);
    const sanitized = rows.map(r => r.is_removed ? { ...r, content: '[Bu yorum kaldırıldı]', author_name: null, author_avatar: null } : r);
    res.json(sanitized);
  } catch (err) { next(err); }
});

router.post('/', authenticate, [
  body('incidentId').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 2000 }),
  body('isAnonymous').optional().isBoolean().toBoolean(),
], validate, async (req, res, next) => {
  try {
    const { incidentId, content, parentId, isAnonymous } = req.body;
    const { rows: inc } = await pool.query("SELECT id FROM incidents WHERE id = $1 AND status = 'approved'", [incidentId]);
    if (!inc.length) return res.status(404).json({ error: 'Olay bulunamadı.' });
    const { rows } = await pool.query(
      'INSERT INTO comments (incident_id, author_id, parent_id, content, is_anonymous) VALUES ($1, $2, $3, $4, $5) RETURNING id, parent_id, content, is_anonymous, created_at',
      [incidentId, req.user.id, parentId || null, content, isAnonymous || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, [param('id').isUUID()], validate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT author_id FROM comments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    if (rows[0].author_id !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ error: 'Bu yorumu silme yetkiniz yok.' });
    }
    await pool.query('UPDATE comments SET is_removed = TRUE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ message: 'Yorum kaldırıldı.' });
  } catch (err) { next(err); }
});

export default router;
