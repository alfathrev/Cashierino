import pg from 'pg';
const { Pool } = pg;

const urls = [
  'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
];

async function tryAll() {
  for (const url of urls) {
    console.log('\nTrying:', url);
    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('SUCCESS with:', url, res.rows[0]);
      await pool.end();
      return;
    } catch (e) {
      console.log('Failed:', e.message);
    } finally {
      await pool.end();
    }
  }
}

tryAll();
