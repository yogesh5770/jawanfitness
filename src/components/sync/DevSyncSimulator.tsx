import React from 'react';
import { Live3SyncView } from './Live3SyncView';
import { ShieldCheck, Dumbbell, Smartphone, RefreshCw, ArrowLeft } from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';

export const DevSyncSimulator: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col font-sans">
      {/* Dev Simulator Top Header */}
      <header className="bg-purple-950/40 border-b border-purple-500/30 px-4 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold text-sm">
            🛠️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-wider text-purple-300 uppercase">
                INTERNAL DEVELOPER TEST BENCH (/dev-sync)
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                DEVELOPMENT SIMULATOR ONLY
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Live multi-device pub/sub simulator for Admin, Trainer, and Client verification.
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons for Production Apps */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => navigateToRole('admin')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1 font-semibold"
          >
            <span>👑 Test Admin Web</span>
          </button>
          <button
            onClick={() => navigateToRole('trainer')}
            className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center space-x-1 font-semibold"
          >
            <span>🧑‍🏫 Test Trainer PWA</span>
          </button>
          <button
            onClick={() => navigateToRole('client')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 font-semibold"
          >
            <span>📱 Test Client App</span>
          </button>
        </div>
      </header>

      {/* 3-Column Split Bench */}
      <main className="flex-1 p-3">
        <Live3SyncView
          onSelectFullView={(role) => {
            navigateToRole(role);
          }}
        />
      </main>
    </div>
  );
};

export default DevSyncSimulator;
