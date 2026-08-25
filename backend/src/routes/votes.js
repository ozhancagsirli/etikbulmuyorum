import { Router } from 'express';
import { param, body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

function calcTrustScore(correct, wrong, neutral, insufficient) {
  const total = correct + wrong + neutral + insufficient;
  if (total === 0) return 0;
  const score = (correct * 2) + (neutral * 0) + (wrong * -2) + (insufficient * -1);
  return Math.round((score / (total * 2)) * 100);
}

// POST /api/votes/:incidentId
router.post('/:incidentId', authenticate, [
  param('incidentId').isUUID(),
  body('verdict').isIn(['correct', 'wrong', 'neutral', 'insufficient']),
], validate, async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { verdict } = req.body;

    const { rows: inc } = await pool.query(
      "SELECT id FROM incidents WHERE id = $1 AND status = 'approved'",
      [incidentId]
    );
    if (!inc.length) return res.status(404).json({ error: 'Olay bulunamadı.' });

    const { rows: existing } = await pool.query(
      'SELECT verdict FROM votes WHERE incident_id = $1 AND user_id = $2',
      [incidentId, req.user.id]
    );

    if (existing.length) {
      const old = existing[0].verdict;
      const oldCol = old === 'correct' ? 'vote_correct' : old === 'wrong' ? 'vote_wrong' : old === 'neutral' ? 'vote_neutral' : 'vote_insufficient';
      const newCol = verdict === 'correct' ? 'vote_correct' : verdict === 'wrong' ? 'vote_wrong' : verdict === 'neutral' ? 'vote_neutral' : 'vote_insufficient';
      await pool.query(`UPDATE incidents SET ${oldCol} = GREATEST(0, ${oldCol} - 1), ${newCol} = ${newCol} + 1 WHERE id = $1`, [incidentId]);
      await pool.query('UPDATE votes SET verdict = $1 WHERE incident_id = $2 AND user_id = $3', [verdict, incidentId, req.user.id]);
    } else {
      const col = verdict === 'correct' ? 'vote_correct' : verdict === 'wrong' ? 'vote_wrong' : verdict === 'neutral' ? 'vote_neutral' : 'vote_insufficient';
      await pool.query(`UPDATE incidents SET ${col} = ${col} + 1 WHERE id = $1`, [incidentId]);
      await pool.query('INSERT INTO votes (incident_id, user_id, verdict) VALUES ($1, $2, $3)', [incidentId, req.user.id, verdict]);
    }

    const { rows } = await pool.query(
      'SELECT vote_correct, vote_wrong, vote_neutral, vote_insufficient FROM incidents WHERE id = $1',
      [incidentId]
    );
    const { vote_correct, vote_wrong, vote_neutral, vote_insufficient } = rows[0];
    const trustScore = calcTrustScore(vote_correct, vote_wrong, vote_neutral, vote_insufficient);
    await pool.query('UPDATE incidents SET trust_score = $1 WHERE id = $2', [trustScore, incidentId]);

    res.json({ voteCorrect: vote_correct, voteWrong: vote_wrong, voteNeutral: vote_neutral, voteInsufficient: vote_insufficient, trustScore, myVote: verdict });
  } catch (err) { next(err); }
});

// DELETE /api/votes/:incidentId
router.delete('/:incidentId', authenticate, [param('incidentId').isUUID()], validate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT verdict FROM votes WHERE incident_id = $1 AND user_id = $2', [req.params.incidentId, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Oy bulunamadı.' });

    const col = rows[0].verdict === 'correct' ? 'vote_correct' : rows[0].verdict === 'wrong' ? 'vote_wrong' : rows[0].verdict === 'neutral' ? 'vote_neutral' : 'vote_insufficient';
    await pool.query(`UPDATE incidents SET ${col} = GREATEST(0, ${col} - 1) WHERE id = $1`, [req.params.incidentId]);
    await pool.query('DELETE FROM votes WHERE incident_id = $1 AND user_id = $2', [req.params.incidentId, req.user.id]);

    const { rows: inc } = await pool.query('SELECT vote_correct, vote_wrong, vote_neutral, vote_insufficient FROM incidents WHERE id = $1', [req.params.incidentId]);
    const { vote_correct, vote_wrong, vote_neutral, vote_insufficient } = inc[0];
    const trustScore = calcTrustScore(vote_correct, vote_wrong, vote_neutral, vote_insufficient);
    await pool.query('UPDATE incidents SET trust_score = $1 WHERE id = $2', [trustScore, req.params.incidentId]);

    res.json({ voteCorrect: vote_correct, voteWrong: vote_wrong, voteNeutral: vote_neutral, voteInsufficient: vote_insufficient, trustScore, myVote: null });
  } catch (err) { next(err); }
});

export default router;
