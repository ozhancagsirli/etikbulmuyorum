import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Olay kararını hesapla
function calcVerdict(correct, wrong) {
  const total = correct + wrong;
  if (total < 10) return 'pending'; // Yeterli oy yok
  const posPct = (correct / total) * 100;
  if (posPct >= 65) return 'positive';
  if (posPct <= 35) return 'negative';
  return 'neutral';
}

// Kişinin skorunu güncelle
async function updatePersonScore(igUsername) {
  if (!igUsername) return;
  
  const { rows } = await pool.query(`
    SELECT verdict FROM incidents 
    WHERE instagram_username = $1 AND status = 'approved'
  `, [igUsername]);

  let score = 1000;
  for (const inc of rows) {
    if (inc.verdict === 'positive') score += 50;
    else if (inc.verdict === 'negative') score -= 50;
  }
  score = Math.max(0, Math.min(2000, score));

  await pool.query(`
    INSERT INTO person_scores (instagram_username, score, total_votes, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (instagram_username) DO UPDATE SET score = $2, updated_at = NOW()
  `, [igUsername, score, rows.length]);

  return score;
}

// POST /api/sentiment/:incidentId — oy ver
router.post('/:incidentId', authenticate, async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { vote } = req.body; // 'correct' veya 'wrong'
    const userId = req.user.id;

    if (!['correct', 'wrong'].includes(vote)) {
      return res.status(400).json({ error: 'Geçersiz oy.' });
    }

    // Olay bilgilerini al
    const { rows: incRows } = await pool.query(
      'SELECT instagram_username, author_id FROM incidents WHERE id = $1 AND status = $2',
      [incidentId, 'approved']
    );
    if (!incRows.length) return res.status(404).json({ error: 'Olay bulunamadı.' });
    const igUsername = incRows[0].instagram_username;

    // Daha önce oy kullanmış mı?
    const { rows: existing } = await pool.query(
      'SELECT id, vote_type FROM votes WHERE user_id = $1 AND incident_id = $2',
      [userId, incidentId]
    );

    if (existing.length > 0) {
      if (existing[0].vote_type === vote) {
        // Aynı oyu geri al
        await pool.query('DELETE FROM votes WHERE id = $1', [existing[0].id]);
      } else {
        // Farklı oy - güncelle
        await pool.query('UPDATE votes SET vote_type = $1, verdict = $1 WHERE id = $2', [vote, existing[0].id]);
      }
    } else {
      // Yeni oy
      await pool.query(
        'INSERT INTO votes (user_id, incident_id, vote_type, verdict) VALUES ($1, $2, $3, $3)',
        [userId, incidentId, vote]
      );
    }

    // Oy sayılarını güncelle
    const { rows: counts } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'correct') as correct,
        COUNT(*) FILTER (WHERE vote_type = 'wrong') as wrong,
        MAX(CASE WHEN user_id = $2 THEN vote_type END) as my_vote
      FROM votes WHERE incident_id = $1
    `, [incidentId, userId]);

    const correct = parseInt(counts[0].correct);
    const wrong = parseInt(counts[0].wrong);
    const total = correct + wrong;
    const verdict = calcVerdict(correct, wrong);

    // Olay verdict güncelle
    await pool.query(
      'UPDATE incidents SET vote_correct_new = $1, vote_wrong_new = $2, verdict = $3 WHERE id = $4',
      [correct, wrong, verdict, incidentId]
    );

    // Kişi skoru güncelle
    const newScore = await updatePersonScore(igUsername);

    res.json({ correct, wrong, total, verdict, my_vote: counts[0].my_vote, person_score: newScore });
  } catch (err) { next(err); }
});

// GET /api/sentiment/:incidentId
router.get('/:incidentId', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'correct') as correct,
        COUNT(*) FILTER (WHERE vote_type = 'wrong') as wrong
        ${userId ? ", MAX(CASE WHEN user_id = '" + userId + "' THEN vote_type END) as my_vote" : ''}
      FROM votes WHERE incident_id = $1
    `, [req.params.incidentId]);

    const correct = parseInt(rows[0].correct);
    const wrong = parseInt(rows[0].wrong);
    const total = correct + wrong;

    res.json({
      correct, wrong, total,
      verdict: calcVerdict(correct, wrong),
      my_vote: rows[0].my_vote || null,
    });
  } catch (err) { next(err); }
});

export default router;
