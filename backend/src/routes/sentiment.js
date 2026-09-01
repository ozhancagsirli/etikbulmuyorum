import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/sentiment/:incidentId
router.post('/:incidentId', authenticate, async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { vote } = req.body; // 'positive', 'neutral', 'negative'
    const userId = req.user.id;

    if (!['positive', 'neutral', 'negative'].includes(vote)) {
      return res.status(400).json({ error: 'Geçersiz oy.' });
    }

    // Olay bilgilerini al
    const { rows: incRows } = await pool.query(
      'SELECT instagram_username FROM incidents WHERE id = $1 AND status = $2',
      [incidentId, 'approved']
    );
    if (!incRows.length) return res.status(404).json({ error: 'Olay bulunamadı.' });
    const igUsername = incRows[0].instagram_username;

    // Kullanıcının güvenilirliği
    const { rows: voteRows } = await pool.query(
      'SELECT COUNT(*) as cnt FROM votes WHERE user_id = $1', [userId]
    );
    const voteCount = parseInt(voteRows[0].cnt);
    const { rows: userRows } = await pool.query(
      'SELECT instagram_verified FROM users WHERE id = $1', [userId]
    );
    const igVerified = userRows[0]?.instagram_verified || false;
    
    let trust = voteCount >= 20 ? 1.0 : voteCount >= 5 ? 0.5 : 0.2;
    if (igVerified) trust = Math.min(trust + 0.2, 1.0);

    // Daha önce oy kullanmış mı?
    const { rows: existing } = await pool.query(
      'SELECT id, sentiment FROM votes WHERE user_id = $1 AND incident_id = $2',
      [userId, incidentId]
    );

    if (existing.length > 0 && existing[0].sentiment === vote) {
      // Aynı oyu tekrar tıkladı — geri al
      await pool.query('DELETE FROM votes WHERE user_id = $1 AND incident_id = $2', [userId, incidentId]);
    } else {
      // Yeni oy veya güncelle — UPSERT
      await pool.query(`
        INSERT INTO votes (user_id, incident_id, sentiment, verdict)
        VALUES ($1, $2, $3, 'sentiment')
        ON CONFLICT (incident_id, user_id) DO UPDATE SET sentiment = $3
      `, [userId, incidentId, vote]);
    }

    // Kişinin skorunu yeniden hesapla
    if (igUsername) {
      const { rows: allVotes } = await pool.query(`
        SELECT v.sentiment, v.user_id
        FROM votes v
        JOIN incidents i ON i.id = v.incident_id
        WHERE i.instagram_username = $1 AND i.status = 'approved'
      `, [igUsername]);

      let totalEffect = 0;
      for (const v of allVotes) {
        // Her oyu yapanın güvenilirliğini al
        const { rows: vr } = await pool.query('SELECT COUNT(*) as cnt FROM votes WHERE user_id = $1', [v.user_id]);
        const vc = parseInt(vr[0].cnt);
        const voterTrust = vc >= 20 ? 1.0 : vc >= 5 ? 0.5 : 0.2;
        
        const baseEffect = v.sentiment === 'positive' ? 50 : v.sentiment === 'negative' ? -50 : 0;
        totalEffect += Math.round(baseEffect * voterTrust);
      }

      // Minimum etki koruması - tek kişi max ±10 puan etkisi
      const voterCount = allVotes.length;
      const impactMultiplier = Math.min(voterCount / 5, 1);
      const adjustedEffect = Math.round(totalEffect * impactMultiplier);
      const finalScore = Math.max(0, Math.min(2000, 1000 + adjustedEffect));

      await pool.query(`
        INSERT INTO person_scores (instagram_username, score, total_votes, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (instagram_username) DO UPDATE SET score = $2, total_votes = $3, updated_at = NOW()
      `, [igUsername, finalScore, voterCount]);
    }

    // Güncel oy sayılarını dön
    const { rows: counts } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
        COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
        COUNT(*) FILTER (WHERE sentiment = 'negative') as negative,
        MAX(CASE WHEN user_id = $2 THEN sentiment END) as my_vote
      FROM votes WHERE incident_id = $1
    `, [incidentId, userId]);

    res.json({ 
      positive: parseInt(counts[0].positive),
      neutral: parseInt(counts[0].neutral),
      negative: parseInt(counts[0].negative),
      my_vote: counts[0].my_vote,
    });
  } catch (err) { next(err); }
});

// GET /api/sentiment/:incidentId
router.get('/:incidentId', async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
        COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
        COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
        ${userId ? ", MAX(CASE WHEN user_id = '" + userId + "' THEN sentiment END) as my_vote" : ''}
      FROM votes WHERE incident_id = $1
    `, [req.params.incidentId]);

    res.json({
      positive: parseInt(rows[0].positive),
      neutral: parseInt(rows[0].neutral),
      negative: parseInt(rows[0].negative),
      my_vote: rows[0].my_vote || null,
    });
  } catch (err) { next(err); }
});

export default router;
