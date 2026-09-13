import { Pool } from 'pg';
import type { PoolClient } from 'pg';

let pool: Pool | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: requireEnv('SUPABASE_DB_HOST'),
      port: Number(process.env.SUPABASE_DB_PORT || 6543),
      user: requireEnv('SUPABASE_DB_USER'),
      password: requireEnv('SUPABASE_DB_PASSWORD'),
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      ssl: { rejectUnauthorized: false },
      max: Number(process.env.DB_POOL_MAX || 5),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }
  return pool;
}

export async function ensureAuthSchema(client: PoolClient) {
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
    CREATE INDEX IF NOT EXISTS idx_users_login_id ON gym_users(login_id);
  `);
}

export async function verifySessionToken(
  client: PoolClient,
  token: string | undefined,
  allowedRoles?: Array<'ADMIN' | 'TRAINER' | 'CLIENT'>
) {
  if (!token) return null;

  const sessionRes = await client.query(
    `SELECT s.token, s.role, s.expires_at, u.id, u.email, u.name
     FROM gym_sessions s
     JOIN gym_users u ON s.user_id = u.id
     WHERE s.token = $1 AND s.revoked = false AND s.expires_at > now()`,
    [token]
  );

  if (sessionRes.rows.length === 0) return null;

  const row = sessionRes.rows[0];
  if (allowedRoles && !allowedRoles.includes(row.role)) return null;

  return {
    token: row.token as string,
    expiresAt: row.expires_at as string,
    user: {
      id: row.id as string,
      email: row.email as string,
      name: row.name as string,
      role: row.role as 'ADMIN' | 'TRAINER' | 'CLIENT'
    }
  };
}

export function getBearerToken(req: { headers: { authorization?: string } }): string | undefined {
  return req.headers.authorization?.replace(/^Bearer\s+/i, '');
}
