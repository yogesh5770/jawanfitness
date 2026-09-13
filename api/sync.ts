import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerToken, getDbPool, verifySessionToken } from './db.js';

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const defaultOrigins = [
    'http://localhost:5173',
    'https://jawan-fitness-admin.vercel.app',
    'https://jawan-fitness-trainer.vercel.app',
    'https://jawan-fitness-app.vercel.app'
  ];
  const allowedOrigins = (process.env.ALLOWED_CORS_ORIGINS || defaultOrigins.join(','))
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const isAllowed = allowedOrigins.includes(origin);

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', isAllowed && origin ? origin : 'https://jawan-fitness-admin.vercel.app');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let client: any = null;
  try {
    client = await getDbPool().connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS gym_sync_state (
        id TEXT PRIMARY KEY DEFAULT 'master',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    const session = await verifySessionToken(client, getBearerToken(req), ['ADMIN', 'TRAINER', 'CLIENT']);
    if (!session) {
      return res.status(401).json({ error: 'Valid portal session required.' });
    }

    if (req.method === 'GET') {
      const result = await client.query('SELECT data, updated_at FROM gym_sync_state WHERE id = $1', ['master']);
      if (result.rows.length > 0) {
        return res.status(200).json({
          status: 'ok',
          source: 'supabase-postgresql',
          data: result.rows[0].data,
          updated_at: result.rows[0].updated_at
        });
      } else {
        return res.status(200).json({
          status: 'ok',
          source: 'supabase-postgresql',
          data: { clients: [], trainers: [] }
        });
      }
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      if (!['ADMIN', 'TRAINER', 'CLIENT'].includes(session.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions.' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const stateData = body.data || body;

      const result = await client.query(
        `INSERT INTO gym_sync_state (id, data, updated_at)
         VALUES ('master', $1, now())
         ON CONFLICT (id) DO UPDATE
         SET data = $1, updated_at = now()
         RETURNING updated_at;`,
        [JSON.stringify(stateData)]
      );

      return res.status(200).json({
        status: 'ok',
        source: 'supabase-postgresql',
        updated_at: result.rows[0]?.updated_at
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Supabase PostgreSQL API Error:', err);
    return res.status(500).json({ error: err?.message || 'Database query error' });
  } finally {
    if (client) {
      client.release();
    }
  }
}
