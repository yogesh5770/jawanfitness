const { Client } = require('pg');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
}

async function updateAdminCredentials() {
  const client = new Client({
    host: requireEnv('SUPABASE_DB_HOST'),
    port: Number(process.env.SUPABASE_DB_PORT || 6543),
    user: requireEnv('SUPABASE_DB_USER'),
    password: requireEnv('SUPABASE_DB_PASSWORD'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL in Mumbai...');

  const email = requireEnv('ADMIN_EMAIL').toLowerCase().trim();
  const pass = requireEnv('ADMIN_PASSWORD');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(pass, salt);

  // Upsert jawanfitness@gmail.com
  await client.query(`
    INSERT INTO gym_users (email, password_hash, salt, name, role, phone)
    VALUES ($1, $2, $3, 'Gym Director', 'ADMIN', '+91 98765 43210')
    ON CONFLICT (email) DO UPDATE
    SET password_hash = $2, salt = $3, role = 'ADMIN', name = 'Gym Director';
  `, [email, hash, salt]);

  console.log('✅ Admin credentials updated:');
  console.log('Email:', email);

  const rows = await client.query('SELECT id, email, name, role, created_at FROM gym_users;');
  console.log('All Gym Users in Supabase:', rows.rows);

  await client.end();
}

updateAdminCredentials().catch(e => {
  console.error(e);
  process.exit(1);
});
