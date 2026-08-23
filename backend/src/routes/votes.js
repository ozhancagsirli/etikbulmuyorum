import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.post('/:incidentId', authenticate, [
  param('incidentId').isUUID(),
  body('verdict').isIn(['ethical', 'unethical']),
], validate, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: inc } = await client.query(
      "SELECT id, author_id FROM incidents WHERE id = $1 AND status = 'approved'",
      [req.params.incidentId]
    );
    if (!inc.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Olay bulunamadı.' }); }

    await client.query(
      `INSERT INTO votes (incident_id, user_id, verdict) VALUES ($1, $2, $3)
       ON CONFLICT (incident_id, user_id) DO UPDATE SET verdict = EXCLUDED.verdict`,
      [req.params.incidentId, req.user.id, req.body.verdict]
    );
    const { rows } = await client.query(
      'SELECT vote_ethical, vote_unethical FROM incidents WHERE id = $1',
      [req.params.incidentId]
    );
    await client.query('COMMIT');
    res.json({ verdict: req.body.verdict, voteEthical: rows[0].vote_ethical, voteUnethical: rows[0].vote_unethical });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.delete('/:incidentId', authenticate, [param('incidentId').isUUID()], validate, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM votes WHERE incident_id = $1 AND user_id = $2', [req.params.incidentId, req.user.id]);
    const { rows } = await pool.query('SELECT vote_ethical, vote_unethical FROM incidents WHERE id = $1', [req.params.incidentId]);
    res.json({ verdict: null, voteEthical: rows[0]?.vote_ethical ?? 0, voteUnethical: rows[0]?.vote_unethical ?? 0 });
  } catch (err) { next(err); }
});

export default router;
