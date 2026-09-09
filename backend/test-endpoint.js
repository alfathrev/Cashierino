import pg from 'pg';
const { Pool } = pg;

const tests = [
  {
    name: 'With endpoint in options',
    url: 'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-patient-shape-b36x8yuj'
  },
  {
    name: 'With endpoint in user',
    url: 'postgresql://neondb_owner$ep-patient-shape-b36x8yuj:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  },
  {
    name: 'Standard without pooler with endpoint in options',
    url: 'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-patient-shape-b36x8yuj'
  }
];

async function run() {
  for (const t of tests) {
    console.log('\nTesting:', t.name);
    const pool = new Pool({
      connectionString: t.url,
      ssl: { rejectUnauthorized: false }
    });
    try {
      const res = await pool.query('SELECT 1 as connected');
      console.log('>>> SUCCESS! Connected! Result:', res.rows[0]);
      await pool.end();
      return;
    } catch (e) {
      console.log('Failed:', e.message);
    } finally {
      await pool.end();
    }
  }
}

run();
