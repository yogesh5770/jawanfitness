/**
 * JAWAN FITNESS - ENTERPRISE AUTHENTICATION SERVICE
 * Backed by Cloudflare D1 database and verified server-side with PBKDF2 Web Crypto.
 */

import { Capacitor } from '@capacitor/core';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TRAINER' | 'CLIENT';
  loginId?: string;
  phone?: string;
  startingWeightKg?: number;
  currentWeightKg?: number;
  goalWeightKg?: number;
  heightCm?: number;
  goal?: string;
  trainerId?: string;
  trainerName?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

const STORAGE_TOKEN_KEY = 'jawan_auth_session_token_v1';
const STORAGE_USER_KEY = 'jawan_auth_user_v1';

// Base API endpoints (local serverless route or remote admin domain for PWA/APK)
const REMOTE_AUTH_URL = 'https://jawan-fitness-admin.pages.dev/api/auth';

function getPrimaryAuthUrl(): string {
  if (typeof window === 'undefined') return REMOTE_AUTH_URL;
  // If running in Capacitor native Android/iOS app or local development or non-pages domain:
  if (
    Capacitor.isNativePlatform() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    !window.location.hostname.includes('pages.dev')
  ) {
    return REMOTE_AUTH_URL;
  }
  return '/api/auth';
}

async function safeApiCall(
  action: string,
  options: {
    method?: string;
    body?: any;
    token?: string | null;
  } = {}
): Promise<{ data: any; error?: string }> {
  const { method = 'POST', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const primaryUrl = `${getPrimaryAuthUrl()}?action=${action}`;
  const remoteUrl = `${REMOTE_AUTH_URL}?action=${action}`;

  async function tryFetch(url: string) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      // If server returned single-page-app HTML index file instead of JSON
      if (
        contentType.includes('text/html') ||
        text.trim().startsWith('<!DOCTYPE') ||
        text.trim().startsWith('<html')
      ) {
        return { ok: false, isHtml: true, status: res.status, data: null };
      }

      let data: any = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return { ok: false, isHtml: false, status: res.status, data: null, parseError: true };
      }

      return { ok: res.ok, isHtml: false, status: res.status, data };
    } catch {
      return { ok: false, isHtml: false, status: 0, data: null, networkError: true };
    }
  }

  // 1. Try primary endpoint
  let result = await tryFetch(primaryUrl);

  // 2. If primary returned HTML (e.g. Capacitor WebView SPA fallback) or failed, try remote admin endpoint
  if ((!result.ok || result.isHtml || result.parseError || result.networkError) && primaryUrl !== remoteUrl) {
    const fallbackResult = await tryFetch(remoteUrl);
    if (fallbackResult.data || fallbackResult.ok) {
      result = fallbackResult;
    }
  }

  if (result.data) {
    if (result.data.error) {
      return { data: null, error: result.data.error };
    }
    return { data: result.data };
  }

  if (result.networkError) {
    return { data: null, error: 'Network error: auth server unreachable. Please check internet connection.' };
  }

  return { data: null, error: `Authentication failed (status ${result.status}).` };
}

class AuthService {
  private currentSession: AuthSession | null = null;

  constructor() {
    this.restoreLocalSession();
  }

