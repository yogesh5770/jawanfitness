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
  const headers = corsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const token = getBearerToken(request);
    let session = null;

    if (token) {
      session = await env.DB.prepare(`
        SELECT * FROM gym_sessions
        WHERE token = ? AND datetime(expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first() as any;
    }

    // -----------------------------------------------------------------
    // 1. GET: Fetch current gym sync state
    // -----------------------------------------------------------------
    if (request.method === 'GET') {
      const row = await env.DB.prepare(`
        SELECT data, updated_at FROM gym_sync_state WHERE id = 'master' LIMIT 1
      `).first() as any;

      if (!row) {
        return new Response(JSON.stringify({ data: null }), { status: 200, headers });
      }

      let parsed = row.data;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // ignore
        }
      }

      return new Response(JSON.stringify({
        data: parsed,
        updatedAt: row.updated_at
      }), {
        status: 200,
        headers
      });
    }

    // -----------------------------------------------------------------
    // 2. POST: Update gym sync state
    // -----------------------------------------------------------------
    if (request.method === 'POST') {
      if (!session) {
        return new Response(JSON.stringify({ error: 'Valid session required to sync state.' }), {
          status: 401,
          headers
        });
      }

      const body = await request.json() as any;
      const dataString = typeof body === 'string' ? body : JSON.stringify(body);

      await env.DB.prepare(`
        INSERT INTO gym_sync_state (id, data, updated_at)
        VALUES ('master', ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updated_at = datetime('now');
      `).bind(dataString).run();

      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), {
      status: 405,
      headers
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Sync error' }), {
      status: 500,
      headers
    });
  }
};
