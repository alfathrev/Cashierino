import { pool } from './src/db/pool.js';

async function testConn() {
  try {
    console.log('Testing connection to Neon DB...');
    const res = await pool.query('SELECT NOW()');
    console.log('Success! Database time:', res.rows[0]);
  } catch (err) {
    console.error('Connection error details:', err.message, err.stack);
  } finally {
    await pool.end();
  }
}

testConn();
