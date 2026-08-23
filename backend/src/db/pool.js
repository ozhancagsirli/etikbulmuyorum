import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export async function testConnection() {
  const client = await pool.connect();
  const { rows } = await client.query('SELECT NOW() AS now');
  client.release();
  console.log(`✅ Database connected at ${rows[0].now}`);
}

export default pool;
