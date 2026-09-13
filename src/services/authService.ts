/**
 * JAWAN FITNESS - ENTERPRISE AUTHENTICATION SERVICE
 * Backed by Supabase PostgreSQL database and verified server-side.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TRAINER' | 'CLIENT';
  loginId?: string;
  phone?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

const STORAGE_TOKEN_KEY = 'jawan_auth_session_token_v1';
const STORAGE_USER_KEY = 'jawan_auth_user_v1';

// Base API endpoints (local serverless route or remote admin domain for PWA/APK)
const PRIMARY_AUTH_URL = '/api/auth';
const REMOTE_AUTH_URL = 'https://jawan-fitness-admin.vercel.app/api/auth';

async function parseJsonResponse(res: Response | null): Promise<{ data: any; error?: string }> {
  if (!res) return { data: null, error: 'Network error: server unreachable.' };
  try {
    const text = await res.text();
    const parsed = text ? JSON.parse(text) : {};
    return { data: parsed };
  } catch {
    return { data: null, error: `Authentication server returned status ${res.status}.` };
  }
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
      let res = await fetch(`${PRIMARY_AUTH_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (!res || !res.ok) {
        // Fallback to remote admin host for Trainer/Client domains
        const fallbackRes = await fetch(`${REMOTE_AUTH_URL}?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      if (!res) {
        return { success: false, error: 'Network error: could not contact auth server.' };
      }

      const { data, error: parseError } = await parseJsonResponse(res);
      if (parseError) {
        return { success: false, error: parseError };
      }

      if (!res.ok || data?.error) {
        return { success: false, error: data?.error || 'Authentication failed.' };
      }

      // Save verified session
      this.currentSession = {
        token: data.token,
        expiresAt: data.expiresAt,
        user: data.user
      };

      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      } catch {
        // fallback
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication error.' };
    }
  }

  public async createPortalUser(input: {
    email: string;
    password: string;
    name: string;
    role: 'TRAINER' | 'CLIENT';
    phone?: string;
    loginId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Admin session token missing.' };
    }

    try {
      let res = await fetch(`${PRIMARY_AUTH_URL}?action=create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(input)
      }).catch(() => null);

      if (!res || !res.ok) {
        const fallbackRes = await fetch(`${REMOTE_AUTH_URL}?action=create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(input)
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      if (!res) {
        return { success: false, error: 'Network error: could not contact auth server.' };
      }

      const { data, error: parseError } = await parseJsonResponse(res);
      if (parseError) {
        return { success: false, error: parseError };
      }

      if (!res.ok || data?.error) {
        return { success: false, error: data?.error || 'Could not create portal user.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Portal user creation failed.' };
    }
  }

  /**
   * Verify current session token with backend
   */
  public async verifySession(): Promise<boolean> {
    const token = this.currentSession?.token || localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token) return false;

    try {
      let res = await fetch(`${PRIMARY_AUTH_URL}?action=verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      }).catch(() => null);

      if (!res || !res.ok) {
        const fallbackRes = await fetch(`${REMOTE_AUTH_URL}?action=verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      if (res && res.ok) {
        const { data } = await parseJsonResponse(res);
        if (data && data.valid && data.user) {
          this.currentSession = {
            token,
            expiresAt: data.expiresAt,
            user: data.user
          };
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
          return true;
        }
      }

      // If token invalid, clear local session
      this.logout();
      return false;
    } catch {
      // In offline mode, preserve local session if present
      return !!this.currentSession;
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
    } catch {
      // fallback
    }

    if (token) {
      try {
        fetch(`${PRIMARY_AUTH_URL}?action=logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }).catch(() => null);
      } catch {
        // ignore
      }
    }
  }
}

export const authService = new AuthService();
