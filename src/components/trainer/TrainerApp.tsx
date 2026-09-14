import React, { useState, useEffect } from 'react';
import { TrainerScreen } from './TrainerScreen';
import {
  Users,
  Award,
  CalendarCheck,
  Bell,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { authService } from '../../services/authService';
import { hapticTap } from '../../utils/audioHaptics';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { IOSInstallBanner } from '../common/IOSInstallBanner';
import { ThemeToggle } from '../common/ThemeToggle';

export const TrainerApp: React.FC = () => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTrainerId, setActiveTrainerId] = useState<string>(() => {
    return localStorage.getItem('jawan_trainer_session_id_v1') || '';
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showQuickList, setShowQuickList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const activeTrainer = syncState.trainers.find((t) => t.id === activeTrainerId);
  const myClients = activeTrainer
    ? syncState.clients.filter((c) => c.trainerId === activeTrainer.id)
    : [];

  const handleSelectTrainer = (id: string) => {
    hapticTap();
    setActiveTrainerId(id);
    localStorage.setItem('jawan_trainer_session_id_v1', id);
    syncedStore.setActiveTrainer(id);
  };

  const handleTrainerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const identifier = loginIdentifier.trim();
    const password = loginPassword;

    if (!identifier || !password) {
      setLoginError('Please enter both your User ID / Email and Password.');
      return;
    }

    setIsLoading(true);
    const result = await authService.login(identifier, password, 'TRAINER', true);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setLoginError(result.error || 'Trainer login failed. Please verify the credentials sent on WhatsApp.');
      return;
    }

    const verifiedUser = result.user;
    const latestState = await syncedStore.syncFromCloud();
    const state = latestState || syncedStore.getState();
    const cleanDigits = identifier.replace(/\D/g, '');
    const matched = state.trainers.find((t) => {
      // Match by loginId from verified user
      const matchLoginId = t.loginId && verifiedUser.loginId && t.loginId.toLowerCase() === verifiedUser.loginId.toLowerCase();
      // Match by raw identifier against loginId (fallback)
      const matchRawId = t.loginId && t.loginId.toLowerCase() === identifier.trim().toLowerCase();
      // Match by email
      const matchEmail = t.email && verifiedUser.email && t.email.toLowerCase() === verifiedUser.email.toLowerCase();
      // Match by phone digits
      const matchPhone = cleanDigits.length >= 10 && t.phone && t.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
      return matchLoginId || matchRawId || matchEmail || matchPhone;
    });

    let activeMatched = matched;
    if (!activeMatched) {
      // Auth succeeded but no trainer profile in sync state — create one so trainer can access UI
      activeMatched = {
        id: verifiedUser.id,
        name: verifiedUser.name || 'Coach',
        email: verifiedUser.email || '',
        phone: verifiedUser.phone || cleanDigits || '',
        role: 'Fitness Coach',
        status: 'Active',
        clientsCount: 0,
        avgAdherence: 0,
        loginId: verifiedUser.loginId || identifier
      };
      // Add to sync state so it persists
      const updatedState = syncedStore.getState();
      const exists = updatedState.trainers.some((t) => t.id === activeMatched!.id);
      if (!exists) {
        syncedStore.createTrainer({
          name: activeMatched.name,
          email: activeMatched.email,
          phone: activeMatched.phone,
          role: activeMatched.role,
          status: 'Active',
          loginId: activeMatched.loginId
        });
        // Re-fetch to get the created trainer with proper id
        const refreshedState = syncedStore.getState();
        const justCreated = refreshedState.trainers.find((t) =>
          t.loginId && activeMatched!.loginId && t.loginId.toLowerCase() === activeMatched!.loginId!.toLowerCase()
        );
        if (justCreated) activeMatched = justCreated;
      }
    }

    hapticTap();
    setActiveTrainerId(activeMatched.id);
    localStorage.setItem('jawan_trainer_session_id_v1', activeMatched.id);
    syncedStore.setActiveTrainer(activeMatched.id);
  };

  const handleLogout = () => {
    hapticTap();
    authService.logout();
    setActiveTrainerId('');
    localStorage.removeItem('jawan_trainer_session_id_v1');
  };

  // If no trainer profile selected or session is not active, render Trainer Login Gate
  if (!activeTrainer) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-[#0a0e1a]/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain drop-shadow" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-display font-black text-xl tracking-wider text-white uppercase">
                    JAWAN <span className="text-amber-500">TRAINER</span>
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    COACH PWA
                  </span>
                </div>
                <p className="text-xs text-neutral-400">Personal Coach Command Center</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="mb-5 bg-slate-900/60 border border-white/5 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold font-tech uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coach Secure Access</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter your official Trainer ID or Email and Password provided by the Gym Director via WhatsApp.
            </p>
          </div>

          <form onSubmit={handleTrainerLogin} className="space-y-3.5">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <span className="font-bold">Error:</span>
                <span>{loginError}</span>
              </div>
            )}

              <div>
                <label className="text-[10px] font-tech uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Trainer User ID / Email / Phone
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-tech uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pr-11 text-white text-xs outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] mt-2"
              >
                {isLoading ? 'Verifying Coach...' : 'Sign In to Coach Portal'}
              </button>

              {/* Quick Select Accordion for testing */}
              <div className="pt-3 border-t border-white/5">
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => setShowQuickList(!showQuickList)}
                    className="w-full text-center text-[11px] text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>{showQuickList ? '▲ Hide Registered Coaches' : '▼ Quick One-Tap Sign In (Testing)'}</span>
                  </button>
                )}

                {import.meta.env.DEV && showQuickList && (
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {syncState.trainers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTrainer(t.id)}
                        className="w-full p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/40 rounded-xl flex items-center justify-between text-left transition-all"
                      >
                        <div>
                          <div className="text-white text-xs font-bold">{t.name}</div>
                          <div className="text-[10px] text-slate-400 font-tech">ID: {t.loginId || t.phone}</div>
                        </div>
                        <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          Enter &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>

          <div className="mt-5 pt-3 border-t border-white/5 text-center text-[10px] text-neutral-500">
            Jawan Fitness Platform &copy; 2026 • Verified Coach Session
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Trainer Workspace Header */}
      <header className="pt-safe min-h-[4rem] h-auto py-2.5 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 p-1.5 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain drop-shadow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-wider text-white uppercase">
                JAWAN <span className="text-amber-500">TRAINER</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>COACH ACTIVE</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Coaching, Workout & Nutrition Programming</p>
          </div>
        </div>

        {/* Coach Metrics (100% Real Synchronized Data) */}
        <div className="hidden md:flex items-center space-x-6 text-xs text-neutral-300">
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-neutral-400">Assigned Clients:</span>
            <span className="font-bold text-white">{myClients.length}</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-neutral-800 pl-6">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Sessions Completed:</span>
            <span className="font-bold text-emerald-400">{syncState.workoutHistory.length}</span>
          </div>
        </div>

        {/* Coach Profile & PWA Notice */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-300">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>PWA Ready</span>
          </div>

          <button
            title="Trainer Notifications"
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {syncState.events.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          <div className="flex items-center space-x-2.5 pl-2 border-l border-neutral-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-bold text-xs flex items-center justify-center shadow overflow-hidden">
              {activeTrainer.avatarUrl ? (
                <img src={activeTrainer.avatarUrl} alt={activeTrainer.name} className="w-full h-full object-cover" />
              ) : (
                activeTrainer.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-neutral-200">{activeTrainer.name}</div>
              <div className="text-[10px] text-amber-400 font-semibold">{activeTrainer.role}</div>
            </div>
          </div>

          <ThemeToggle />

          <button
            onClick={() => {
              hapticTap();
              setIsChangePasswordOpen(true);
            }}
            title="Change Password"
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 transition-colors flex items-center space-x-1 text-xs font-bold"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Password</span>
          </button>

          <button
            onClick={handleLogout}
            title="Switch Coach / Log Out"
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Trainer Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8">
        <TrainerScreen activeTrainerId={activeTrainer.id} />
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userRole="TRAINER"
        userIdentifier={activeTrainer.loginId || activeTrainer.phone || activeTrainer.email}
        userName={activeTrainer.name}
      />

      {/* Trainer Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-4 text-neutral-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Jawan Fitness Platform &copy; 2026. Coach Portal (Web & PWA). Certified Role Isolation.</span>
        </div>

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

      <IOSInstallBanner />
    </div>
  );
};

export default TrainerApp;
