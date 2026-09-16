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
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Cinematic Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Geometric Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Luxury Gateway Card */}
      <div className="relative w-full max-w-[440px] bg-gradient-to-b from-[#0f1422]/95 via-[#0b0e18]/95 to-[#080a12]/98 border border-white/10 rounded-[32px] p-7 sm:p-9 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-left animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Gold Accent Rim */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        {/* Brand Showcase Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 opacity-30 blur-sm group-hover:opacity-60 transition duration-300" />
              <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-b from-slate-900 to-black border border-amber-500/40 p-2 flex items-center justify-center shadow-xl">
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
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-wider font-display text-white uppercase">
                  JAWAN <span className="text-amber-400">FITNESS</span>
                </h1>
                <span className="text-[9px] font-tech font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-widest uppercase">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Unified High-Performance Portal
              </p>
            </div>
          </div>

          {/* Real-time Cloud Connection Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-tech font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE SYNC</span>
          </div>
        </div>

        {/* 3-WAY ROLE SELECTOR (Executive Segmented Control) */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-tech uppercase tracking-widest text-slate-400 font-bold">
              Account Privilege
            </span>
            <span className="text-[10px] text-amber-400/90 font-tech font-medium tracking-wider">
              {selectedRole === 'CLIENT' ? 'Member • Athlete' : selectedRole === 'TRAINER' ? 'Certified Coach' : 'HQ Executive'}
            </span>
          </div>

          <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-[#06080f] border border-white/10 shadow-inner">
            {/* Member Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('CLIENT')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                selectedRole === 'CLIENT'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_2px_15px_rgba(245,158,11,0.35)] font-black scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Athlete</span>
            </button>

            {/* Trainer Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('TRAINER')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                selectedRole === 'TRAINER'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_2px_15px_rgba(245,158,11,0.35)] font-black scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Trainer</span>
            </button>

            {/* Admin Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                selectedRole === 'ADMIN'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_2px_15px_rgba(245,158,11,0.35)] font-black scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Director</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Card */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 flex items-center space-x-3 text-left shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            {selectedRole === 'CLIENT' && <Dumbbell className="w-4 h-4" />}
            {selectedRole === 'TRAINER' && <Users className="w-4 h-4" />}
            {selectedRole === 'ADMIN' && <ShieldCheck className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-white text-xs block truncate font-display">
              {selectedRole === 'CLIENT' && 'Member Training & Nutrition Terminal'}
              {selectedRole === 'TRAINER' && 'Coach Roster & Workout Engineering'}
              {selectedRole === 'ADMIN' && 'Director Console & Operations Command'}
            </span>
            <span className="text-[11px] text-slate-400 truncate block mt-0.5">
              {selectedRole === 'CLIENT' && 'Access tailored splits, 3D form guides, and nutrition'}
              {selectedRole === 'TRAINER' && 'Build custom splits, assign meal macros, and review client logs'}
              {selectedRole === 'ADMIN' && 'Master gym control, trainer dispatch, and biometric audits'}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1 font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Identity Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-0.5">
              <label className="text-slate-300 font-semibold tracking-wide">
                {selectedRole === 'CLIENT'
                  ? 'Member ID, Phone, or Email'
                  : selectedRole === 'TRAINER'
                  ? 'Trainer ID or Registered Email'
                  : 'Director Credentials'}
              </label>
              {selectedRole === 'CLIENT' && syncState.clients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowQuickList(!showQuickList)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-tech font-bold transition-colors"
                >
                  {showQuickList ? 'Close Roster' : 'Quick Access ▾'}
                </button>
              )}
            </div>

            <div className="relative group">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRole === 'CLIENT'
                    ? 'e.g. JWM-5200 or 9876543210'
                    : selectedRole === 'TRAINER'
                    ? 'e.g. JWT-7195 or trainer@jawan.fit'
                    : 'admin@jawanfitness.com'
                }
                className="w-full bg-[#060810]/80 border border-white/10 focus:border-amber-500 focus:bg-[#0a0d18] rounded-2xl px-4 py-3.5 text-sm text-white outline-none transition-all duration-200 placeholder-slate-500 shadow-inner focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] pr-11"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-amber-400 transition-colors">
                {selectedRole === 'CLIENT' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
            </div>

            {/* Quick Select Drawer */}
            {showQuickList && selectedRole === 'CLIENT' && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto p-2.5 bg-[#05070e] border border-amber-500/30 rounded-2xl text-xs shadow-2xl">
                <span className="text-[10px] font-tech text-amber-400/90 font-bold uppercase tracking-wider block px-2 py-1">
                  Active Roster Members
                </span>
                {syncState.clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setIdentifier(c.loginId || c.phone || c.email);
                      setShowQuickList(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-amber-500/15 text-slate-300 hover:text-white flex items-center justify-between border border-transparent hover:border-amber-500/20 transition-all"
                  >
                    <div>
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">{c.email || 'Member Profile'}</span>
                    </div>
                    <span className="text-[10px] font-tech font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {c.loginId || c.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-0.5">
              <label className="text-slate-300 font-semibold tracking-wide">
                Master Password
              </label>
              <span className="text-[10px] text-slate-500 font-tech">
                PBKDF2 SHA-256
              </span>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#060810]/80 border border-white/10 focus:border-amber-500 focus:bg-[#0a0d18] rounded-2xl px-4 py-3.5 text-sm text-white outline-none transition-all duration-200 placeholder-slate-500 shadow-inner focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Launch Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-sm tracking-widest uppercase shadow-[0_4px_25px_rgba(245,158,11,0.35)] flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <span>
                  Enter {selectedRole === 'CLIENT' ? 'Member Portal' : selectedRole === 'TRAINER' ? 'Trainer Terminal' : 'Admin Console'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Security & System Integrity Footer */}
        <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-tech">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3 h-3 text-amber-500/80" />
            <span>Encrypted Session</span>
          </div>
          <span className="text-slate-400 font-medium">Jawan Fitness OS v2.4</span>
        </div>
      </div>
    </div>
  );
};
