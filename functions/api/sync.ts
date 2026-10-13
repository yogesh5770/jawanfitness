interface Env {
  DB: D1Database;
}

interface SessionInfo {
  token: string;
  user_id: string;
  role: string;
  email: string;
  name: string;
  phone: string | null;
  login_id: string | null;
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

function stripSecrets<T extends Record<string, any>>(list: T[] | undefined): T[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    if (item && typeof item === 'object' && 'temporaryPassword' in item) {
      const { temporaryPassword: _removed, ...rest } = item;
      return rest as T;
    }
    return item;
  });
}

function sameUser(record: { id?: string; email?: string; loginId?: string; phone?: string } | null | undefined, session: SessionInfo): boolean {
  if (!record) return false;
  const uid = (session.user_id || '').toLowerCase();
  const email = (session.email || '').toLowerCase();
  const loginId = (session.login_id || '').toLowerCase();
  const phoneDigits = (session.phone || '').replace(/\D/g, '');
  if (record.id && uid && record.id.toLowerCase() === uid) return true;
  if (record.email && email && record.email.toLowerCase() === email) return true;
  if (record.loginId && loginId && record.loginId.toLowerCase() === loginId) return true;
  if (phoneDigits.length >= 10 && record.phone && record.phone.replace(/\D/g, '').endsWith(phoneDigits.slice(-10))) return true;
  return false;
}

/** Resolve the blob-side identity keys for the logged-in user (id + loginId + email). */
function identityKeys(session: SessionInfo, ownBlobRecord: { id?: string; loginId?: string; email?: string } | null): Set<string> {
  const keys = new Set<string>();
  const add = (v?: string | null) => { if (v) { keys.add(String(v).toLowerCase()); } };
  add(session.user_id);
  add(session.email);
  add(session.login_id);
  if (ownBlobRecord) {
    add(ownBlobRecord.id);
    add(ownBlobRecord.loginId);
    add(ownBlobRecord.email);
  }
  return keys;
}

function keyMatches(key: string, keys: Set<string>): boolean {
  return keys.has(String(key || '').toLowerCase());
}

/** Role-scope the master blob so each role only receives data they are allowed to see. */
function scopeStateForRole(inner: any, session: SessionInfo): any {
  const role = session.role;

  // Never expose temp passwords to anyone
  inner.clients = stripSecrets(inner.clients);
  inner.trainers = stripSecrets(inner.trainers);

  if (role === 'ADMIN') return inner;

  const clients: any[] = Array.isArray(inner.clients) ? inner.clients : [];
  const trainers: any[] = Array.isArray(inner.trainers) ? inner.trainers : [];

  if (role === 'CLIENT') {
    const own = clients.find((c) => sameUser(c, session)) || null;
    const keys = identityKeys(session, own);
    const ownId = own?.id || session.user_id;

    const scopedTrainers = own?.trainerId
      ? trainers.filter((t) => t.id === own.trainerId || sameUser(t, session))
      : trainers.filter((t) => sameUser(t, session));

    const scopedWorkouts: Record<string, any> = {};
    for (const [k, v] of Object.entries(inner.assignedWorkouts || {})) {
      if (keyMatches(k, keys)) scopedWorkouts[k] = v;
    }
    const scopedDiets: Record<string, any> = {};
    for (const [k, v] of Object.entries(inner.assignedDietPlans || {})) {
      if (keyMatches(k, keys)) scopedDiets[k] = v;
    }

    return {
      ...inner,
      clients: own ? [own] : [],
      trainers: scopedTrainers,
      assignedWorkouts: scopedWorkouts,
      assignedDietPlans: scopedDiets,
      workoutHistory: (inner.workoutHistory || []).filter((w: any) => !w?.clientId || w.clientId === ownId),
      loggedMeals: (inner.loggedMeals || []).filter((m: any) => !m?.clientId || m.clientId === ownId),
      weightHistory: (inner.weightHistory || []).filter((w: any) => !w?.clientId || w.clientId === ownId),
      messages: (inner.messages || []).filter((m: any) => m?.clientId === ownId),
      events: [],
      activeClientId: ownId
    };
  }

  if (role === 'TRAINER') {
    // Trainer blob record (matched by login/email/phone) gives the store-side id
    const self = trainers.find((t) => sameUser(t, session)) || null;
    const keys = identityKeys(session, self);
    const trainerIds = new Set<string>();
    if (session.user_id) trainerIds.add(session.user_id);
    if (self?.id) trainerIds.add(self.id);

    const myClients = clients.filter((c) => c?.trainerId && trainerIds.has(c.trainerId));
    const myClientIds = new Set(myClients.map((c) => c.id).filter(Boolean));
    const myClientKeys = new Set<string>();
    for (const c of myClients) {
      if (c.id) myClientKeys.add(String(c.id).toLowerCase());
      if (c.loginId) myClientKeys.add(String(c.loginId).toLowerCase());
      if (c.email) myClientKeys.add(String(c.email).toLowerCase());
    }

    const scopedWorkouts: Record<string, any> = {};
    for (const [k, v] of Object.entries(inner.assignedWorkouts || {})) {
      if (keyMatches(k, myClientKeys) || keyMatches(k, keys)) scopedWorkouts[k] = v;
    }
    const scopedDiets: Record<string, any> = {};
    for (const [k, v] of Object.entries(inner.assignedDietPlans || {})) {
      if (keyMatches(k, myClientKeys) || keyMatches(k, keys)) scopedDiets[k] = v;
    }

    return {
      ...inner,
      clients: myClients,
      trainers: self ? [self] : trainers.filter((t) => sameUser(t, session)),
      assignedWorkouts: scopedWorkouts,
      assignedDietPlans: scopedDiets,
      workoutHistory: (inner.workoutHistory || []).filter((w: any) => w?.clientId && myClientIds.has(w.clientId)),
      loggedMeals: (inner.loggedMeals || []).filter((m: any) => m?.clientId && myClientIds.has(m.clientId)),
      weightHistory: (inner.weightHistory || []).filter((w: any) => w?.clientId && myClientIds.has(w.clientId)),
      messages: (inner.messages || []).filter(
        (m: any) => (m?.trainerId && trainerIds.has(m.trainerId)) || (m?.clientId && myClientIds.has(m.clientId))
      ),
      events: []
    };
  }

  return inner;
}

