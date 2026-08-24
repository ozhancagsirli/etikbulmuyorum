import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /api/stats
router.get('/', async (_req, res, next) => {
  try {
    const [totals, topSubjects, topCategories, recentActivity] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'approved') AS total_incidents,
          COUNT(*) FILTER (WHERE status = 'approved' AND created_at > NOW() - INTERVAL '7 days') AS incidents_this_week,
          SUM(vote_ethical + vote_unethical) AS total_votes,
          COUNT(DISTINCT author_id) AS total_users
        FROM incidents
      `),
      pool.query(`
        SELECT subject, COUNT(*) AS count,
          SUM(vote_ethical) AS ethical, SUM(vote_unethical) AS unethical
        FROM incidents
        WHERE status = 'approved' AND subject IS NOT NULL
        GROUP BY subject
        ORDER BY count DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT c.name_tr, c.icon, COUNT(i.id) AS count
        FROM categories c
        LEFT JOIN incidents i ON i.category_id = c.id AND i.status = 'approved'
        GROUP BY c.id, c.name_tr, c.icon
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM incidents WHERE status = 'approved' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC
      `),
    ]);

    res.json({
      totals: totals.rows[0],
      topSubjects: topSubjects.rows,
      topCategories: topCategories.rows,
      recentActivity: recentActivity.rows,
    });
  } catch (err) { next(err); }
});

export default router;
