import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/comments?incidentId=xxx
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { incidentId } = req.query;
    if (!incidentId) return res.status(400).json({ error: 'incidentId gerekli.' });
    const { rows } = await pool.query(`
      SELECT c.id, c.content, c.is_anonymous, c.is_removed, c.created_at, c.like_count,
        CASE WHEN c.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN c.is_anonymous THEN NULL ELSE u.avatar_url END AS author_avatar,
        ${req.user ? `EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2) AS liked_by_me` : 'false AS liked_by_me'}
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE c.incident_id = $1 AND NOT c.is_removed
      ORDER BY c.created_at ASC
    `, req.user ? [incidentId, req.user.id] : [incidentId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/comments
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { incidentId, content, isAnonymous } = req.body;
    if (!incidentId || !content?.trim()) return res.status(400).json({ error: 'incidentId ve içerik gerekli.' });
    if (content.trim().length < 3) return res.status(400).json({ error: 'Yorum en az 3 karakter olmalı.' });
    const { rows } = await pool.query(
      'INSERT INTO comments (incident_id, author_id, content, is_anonymous) VALUES ($1,$2,$3,$4) RETURNING *',
      [incidentId, req.user.id, content.trim(), isAnonymous || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/comments/:id/like
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT id FROM comment_likes WHERE comment_id=$1 AND user_id=$2', [id, req.user.id]);
    if (existing.rows.length) {
      await pool.query('DELETE FROM comment_likes WHERE comment_id=$1 AND user_id=$2', [id, req.user.id]);
      await pool.query('UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id=$1', [id]);
      const { rows } = await pool.query('SELECT like_count FROM comments WHERE id=$1', [id]);
      return res.json({ liked: false, likeCount: rows[0].like_count });
    }
    await pool.query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1,$2)', [id, req.user.id]);
    await pool.query('UPDATE comments SET like_count = like_count + 1 WHERE id=$1', [id]);
    const { rows } = await pool.query('SELECT like_count FROM comments WHERE id=$1', [id]);
    res.json({ liked: true, likeCount: rows[0].like_count });
  } catch (err) { next(err); }
});

export default router;
