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

const ALLOWED_ORIGINS = new Set([
  'https://jawan.fit',
  'https://www.jawan.fit',
  'https://admin.jawan.fit',
  'https://trainer.jawan.fit',
  'https://app.jawan.fit',
  'https://jawan-fitness-app.pages.dev',
  'https://jawan-fitness-admin.pages.dev',
  'https://jawan-fitness-trainer.pages.dev',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost'
]);

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (/^https:\/\/([a-z0-9-]+\.)?jawan-fitness(-[a-z0-9]+)?\.pages\.dev$/.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  const allowed = isOriginAllowed(origin);
  const allowOrigin = allowed && origin ? origin : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept',
    ...(allowed && allowOrigin !== 'null' ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
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

function sameUser(record: { id?: string; email?: string; loginId?: string; phone?: string; name?: string } | null | undefined, session: SessionInfo): boolean {
  if (!record) return false;
  const uid = (session.user_id || '').toLowerCase();
  const email = (session.email || '').toLowerCase();
  const loginId = (session.login_id || '').toLowerCase();
  const name = (session.name || '').toLowerCase();
  const phoneDigits = (session.phone || '').replace(/\D/g, '');
  if (record.id && uid && record.id.toLowerCase() === uid) return true;
  if (record.email && email && record.email.toLowerCase() === email) return true;
  if (record.loginId && loginId && record.loginId.toLowerCase() === loginId) return true;
  if (record.name && name && record.name.toLowerCase() === name) return true;
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
    // Trainer blob record (matched by login/email/phone/name) gives the store-side id
    const self = trainers.find((t) => sameUser(t, session)) || null;
    const keys = identityKeys(session, self);
    const trainerIds = new Set<string>();
    if (session.user_id) trainerIds.add(String(session.user_id).toLowerCase());
    if (session.login_id) trainerIds.add(String(session.login_id).toLowerCase());
    if (session.email) trainerIds.add(String(session.email).toLowerCase());
    if (session.name) trainerIds.add(String(session.name).toLowerCase());
    if (self?.id) trainerIds.add(String(self.id).toLowerCase());
    if (self?.loginId) trainerIds.add(String(self.loginId).toLowerCase());
    if (self?.email) trainerIds.add(String(self.email).toLowerCase());
    if (self?.name) trainerIds.add(String(self.name).toLowerCase());

    const isClientForThisTrainer = (c: any) => {
      if (!c) return false;
      const tid = String(c.trainerId || '').toLowerCase();
      const tname = String(c.trainerName || '').toLowerCase();
      return (tid && trainerIds.has(tid)) || (tname && tname !== 'unassigned' && trainerIds.has(tname));
    };

    const myClients = clients.filter(isClientForThisTrainer);
    // If no clients are specifically assigned to this trainer, include active clients so trainer can prescribe workouts
    const clientsForTrainer = myClients.length > 0 ? myClients : clients;

    const myClientIds = new Set(clientsForTrainer.map((c) => c.id).filter(Boolean));
    const myClientKeys = new Set<string>();
    for (const c of clientsForTrainer) {
      if (c.id) myClientKeys.add(String(c.id).toLowerCase());
      if (c.loginId) myClientKeys.add(String(c.loginId).toLowerCase());
      if (c.email) myClientKeys.add(String(c.email).toLowerCase());
    }

    const scopedWorkouts: Record<string, any> = {};
    for (const [k, v] of Object.entries(inner.assignedWorkouts || {})) {
      if (keyMatches(k, myClientKeys) || keyMatches(k, keys)) {
        scopedWorkouts[k] = v;
      } else if (v && (v as any).assignedBy && trainerIds.has(String((v as any).assignedBy).toLowerCase())) {
        scopedWorkouts[k] = v;
      }
    }
    const scopedDiets: Record<string, any> = {};
    for (const [k, v] of Object.entries(inner.assignedDietPlans || {})) {
      if (keyMatches(k, myClientKeys) || keyMatches(k, keys)) {
        scopedDiets[k] = v;
      } else if (v && (v as any).assignedBy && trainerIds.has(String((v as any).assignedBy).toLowerCase())) {
        scopedDiets[k] = v;
      }
    }

    return {
      ...inner,
      clients: clientsForTrainer,
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
      mergedClients = clients.map((c) =>
        c.id === own.id
          ? {
              ...c,
              currentWeightKg: ownRecord.currentWeightKg ?? c.currentWeightKg,
              startingWeightKg: ownRecord.startingWeightKg ?? c.startingWeightKg,
              goalWeightKg: ownRecord.goalWeightKg ?? c.goalWeightKg,
              heightCm: ownRecord.heightCm ?? c.heightCm,
              goal: ownRecord.goal ?? c.goal,
              firstLoginCompleted: Boolean(ownRecord.firstLoginCompleted || c.firstLoginCompleted)
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
  if (session.user_id) trainerIds.add(String(session.user_id).toLowerCase());
  if (session.login_id) trainerIds.add(String(session.login_id).toLowerCase());
  if (session.email) trainerIds.add(String(session.email).toLowerCase());
  if (session.name) trainerIds.add(String(session.name).toLowerCase());
  if (self?.id) trainerIds.add(String(self.id).toLowerCase());
  if (self?.loginId) trainerIds.add(String(self.loginId).toLowerCase());
  if (self?.email) trainerIds.add(String(self.email).toLowerCase());
  if (self?.name) trainerIds.add(String(self.name).toLowerCase());

  const isClientForThisTrainer = (c: any) => {
    if (!c) return false;
    const tid = String(c.trainerId || '').toLowerCase();
    const tname = String(c.trainerName || '').toLowerCase();
    return (tid && trainerIds.has(tid)) || (tname && tname !== 'unassigned' && trainerIds.has(tname));
  };

  const myClients = clients.filter(isClientForThisTrainer);
  const myClientIds = new Set(myClients.map((c) => String(c.id).toLowerCase()).filter(Boolean));
  for (const c of myClients) {
    if (c.loginId) myClientIds.add(String(c.loginId).toLowerCase());
    if (c.email) myClientIds.add(String(c.email).toLowerCase());
  }

  const allClientKeys = new Set<string>();
  for (const c of clients) {
    if (c.id) allClientKeys.add(String(c.id).toLowerCase());
    if (c.loginId) allClientKeys.add(String(c.loginId).toLowerCase());
    if (c.email) allClientKeys.add(String(c.email).toLowerCase());
  }

  const scopedWorkouts = { ...(existingState.assignedWorkouts || {}) };
  for (const [k, v] of Object.entries(incoming.assignedWorkouts || {})) {
    if (!v) continue;
    const targetKey = String((v as any).clientId || k).toLowerCase();
    const assignedBy = String((v as any).assignedBy || '').toLowerCase();
    const isTargetClient = myClientIds.has(targetKey);
    const isByTrainer = assignedBy && trainerIds.has(assignedBy);
    const isValidGymClient = allClientKeys.has(targetKey);

    if (isTargetClient || isByTrainer || isValidGymClient) {
      scopedWorkouts[k] = {
        ...(v as any),
        clientId: (v as any).clientId || k
      };
    }
  }

  const scopedDiets = { ...(existingState.assignedDietPlans || {}) };
  for (const [k, v] of Object.entries(incoming.assignedDietPlans || {})) {
    if (!v) continue;
    const targetKey = String((v as any).clientId || k).toLowerCase();
    const assignedBy = String((v as any).assignedBy || '').toLowerCase();
    const isTargetClient = myClientIds.has(targetKey);
    const isByTrainer = assignedBy && trainerIds.has(assignedBy);
    const isValidGymClient = allClientKeys.has(targetKey);

    if (isTargetClient || isByTrainer || isValidGymClient) {
      scopedDiets[k] = {
        ...(v as any),
        clientId: (v as any).clientId || k
      };
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

      let row: any = null;
      try {
        row = await env.DB.prepare(`
          SELECT data, updated_at, version FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first() as any;
      } catch {
        row = await env.DB.prepare(`
          SELECT data, updated_at FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first() as any;
      }

      if (!row) {
        return new Response(JSON.stringify({ data: null, version: 1 }), { status: 200, headers });
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

      const deadClientKeys = new Set<string>(
        (Array.isArray(inner.deletedClientIds) ? inner.deletedClientIds : []).map((v: any) => String(v).toLowerCase())
      );
      const deadTrainerKeys = new Set<string>(
        (Array.isArray(inner.deletedTrainerIds) ? inner.deletedTrainerIds : []).map((v: any) => String(v).toLowerCase())
      );

      // Purge tombstoned entities from inner state
      inner.clients = inner.clients.filter((c: any) => {
        const keys = [c.id, c.loginId, c.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
        return !keys.some((k) => deadClientKeys.has(k));
      });
      inner.trainers = inner.trainers.filter((t: any) => {
        const keys = [t.id, t.loginId, t.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
        return !keys.some((k) => deadTrainerKeys.has(k));
      });

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

        // Merge DB trainers into state (skip any deleted/tombstoned trainers)
        for (const t of dbTrainers) {
          const tKeys = [t.id, t.login_id, t.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
          if (tKeys.some((k) => deadTrainerKeys.has(k))) continue;

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

        // Ensure DB clients are in state — skip any deleted/tombstoned clients
        for (const c of dbClients) {
          const cKeys = [c.id, c.login_id, c.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
          if (cKeys.some((k) => deadClientKeys.has(k))) continue;
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
              firstLoginCompleted: Boolean((c.starting_weight_kg && c.starting_weight_kg > 0) || (c.height_cm && c.height_cm > 0)),
              gymId: 'JAWAN-SALEM-01',
              workoutAdherence: 0,
              dietAdherence: 0,
              lastWorkout: 'Ready'
            };
            inner.clients.push(clientObj);
          } else {
            if (!clientObj.loginId && c.login_id) clientObj.loginId = c.login_id;
            // Trainer assignment sync: database is single source of truth for assignments
            if (c.trainer_id && c.trainer_id.trim() !== '' && c.trainer_id !== 'Unassigned') {
              clientObj.trainerId = c.trainer_id;
              clientObj.trainerName = c.trainer_name || 'Assigned Coach';
            } else {
              // Explicitly unassigned in database — never resurrect stale previous coach
              clientObj.trainerId = '';
              clientObj.trainerName = 'Unassigned';
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
            if (!clientObj.firstLoginCompleted && ((clientObj.startingWeightKg && clientObj.startingWeightKg > 0) || (c.starting_weight_kg && c.starting_weight_kg > 0))) {
              clientObj.firstLoginCompleted = true;
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
        version: row?.version || 1,
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

      const expectedVersion = typeof parsedBody?.version === 'number'
        ? parsedBody.version
        : (typeof incomingData?.version === 'number' ? incomingData.version : null);

      // Fetch current row with version
      let existingRow: any = null;
      try {
        existingRow = await env.DB.prepare(`
          SELECT data, version FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first() as any;
      } catch {
        existingRow = await env.DB.prepare(`
          SELECT data FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first() as any;
      }

      // Optimistic concurrency compare-and-set verification
      if (
        expectedVersion !== null &&
        existingRow &&
        typeof existingRow.version === 'number' &&
        expectedVersion !== existingRow.version
      ) {
        return new Response(JSON.stringify({
          error: 'Conflict: sync state has been updated by another client. Please fetch latest state and retry.',
          code: 'CONCURRENCY_CONFLICT',
          currentVersion: existingRow.version,
          clientVersion: expectedVersion
        }), {
          status: 409,
          headers
        });
      }
      let existingState: any = {};
      if (existingRow?.data) {
        try {
          const ep = JSON.parse(existingRow.data);
          existingState = ep?.data || ep || {};
        } catch {}
      }

      let mergedPayload: any;

      if (session.role === 'ADMIN') {
        // Collect tombstones
        const clientTombstones: string[] = [
          ...(Array.isArray(incomingData.deletedClientIds) ? incomingData.deletedClientIds : []),
          ...(Array.isArray(existingState.deletedClientIds) ? existingState.deletedClientIds : [])
        ];

        if (Array.isArray(existingState.clients) && Array.isArray(incomingData.clients)) {
          const incomingIds = new Set(
            incomingData.clients.flatMap((c: any) => [c.id, c.loginId, c.email].filter(Boolean).map(String).map((v) => v.toLowerCase()))
          );
          for (const ec of existingState.clients) {
            const ecKeys = [ec.id, ec.loginId, ec.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
            if (ecKeys.length > 0 && !ecKeys.some((k) => incomingIds.has(k))) {
              clientTombstones.push(...ecKeys);
            }
          }
        }

        const uniqueClientTombstones = Array.from(new Set(clientTombstones.filter(Boolean)));
        for (const deadId of uniqueClientTombstones) {
          try {
            await env.DB.prepare(`
              DELETE FROM gym_users 
              WHERE LOWER(id) = LOWER(?) 
                 OR (login_id IS NOT NULL AND LOWER(login_id) = LOWER(?))
                 OR (email IS NOT NULL AND LOWER(email) = LOWER(?))
            `).bind(deadId, deadId, deadId).run();

            await env.DB.prepare(`
              DELETE FROM gym_sessions WHERE LOWER(user_id) = LOWER(?)
            `).bind(deadId).run();
          } catch (delErr) {
            console.error('Error deleting client from D1:', delErr);
          }
        }

        const trainerTombstones: string[] = [
          ...(Array.isArray(incomingData.deletedTrainerIds) ? incomingData.deletedTrainerIds : []),
          ...(Array.isArray(existingState.deletedTrainerIds) ? existingState.deletedTrainerIds : [])
        ];

        if (Array.isArray(existingState.trainers) && Array.isArray(incomingData.trainers)) {
          const incomingIds = new Set(
            incomingData.trainers.flatMap((t: any) => [t.id, t.loginId, t.email].filter(Boolean).map(String).map((v) => v.toLowerCase()))
          );
          for (const et of existingState.trainers) {
            const etKeys = [et.id, et.loginId, et.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
            if (etKeys.length > 0 && !etKeys.some((k) => incomingIds.has(k))) {
              trainerTombstones.push(...etKeys);
            }
          }
        }

        const uniqueTrainerTombstones = Array.from(new Set(trainerTombstones.filter(Boolean)));
        for (const deadId of uniqueTrainerTombstones) {
          try {
            await env.DB.prepare(`
              DELETE FROM gym_users 
              WHERE (LOWER(id) = LOWER(?) 
                 OR (login_id IS NOT NULL AND LOWER(login_id) = LOWER(?))
                 OR (email IS NOT NULL AND LOWER(email) = LOWER(?)))
                AND role = 'TRAINER'
            `).bind(deadId, deadId, deadId).run();

            await env.DB.prepare(`
              DELETE FROM gym_sessions WHERE LOWER(user_id) = LOWER(?)
            `).bind(deadId).run();
          } catch (delErr) {
            console.error('Error deleting trainer from D1:', delErr);
          }
        }

        const deadAllKeys = new Set([...uniqueClientTombstones, ...uniqueTrainerTombstones].map((v) => v.toLowerCase()));

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
        const mergedMessages = Array.from(msgMap.values())
          .filter((m: any) => !deadAllKeys.has(String(m?.clientId || '').toLowerCase()) && !deadAllKeys.has(String(m?.trainerId || '').toLowerCase()))
          .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

        const mergedWorkouts = {
          ...(existingState.assignedWorkouts || {}),
          ...(incomingData.assignedWorkouts || {})
        };
        for (const k of Object.keys(mergedWorkouts)) {
          if (deadAllKeys.has(k.toLowerCase())) delete mergedWorkouts[k];
        }

        const mergedDietPlans = {
          ...(existingState.assignedDietPlans || {}),
          ...(incomingData.assignedDietPlans || {})
        };
        for (const k of Object.keys(mergedDietPlans)) {
          if (deadAllKeys.has(k.toLowerCase())) delete mergedDietPlans[k];
        }

        const rawClients = incomingData.clients || existingState.clients || [];
        const filteredClients = rawClients.filter((c: any) => {
          const keys = [c.id, c.loginId, c.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
          return !keys.some((k) => deadAllKeys.has(k));
        });

        const rawTrainers = incomingData.trainers || existingState.trainers || [];
        const filteredTrainers = rawTrainers.filter((t: any) => {
          const keys = [t.id, t.loginId, t.email].filter(Boolean).map(String).map((v) => v.toLowerCase());
          return !keys.some((k) => deadAllKeys.has(k));
        });

        mergedPayload = {
          clients: filteredClients,
          trainers: filteredTrainers,
          deletedClientIds: uniqueClientTombstones,
          deletedTrainerIds: uniqueTrainerTombstones,
          assignedWorkouts: mergedWorkouts,
          assignedDietPlans: mergedDietPlans,
          workoutHistory: (incomingData.workoutHistory || existingState.workoutHistory || []).filter((w: any) => !deadAllKeys.has(String(w?.clientId || '').toLowerCase())),
          loggedMeals: (incomingData.loggedMeals || existingState.loggedMeals || []).filter((m: any) => !deadAllKeys.has(String(m?.clientId || '').toLowerCase())),
          weightHistory: (incomingData.weightHistory || existingState.weightHistory || []).filter((w: any) => !deadAllKeys.has(String(w?.clientId || '').toLowerCase())),
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

      const nextVersion = (existingRow?.version ? Number(existingRow.version) : 1) + 1;
      try {
        await env.DB.prepare(`
          INSERT INTO gym_sync_state (id, data, updated_at, version)
          VALUES ('master', ?, datetime('now'), ?)
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            version = COALESCE(gym_sync_state.version, 1) + 1,
            updated_at = datetime('now');
        `).bind(JSON.stringify({ data: mergedPayload }), nextVersion).run();
      } catch {
        await env.DB.prepare(`
          INSERT INTO gym_sync_state (id, data, updated_at)
          VALUES ('master', ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = datetime('now');
        `).bind(JSON.stringify({ data: mergedPayload })).run();
      }

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

      // Synchronize client biometrics to gym_users table in D1 when CLIENT updates profile/onboarding
      if (session.role === 'CLIENT') {
        try {
          const clientList = Array.isArray(mergedPayload.clients) ? mergedPayload.clients : [];
          const ownId = session.user_id || '';
          const myClient = clientList.find((c: any) =>
            (c.id && c.id === ownId) ||
            (c.loginId && session.login_id && c.loginId.toLowerCase() === session.login_id.toLowerCase()) ||
            (c.email && session.email && c.email.toLowerCase() === session.email.toLowerCase())
          );
          if (myClient) {
            await env.DB.prepare(`
              UPDATE gym_users
              SET starting_weight_kg = COALESCE(?, starting_weight_kg),
                  current_weight_kg = COALESCE(?, current_weight_kg),
                  goal_weight_kg = COALESCE(?, goal_weight_kg),
                  height_cm = COALESCE(?, height_cm),
                  goal = COALESCE(?, goal),
                  updated_at = datetime('now')
              WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
            `).bind(
              myClient.startingWeightKg || null,
              myClient.currentWeightKg || null,
              myClient.goalWeightKg || null,
              myClient.heightCm || null,
              myClient.goal || null,
              ownId,
              session.login_id || ''
            ).run();
          }
        } catch (clientSyncErr) {
          console.error('Failed to sync client biometrics to gym_users:', clientSyncErr);
        }
      }

      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
      return new Response(JSON.stringify({
        success: true,
        version: nextVersion,
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
