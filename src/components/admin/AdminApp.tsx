import React, { useState } from 'react';
import { AdminScreen } from './AdminScreen';
import {
  ShieldCheck,
  Building2,
  Users,
  Dumbbell,
  Apple,
  FileSpreadsheet,
  Activity,
  Layers,
  Settings,
  Bell,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';

export const AdminApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'trainers' | 'exercises' | 'foods' | 'templates' | 'assignments' | 'logs'>('dashboard');

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Enterprise Admin Bar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-wider text-white uppercase">
                JAWAN <span className="text-amber-500">ADMIN</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                HEADQUARTERS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Enterprise Gym Management Console</p>
          </div>
        </div>

        {/* Global Quick Telemetry Badges */}
        <div className="hidden lg:flex items-center space-x-6 text-xs text-neutral-300">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-400">Database Status:</span>
            <span className="font-semibold text-emerald-400">Live Synchronized</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-neutral-800 pl-6">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-neutral-400">Enrolled Clients:</span>
            <span className="font-bold text-white">248</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-neutral-800 pl-6">
            <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-neutral-400">Active Staff Trainers:</span>
            <span className="font-bold text-white">12</span>
          </div>
        </div>

        {/* Admin Profile & Actions */}
        <div className="flex items-center space-x-3">
          <button
            title="System Notifications"
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
          </button>

          <div className="flex items-center space-x-2.5 pl-2 border-l border-neutral-800">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-neutral-200">Director Yogesh</div>
              <div className="text-[10px] text-neutral-400">Super Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8">
        <AdminScreen />
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-4 text-neutral-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Jawan Fitness Platform &copy; 2026. Certified Role Isolation: Admin View.</span>
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

export default AdminApp;
