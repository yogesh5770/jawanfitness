import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Dumbbell,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  KeyRound
} from 'lucide-react';
import { authService, AuthUser } from '../../services/authService';
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

  const handleRoleChange = (role: 'CLIENT' | 'TRAINER' | 'ADMIN') => {
    hapticTap();
    setSelectedRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your User ID / Email and Master Password.');
      return;
    }

    hapticTap();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.login(
        identifier.trim(),
        password,
        selectedRole,
        keepSignedIn
      );

      if (result.success && result.user) {
        onLoginSuccess(result.user, selectedRole);
        return;
      }

      setErrorMessage(result.error || 'Invalid credentials. Please check your ID and password.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication error. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-[#04060a] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 py-8 relative overflow-y-auto font-sans selection:bg-amber-500 selection:text-black">
      {/* Cinematic Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Master Luxury Auth Portal Card */}
      <div className="relative w-full max-w-[460px] bg-gradient-to-b from-white dark:from-[#0f1422]/95 via-white dark:via-[#0b0e18]/95 to-white dark:to-[#080a12]/98 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.12)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-left animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        {/* Brand Showcase Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 p-2 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.25)] flex-shrink-0 transition-transform group-hover:scale-105 duration-300">
                <img
                  src="/logo-3d-tight.png"
                  alt="Jawan Fitness"
                  className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                />
              </div>
              <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur-sm -z-10 group-hover:bg-amber-500/30 transition-all" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-black text-xl tracking-wider text-slate-900 dark:text-white uppercase leading-none">
                  JAWAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">FITNESS</span>
                </h1>
              </div>
              <p className="text-[11px] font-tech text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Executive Gateway Portal</span>
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-tech font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            PBKDF2 Cloud
          </div>
        </div>

        {/* Triple Role Selector */}
        <div className="mb-6 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#060810]/90 border border-slate-200 dark:border-white/10 shadow-inner">
          <div className="grid grid-cols-3 gap-1">
            {/* Athlete Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('CLIENT')}
              className={`min-h-[44px] py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
                selectedRole === 'CLIENT'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_2px_15px_rgba(245,158,11,0.35)] font-black scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Athlete</span>
            </button>

            {/* Trainer Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('TRAINER')}
              className={`min-h-[44px] py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
                selectedRole === 'TRAINER'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_2px_15px_rgba(245,158,11,0.35)] font-black scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Trainer</span>
            </button>

            {/* Admin Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`min-h-[44px] py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_2px_15px_rgba(245,158,11,0.35)] font-black scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Director</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Header */}
        <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-slate-200 dark:border-white/10 flex items-center space-x-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            {selectedRole === 'CLIENT' && <Dumbbell className="w-4 h-4" />}
            {selectedRole === 'TRAINER' && <Users className="w-4 h-4" />}
            {selectedRole === 'ADMIN' && <ShieldCheck className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 dark:text-white text-xs block truncate font-display">
              {selectedRole === 'CLIENT' && 'Member Training & Nutrition Terminal'}
              {selectedRole === 'TRAINER' && 'Coach Roster & Workout Engineering'}
              {selectedRole === 'ADMIN' && 'Director Console & Operations Command'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
              {selectedRole === 'CLIENT' && 'Real-time splits, 3D biomechanics motion, and diet'}
              {selectedRole === 'TRAINER' && 'Member roster, daily compliance, and split creator'}
              {selectedRole === 'ADMIN' && 'Gym administration, coach assignor, and member telemetry'}
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1 font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Identity Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-0.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold tracking-wide">
                {selectedRole === 'CLIENT'
                  ? 'Member ID / Phone / Email'
                  : selectedRole === 'TRAINER'
                  ? 'Trainer ID / Phone / Email'
                  : 'Director Email or ID'}
              </label>
            </div>

            <div className="relative group">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRole === 'CLIENT'
                    ? 'e.g. JWM-5200 or 8248345770'
                    : selectedRole === 'TRAINER'
                    ? 'e.g. JWT-7195 or 9360345770'
                    : 'admin@jawan.fit'
                }
                className="w-full min-h-[48px] bg-slate-100 dark:bg-[#060810]/90 border border-slate-200 dark:border-white/10 focus:border-amber-500 focus:bg-white dark:focus:bg-[#0a0d18] rounded-2xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white outline-none transition-all duration-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-inner focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] pr-11"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-amber-400 transition-colors">
                {selectedRole === 'CLIENT' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-0.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold tracking-wide">
                Password
              </label>
              <span className="text-[10px] text-slate-500 font-tech">
                Secure Hash
              </span>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secure password"
                className="w-full min-h-[48px] bg-slate-100 dark:bg-[#060810]/90 border border-slate-200 dark:border-white/10 focus:border-amber-500 focus:bg-white dark:focus:bg-[#0a0d18] rounded-2xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white outline-none transition-all duration-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-inner focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="min-h-[44px] min-w-[44px] absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Keep me signed in */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="min-h-[44px] flex items-center space-x-2 text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="w-4 h-4 rounded bg-black/60 border-slate-300 dark:border-white/20 text-amber-600 dark:text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-xs tracking-widest uppercase shadow-[0_4px_25px_rgba(245,158,11,0.35)] flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <span>
                  Log In as {selectedRole === 'CLIENT' ? 'Athlete' : selectedRole === 'TRAINER' ? 'Trainer' : 'Director'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Credential Help */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2.5 text-left">
            <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Need your login ID?</span>
              Your gym ID and temporary password were shared with you by the front desk.
              Use your phone number or Member/Trainer ID to sign in, then set a new password.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-tech">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-500/80" />
            <span>End-to-End Verified</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Jawan Fitness OS • 2026</span>
        </div>
      </div>
    </div>
  );
};
