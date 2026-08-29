import { Pool } from 'pg';
import { config } from './config.ts';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Query error:', text, params, err.message);
    throw err;
  } finally {
    if (process.env.QUERY_DEBUG) {
      console.log(`[db] ${Date.now() - start}ms :: ${text.slice(0, 80)}`);
    }
  }
}

export async function getClient() {
  return pool.connect();
}

export default pool;
