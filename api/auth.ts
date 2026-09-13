import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { ensureAuthSchema, getBearerToken, getDbPool, verifySessionToken } from './db.js';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function safeCompareHex(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'hex');
  const bBuffer = Buffer.from(b, 'hex');
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
}

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
    return res.status(200).end();
  }

  let client: any = null;
  try {
    client = await getDbPool().connect();
    await ensureAuthSchema(client);
    const action = (req.query.action as string) || (req.body && req.body.action) || 'login';

    // -------------------------------------------------------------
    // 1. ACTION: LOGIN (EMAIL + PASSWORD -> VERIFIED BY BACKEND)
    // -------------------------------------------------------------
    if (action === 'login' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { email, password, requiredRole = 'ADMIN', keepSignedIn = true } = body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'User ID / email and password are required.' });
      }

      const identifier = String(email).toLowerCase().trim();
      const digits = identifier.replace(/\D/g, '');

      // Find user
      const userRes = await client.query(
        `SELECT id, email, login_id, password_hash, salt, name, role
         FROM gym_users
         WHERE lower(email) = $1
            OR lower(login_id) = $1
            OR ($2 <> '' AND regexp_replace(coalesce(phone, ''), '\\D', '', 'g') LIKE '%' || $2)
         LIMIT 1`,
        [identifier, digits]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = userRes.rows[0];

      // Check role isolation
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({
          error: `Access Denied: Account role (${user.role}) is not authorized for the ${requiredRole} portal.`
        });
      }

      // Verify password hash
      const computedHash = hashPassword(password, user.salt);
      if (!safeCompareHex(computedHash, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate cryptographically secure session token
      const sessionToken = `jwt_${crypto.randomBytes(32).toString('hex')}`;
      const sessionDurationDays = keepSignedIn ? 30 : 1;
      const expiresAt = new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000);

      // Save session to backend
      await client.query(
        `INSERT INTO gym_sessions (user_id, token, role, expires_at, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [user.id, sessionToken, user.role, expiresAt]
      );

      // Update last login
      await client.query(`UPDATE gym_users SET last_login = now() WHERE id = $1`, [user.id]);

      return res.status(200).json({
        status: 'ok',
        token: sessionToken,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          loginId: user.login_id
        }
      });
    }

    // -------------------------------------------------------------
    // 2. ACTION: CREATE / UPDATE PORTAL USER (ADMIN ONLY)
    // -------------------------------------------------------------
    if (action === 'create-user' && req.method === 'POST') {
      const adminSession = await verifySessionToken(client, getBearerToken(req), ['ADMIN']);
      if (!adminSession) {
        return res.status(401).json({ error: 'Admin session required.' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { email, password, name, role, phone, loginId } = body || {};

      if (!email || !password || !name || !['TRAINER', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Email, password, name and portal role are required.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(String(password), salt);

      const userRes = await client.query(
        `INSERT INTO gym_users (email, login_id, password_hash, salt, name, role, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE
         SET login_id = excluded.login_id,
             password_hash = excluded.password_hash,
             salt = excluded.salt,
             name = excluded.name,
             role = excluded.role,
             phone = excluded.phone
         RETURNING id, email, login_id, name, role, phone`,
        [
          String(email).toLowerCase().trim(),
          loginId ? String(loginId).trim() : null,
          passwordHash,
          salt,
          String(name).trim(),
          role,
          phone ? String(phone).trim() : null
        ]
      );

      return res.status(200).json({ status: 'ok', user: userRes.rows[0] });
    }

    // -------------------------------------------------------------
    // 3. ACTION: VERIFY SESSION (VALIDATES TOKEN WITH BACKEND)
    // -------------------------------------------------------------
    if (action === 'verify') {
      const authHeader = req.headers.authorization;
      const token =
        (req.body && req.body.token) ||
        (req.query && (req.query.token as string)) ||
        (authHeader && authHeader.replace(/^Bearer\s+/i, ''));

      if (!token) {
        return res.status(401).json({ valid: false, error: 'Token missing.' });
      }

      const session = await verifySessionToken(client, token);
      if (!session) {
        return res.status(401).json({ valid: false, error: 'Session invalid or expired.' });
      }

      return res.status(200).json({
        valid: true,
        user: session.user,
        expiresAt: session.expiresAt
      });
    }

    // -------------------------------------------------------------
    // 4. ACTION: LOGOUT (REVOKES SESSION IN BACKEND)
    // -------------------------------------------------------------
    if (action === 'logout') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const token = body?.token || (req.query?.token as string);

      if (token) {
        await client.query(`UPDATE gym_sessions SET revoked = true WHERE token = $1`, [token]);
      }

      return res.status(200).json({ status: 'logged_out' });
    }

    return res.status(400).json({ error: 'Unsupported auth action.' });
  } catch (err: any) {
    console.error('Auth API Error:', err);
    return res.status(500).json({ error: err?.message || 'Authentication service error.' });
  } finally {
    if (client) {
      client.release();
    }
  }
}
