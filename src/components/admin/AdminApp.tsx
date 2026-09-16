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
import { syncedStore } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';
import { IOSInstallBanner } from '../common/IOSInstallBanner';
import { ThemeToggle } from '../common/ThemeToggle';

export interface AdminAppProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ currentUser: initialUser, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => initialUser || authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(initialUser || authService.isAuthenticated('ADMIN')));

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
      setIsAuthenticated(true);
    }
  }, [initialUser]);

  useEffect(() => {
    if (isAuthenticated) {
      syncedStore.syncFromCloud();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    hapticTap();
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('jawan_auth_session_token_v1');
    localStorage.removeItem('jawan_auth_user_v1');
    if (onLogout) onLogout();
  };

  // If not logged in, transition back to Unified Auth Gateway
  if (!isAuthenticated) {
    if (onLogout) {
      setTimeout(() => onLogout(), 50);
    }
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
        </div>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
        <span className="text-xs text-slate-400 font-tech tracking-wider">Accessing Director Console...</span>
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

      <IOSInstallBanner />
    </div>
  );
};

export default AdminApp;
