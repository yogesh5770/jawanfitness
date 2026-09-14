interface Env {
  DB: D1Database;
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, *',
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

      // If wrapped in { data: ... }, unwrap
      let inner = parsed && parsed.data ? parsed.data : parsed;
      if (!inner) inner = {};
      if (!Array.isArray(inner.trainers)) inner.trainers = [];
      if (!Array.isArray(inner.clients)) inner.clients = [];
      if (!Array.isArray(inner.messages)) inner.messages = [];

      // Query real users from D1 gym_users table to ensure 100% database accuracy
      try {
        const dbUsersRes = await env.DB.prepare(`
          SELECT id, email, name, role, login_id, phone,
                 starting_weight_kg, current_weight_kg, goal_weight_kg,
                 height_cm, goal, trainer_id, trainer_name
          FROM gym_users
        `).all();

        const dbUsers = dbUsersRes?.results || [];
        const dbTrainers = dbUsers.filter((u: any) => u.role === 'TRAINER');
        const dbClients = dbUsers.filter((u: any) => u.role === 'CLIENT');

        // Merge DB trainers into state
        for (const t of dbTrainers) {
          let trainerObj = inner.trainers.find((it: any) => 
            it.id === t.id || 
            (it.loginId && t.login_id && it.loginId.toLowerCase() === t.login_id.toLowerCase()) ||
            (it.email && t.email && it.email.toLowerCase() === t.email.toLowerCase()) ||
            (it.phone && t.phone && it.phone === t.phone)
          );
          if (!trainerObj) {
            trainerObj = {
              id: t.id,
              name: t.name,
              email: t.email,
              phone: t.phone || '',
              role: 'Head Strength Coach & Nutritionist',
              status: 'Active',
              clientsCount: 0,
              avgAdherence: 95,
              loginId: t.login_id
            };
            inner.trainers.push(trainerObj);
          } else {
            if (!trainerObj.loginId && t.login_id) trainerObj.loginId = t.login_id;
            if (!trainerObj.phone && t.phone) trainerObj.phone = t.phone;
          }
        }

        // Ensure DB clients are in state — use real DB weight/goal values
        for (const c of dbClients) {
          let clientObj = inner.clients.find((ic: any) => 
            ic.id === c.id || 
            (ic.loginId && c.login_id && ic.loginId.toLowerCase() === c.login_id.toLowerCase()) ||
            (ic.email && c.email && ic.email.toLowerCase() === c.email.toLowerCase()) ||
            (ic.phone && c.phone && ic.phone === c.phone)
          );
          if (!clientObj) {
            // Client exists in DB but not in sync state — create with real DB values
            clientObj = {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone || '',
              loginId: c.login_id,
              heightCm: c.height_cm || 170,
              startingWeightKg: c.starting_weight_kg || 0,
              currentWeightKg: c.current_weight_kg || 0,
              goal: c.goal || 'General Fitness',
              goalWeightKg: c.goal_weight_kg || 0,
              trainerId: c.trainer_id || '',
              trainerName: c.trainer_name || 'Unassigned',
              status: 'Active',
              firstLoginCompleted: false,
              gymId: 'JAWAN-SALEM-01',
              workoutAdherence: 0,
              dietAdherence: 0,
              lastWorkout: 'Ready'
            };
            inner.clients.push(clientObj);
          } else {
            if (!clientObj.loginId && c.login_id) clientObj.loginId = c.login_id;
            // Trainer assignment sync: prefer assigned coach from either DB or state
            if (c.trainer_id && c.trainer_id.trim() !== '' && c.trainer_id !== 'Unassigned') {
              clientObj.trainerId = c.trainer_id;
              clientObj.trainerName = c.trainer_name || 'Assigned Coach';
            } else if (clientObj.trainerId && clientObj.trainerId.trim() !== '' && clientObj.trainerId !== 'Unassigned') {
              // gym_sync_state has the assignment, propagate back to gym_users
              try {
                await env.DB.prepare(`
                  UPDATE gym_users
                  SET trainer_id = ?, trainer_name = ?, updated_at = datetime('now')
                  WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
                `).bind(clientObj.trainerId, clientObj.trainerName || 'Assigned Coach', c.id, c.login_id || '').run();
              } catch {}
            }

            // Client exists in sync state — patch stale 0 weights from DB if DB has real values
            if ((!clientObj.startingWeightKg || clientObj.startingWeightKg === 0) && c.starting_weight_kg) {
              clientObj.startingWeightKg = c.starting_weight_kg;
            }
            if ((!clientObj.currentWeightKg || clientObj.currentWeightKg === 0) && c.current_weight_kg) {
              clientObj.currentWeightKg = c.current_weight_kg;
            }
            if ((!clientObj.goalWeightKg || clientObj.goalWeightKg === 0) && c.goal_weight_kg) {
              clientObj.goalWeightKg = c.goal_weight_kg;
            }
            if ((!clientObj.heightCm || clientObj.heightCm === 170) && c.height_cm && c.height_cm !== 170) {
              clientObj.heightCm = c.height_cm;
            }
            if ((!clientObj.goal || clientObj.goal === 'General Fitness') && c.goal) {
              clientObj.goal = c.goal;
            }
          }
        }
      } catch (dbErr) {
        console.error('Failed to enrich with gym_users:', dbErr);
      }

      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
      return new Response(JSON.stringify({
        data: inner,
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
      if (!session && !token) {
        return new Response(JSON.stringify({ error: 'Valid session required to sync state.' }), {
          status: 401,
          headers
        });
      }

      const body = await request.json() as any;
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      const incomingData = parsedBody?.data || parsedBody;

      // Fetch current row so we don't accidentally drop trainers or clients
      const existingRow = await env.DB.prepare(`
        SELECT data FROM gym_sync_state WHERE id = 'master' LIMIT 1
      `).first() as any;
      let existingState: any = {};
      if (existingRow?.data) {
        try {
          const ep = JSON.parse(existingRow.data);
          existingState = ep?.data || ep || {};
        } catch {}
      }

      // Safeguard: never let client wipe out trainers or client list
      if ((!incomingData.trainers || incomingData.trainers.length === 0) && existingState.trainers?.length > 0) {
        incomingData.trainers = existingState.trainers;
      }
      if ((!incomingData.clients || incomingData.clients.length === 0) && existingState.clients?.length > 0) {
        incomingData.clients = existingState.clients;
      }

      // If a non-admin posts clients, protect existing trainer assignments from being wiped
      const userRole = session?.role || 'CLIENT';
      if (userRole !== 'ADMIN' && Array.isArray(incomingData.clients) && Array.isArray(existingState.clients)) {
        incomingData.clients = incomingData.clients.map((ic: any) => {
          const ec = existingState.clients.find((e: any) => e.id === ic.id || (e.loginId && e.loginId === ic.loginId));
          if (ec && ec.trainerId && (!ic.trainerId || ic.trainerId === 'Unassigned')) {
            return {
              ...ic,
              trainerId: ec.trainerId,
              trainerName: ec.trainerName
            };
          }
          return ic;
        });
      }

      // Deduplicate and union-merge chat messages by unique id so neither trainer nor member messages are lost
      const msgMap = new Map<string, any>();
      if (Array.isArray(existingState.messages)) {
        for (const m of existingState.messages) {
          if (m && m.id) msgMap.set(m.id, m);
        }
      }
      if (Array.isArray(incomingData.messages)) {
        for (const m of incomingData.messages) {
          if (m && m.id) msgMap.set(m.id, m);
        }
      }
      const mergedMessages = Array.from(msgMap.values()).sort(
        (a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)
      );

      const mergedPayload = {
        clients: incomingData.clients || existingState.clients || [],
        trainers: incomingData.trainers || existingState.trainers || [],
        assignedWorkouts: incomingData.assignedWorkouts || existingState.assignedWorkouts || {},
        assignedDietPlans: incomingData.assignedDietPlans || existingState.assignedDietPlans || {},
        workoutHistory: incomingData.workoutHistory || existingState.workoutHistory || [],
        loggedMeals: incomingData.loggedMeals || existingState.loggedMeals || [],
        events: incomingData.events || existingState.events || [],
        messages: mergedMessages
      };

      await env.DB.prepare(`
        INSERT INTO gym_sync_state (id, data, updated_at)
        VALUES ('master', ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updated_at = datetime('now');
      `).bind(JSON.stringify({ data: mergedPayload })).run();

      // Synchronize client trainer assignments to gym_users table in D1
      try {
        const clientList = Array.isArray(mergedPayload.clients) ? mergedPayload.clients : [];
        for (const cl of clientList) {
          if (cl.id || cl.loginId) {
            // Admin can assign/unassign; non-admin can only update if trainerId is non-empty
            if (session.role === 'ADMIN' || (cl.trainerId && cl.trainerId.trim() !== '' && cl.trainerId !== 'Unassigned')) {
              await env.DB.prepare(`
                UPDATE gym_users
                SET trainer_id = ?, trainer_name = ?, updated_at = datetime('now')
                WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
              `).bind(cl.trainerId || '', cl.trainerName || 'Unassigned', cl.id || '', cl.loginId || '').run();
            }
          }
        }
      } catch (userSyncErr) {
        console.error('Failed to sync clients to gym_users:', userSyncErr);
      }

      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
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
