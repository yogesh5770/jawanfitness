import React from 'react';
import { Home, Dumbbell, UtensilsCrossed, TrendingUp, UserCheck } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export type TabType = 'home' | 'exercises' | 'diet' | 'progress' | 'trainer';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isWorkoutActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isWorkoutActive = false
}) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'diet', label: 'Diet', icon: UtensilsCrossed },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'trainer', label: 'Trainer', icon: UserCheck }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0d14]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-2 pt-2 pb-safe shadow-lg dark:shadow-[0_-10px_25px_rgba(0,0,0,0.5)] transition-colors duration-200">
      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const hasActiveWorkout = tab.id === 'home' && isWorkoutActive;

          return (
            <button
              key={tab.id}
              onClick={() => {
                hapticTap();
                onSelectTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 sm:px-5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active workout indicator pulse */}
              {hasActiveWorkout && !isActive && (
                <span className="absolute -top-1 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
              {hasActiveWorkout && (
                <span className="absolute -top-1 right-3 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0d14]" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <span className="text-[10px] mt-0.5 tracking-tight font-display">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
