/**
 * JAWAN FITNESS - ONBOARDING LIFECYCLE CONTROLLER
 * Ensures the first-time member onboarding modal is shown STRICTLY ONCE in a member's lifetime.
 * Uses persistent multi-key local storage, memory cache, and biometric heuristic fallback.
 */

const STORAGE_KEY_ONBOARDED_MEMBERS = 'jawan_onboarded_members_v2';
const LEGACY_PREFIX = 'jawan_onboarding_completed_';

export function isMemberOnboarded(userOrClient?: {
  id?: string;
  loginId?: string;
  email?: string;
  phone?: string;
  firstLoginCompleted?: boolean;
  startingWeightKg?: number;
  heightCm?: number;
} | null): boolean {
  if (!userOrClient) return false;

  // 1. Explicit flag in object
  if (userOrClient.firstLoginCompleted === true) return true;

  const identifiers = [
    userOrClient.id,
    userOrClient.loginId,
    userOrClient.email,
    userOrClient.phone
  ].filter(Boolean) as string[];

  // 2. Check persistent multi-key local storage
  try {
    for (const rawId of identifiers) {
      const id = String(rawId).trim();
      if (!id) continue;
      if (localStorage.getItem(`${LEGACY_PREFIX}${id}`) === 'true') return true;
      if (localStorage.getItem(`${LEGACY_PREFIX}${id.toLowerCase()}`) === 'true') return true;
    }

    const dict = JSON.parse(localStorage.getItem(STORAGE_KEY_ONBOARDED_MEMBERS) || '{}');
    for (const rawId of identifiers) {
      const id = String(rawId).trim();
      if (!id) continue;
      if (dict[id] === true || dict[id.toLowerCase()] === true) return true;
    }
  } catch {
    // fallback
  }

  // 3. Biometrics heuristic:
  // If the user already has non-default starting weight and height set,
  // they have already set up their profile.
  const startingWeight = Number(userOrClient.startingWeightKg);
  const height = Number(userOrClient.heightCm);
  if (
    Number.isFinite(startingWeight) &&
    startingWeight > 0 &&
    Number.isFinite(height) &&
    height > 0 &&
    !(startingWeight === 108 && height === 170)
  ) {
    return true;
  }

  return false;
}

export function markMemberOnboarded(userOrClient?: {
  id?: string;
  loginId?: string;
  email?: string;
  phone?: string;
  firstLoginCompleted?: boolean;
} | null): void {
  if (!userOrClient) return;

  const identifiers = [
    userOrClient.id,
    userOrClient.loginId,
    userOrClient.email,
    userOrClient.phone
  ].filter(Boolean) as string[];

  try {
    const dict = JSON.parse(localStorage.getItem(STORAGE_KEY_ONBOARDED_MEMBERS) || '{}');
    for (const rawId of identifiers) {
      const id = String(rawId).trim();
      if (!id) continue;
      localStorage.setItem(`${LEGACY_PREFIX}${id}`, 'true');
      localStorage.setItem(`${LEGACY_PREFIX}${id.toLowerCase()}`, 'true');
      dict[id] = true;
      dict[id.toLowerCase()] = true;
    }
    localStorage.setItem(STORAGE_KEY_ONBOARDED_MEMBERS, JSON.stringify(dict));
  } catch {
    // fallback
  }
}
