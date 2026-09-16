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
  KeyRound,
  Loader2
} from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { authService, AuthUser } from '../../services/authService';
import { hapticTap } from '../../utils/audioHaptics';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { IOSInstallBanner } from '../common/IOSInstallBanner';
import { ThemeToggle } from '../common/ThemeToggle';

export interface TrainerAppProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const TrainerApp: React.FC<TrainerAppProps> = ({ currentUser: initialUser, onLogout }) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTrainerId, setActiveTrainerId] = useState<string>(() => {
    return localStorage.getItem('jawan_trainer_session_id_v1') || '';
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => initialUser || authService.getUser());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const user = currentUser || authService.getUser();
  const activeTrainer = syncState.trainers.find((t) => {
    if (user?.id && t.id === user.id) return true;
    if (user?.loginId && t.loginId && t.loginId.toLowerCase() === user.loginId.toLowerCase()) return true;
    if (user?.email && t.email && t.email.toLowerCase() === user.email.toLowerCase()) return true;
    if (user?.phone && t.phone && t.phone.replace(/\D/g, '').endsWith(user.phone.replace(/\D/g, '').slice(-10))) return true;
    if (activeTrainerId && t.id === activeTrainerId) return true;
    return false;
  }) || (user && user.role === 'TRAINER' ? {
    id: user.id,
    name: user.name || 'Coach',
    email: user.email || '',
    phone: user.phone || '',
    role: 'Fitness Coach',
    status: 'Active',
    clientsCount: 0,
    avgAdherence: 95,
    loginId: user.loginId,
    avatarUrl: ''
  } : null);

  const myClients = activeTrainer
    ? syncState.clients.filter((c) => c.trainerId === activeTrainer.id)
    : [];

  const handleSelectTrainer = (id: string) => {
    hapticTap();
    setActiveTrainerId(id);
    localStorage.setItem('jawan_trainer_session_id_v1', id);
    syncedStore.setActiveTrainer(id);
  };

  const handleLogout = () => {
    hapticTap();
    authService.logout();
    setActiveTrainerId('');
    localStorage.removeItem('jawan_auth_session_token_v1');
    localStorage.removeItem('jawan_auth_user_v1');
    localStorage.removeItem('jawan_trainer_session_id_v1');
    if (onLogout) onLogout();
  };

  // If no trainer profile selected or session is not active, redirect to Gateway
  if (!activeTrainer) {
    if (onLogout) {
      setTimeout(() => onLogout(), 50);
    }
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
        </div>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
        <span className="text-xs text-slate-400 font-tech tracking-wider">Accessing Coach Terminal...</span>
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
