import pool from '../db/pool.js';

export async function getVoterTrust(userId) {
  if (!userId) return 0.2;
  const { rows } = await pool.query('SELECT COUNT(*) as vote_count FROM votes WHERE user_id = $1', [userId]);
  const count = parseInt(rows[0].vote_count);
  const igRes = await pool.query('SELECT instagram_verified FROM users WHERE id = $1', [userId]);
  const igBonus = igRes.rows[0]?.instagram_verified ? 0.2 : 0;
  let trust = count >= 20 ? 1.0 : count >= 5 ? 0.5 : 0.2;
  return Math.min(trust + igBonus, 1.0);
}

export function calcSentiment(votes, voterCount) {
  const { correct = 0, wrong = 0, neutral = 0, insufficient = 0 } = votes;
  const total = correct + wrong + neutral + insufficient;
  if (total === 0) return { sentiment: 'neutral', score: 0 };
  const rawScore = (correct * 2 + neutral * 0 + wrong * -2 + insufficient * -1) / (total * 2) * 100;
  const impactMultiplier = Math.min(voterCount / 5, 1);
  const score = Math.round(rawScore * impactMultiplier);
  let sentiment;
  if (score >= 40) sentiment = 'positive';
  else if (score >= 10) sentiment = 'mostly_positive';
  else if (score >= -10) sentiment = 'neutral';
  else if (score >= -40) sentiment = 'mostly_negative';
  else sentiment = 'negative';
  return { sentiment, score };
}

export async function updatePersonScore(igUsername) {
  if (!igUsername) return;
  const { rows } = await pool.query(`
    SELECT trust_score, vote_correct, vote_wrong, vote_neutral, vote_insufficient
    FROM incidents WHERE instagram_username = $1 AND status = 'approved'
  `, [igUsername]);
  if (rows.length === 0) return;
  let totalEffect = 0;
  for (const inc of rows) {
    const voterCount = (inc.vote_correct||0)+(inc.vote_wrong||0)+(inc.vote_neutral||0)+(inc.vote_insufficient||0);
    const { score } = calcSentiment({ correct: inc.vote_correct, wrong: inc.vote_wrong, neutral: inc.vote_neutral, insufficient: inc.vote_insufficient }, voterCount);
    totalEffect += Math.round(score * 0.5);
  }
  const finalScore = Math.max(0, Math.min(2000, 1000 + totalEffect));
  await pool.query(`INSERT INTO subjects (name, score) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET score = $2`, [igUsername, finalScore]);
  return finalScore;
}
