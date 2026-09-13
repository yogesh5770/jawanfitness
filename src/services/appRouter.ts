/**
 * JAWAN FITNESS - HOST & ROUTE DISPATCHER
 * 
 * Supports both:
 * 1. Subdomain multi-tenant routing:
 *    - admin.jawanfitness.com / *-admin.* -> 'admin'
 *    - trainer.jawanfitness.com / *-trainer.* -> 'trainer'
 *    - app.jawanfitness.com / *-app.* -> 'client'
 * 
 * 2. Path / Hash routing (for local dev, preview domains, and subpaths):
 *    - /admin or /#admin -> 'admin'
 *    - /trainer or /#trainer -> 'trainer'
 *    - /dev-sync or /#sync -> 'dev-sync'
 *    - / or /client or /#client -> 'client'
 * 
 * 3. Native Capacitor Android APK:
 *    - Always locks directly into 'client' mobile app experience.
 */

import { Capacitor } from '@capacitor/core';

export type AppRoleMode = 'admin' | 'trainer' | 'client' | 'dev-sync';

export function detectAppRole(): AppRoleMode {
  // 1. Android APK or iOS Native Wrapper: Always Client
  if (Capacitor.isNativePlatform()) {
    return 'client';
  }

  // 2. Build-time environment variable override (e.g. Vercel deployment variable)
  const envRole = (import.meta as any).env?.VITE_APP_ROLE;
  if (envRole === 'admin' || envRole === 'trainer' || envRole === 'client' || envRole === 'dev-sync') {
    return envRole;
  }

  // 3. Domain and Subdomain-based routing
  const hostname = window.location.hostname.toLowerCase();
  if (
    hostname.includes('jawanfitnessadmin') ||
    hostname.startsWith('admin.') ||
    hostname.includes('-admin') ||
    hostname.includes('admin')
  ) {
    return 'admin';
  }
  if (
    hostname.includes('jawanfitnesstrainer') ||
    hostname.startsWith('trainer.') ||
    hostname.includes('-trainer') ||
    hostname.includes('trainer')
  ) {
    return 'trainer';
  }
  if (
    hostname.includes('jawanfitnessapp') ||
    hostname.startsWith('app.') ||
    hostname.includes('-app')
  ) {
    return 'client';
  }

  // 4. Path-based routing (e.g. /admin, /trainer, /client, /dev-sync)
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }
  if (pathname.startsWith('/trainer')) {
    return 'trainer';
  }
  if (pathname.startsWith('/dev-sync') || pathname.startsWith('/sync')) {
    return 'dev-sync';
  }
  if (pathname.startsWith('/client') || pathname.startsWith('/app')) {
    return 'client';
  }

  // 5. Hash-based routing fallback (e.g. /#admin, /#trainer, /#sync)
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('admin')) {
    return 'admin';
  }
  if (hash.includes('trainer')) {
    return 'trainer';
  }
  if (hash.includes('sync') || hash.includes('dev')) {
    return 'dev-sync';
  }
  if (hash.includes('client')) {
    return 'client';
  }

  // Default to Client Mobile App Experience
  return 'client';
}

export function navigateToRole(role: AppRoleMode) {
  if (role === 'admin') {
    window.location.hash = '#admin';
  } else if (role === 'trainer') {
    window.location.hash = '#trainer';
  } else if (role === 'dev-sync') {
    window.location.hash = '#sync';
  } else {
    window.location.hash = '#client';
  }
  window.dispatchEvent(new Event('hashchange'));
}
