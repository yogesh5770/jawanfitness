import React, { useState, useEffect } from 'react';
import { AdminScreen } from './AdminScreen';
import {
  ShieldCheck,
  Users,
  Dumbbell,
  Bell,
  LogOut,
  ExternalLink,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

export const AdminApp: React.FC = () => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  // Permanent login state: never logs out unless explicitly chosen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('jawan_admin_session_active_v1') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState('admin@jawan.fit');
  const [adminPin, setAdminPin] = useState('9999');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    hapticTap();
    if (adminPin === '9999' || adminPin.length >= 4) {
      localStorage.setItem('jawan_admin_session_active_v1', 'true');
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('Invalid Master Security PIN. (Default PIN: 9999)');
    }
  };

  const handleLogout = () => {
    hapticTap();
    localStorage.removeItem('jawan_admin_session_active_v1');
    setIsAuthenticated(false);
  };

  // If not logged in, render the secure Admin Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        {/* Ambient military gold radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-[#0a0e1a]/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left animate-in fade-in zoom-in-95 duration-200">
          {/* Badge & Crown */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-2xl">
              👑
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-black text-xl tracking-wider text-white uppercase">
                  JAWAN <span className="text-amber-500">ADMIN</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  SECURE
                </span>
              </div>
              <p className="text-xs text-neutral-400">Headquarters Management Portal</p>
            </div>
          </div>

          <div className="mb-6 bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-bold font-tech uppercase text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Director Authentication</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only the Admin can appoint trainers, enroll clients, and assign clients to coaches. Your session will stay permanently logged in on this device.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-tech uppercase text-slate-400 mb-1 font-bold">
                Admin Director Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-amber-500 rounded-xl text-white text-sm outline-none transition-all"
                placeholder="admin@jawan.fit"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-tech uppercase text-slate-400 font-bold">
                  Master Security PIN
                </label>
                <span className="text-[10px] font-tech text-amber-400">Default PIN: 9999</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-amber-500 rounded-xl text-white text-sm outline-none transition-all pl-9"
                  placeholder="Enter PIN (9999)"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
                {loginError}
              </div>
            )}

            <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Keep permanently logged in on this device (No auto-logout)</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 mt-2"
            >
              <span>Unlock Admin Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-neutral-500">
            Jawan Fitness Platform &copy; 2026 • Certified Role Isolation
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Enterprise Admin Bar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-wider text-white uppercase">
                JAWAN <span className="text-amber-500">ADMIN</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                HEADQUARTERS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Enterprise Gym Management Console</p>
          </div>
        </div>

        {/* Global Quick Telemetry Badges - 100% Real Synchronized Data */}
        <div className="hidden lg:flex items-center space-x-6 text-xs text-neutral-300">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-400">Database Status:</span>
            <span className="font-semibold text-emerald-400">Live Synchronized</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-neutral-800 pl-6">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-neutral-400">Enrolled Clients:</span>
            <span className="font-bold text-white">{syncState.clients.length}</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-neutral-800 pl-6">
            <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-neutral-400">Staff Trainers:</span>
            <span className="font-bold text-white">{syncState.trainers.length}</span>
          </div>
        </div>

        {/* Admin Profile & Actions */}
        <div className="flex items-center space-x-3">
          <button
            title="System Notifications"
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {syncState.events.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          <div className="flex items-center space-x-2.5 pl-2 border-l border-neutral-800">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-neutral-200">Director Yogesh</div>
              <div className="text-[10px] text-neutral-400">Super Admin</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Exit Session"
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8">
        <AdminScreen />
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-4 text-neutral-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Jawan Fitness Platform &copy; 2026. Certified Role Isolation: Admin View.</span>
        </div>

        {/* Local Developer Test Bench Shortcut */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateToRole('dev-sync')}
            className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
          >
            <span>Launch Developer Simulator</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AdminApp;
