async function testHttp() {
  const url = 'https://ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/sql';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': 'postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    const text = await res.text();
    console.log('HTTP Neon Status:', res.status, text);
  } catch (e) {
    console.error('HTTP Neon error:', e.message);
  }
}

testHttp();
