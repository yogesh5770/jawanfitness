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

async function run() {
  const client = new Client({
    host: requireEnv('SUPABASE_DB_HOST'),
    port: Number(process.env.SUPABASE_DB_PORT || 6543),
    user: requireEnv('SUPABASE_DB_USER'),
    password: requireEnv('SUPABASE_DB_PASSWORD'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('1️⃣ Creating gym_users and gym_sessions tables...');

  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS gym_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TRAINER', 'CLIENT')),
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      last_login TIMESTAMPTZ
    );

    ALTER TABLE gym_users ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE;

    CREATE TABLE IF NOT EXISTS gym_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES gym_users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      revoked BOOLEAN DEFAULT false NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON gym_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_users_email ON gym_users(email);
  `);
  console.log('✅ Tables created!');

  // Check if admin user exists, or create initial admin account
  console.log('2️⃣ Seeding initial Admin Director account...');
  const defaultAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@jawan.fit';
  const defaultAdminPass = requireEnv('INITIAL_ADMIN_PASSWORD');
  const existing = await client.query(`SELECT id FROM gym_users WHERE email = $1`, [defaultAdminEmail]);
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(defaultAdminPass, salt);

  if (existing.rows.length === 0) {
    await client.query(
      `INSERT INTO gym_users (email, password_hash, salt, name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [defaultAdminEmail, hash, salt, 'Director Yogesh', 'ADMIN', '+91 98765 43210']
    );
    console.log(`✅ Admin Director created: ${defaultAdminEmail}`);
  } else {
    // Update hash to ensure it matches
    await client.query(
      `UPDATE gym_users SET password_hash = $1, salt = $2 WHERE email = $3`,
      [hash, salt, defaultAdminEmail]
    );
    console.log(`✅ Admin Director password reset: ${defaultAdminEmail}`);
  }

  // Grant access
  await client.query(`
    GRANT ALL ON gym_users TO anon, authenticated, service_role;
    GRANT ALL ON gym_sessions TO anon, authenticated, service_role;
  `);

  const users = await client.query(`SELECT id, email, name, role, created_at FROM gym_users`);
  console.log('Current Gym Users in DB:', users.rows);

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
