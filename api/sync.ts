import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerToken, getDbPool, verifySessionToken } from './db.js';

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const defaultOrigins = [
    'http://localhost:5173',
    'https://localhost',
    'capacitor://localhost',
    'https://jawan-fitness.pages.dev',
    'https://jawan-fitness-admin.vercel.app',
    'https://jawan-fitness-trainer.vercel.app',
    'https://jawan-fitness-app.vercel.app',
    'https://jawan-fitness-admin.pages.dev',
    'https://jawan-fitness-trainer.pages.dev',
    'https://jawan-fitness-app.pages.dev'
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

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TRAINER' | 'CLIENT';
  phone: string | null;
  loginId: string | null;
};

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

function sameUser(record: { id?: string; email?: string; loginId?: string; phone?: string } | null | undefined, user: SessionUser): boolean {
  if (!record) return false;
  const uid = (user.id || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  const loginId = (user.loginId || '').toLowerCase();
  const phoneDigits = (user.phone || '').replace(/\D/g, '');
  if (record.id && uid && record.id.toLowerCase() === uid) return true;
  if (record.email && email && record.email.toLowerCase() === email) return true;
  if (record.loginId && loginId && record.loginId.toLowerCase() === loginId) return true;
  if (phoneDigits.length >= 10 && record.phone && record.phone.replace(/\D/g, '').endsWith(phoneDigits.slice(-10))) return true;
  return false;
}

function identityKeys(user: SessionUser, ownBlobRecord: { id?: string; loginId?: string; email?: string } | null): Set<string> {
  const keys = new Set<string>();
  const add = (v?: string | null) => { if (v) keys.add(String(v).toLowerCase()); };
  add(user.id);
  add(user.email);
  add(user.loginId);
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

function scopeStateForRole(inner: any, user: SessionUser): any {
  inner.clients = stripSecrets(inner.clients);
  inner.trainers = stripSecrets(inner.trainers);

  if (user.role === 'ADMIN') return inner;

  const clients: any[] = Array.isArray(inner.clients) ? inner.clients : [];
  const trainers: any[] = Array.isArray(inner.trainers) ? inner.trainers : [];

  if (user.role === 'CLIENT') {
    const own = clients.find((c) => sameUser(c, user)) || null;
    const keys = identityKeys(user, own);
    const ownId = own?.id || user.id;

    const scopedTrainers = own?.trainerId
      ? trainers.filter((t) => t.id === own.trainerId || sameUser(t, user))
      : trainers.filter((t) => sameUser(t, user));

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

  // TRAINER
  const self = trainers.find((t) => sameUser(t, user)) || null;
  const keys = identityKeys(user, self);
  const trainerIds = new Set<string>();
  if (user.id) trainerIds.add(user.id);
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
    trainers: self ? [self] : trainers.filter((t) => sameUser(t, user)),
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

function unionById<T extends { id?: string }>(existing: T[] | undefined, incoming: T[] | undefined): T[] {
  const map = new Map<string, T>();
  for (const e of existing || []) if (e?.id) map.set(e.id, e);
  for (const e of incoming || []) if (e?.id) map.set(e.id, e);
  return Array.from(map.values());
}

function mergeNonAdminPost(incoming: any, existingState: any, user: SessionUser): any {
  const clients: any[] = Array.isArray(existingState.clients) ? existingState.clients : [];
  const trainers: any[] = Array.isArray(existingState.trainers) ? existingState.trainers : [];

  if (user.role === 'CLIENT') {
    const own = clients.find((c) => sameUser(c, user)) || null;
    const ownId = own?.id || user.id;

    const stamp = <T extends { id?: string; clientId?: string }>(arr: T[] | undefined): T[] =>
      (Array.isArray(arr) ? arr : []).map((e) => (e && !e.clientId ? { ...e, clientId: ownId } : e));

    const ownRecord = Array.isArray(incoming.clients)
      ? incoming.clients.find((c: any) => sameUser(c, user))
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
              firstLoginCompleted: ownRecord.firstLoginCompleted ?? c.firstLoginCompleted
            }
          : c
      );
    }

    const msgMap = new Map<string, any>();
    for (const m of existingState.messages || []) if (m?.id) msgMap.set(m.id, m);
    for (const m of stamp(incoming.messages)) {
      if (m?.id) msgMap.set(m.id, { ...m, clientId: m.clientId || ownId });
    }

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
  const self = trainers.find((t) => sameUser(t, user)) || null;
  const trainerIds = new Set<string>();
  if (user.id) trainerIds.add(user.id);
  if (self?.id) trainerIds.add(self.id);
  const myClients = clients.filter((c) => c?.trainerId && trainerIds.has(c.trainerId));
  const myClientIds = new Set(myClients.map((c) => c.id).filter(Boolean));
  const myClientKeys = new Set(myClients.flatMap((c) => [c.id, c.loginId, c.email].filter(Boolean).map((v) => String(v).toLowerCase())));

  const scopedWorkouts = { ...(existingState.assignedWorkouts || {}) };
  for (const [k, v] of Object.entries(incoming.assignedWorkouts || {})) {
    if (v && keyMatches(k, myClientKeys)) scopedWorkouts[k] = v;
  }
  const scopedDiets = { ...(existingState.assignedDietPlans || {}) };
  for (const [k, v] of Object.entries(incoming.assignedDietPlans || {})) {
    if (v && keyMatches(k, myClientKeys)) scopedDiets[k] = v;
  }

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
    const user = session.user as SessionUser;

    if (req.method === 'GET') {
      const result = await client.query('SELECT data, updated_at FROM gym_sync_state WHERE id = $1', ['master']);
      if (result.rows.length > 0) {
        let data = result.rows[0].data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch { /* keep */ }
        }
        let inner = data?.data ? data.data : data || {};
        if (!inner || typeof inner !== 'object') inner = {};
        return res.status(200).json({
          status: 'ok',
          source: 'supabase-postgresql',
          data: scopeStateForRole(inner, user),
          updated_at: result.rows[0].updated_at
        });
      }
      return res.status(200).json({
        status: 'ok',
        source: 'supabase-postgresql',
        data: { clients: [], trainers: [] }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let incoming = body?.data || body;
      if (!incoming || typeof incoming !== 'object') incoming = {};

      const existingRes = await client.query('SELECT data FROM gym_sync_state WHERE id = $1', ['master']);
      let existingState: any = {};
      if (existingRes.rows.length > 0) {
        let ed = existingRes.rows[0].data;
        if (typeof ed === 'string') {
          try { ed = JSON.parse(ed); } catch { /* keep */ }
        }
        existingState = ed?.data || ed || {};
      }

      let merged: any;
      if (user.role === 'ADMIN') {
        if ((!incoming.trainers || incoming.trainers.length === 0) && existingState.trainers?.length > 0) {
          incoming.trainers = existingState.trainers;
        }
        if ((!incoming.clients || incoming.clients.length === 0) && existingState.clients?.length > 0) {
          incoming.clients = existingState.clients;
        }
        const msgMap = new Map<string, any>();
        for (const m of existingState.messages || []) if (m?.id) msgMap.set(m.id, m);
        for (const m of incoming.messages || []) if (m?.id) msgMap.set(m.id, m);
        merged = {
          clients: incoming.clients || existingState.clients || [],
          trainers: incoming.trainers || existingState.trainers || [],
          assignedWorkouts: { ...(existingState.assignedWorkouts || {}), ...(incoming.assignedWorkouts || {}) },
          assignedDietPlans: { ...(existingState.assignedDietPlans || {}), ...(incoming.assignedDietPlans || {}) },
          workoutHistory: incoming.workoutHistory || existingState.workoutHistory || [],
          loggedMeals: incoming.loggedMeals || existingState.loggedMeals || [],
          weightHistory: incoming.weightHistory || existingState.weightHistory || [],
          events: incoming.events || existingState.events || [],
          messages: Array.from(msgMap.values()).sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)),
          customFoods: incoming.customFoods || existingState.customFoods || [],
          dailyWaterLog: incoming.dailyWaterLog || existingState.dailyWaterLog || {}
        };
      } else {
        merged = mergeNonAdminPost(incoming, existingState, user);
      }

      merged.clients = stripSecrets(merged.clients);
      merged.trainers = stripSecrets(merged.trainers);

      await client.query(
        `INSERT INTO gym_sync_state (id, data, updated_at)
         VALUES ('master', $1, now())
         ON CONFLICT (id) DO UPDATE
         SET data = $1, updated_at = now()
         RETURNING updated_at;`,
        [JSON.stringify(merged)]
      );

      return res.status(200).json({
        status: 'ok',
        source: 'supabase-postgresql'
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