/** Merge a non-admin POST so it can never wipe other people's data. */
function mergeNonAdminPost(incoming: any, existingState: any, session: SessionInfo): any {
  const role = session.role;
  const clients: any[] = Array.isArray(existingState.clients) ? existingState.clients : [];
  const trainers: any[] = Array.isArray(existingState.trainers) ? existingState.trainers : [];

  if (role === 'CLIENT') {
    const own = clients.find((c) => sameUser(c, session)) || null;
    const ownId = own?.id || session.user_id;

    // Stamp un-attributed incoming activity with the sender's id
    const stamp = <T extends { clientId?: string }>(arr: T[] | undefined): T[] =>
      (Array.isArray(arr) ? arr : []).map((e) => (e && !e.clientId ? { ...e, clientId: ownId } : e));

    const ownRecord = Array.isArray(incoming.clients)
      ? incoming.clients.find((c: any) => sameUser(c, session))
      : null;

    let mergedClients = clients;
    if (own && ownRecord) {
      // Client may update only their own biometric/goal fields
      mergedClients = clients.map((c) =>
        c.id === own.id
          ? {
              ...c,
              currentWeightKg: ownRecord.currentWeightKg ?? c.currentWeightKg,
              startingWeightKg: ownRecord.startingWeightKg ?? c.startingWeightKg,
              goalWeightKg: ownRecord.goalWeightKg ?? c.goalWeightKg,
              heightCm: ownRecord.heightCm ?? c.heightCm,
              goal: ownRecord.goal ?? c.goal,
              firstLoginCompleted: ownRecord.firstLoginCompleted ?? c.firstLoginCompleted
            }
          : c
      );
    }

    const msgMap = new Map<string, any>();
    for (const m of existingState.messages || []) if (m?.id) msgMap.set(m.id, m);
    for (const m of stamp(incoming.messages)) if (m?.id) msgMsgSet(msgMap, m, ownId);

    return {
      clients: mergedClients,
      trainers,
      assignedWorkouts: existingState.assignedWorkouts || {},
      assignedDietPlans: existingState.assignedDietPlans || {},
      workoutHistory: unionById(existingState.workoutHistory, stamp(incoming.workoutHistory)),
      loggedMeals: unionById(existingState.loggedMeals, stamp(incoming.loggedMeals)),
      weightHistory: unionById(existingState.weightHistory, stamp(incoming.weightHistory)),
      events: existingState.events || [],
      messages: Array.from(msgMap.values()).sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)),
      customFoods: Array.isArray(incoming.customFoods) && incoming.customFoods.length > 0
        ? unionById(existingState.customFoods, incoming.customFoods)
        : (existingState.customFoods || [])
    };
  }

  // TRAINER
  const self = trainers.find((t) => sameUser(t, session)) || null;
  const trainerIds = new Set<string>();
  if (session.user_id) trainerIds.add(session.user_id);
  if (self?.id) trainerIds.add(self.id);
  const myClients = clients.filter((c) => c?.trainerId && trainerIds.has(c.trainerId));
  const myClientIds = new Set(myClients.map((c) => c.id).filter(Boolean));

  const scopedWorkouts = { ...(existingState.assignedWorkouts || {}) };
  for (const [k, v] of Object.entries(incoming.assignedWorkouts || {})) {
    if (v && myClientIds.has(String((v as any).clientId || k)) ) scopedWorkouts[k] = v;
    else if (v && myClients.some((c) => [c.id, c.loginId, c.email].filter(Boolean).map(String).includes(String(k)))) {
      scopedWorkouts[k] = v;
    }
  }
  const scopedDiets = { ...(existingState.assignedDietPlans || {}) };
  for (const [k, v] of Object.entries(incoming.assignedDietPlans || {})) {
    if (v && myClients.some((c) => [c.id, c.loginId, c.email].filter(Boolean).map(String).includes(String(k)))) {
      scopedDiets[k] = v;
    }
  }

  // Trainer may update adherence/lastWorkout for their own clients only
  const mergedClients = clients.map((c) => {
    if (!myClientIds.has(c.id)) return c;
    const ic = Array.isArray(incoming.clients) ? incoming.clients.find((x: any) => x.id === c.id) : null;
    if (!ic) return c;
    return {
      ...c,
      currentWeightKg: ic.currentWeightKg ?? c.currentWeightKg,
      workoutAdherence: ic.workoutAdherence ?? c.workoutAdherence,
      dietAdherence: ic.dietAdherence ?? c.dietAdherence,
      lastWorkout: ic.lastWorkout ?? c.lastWorkout,
      trainerId: c.trainerId,
      trainerName: c.trainerName
    };
  });

  const msgMap2 = new Map<string, any>();
  for (const m of existingState.messages || []) if (m?.id) msgMap2.set(m.id, m);
  for (const m of incoming.messages || []) {
    if (!m?.id) continue;
    const allowed = (m.trainerId && trainerIds.has(m.trainerId)) || (m.clientId && myClientIds.has(m.clientId));
    if (allowed) msgMap2.set(m.id, m);
  }

  return {
    clients: mergedClients,
    trainers,
    assignedWorkouts: scopedWorkouts,
    assignedDietPlans: scopedDiets,
    workoutHistory: unionById(existingState.workoutHistory, (incoming.workoutHistory || []).filter((w: any) => w?.clientId && myClientIds.has(w.clientId))),
    loggedMeals: unionById(existingState.loggedMeals, (incoming.loggedMeals || []).filter((m: any) => m?.clientId && myClientIds.has(m.clientId))),
    weightHistory: unionById(existingState.weightHistory, (incoming.weightHistory || []).filter((w: any) => w?.clientId && myClientIds.has(w.clientId))),
    events: existingState.events || [],
    messages: Array.from(msgMap2.values()).sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)),
    customFoods: Array.isArray(incoming.customFoods) && incoming.customFoods.length > 0
      ? unionById(existingState.customFoods, incoming.customFoods)
      : (existingState.customFoods || [])
  };
}

