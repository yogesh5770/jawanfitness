import React from 'react';
import { 
  User, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  Smartphone, 
  Phone, 
  Scale, 
  Ruler, 
  Target, 
  Award, 
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { ThemeToggle } from '../common/ThemeToggle';
import { ClientData, TrainerData } from '../../services/syncedStore';

interface ProfileScreenProps {
  client: ClientData;
  assignedTrainer?: TrainerData | null;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  client,
  assignedTrainer,
  onOpenChangePassword,
  onLogout
}) => {
  const memberInitials = (client.name || 'Member')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const heightMeters = (client.heightCm || 170) / 100;
  const currentBmi = ((client.currentWeightKg || 80) / (heightMeters * heightMeters)).toFixed(1);

  return (
    <div className="space-y-4 pb-28 text-left animate-fadeIn max-w-xl mx-auto">
      {/* 1. Member Executive Profile Header */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-black font-black text-xl flex items-center justify-center font-display shadow-lg shadow-amber-500/20 border border-amber-300/40 flex-shrink-0">
            {memberInitials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display truncate">
                {client.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-tech border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-tech mt-0.5 truncate">
              ID: {client.loginId || client.id} • {client.gymId || 'JAWAN-SALEM-01'}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate mt-0.5">
              Goal: {client.goal || 'Weight Loss & Hypertrophy'}
            </p>
          </div>
        </div>

        {/* Biometrics Triad Bar */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">Height</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-tech">
              {client.heightCm} cm
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">Current</span>
            <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-tech">
              {client.currentWeightKg} kg
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">Target</span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-tech">
              {client.goalWeightKg} kg
            </span>
          </div>
        </div>
      </div>

      {/* 2. Personal Coach Card */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md transition-colors duration-200">
        <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 font-bold block mb-2">
          ASSIGNED PERSONAL COACH
        </span>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 overflow-hidden border border-slate-300 dark:border-white/10">
              {assignedTrainer?.avatarUrl ? (
                <img src={assignedTrainer.avatarUrl} alt={assignedTrainer.name} className="w-full h-full object-cover" />
              ) : (
                (assignedTrainer?.name || client.trainerName || 'Coach').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white font-display">
                {assignedTrainer?.name || client.trainerName || 'Head Coach'}
              </h4>
              <span className="text-xs text-slate-500 font-tech block">
                {assignedTrainer?.role || 'Personal Fitness Coach'}
              </span>
            </div>
          </div>

          {assignedTrainer?.phone && (
            <a
              href={`https://wa.me/${assignedTrainer.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticTap()}
              className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 text-xs font-tech font-bold transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* 3. Settings & Appearance */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md space-y-3 transition-colors duration-200">
        <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 font-bold block mb-1">
          PREFERENCES & SECURITY
        </span>

        {/* Theme Switcher Row */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Interface Theme</h4>
            <p className="text-[10px] text-slate-500 font-tech">Toggle between Obsidian Dark and Clean Light</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Change Password Row */}
        <button
          onClick={() => {
            hapticTap();
            onOpenChangePassword();
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-white/5 transition-all text-left"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Change Account Password</h4>
              <p className="text-[10px] text-slate-500 font-tech">Update your secure member login password</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* 4. App Information & PWA Status */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md space-y-2 text-xs transition-colors duration-200">
        <div className="flex items-center justify-between text-slate-500">
          <span>Application Engine</span>
          <span className="font-tech font-bold text-slate-900 dark:text-white">Jawan Fitness 2.0 PWA</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Cloud Sync & Database</span>
          <span className="font-tech font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloudflare D1 Live</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Gym Headquarters</span>
          <span className="font-tech font-bold text-slate-900 dark:text-white">Salem, Tamil Nadu</span>
        </div>
      </div>

      {/* 5. Sign Out Button */}
      <button
        onClick={() => {
          hapticTap();
          onLogout();
        }}
        className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out from Member Portal</span>
      </button>
    </div>
  );
};
