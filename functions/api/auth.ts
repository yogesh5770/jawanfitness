interface Env {
  DB: D1Database;
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-512'
    },
    keyMaterial,
    512
  );
  const hashArray = Array.from(new Uint8Array(derived));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomHex(byteCount = 32): string {
  const array = new Uint8Array(byteCount);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.substring(7).trim();
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'login';
  const headers = corsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // -----------------------------------------------------------------
    // 1. LOGIN
    // -----------------------------------------------------------------
    if (action === 'login' && request.method === 'POST') {
      const body = await request.json() as any;
      const { email, password, requiredRole = 'ADMIN', keepSignedIn = true } = body || {};

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'User ID / email and password are required.' }), {
          status: 400,
          headers
        });
      }

      const cleanInput = email.trim();
      const digitsOnly = cleanInput.replace(/\D/g, '');
      const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
      const phoneWithCountry = last10Digits ? `+91${last10Digits}` : cleanInput;

      const user = await env.DB.prepare(`
        SELECT * FROM gym_users
        WHERE (
          LOWER(email) = LOWER(?)
          OR LOWER(login_id) = LOWER(?)
          OR phone = ?
          OR phone = ?
          OR (length(?) >= 10 AND phone LIKE '%' || ?)
        )
        ORDER BY CASE 
          WHEN role = ? THEN 0 
          WHEN role = 'ADMIN' THEN 1
          ELSE 2 
        END
        LIMIT 1
      `).bind(
        cleanInput,
        cleanInput,
        cleanInput,
        phoneWithCountry,
        last10Digits,
        last10Digits,
        requiredRole
      ).first() as any;

      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid user credentials.' }), {
          status: 401,
          headers
        });
      }

      const inputHash = await hashPassword(password, user.salt);
      if (inputHash !== user.password_hash) {
        return new Response(JSON.stringify({ error: 'Invalid user credentials.' }), {
          status: 401,
          headers
        });
      }

      const roleHierarchy: Record<string, number> = { CLIENT: 1, TRAINER: 2, ADMIN: 3 };
      const userLevel = roleHierarchy[user.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 1;

      if (userLevel < requiredLevel) {
        return new Response(JSON.stringify({ error: `Access denied. Requires ${requiredRole} privileges.` }), {
          status: 403,
          headers
        });
      }

      const token = generateRandomHex(32);
      const days = keepSignedIn ? 365 : 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const sessionId = generateRandomHex(16);

      await env.DB.prepare(`
        INSERT INTO gym_sessions (id, token, user_id, role, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(sessionId, token, user.id, user.role, expiresAt).run();

      await env.DB.prepare(`
        UPDATE gym_users SET last_login = datetime('now') WHERE id = ?
      `).bind(user.id).run();

      return new Response(JSON.stringify({
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          login_id: user.login_id,
          loginId: user.login_id
        }
      }), {
        status: 200,
        headers
      });
    }

    // -----------------------------------------------------------------
    // 2. VERIFY SESSION
    // -----------------------------------------------------------------
    if (action === 'verify' && (request.method === 'GET' || request.method === 'POST')) {
      let token = getBearerToken(request);
      if (!token && request.method === 'POST') {
        try {
          const body = await request.clone().json() as any;
          token = body?.token || null;
        } catch {}
      }

      if (!token) {
        return new Response(JSON.stringify({ valid: false, error: 'No token provided' }), {
          status: 401,
          headers
        });
      }

      const session = await env.DB.prepare(`
        SELECT s.*, u.email, u.name, u.phone, u.login_id
        FROM gym_sessions s
        JOIN gym_users u ON s.user_id = u.id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first() as any;

      if (!session) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers
        });
      }

      return new Response(JSON.stringify({
        valid: true,
        expiresAt: session.expires_at,
        user: {
          id: session.user_id,
          role: session.role,
          email: session.email,
          name: session.name,
          phone: session.phone,
          login_id: session.login_id,
          loginId: session.login_id
        }
      }), {
        status: 200,
        headers
      });
    }

    // -----------------------------------------------------------------
    // 3. CHANGE PASSWORD
    // -----------------------------------------------------------------
    if (action === 'change-password' && request.method === 'POST') {
      const body = await request.json() as any;
      const { email, oldPassword, newPassword } = body || {};

      if (!email || !oldPassword || !newPassword) {
        return new Response(JSON.stringify({ error: 'User ID, old password, and new password are required.' }), {
          status: 400,
          headers
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'New password must be at least 6 characters long.' }), {
          status: 400,
          headers
        });
      }

      const cleanInput = email.trim();
      const user = await env.DB.prepare(`
        SELECT * FROM gym_users
        WHERE LOWER(email) = LOWER(?)
           OR LOWER(login_id) = LOWER(?)
           OR phone = ?
        LIMIT 1
      `).bind(cleanInput, cleanInput, cleanInput).first() as any;

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found.' }), {
          status: 404,
          headers
        });
      }

      const oldHash = await hashPassword(oldPassword, user.salt);
      if (oldHash !== user.password_hash) {
        return new Response(JSON.stringify({ error: 'Current password does not match.' }), {
          status: 401,
          headers
        });
      }

      const newSalt = generateRandomHex(16);
      const newHash = await hashPassword(newPassword, newSalt);

      await env.DB.prepare(`
        UPDATE gym_users
        SET password_hash = ?, salt = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newHash, newSalt, user.id).run();

      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully!' }), {
        status: 200,
        headers
      });
    }

    // -----------------------------------------------------------------
    // 4. REGISTER / CREATE NEW USER (ADMIN ONLY)
    // -----------------------------------------------------------------
    if ((action === 'register' || action === 'create-user') && request.method === 'POST') {
      const token = getBearerToken(request);
      const adminSession = token ? await env.DB.prepare(`
        SELECT * FROM gym_sessions
        WHERE token = ? AND role = 'ADMIN' AND datetime(expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first() : null;

      if (!adminSession) {
        return new Response(JSON.stringify({ error: 'Admin privileges required to register users.' }), {
          status: 403,
          headers
        });
      }

      const body = await request.json() as any;
      const { email, password, role, name, phone, login_id, loginId } = body || {};
      const userLoginId = login_id || loginId || null;

      if (!email || !password || !role || !name) {
        return new Response(JSON.stringify({ error: 'Email, password, role, and name are required.' }), {
          status: 400,
          headers
        });
      }

      const salt = generateRandomHex(16);
      const passwordHash = await hashPassword(password, salt);
      const userId = generateRandomHex(16);

      await env.DB.prepare(`
        INSERT INTO gym_users (id, email, password_hash, salt, role, name, phone, login_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(userId, email.toLowerCase().trim(), passwordHash, salt, role, name.trim(), phone || null, userLoginId).run();

      return new Response(JSON.stringify({
        success: true,
        user: { id: userId, email, role, name, phone, loginId: userLoginId, login_id: userLoginId }
      }), {
        status: 201,
        headers
      });
    }

    // -----------------------------------------------------------------
    // 5. LOGOUT
    // -----------------------------------------------------------------
    if (action === 'logout') {
      const token = getBearerToken(request);
      if (token) {
        await env.DB.prepare(`DELETE FROM gym_sessions WHERE token = ?`).bind(token).run();
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), {
      status: 500,
      headers
    });
  }
};
