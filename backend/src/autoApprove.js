import pool from './db/pool.js';

export function startAutoApprove() {
  // Her 1 dakikada bir kontrol et
  setInterval(async () => {
    try {
      const { rows } = await pool.query(`
        UPDATE incidents
        SET status = 'approved', updated_at = NOW()
        WHERE status = 'pending'
          AND created_at < NOW() - INTERVAL '15 minutes'
        RETURNING id, title, author_id
      `);

      if (rows.length > 0) {
        console.log(`✅ Otomatik onaylandi: ${rows.length} olay`);

        // Her onaylanan olay icin bildirim gonder
        for (const inc of rows) {
          if (inc.author_id) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, payload)
               VALUES ($1, 'incident_approved', $2)`,
              [inc.author_id, JSON.stringify({ incidentId: inc.id, auto: true })]
            );
          }
        }
      }
    } catch (err) {
      console.error('Otomatik onay hatasi:', err.message);
    }
  }, 60 * 1000); // 60 saniyede bir kontrol

  console.log('⏰ Otomatik onay sistemi baslatildi (15 dk)');
}
