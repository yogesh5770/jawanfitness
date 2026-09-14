import React, { useState, useEffect } from 'react';
import { AdminScreen } from './AdminScreen';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { authService, AuthUser } from '../../services/authService';
import { hapticTap } from '../../utils/audioHaptics';

export const AdminApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated('ADMIN'));
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // On mount: Validate session token with backend Supabase database
  useEffect(() => {
    let isMounted = true;
    async function checkBackendSession() {
      try {
        const valid = await authService.verifySession();
        if (isMounted) {
          setIsAuthenticated(valid && authService.isAuthenticated('ADMIN'));
          setCurrentUser(authService.getUser());
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(authService.isAuthenticated('ADMIN'));
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }
    checkBackendSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticTap();
    setIsLoading(true);
    setLoginError(null);

    const result = await authService.login(adminEmail, adminPassword, 'ADMIN', keepSignedIn);

    setIsLoading(false);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
    } else {
      setLoginError(result.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleLogout = async () => {
    hapticTap();
    await authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Initial session verification loader
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-xs font-tech text-slate-400">Verifying secure Director session...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render the secure Admin Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        {/* Ambient military gold radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-[#0a0e1a]/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left animate-in fade-in zoom-in-95 duration-200">
          {/* Logo & Header */}
          <div className="flex items-center space-x-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain drop-shadow" />
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-tech uppercase text-slate-400 mb-1 font-bold">
                Director Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-amber-500 rounded-xl text-white text-sm outline-none transition-all pl-9"
                  placeholder="admin@jawan.fit"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-tech uppercase text-slate-400 font-bold">
                  Director Password
                </label>
                <span className="text-[10px] font-tech text-slate-500">256-bit Encrypted</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-amber-500 rounded-xl text-white text-sm outline-none transition-all pl-9 pr-11 font-mono"
                  placeholder="••••••••••••"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
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

            {loginError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium animate-in fade-in duration-150">
                {loginError}
              </div>
            )}

            {/* Standard "Keep me signed in" checkbox */}
            <div className="pt-1">
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/20 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 accent-amber-500 cursor-pointer"
                />
                <span className="text-slate-300">Keep me signed in on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-sm tracking-wider uppercase rounded-xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.45)] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500">
            <span>Jawan Fitness &copy; 2026</span>
            <span className="flex items-center space-x-1 text-emerald-400 font-tech text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Encrypted Director Session</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      <AdminScreen onLogout={handleLogout} />

      {/* Enterprise Footer */}
      <footer className="border-t border-white/10 bg-[#0a0e18] px-4 py-3 text-neutral-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>
            Jawan Fitness Headquarters &copy; 2026. Logged in as{' '}
            <strong className="text-slate-300">{currentUser?.name && !currentUser.name.includes('Yogesh') ? currentUser.name : 'Gym Director'}</strong> ({currentUser?.email || 'admin@jawan.fit'}).
          </span>
        </div>

        <div className="text-[11px] text-neutral-500 font-tech">
          <span>Enterprise Management Console • High Security</span>
        </div>
      </footer>
    </div>
  );
};

export default AdminApp;