  private restoreLocalSession() {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      const userStr = localStorage.getItem(STORAGE_USER_KEY);
      if (token && userStr) {
        this.currentSession = {
          token,
          expiresAt: '',
          user: JSON.parse(userStr)
        };
      }
    } catch {
      // fallback
    }
  }

  public getSession(): AuthSession | null {
    return this.currentSession;
  }

  public getUser(): AuthUser | null {
    return this.currentSession?.user || null;
  }

  public getToken(): string | null {
    return this.currentSession?.token || localStorage.getItem(STORAGE_TOKEN_KEY);
  }

  public isAuthenticated(requiredRole?: 'ADMIN' | 'TRAINER' | 'CLIENT'): boolean {
    if (!this.currentSession) return false;
    if (requiredRole && this.currentSession.user.role !== requiredRole) return false;
    return true;
  }

  /**
   * Log in against backend database
   */
  public async login(
    email: string,
    pass: string,
    requiredRole: 'ADMIN' | 'TRAINER' | 'CLIENT' = 'ADMIN',
    keepSignedIn: boolean = true
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const payload = {
      action: 'login',
      email: email.trim(),
      password: pass,
      requiredRole,
      keepSignedIn
    };

    try {
      const { data, error } = await safeApiCall('login', {
        method: 'POST',
        body: payload
      });

      if (error || !data) {
        return { success: false, error: error || 'Authentication failed.' };
      }

      // Normalize login_id → loginId and biometrics for client-side compatibility
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        phone: data.user.phone,
        loginId: data.user.loginId || data.user.login_id || undefined,
        startingWeightKg: data.user.startingWeightKg ?? data.user.starting_weight_kg ?? undefined,
        currentWeightKg: data.user.currentWeightKg ?? data.user.current_weight_kg ?? undefined,
        goalWeightKg: data.user.goalWeightKg ?? data.user.goal_weight_kg ?? undefined,
        heightCm: data.user.heightCm ?? data.user.height_cm ?? undefined,
        goal: data.user.goal ?? undefined,
        trainerId: data.user.trainerId ?? data.user.trainer_id ?? undefined,
        trainerName: data.user.trainerName ?? data.user.trainer_name ?? undefined
      };

      // Save verified session
      this.currentSession = {
        token: data.token,
        expiresAt: data.expiresAt || '',
        user
      };

      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      } catch {
        // fallback
      }

      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication error.' };
    }
  }

  public async createPortalUser(input: {
    id?: string;
    email: string;
    password: string;
    name: string;
    role: 'TRAINER' | 'CLIENT';
    phone?: string;
    loginId?: string;
    startingWeightKg?: number;
    currentWeightKg?: number;
    goalWeightKg?: number;
    heightCm?: number;
    goal?: string;
    trainerId?: string;
    trainerName?: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Admin session token missing.' };
    }

    try {
      const { data, error } = await safeApiCall('create-user', {
        method: 'POST',
        body: input,
        token
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, user: data?.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Portal user creation failed.' };
    }
  }

  /**
   * Verify current session token with backend
   */
  public async verifySession(): Promise<boolean> {
    const token = this.currentSession?.token || localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token && !this.currentSession && !localStorage.getItem(STORAGE_USER_KEY)) {
      return false;
    }

    try {
      if (token) {
        const { data } = await safeApiCall('verify', {
          method: 'POST',
          body: { token },
          token
        });

        if (data && data.valid && data.user) {
          const normalizedUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            phone: data.user.phone,
            loginId: data.user.loginId || data.user.login_id || undefined,
            startingWeightKg: data.user.startingWeightKg ?? data.user.starting_weight_kg ?? undefined,
            currentWeightKg: data.user.currentWeightKg ?? data.user.current_weight_kg ?? undefined,
            goalWeightKg: data.user.goalWeightKg ?? data.user.goal_weight_kg ?? undefined,
            heightCm: data.user.heightCm ?? data.user.height_cm ?? undefined,
            goal: data.user.goal ?? undefined,
            trainerId: data.user.trainerId ?? data.user.trainer_id ?? undefined,
            trainerName: data.user.trainerName ?? data.user.trainer_name ?? undefined
          };
          this.currentSession = {
            token,
            expiresAt: data.expiresAt || '',
            user: normalizedUser
          };
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser));
          } catch {
            // fallback
          }
          return true;
        }
      }
    } catch {
      // In offline mode or temporary network disconnect, preserve session
    }

    // PERSISTENCE RULE: NEVER auto-logout on background verify or network error.
    // The user stays logged in until they explicitly tap the Logout button.
    return !!this.currentSession || !!localStorage.getItem(STORAGE_USER_KEY);
  }

  /**
   * Change user password with old password verification
   */
  public async changePassword(
    oldPassword: string,
    newPassword: string,
    identifier?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getToken();
    const payload = {
      action: 'change-password',
      oldPassword,
      newPassword,
      identifier: identifier || this.getUser()?.loginId || this.getUser()?.email,
      token
    };

    try {
      const { data, error } = await safeApiCall('change-password', {
        method: 'POST',
        body: payload,
        token
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, message: data?.message || 'Password changed successfully!' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password change request failed.' };
    }
  }

  /**
   * Revoke session on backend and clear storage
   */
  public async logout(): Promise<void> {
    const token = this.currentSession?.token;
    this.currentSession = null;

    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem('jawan_admin_session_active_v1');
      localStorage.removeItem('jawan_admin_session_active_v2');
      localStorage.removeItem('jawan_trainer_session_id_v1');
      localStorage.removeItem('jawan_active_client_id_v1');
    } catch {
      // fallback
    }

    if (token) {
      try {
        safeApiCall('logout', {
          method: 'POST',
          body: { token },
          token
        }).catch(() => null);
      } catch {
        // ignore
      }
    }
  }
}

export const authService = new AuthService();
