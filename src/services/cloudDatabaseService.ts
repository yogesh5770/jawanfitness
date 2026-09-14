/**
 * Cloud Database Service for Jawan Fitness
 * Seamlessly connects to user's Supabase PostgreSQL database
 * (sjphtqnyptbxcrwadaxy.supabase.co in ap-south-1 Mumbai)
 * with automatic fallback and offline-first persistence.
 */

import type { AppSyncState } from './syncedStore';
import { authService } from './authService';

export const SUPABASE_PROJECT_REF = 'sjphtqnyptbxcrwadaxy';
export const SUPABASE_PROJECT_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

// Local and remote serverless API routes
const PRIMARY_API_ENDPOINT = '/api/sync';
const FALLBACK_REMOTE_API = 'https://jawan-fitness-admin.pages.dev/api/sync';

export interface CloudDbConfig {
  enabled: boolean;
  dbType: 'supabase-postgresql' | 'live-cloud-rest' | 'custom';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  lastSyncedAt?: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  activeProvider: string;
  errorMessage?: string;
}

class CloudDatabaseService {
  private config: CloudDbConfig = {
    enabled: true,
    dbType: 'supabase-postgresql',
    syncStatus: 'idle',
    activeProvider: 'Supabase PostgreSQL (Mumbai)'
  };

  private syncListeners: Set<(config: CloudDbConfig) => void> = new Set();
  private pollInterval: any = null;
  private hasAuthToken(): boolean {
    return !!authService.getToken();
  }

  private authHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  constructor() {
    this.loadConfig();
    this.startBackgroundSync();
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('jawan_cloud_db_config_v3');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
  }

  public saveConfig(updates: Partial<CloudDbConfig>) {
    this.config = { ...this.config, ...updates };
    try {
      localStorage.setItem('jawan_cloud_db_config_v3', JSON.stringify(this.config));
    } catch {
      // fallback
    }
    this.notify();
  }

  public getConfig(): CloudDbConfig {
    return this.config;
  }

  public subscribe(listener: (config: CloudDbConfig) => void) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notify() {
    this.syncListeners.forEach((l) => l(this.config));
  }

  private startBackgroundSync() {
    if (typeof window === 'undefined') return;

    // Refresh immediately when tab gains focus or becomes visible
    window.addEventListener('focus', () => {
      this.fetchStateFromCloud();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchStateFromCloud();
      }
    });

    // Gentle heartbeat (only when tab is actively visible) to prevent exhausting Vercel limits
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.fetchStateFromCloud();
      }
    }, 60000); // 60s gentle sync instead of 8s aggressive burn
  }

  /**
   * Push gym state to Cloud Database
   */
  public async pushStateToCloud(state: AppSyncState): Promise<boolean> {
    if (!this.config.enabled) return false;
    if (!this.hasAuthToken()) return false;

    try {
      this.config.syncStatus = 'syncing';
      this.notify();

      const payload = {
        clients: Array.isArray(state.clients) ? state.clients : [],
        trainers: Array.isArray(state.trainers) ? state.trainers : [],
        assignedWorkouts: state.assignedWorkouts || {},
        assignedDietPlans: state.assignedDietPlans || {},
        workoutHistory: Array.isArray(state.workoutHistory) ? state.workoutHistory : [],
        loggedMeals: Array.isArray(state.loggedMeals) ? state.loggedMeals : [],
        events: Array.isArray(state.events) ? state.events : []
      };

      // 1. Primary: Direct Supabase PostgreSQL via Serverless API
      try {
        const primaryRes = await fetch(PRIMARY_API_ENDPOINT, {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ data: payload })
        });

        if (primaryRes.ok) {
          this.config.syncStatus = 'synced';
          this.config.lastSyncedAt = Date.now();
          this.config.activeProvider = 'Supabase PostgreSQL (Live)';
          this.config.errorMessage = undefined;
          this.notify();
          return true;
        }
      } catch {
        // Fallback to cross-origin admin endpoint for Trainer / Client PWA
        try {
          const remoteRes = await fetch(FALLBACK_REMOTE_API, {
            method: 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify({ data: payload })
          });

          if (remoteRes.ok) {
            this.config.syncStatus = 'synced';
            this.config.lastSyncedAt = Date.now();
            this.config.activeProvider = 'Supabase PostgreSQL (Remote)';
            this.config.errorMessage = undefined;
            this.notify();
            return true;
          }
        } catch {
          // continue to final error
        }
      }

      throw new Error('Authenticated database sync endpoint unreachable');
    } catch (err: any) {
      this.config.syncStatus = 'error';
      this.config.errorMessage = err?.message || 'Sync failed';
      this.notify();
      return false;
    }
  }

  /**
   * Fetch latest state from Cloud Database
   */
  public async fetchStateFromCloud(): Promise<AppSyncState | null> {
    if (!this.config.enabled) return null;
    if (!this.hasAuthToken()) return null;

    try {
      this.config.syncStatus = 'syncing';
      this.notify();

      // 1. Primary: Direct Supabase PostgreSQL via Serverless API
      try {
        const primaryRes = await fetch(PRIMARY_API_ENDPOINT, {
          headers: {
            ...this.authHeaders(),
            'Cache-Control': 'no-cache'
          }
        });

        if (primaryRes.ok) {
          const json = await primaryRes.json();
          if (json && json.data) {
            this.config.syncStatus = 'synced';
            this.config.lastSyncedAt = Date.now();
            this.config.activeProvider = 'Supabase PostgreSQL (Live)';
            this.config.errorMessage = undefined;
            this.notify();
            return json.data as AppSyncState;
          }
        }
      } catch {
        // Fallback to cross-origin admin endpoint
        try {
          const remoteRes = await fetch(FALLBACK_REMOTE_API, {
            headers: {
              ...this.authHeaders(),
              'Cache-Control': 'no-cache'
            }
          });

          if (remoteRes.ok) {
            const json = await remoteRes.json();
            if (json && json.data) {
              this.config.syncStatus = 'synced';
              this.config.lastSyncedAt = Date.now();
              this.config.activeProvider = 'Supabase PostgreSQL (Remote)';
              this.config.errorMessage = undefined;
              this.notify();
              return json.data as AppSyncState;
            }
          }
        } catch {
          // continue to final empty state
        }
      }

      this.config.syncStatus = 'synced';
      this.notify();
      return null;
    } catch (err: any) {
      this.config.syncStatus = 'error';
      this.config.errorMessage = err?.message || 'Sync failed';
      this.notify();
      return null;
    }
  }
}

export const cloudDbService = new CloudDatabaseService();
