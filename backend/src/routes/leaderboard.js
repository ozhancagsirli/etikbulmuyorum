import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.avatar_url,
        COUNT(i.id)::INT AS incident_count,
        COALESCE(SUM(i.vote_ethical + i.vote_unethical), 0)::INT AS total_votes,
        COALESCE(SUM(i.view_count), 0)::INT AS total_views
      FROM users u
      LEFT JOIN incidents i ON i.author_id = u.id AND i.status = 'approved' AND NOT i.is_anonymous
      GROUP BY u.id, u.name, u.avatar_url
      HAVING COUNT(i.id) > 0
      ORDER BY total_votes DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
