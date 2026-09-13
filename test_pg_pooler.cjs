const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'us-east-1',
  'us-west-1',
  'eu-central-1',
  'eu-west-1',
  'sa-east-1'
];

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
}

async function testPooler() {
  const user = requireEnv('SUPABASE_DB_USER');
  const password = requireEnv('SUPABASE_DB_PASSWORD');
  const database = process.env.SUPABASE_DB_NAME || 'postgres';

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Trying ${region} (${host}:6543)...`);
    const client = new Client({
      host,
      port: 6543,
      user,
      password,
      database,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3500
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS! Connected to Supabase via ${region}!`);
      const res = await client.query('SELECT current_database(), current_user;');
      console.log('Result:', res.rows[0]);
      
      // Auto-create gym_sync_state table if not exists
      console.log('Creating table gym_sync_state if not exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS gym_sync_state (
          id TEXT PRIMARY KEY DEFAULT 'master',
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
      console.log('✅ Table gym_sync_state is ready!');

      // Insert clean scratch record if empty
      await client.query(`
        INSERT INTO gym_sync_state (id, data, updated_at)
        VALUES ('master', '{"clients": [], "trainers": [], "assignedWorkouts": {}, "assignedDietPlans": {}, "workoutHistory": [], "events": []}'::jsonb, now())
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Master clean scratch state initialized in PostgreSQL!');

      await client.end();
      return region;
    } catch (err) {
      console.log(`❌ ${region} error:`, err.message);
      try { await client.end(); } catch {}
    }
  }
}

testPooler();
