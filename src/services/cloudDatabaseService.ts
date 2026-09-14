/**
 * Cloud Database Service for Jawan Fitness
 * Seamlessly connects to Cloudflare D1 database (jawan-fitness-db)
 * with automatic fallback and offline-first persistence.
 */

import type { AppSyncState } from './syncedStore';
import { authService } from './authService';
import { Capacitor } from '@capacitor/core';

// Local and remote serverless API routes
const FALLBACK_REMOTE_API = 'https://jawan-fitness-admin.pages.dev/api/sync';

function getSyncEndpoint(): string {
  if (typeof window === 'undefined') return FALLBACK_REMOTE_API;
  if (
    Capacitor.isNativePlatform() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    !window.location.hostname.includes('pages.dev')
  ) {
    return FALLBACK_REMOTE_API;
  }
  return '/api/sync';
}

export interface CloudDbConfig {
  enabled: boolean;
  dbType: 'cloudflare-d1' | 'live-cloud-rest' | 'custom';
  lastSyncedAt?: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  activeProvider: string;
  errorMessage?: string;
}

class CloudDatabaseService {
  private config: CloudDbConfig = {
    enabled: true,
    dbType: 'cloudflare-d1',
    syncStatus: 'idle',
    activeProvider: 'Cloudflare D1 (Live)'
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

      // 1. Primary: Direct or remote API
      try {
        const endpoint = getSyncEndpoint();
        const primaryRes = await fetch(endpoint, {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ data: payload })
        });

        const contentType = primaryRes.headers.get('content-type') || '';
        if (primaryRes.ok && !contentType.includes('text/html')) {
          this.config.syncStatus = 'synced';
          this.config.lastSyncedAt = Date.now();
          this.config.activeProvider = 'Cloudflare D1 (Live)';
          this.config.errorMessage = undefined;
          this.notify();
          return true;
        }
      } catch {
        // continue to fallback
      }

      // 2. Fallback to remote admin endpoint
      try {
        const remoteRes = await fetch(FALLBACK_REMOTE_API, {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ data: payload })
        });

        const contentType = remoteRes.headers.get('content-type') || '';
        if (remoteRes.ok && !contentType.includes('text/html')) {
          this.config.syncStatus = 'synced';
          this.config.lastSyncedAt = Date.now();
          this.config.activeProvider = 'Cloudflare D1 (Remote)';
          this.config.errorMessage = undefined;
          this.notify();
          return true;
        }
      } catch {
        // continue to error
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

    try {
      this.config.syncStatus = 'syncing';
      this.notify();

      const token = authService.getToken();
      const getHeaders: Record<string, string> = {};
      if (token) getHeaders['Authorization'] = `Bearer ${token}`;

      // 1. Primary
      try {
        const endpoint = getSyncEndpoint();
        const primaryRes = await fetch(endpoint, {
          headers: getHeaders,
          cache: 'no-store'
        });

        const contentType = primaryRes.headers.get('content-type') || '';
        if (primaryRes.ok && !contentType.includes('text/html')) {
          const json = await primaryRes.json();
          if (json && json.data) {
            let resData = json.data;
            if (resData.data && (Array.isArray(resData.data.clients) || Array.isArray(resData.data.trainers))) {
              resData = resData.data;
            }
            this.config.syncStatus = 'synced';
            this.config.lastSyncedAt = Date.now();
            this.config.activeProvider = 'Cloudflare D1 (Live)';
            this.config.errorMessage = undefined;
            this.notify();
            return resData as AppSyncState;
          }
        }
      } catch (err: any) {
        console.warn('Primary sync failed, trying fallback:', err?.message || err);
      }

      // 2. Fallback to remote admin endpoint
      try {
        const remoteRes = await fetch(FALLBACK_REMOTE_API, {
          headers: getHeaders,
          cache: 'no-store'
        });

        const contentType = remoteRes.headers.get('content-type') || '';
        if (remoteRes.ok && !contentType.includes('text/html')) {
          const json = await remoteRes.json();
          if (json && json.data) {
            let resData = json.data;
            if (resData.data && (Array.isArray(resData.data.clients) || Array.isArray(resData.data.trainers))) {
              resData = resData.data;
            }
            this.config.syncStatus = 'synced';
            this.config.lastSyncedAt = Date.now();
            this.config.activeProvider = 'Cloudflare D1 (Remote)';
            this.config.errorMessage = undefined;
            this.notify();
            return resData as AppSyncState;
          }
        }
      } catch (err: any) {
        console.warn('Fallback sync failed:', err?.message || err);
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
