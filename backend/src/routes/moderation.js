import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireRole('moderator', 'admin'));
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.get('/pending', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.id, i.title, i.description, i.location, i.created_at,
             c.name_tr AS category_name, u.name AS author_name, u.email AS author_email
      FROM incidents i
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN users u ON u.id = i.author_id
      WHERE i.status = 'pending' ORDER BY i.created_at ASC LIMIT 30
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/incidents/:id/approve', [param('id').isUUID()], validate, async (req, res, next) => {
  try {
    const { rows: incRows } = await pool.query('SELECT author_id, title FROM incidents WHERE id = $1', [req.params.id]);
    await pool.query("UPDATE incidents SET status = 'approved', updated_at = NOW() WHERE id = $1", [req.params.id]);
    if (incRows[0]?.author_id) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, 'approved', $2, $3, $4)",
        [incRows[0].author_id, '✅ Olayınız onaylandı!', incRows[0].title + ' yayınlandı.', '/olay/' + req.params.id]
      );
    }
    res.json({ message: 'Olay onaylandı.' });
  } catch (err) { next(err); }
});

router.post('/incidents/:id/reject', [
  param('id').isUUID(),
  body('reason').isString().trim().isLength({ min: 5, max: 500 }),
], validate, async (req, res, next) => {
  try {
    await pool.query("UPDATE incidents SET status = 'rejected', reject_reason = $2, updated_at = NOW() WHERE id = $1", [req.params.id, req.body.reason]);
    const { rows } = await pool.query('SELECT author_id FROM incidents WHERE id = $1', [req.params.id]);
    if (rows[0]?.author_id) {
      await pool.query("INSERT INTO notifications (user_id, type, payload) VALUES ($1, 'incident_rejected', $2)",
        [rows[0].author_id, JSON.stringify({ incidentId: req.params.id, reason: req.body.reason })]);
    }
    res.json({ message: 'Olay reddedildi.' });
  } catch (err) { next(err); }
});

router.get('/reports', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.reason, r.details, r.resolved, r.created_at,
             u.name AS reporter_name, i.id AS incident_id, i.title AS incident_title,
             c.id AS comment_id, c.content AS comment_content
      FROM reports r
      LEFT JOIN users u ON u.id = r.reporter_id
      LEFT JOIN incidents i ON i.id = r.incident_id
      LEFT JOIN comments c ON c.id = r.comment_id
      WHERE r.resolved = FALSE ORDER BY r.created_at ASC LIMIT 50
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/reports/:id/resolve', [param('id').isUUID()], validate, async (req, res, next) => {
  try {
    await pool.query('UPDATE reports SET resolved = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Şikayet çözümlendi.' });
  } catch (err) { next(err); }
});

// POST /api/moderation/subjects/:name/avatar
router.post('/subjects/avatar', async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    await pool.query(
      'INSERT INTO subjects (name, avatar_url, count) VALUES ($1, $2, 0) ON CONFLICT (name) DO UPDATE SET avatar_url = $2',
      [name, avatar_url]
    );
    res.json({ message: 'Avatar güncellendi.' });
  } catch (err) { next(err); }
});

export default router;

// GET /api/moderation/incidents?status=approved|rejected
router.get('/incidents', async (req, res, next) => {
  try {
    const { status } = req.query;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz status.' });
    }
    const { rows } = await pool.query(`
      SELECT i.id, i.title, i.description, i.status, i.reject_reason, i.created_at,
        i.vote_ethical, i.vote_unethical, i.view_count, i.subject,
        c.name_tr AS category_name, c.icon AS category_icon,
        CASE WHEN i.is_anonymous THEN NULL ELSE u.name END AS author_name
      FROM incidents i
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN users u ON u.id = i.author_id
      WHERE i.status = $1
      ORDER BY i.created_at DESC
      LIMIT 50
    `, [status]);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/moderation/users
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.is_banned, u.created_at,
        COUNT(i.id)::INT AS incident_count
      FROM users u
      LEFT JOIN incidents i ON i.author_id = u.id AND i.status = 'approved'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/moderation/users/:id/ban
router.post('/users/:id/ban', async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_banned = NOT is_banned WHERE id = $1', [req.params.id]);
    const { rows } = await pool.query('SELECT is_banned FROM users WHERE id = $1', [req.params.id]);
    res.json({ is_banned: rows[0].is_banned });
  } catch (err) { next(err); }
});

// POST /api/moderation/users/:id/role
router.post('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) return res.status(400).json({ error: 'Geçersiz rol.' });
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ role });
  } catch (err) { next(err); }
});
