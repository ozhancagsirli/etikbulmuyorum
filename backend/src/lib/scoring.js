import pool from '../db/pool.js';

// Kullanıcının değerlendirici güvenilirliğini hesapla (0.1 - 1.0)
async function getVoterTrust(userId) {
  if (!userId) return 0.2;
  const { rows } = await pool.query(
    'SELECT COUNT(*) as vote_count FROM votes WHERE user_id = $1',
    [userId]
  );
  const count = parseInt(rows[0].vote_count);
  const igVerified = await pool.query('SELECT instagram_verified FROM users WHERE id = $1', [userId]);
  const igBonus = igVerified.rows[0]?.instagram_verified ? 0.2 : 0;
  
  let trust = 0.2;
  if (count >= 20) trust = 1.0;
  else if (count >= 5) trust = 0.5;
  else trust = 0.2;
  
  return Math.min(trust + igBonus, 1.0);
}

// Olay için sentiment hesapla
function calcSentiment(votes, voterCount) {
  const { correct = 0, wrong = 0, neutral = 0, insufficient = 0 } = votes;
  const total = correct + wrong + neutral + insufficient;
  if (total === 0) return { sentiment: 'neutral', score: 0 };
  
  // Ham skor
  const rawScore = (correct * 2 + neutral * 0 + wrong * -2 + insufficient * -1) / (total * 2) * 100;
  
  // Minimum etki koruması - tek kişi oylarsa düşük etki
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

// Kişinin genel skorunu güncelle
export async function updatePersonScore(igUsername) {
  if (!igUsername) return;
  
  const { rows } = await pool.query(`
    SELECT trust_score, vote_correct, vote_wrong, vote_neutral, vote_insufficient
    FROM incidents 
    WHERE instagram_username = $1 AND status = 'approved'
  `, [igUsername]);
  
  if (rows.length === 0) return;
  
  // Her olayın ağırlıklı etkisini hesapla
  let totalEffect = 0;
  for (const inc of rows) {
    const voterCount = (inc.vote_correct || 0) + (inc.vote_wrong || 0) + (inc.vote_neutral || 0) + (inc.vote_insufficient || 0);
    const { score } = calcSentiment({
      correct: inc.vote_correct,
      wrong: inc.vote_wrong,
      neutral: inc.vote_neutral,
      insufficient: inc.vote_insufficient
    }, voterCount);
    
    // Skoru -50/+50 aralığında normalize et
    const effect = Math.round(score * 0.5);
    totalEffect += effect;
  }
  
  // 1000 baz puan + olayların etkisi
  const finalScore = Math.max(0, Math.min(2000, 1000 + totalEffect));
  
  // subjects tablosunu güncelle
  await pool.query(`
    INSERT INTO subjects (name, score) VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE SET score = $2
  `, [igUsername, finalScore]);
  
  return finalScore;
}

export { calcSentiment, getVoterTrust };