function msgMsgSet(map: Map<string, any>, m: any, ownId: string) {
  if (m.clientId === ownId || !m.clientId) map.set(m.id, { ...m, clientId: m.clientId || ownId });
}

function unionById<T extends { id?: string }>(existing: T[] | undefined, incoming: T[] | undefined): T[] {
  const map = new Map<string, T>();
  for (const e of existing || []) if (e?.id) map.set(e.id, e);
  for (const e of incoming || []) if (e?.id) map.set(e.id, e);
  return Array.from(map.values());
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
    let session: SessionInfo | null = null;

    if (token) {
      session = await env.DB.prepare(`
        SELECT s.token, s.user_id, s.role, u.email, u.name, u.phone, u.login_id
        FROM gym_sessions s
        JOIN gym_users u ON s.user_id = u.id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first() as SessionInfo | null;
    }

    // -----------------------------------------------------------------
    // 1. GET: Fetch gym sync state (scoped to the caller's role)
    // -----------------------------------------------------------------
    if (request.method === 'GET') {
      if (!session) {
        return new Response(JSON.stringify({ error: 'Valid session required.' }), { status: 401, headers });
      }

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
      if (!Array.isArray(inner.weightHistory)) inner.weightHistory = [];
      if (!Array.isArray(inner.loggedMeals)) inner.loggedMeals = [];
      if (!Array.isArray(inner.workoutHistory)) inner.workoutHistory = [];
      if (!Array.isArray(inner.events)) inner.events = [];
      if (!inner.assignedWorkouts) inner.assignedWorkouts = {};
      if (!inner.assignedDietPlans) inner.assignedDietPlans = {};
      if (!Array.isArray(inner.customFoods)) inner.customFoods = [];

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

        // Merge DB trainers into state (ADMIN only sees the full roster;
        // role scoping below trims this for TRAINER/CLIENT)
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
              try {
                await env.DB.prepare(`
                  UPDATE gym_users
                  SET trainer_id = ?, trainer_name = ?, updated_at = datetime('now')
                  WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
                `).bind(clientObj.trainerId, clientObj.trainerName || 'Assigned Coach', c.id, c.login_id || '').run();
              } catch {}
            }

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

      // Per-role scoping — a CLIENT never receives other members' data
      const scoped = scopeStateForRole(inner, session);

      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
      return new Response(JSON.stringify({
        data: scoped,
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
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      let incomingData = parsedBody?.data || parsedBody;
      if (!incomingData || typeof incomingData !== 'object') incomingData = {};

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

      let mergedPayload: any;

      if (session.role === 'ADMIN') {
        // Safeguard: never let a post wipe out trainers or client list
        if ((!incomingData.trainers || incomingData.trainers.length === 0) && existingState.trainers?.length > 0) {
          incomingData.trainers = existingState.trainers;
        }
        if ((!incomingData.clients || incomingData.clients.length === 0) && existingState.clients?.length > 0) {
          incomingData.clients = existingState.clients;
        }

        // Deduplicate and union-merge chat messages by unique id
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

        const mergedWorkouts = {
          ...(existingState.assignedWorkouts || {}),
          ...(incomingData.assignedWorkouts || {})
        };
        const mergedDietPlans = {
          ...(existingState.assignedDietPlans || {}),
          ...(incomingData.assignedDietPlans || {})
        };

        mergedPayload = {
          clients: incomingData.clients || existingState.clients || [],
          trainers: incomingData.trainers || existingState.trainers || [],
          assignedWorkouts: mergedWorkouts,
          assignedDietPlans: mergedDietPlans,
          workoutHistory: incomingData.workoutHistory || existingState.workoutHistory || [],
          loggedMeals: incomingData.loggedMeals || existingState.loggedMeals || [],
          weightHistory: incomingData.weightHistory || existingState.weightHistory || [],
          events: incomingData.events || existingState.events || [],
          messages: mergedMessages,
          customFoods: incomingData.customFoods || existingState.customFoods || [],
          dailyWaterLog: incomingData.dailyWaterLog || existingState.dailyWaterLog || {}
        };
      } else {
        mergedPayload = mergeNonAdminPost(incomingData, existingState, session);
      }

      // Strip secrets before persisting
      mergedPayload.clients = stripSecrets(mergedPayload.clients);
      mergedPayload.trainers = stripSecrets(mergedPayload.trainers);

      await env.DB.prepare(`
        INSERT INTO gym_sync_state (id, data, updated_at)
        VALUES ('master', ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updated_at = datetime('now');
      `).bind(JSON.stringify({ data: mergedPayload })).run();

      // Synchronize client trainer assignments to gym_users table in D1 (ADMIN only)
      if (session.role === 'ADMIN') {
        try {
          const clientList = Array.isArray(mergedPayload.clients) ? mergedPayload.clients : [];
          for (const cl of clientList) {
            if (cl.id || cl.loginId) {
              await env.DB.prepare(`
                UPDATE gym_users
                SET trainer_id = ?, trainer_name = ?, updated_at = datetime('now')
                WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
              `).bind(cl.trainerId || '', cl.trainerName || 'Unassigned', cl.id || '', cl.loginId || '').run();
            }
          }
        } catch (userSyncErr) {
          console.error('Failed to sync clients to gym_users:', userSyncErr);
        }
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
