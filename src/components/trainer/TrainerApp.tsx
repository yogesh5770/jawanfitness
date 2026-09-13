import React, { useState } from 'react';
import { TrainerScreen } from './TrainerScreen';
import {
  Dumbbell,
  Users,
  Award,
  CalendarCheck,
  Bell,
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';

export const TrainerApp: React.FC = () => {
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

        {/* Coach Metrics */}
        <div className="hidden md:flex items-center space-x-6 text-xs text-neutral-300">
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-neutral-400">Assigned Clients:</span>
            <span className="font-bold text-white">18 Active</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-neutral-800 pl-6">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Today's Completed Sessions:</span>
            <span className="font-bold text-emerald-400">14 / 18</span>
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
          </button>

          <div className="flex items-center space-x-2.5 pl-2 border-l border-neutral-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-bold text-xs flex items-center justify-center shadow">
              CR
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-neutral-200">Coach Ravi</div>
              <div className="text-[10px] text-amber-400 font-semibold">Head Strength Coach</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Trainer Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8">
        <TrainerScreen />
      </main>

      {/* Trainer Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-4 text-neutral-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Jawan Fitness Platform &copy; 2026. Coach Portal (Web & PWA).</span>
        </div>

        {/* Local Developer Test Bench Shortcut */}
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
