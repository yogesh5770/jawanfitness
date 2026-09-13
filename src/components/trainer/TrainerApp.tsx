import React, { useState, useEffect } from 'react';
import { TrainerScreen } from './TrainerScreen';
import {
  Dumbbell,
  Users,
  Award,
  CalendarCheck,
  Bell,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  LogOut,
  UserCheck
} from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';
import { syncedStore, AppSyncState, TrainerData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

export const TrainerApp: React.FC = () => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTrainerId, setActiveTrainerId] = useState<string>(() => {
    return localStorage.getItem('jawan_trainer_session_id_v1') || '';
  });

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

  const handleLogout = () => {
    hapticTap();
    setActiveTrainerId('');
    localStorage.removeItem('jawan_trainer_session_id_v1');
  };

  // If no trainer profile selected or session is not active, render Trainer Login Gate
  if (!activeTrainer) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-[#0a0e1a]/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-2xl">
              🏋️
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

          <div className="mb-6 bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-bold font-tech uppercase text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coach Identification</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only appointed staff trainers can access coaching routines and assigned cadets. Once chosen, your session will stay permanently logged in on this device.
            </p>
          </div>

          {syncState.trainers.length === 0 ? (
            <div className="p-6 bg-black/40 border border-dashed border-amber-500/30 rounded-2xl text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
              <h3 className="font-bold text-white text-sm">No Trainers Appointed Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Gym Director must appoint your trainer profile in the Admin Console before you can access this portal.
              </p>
              <button
                onClick={() => navigateToRole('admin')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Go to Admin Console
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[11px] font-tech uppercase text-slate-400 font-bold block">
                Select Your Coach Profile
              </label>
              <div className="space-y-2">
                {syncState.trainers.map((t) => {
                  const cadetCount = syncState.clients.filter((c) => c.trainerId === t.id).length;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTrainer(t.id)}
                      className="w-full p-3 bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-amber-500/50 rounded-2xl flex items-center justify-between text-left transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{t.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-tech text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                          {cadetCount} Cadets
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 ml-auto mt-1 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-neutral-500">
            Jawan Fitness Platform &copy; 2026 • Persistent Coach Session
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Trainer Workspace Header */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl">
            🏋️
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
            <span className="text-neutral-400">Assigned Cadets:</span>
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-bold text-xs flex items-center justify-center shadow">
              {activeTrainer.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-neutral-200">{activeTrainer.name}</div>
              <div className="text-[10px] text-amber-400 font-semibold">{activeTrainer.role}</div>
            </div>
          </div>

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
    </div>
  );
};

export default TrainerApp;
