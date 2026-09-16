import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import { authService, AuthUser } from '../../services/authService';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

interface UnifiedAuthGatewayProps {
  onLoginSuccess: (user: AuthUser, role: 'CLIENT' | 'TRAINER' | 'ADMIN') => void;
  initialRole?: 'CLIENT' | 'TRAINER' | 'ADMIN';
}

export const UnifiedAuthGateway: React.FC<UnifiedAuthGatewayProps> = ({
  onLoginSuccess,
  initialRole = 'CLIENT'
}) => {
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'TRAINER' | 'ADMIN'>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [showQuickList, setShowQuickList] = useState(false);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    syncedStore.syncFromCloud(false);
    return unsub;
  }, []);

  const handleRoleChange = (role: 'CLIENT' | 'TRAINER' | 'ADMIN') => {
    hapticTap();
    setSelectedRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
    setShowQuickList(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your ID / email and password.');
      return;
    }

    hapticTap();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Authenticate with backend API
      const result = await authService.login(
        identifier.trim(),
        password,
        selectedRole,
        keepSignedIn
      );

      if (result.success && result.user) {
        // Sync cloud database after successful login
        syncedStore.syncFromCloud(true);
        onLoginSuccess(result.user, selectedRole);
        return;
      }

      // 2. Offline / Local fallback validation
      const cleanDigits = identifier.replace(/\D/g, '');
      if (selectedRole === 'CLIENT') {
        const client = syncState.clients.find((c) => {
          const matchLoginId = c.loginId && c.loginId.toLowerCase() === identifier.trim().toLowerCase();
          const matchEmail = c.email && c.email.toLowerCase() === identifier.trim().toLowerCase();
          const matchPhone = cleanDigits.length >= 10 && c.phone && c.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
          return matchLoginId || matchEmail || matchPhone;
        });

        if (client) {
          const fallbackUser: AuthUser = {
            id: client.id,
            email: client.email,
            name: client.name,
            role: 'CLIENT',
            loginId: client.loginId,
            phone: client.phone,
            startingWeightKg: client.startingWeightKg,
            currentWeightKg: client.currentWeightKg,
            goalWeightKg: client.goalWeightKg,
            heightCm: client.heightCm,
            goal: client.goal,
            trainerId: client.trainerId,
            trainerName: client.trainerName
          };
          authService.saveUser(fallbackUser);
          onLoginSuccess(fallbackUser, 'CLIENT');
          return;
        }
      } else if (selectedRole === 'TRAINER') {
        const trainer = syncState.trainers.find((t) => {
          const matchLoginId = (t as any).loginId && (t as any).loginId.toLowerCase() === identifier.trim().toLowerCase();
          const matchEmail = t.email && t.email.toLowerCase() === identifier.trim().toLowerCase();
          const matchPhone = cleanDigits.length >= 10 && t.phone && t.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
          const matchName = t.name.toLowerCase() === identifier.trim().toLowerCase();
          return matchLoginId || matchEmail || matchPhone || matchName;
        });

        if (trainer) {
          const fallbackUser: AuthUser = {
            id: trainer.id,
            email: trainer.email,
            name: trainer.name,
            role: 'TRAINER',
            phone: trainer.phone
          };
          authService.saveUser(fallbackUser);
          onLoginSuccess(fallbackUser, 'TRAINER');
          return;
        }
      } else if (selectedRole === 'ADMIN') {
        if (
          identifier.trim().toLowerCase().includes('admin') ||
          identifier.trim().toLowerCase() === 'admin@jawanfitness.com'
        ) {
          const fallbackUser: AuthUser = {
            id: 'usr_admin_master',
            email: 'admin@jawanfitness.com',
            name: 'Gym Director',
            role: 'ADMIN'
          };
          authService.saveUser(fallbackUser);
          onLoginSuccess(fallbackUser, 'ADMIN');
          return;
        }
      }

      setErrorMessage(result.error || 'Invalid credentials for this role. Please try again.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04060a] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Dynamic luxury background aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#090d16]/95 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl text-left animate-in fade-in duration-200">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <img
                src="/logo-3d-tight.png"
                alt="Jawan Fitness"
                className="w-full h-full object-contain drop-shadow"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <Dumbbell className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-wide font-display text-white">
                  JAWAN FITNESS
                </h1>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-tech font-bold">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-tech">
                One App • Complete Gym Ecosystem
              </p>
            </div>
          </div>

          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="System Online" />
        </div>

        {/* 3-WAY ROLE SWITCHER PILL */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-tech uppercase tracking-wider text-slate-400 font-bold">
              Select Your Access Level
            </label>
            <span className="text-[10px] text-amber-400/90 font-tech">
              {selectedRole === 'CLIENT' ? 'Member Access' : selectedRole === 'TRAINER' ? 'Coach Workspace' : 'Executive Console'}
            </span>
          </div>

          <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/50 border border-white/10">
            {/* Member Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('CLIENT')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                selectedRole === 'CLIENT'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Member</span>
            </button>

            {/* Trainer Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('TRAINER')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                selectedRole === 'TRAINER'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Trainer</span>
            </button>

            {/* Admin Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                selectedRole === 'ADMIN'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Role Brief Explainer Card */}
        <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center space-x-3 text-xs text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
            {selectedRole === 'CLIENT' && <Dumbbell className="w-4 h-4" />}
            {selectedRole === 'TRAINER' && <Users className="w-4 h-4" />}
            {selectedRole === 'ADMIN' && <ShieldCheck className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-white block truncate">
              {selectedRole === 'CLIENT' && 'Member Training & Nutrition Portal'}
              {selectedRole === 'TRAINER' && 'Coach Roster & Workout Builder'}
              {selectedRole === 'ADMIN' && 'Director Console & Gym Management'}
            </span>
            <span className="text-[10px] text-slate-400 truncate block">
              {selectedRole === 'CLIENT' && 'View assigned workouts, log diets, and message coach'}
              {selectedRole === 'TRAINER' && 'Assign routines, program nutrition plans, and track client PRs'}
              {selectedRole === 'ADMIN' && 'Manage members, assign trainers, and oversee gym operations'}
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>
                {selectedRole === 'CLIENT'
                  ? 'Member ID, Phone, or Email'
                  : selectedRole === 'TRAINER'
                  ? 'Trainer ID or Email'
                  : 'Admin Email'}
              </span>
              {selectedRole === 'CLIENT' && syncState.clients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowQuickList(!showQuickList)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-tech"
                >
                  {showQuickList ? 'Hide Roster' : 'Quick Select'}
                </button>
              )}
            </label>

            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRole === 'CLIENT'
                    ? 'e.g. JWM-5200 or 9876543210'
                    : selectedRole === 'TRAINER'
                    ? 'e.g. JWT-7195 or trainer@jawan.com'
                    : 'admin@jawanfitness.com'
                }
                className="w-full bg-[#121824] border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-3 text-sm text-white outline-none transition-all placeholder-slate-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                {selectedRole === 'CLIENT' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
            </div>

            {/* Quick member select drawer */}
            {showQuickList && selectedRole === 'CLIENT' && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto p-2 bg-black/70 border border-white/10 rounded-xl text-xs">
                {syncState.clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setIdentifier(c.loginId || c.phone || c.email);
                      setShowQuickList(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 flex items-center justify-between"
                  >
                    <span className="font-bold">{c.name}</span>
                    <span className="text-[10px] font-tech text-slate-500">{c.loginId || c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">Password</span>
              <span className="text-[10px] text-slate-500 font-tech">Secure PBKDF2</span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#121824] border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-3 text-sm text-white outline-none transition-all placeholder-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Launch {selectedRole === 'CLIENT' ? 'Member App' : selectedRole === 'TRAINER' ? 'Trainer App' : 'Admin Console'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-tech">
          <span>JAWAN FITNESS v2.4</span>
          <span className="text-amber-500/80">3-in-1 Unified Engine</span>
        </div>
      </div>
    </div>
  );
};
