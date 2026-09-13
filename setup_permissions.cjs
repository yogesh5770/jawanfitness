const { Client } = require('pg');

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
}

async function setupPermissions() {
  const client = new Client({
    host: requireEnv('SUPABASE_DB_HOST'),
    port: Number(process.env.SUPABASE_DB_PORT || 6543),
    user: requireEnv('SUPABASE_DB_USER'),
    password: requireEnv('SUPABASE_DB_PASSWORD'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Setting up table permissions for gym_sync_state...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS gym_sync_state (
      id TEXT PRIMARY KEY DEFAULT 'master',
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    REVOKE ALL ON gym_sync_state FROM anon, authenticated;
    GRANT ALL ON gym_sync_state TO service_role;
  `);

  console.log('✅ Direct public table access revoked. Use the authenticated API route.');

  // Check data
  const res = await client.query('SELECT id, updated_at, data FROM gym_sync_state;');
  console.log('Current rows in gym_sync_state:', res.rows);

  await client.end();
}

setupPermissions().catch(err => console.error('Error:', err));
