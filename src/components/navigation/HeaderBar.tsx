import React from 'react';
import { Flame, ShieldCheck, Crown, User } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { ThemeToggle } from '../common/ThemeToggle';

export type UserRole = 'client' | 'trainer' | 'admin';

interface HeaderBarProps {
  streakDays?: number;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  streakDays = 6,
  activeRole,
  onSelectRole
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#07090e]/95 backdrop-blur-xl border-b border-white/10 px-3 py-2.5 pt-safe transition-all shadow-md">
      {/* Top Row: Brand & Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2.5">
          {/* Official Jawan Fitness 3D Logo */}
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-black/60 border border-amber-500/30 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <img
              src="/logo-3d-tight.png"
              alt="Jawan Fitness"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-black tracking-wider text-sm text-white">
                JAWAN <span className="text-amber-500">FITNESS</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 font-tech">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Salem Training Headquarters</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle className="scale-85" />
          {/* Workout Streak */}
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-950/60 to-amber-950/60 border border-orange-500/30">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
            <span className="text-[11px] font-black text-orange-300 font-tech">{streakDays}d</span>
          </div>

          {/* Active Role Tag */}
          <span className="text-[10px] font-tech font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {activeRole === 'client' && 'Client'}
            {activeRole === 'trainer' && 'Trainer'}
            {activeRole === 'admin' && 'Admin'}
          </span>
        </div>
      </div>

      {/* Bottom Row: 3-Way Role Switcher */}
      <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
        <button
          onClick={() => {
            hapticTap();
            onSelectRole('client');
          }}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-tech flex items-center justify-center space-x-1 transition-all ${
            activeRole === 'client'
              ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Client</span>
        </button>

        <button
          onClick={() => {
            hapticTap();
            onSelectRole('trainer');
          }}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-tech flex items-center justify-center space-x-1 transition-all ${
            activeRole === 'trainer'
              ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Trainer</span>
        </button>

        <button
          onClick={() => {
            hapticTap();
            onSelectRole('admin');
          }}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-tech flex items-center justify-center space-x-1 transition-all ${
            activeRole === 'admin'
              ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crown className="w-3 h-3" />
          <span>👑 Admin</span>
        </button>
      </div>
    </header>
  );
};
