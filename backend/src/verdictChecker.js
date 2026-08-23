import pool from './db/pool.js';

export function startVerdictChecker() {
  setInterval(async () => {
    try {
      // Süresi dolan olayları bul ve verdict ata
      const { rows } = await pool.query(`
        SELECT id, vote_ethical, vote_unethical
        FROM incidents
        WHERE status = 'approved'
          AND verdict = 'pending'
          AND voting_ends_at IS NOT NULL
          AND voting_ends_at < NOW()
      `);

      for (const inc of rows) {
        const verdict = inc.vote_unethical > inc.vote_ethical ? 'unethical' : 'ethical';
        await pool.query(
          'UPDATE incidents SET verdict = $1, updated_at = NOW() WHERE id = $2',
          [verdict, inc.id]
        );
        console.log(`⚖️ Verdict: ${inc.id} → ${verdict}`);
      }
    } catch (err) {
      console.error('Verdict checker hatasi:', err.message);
    }
  }, 60 * 1000);

  console.log('⚖️ Verdict checker baslatildi');
}
