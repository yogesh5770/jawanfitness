import React from 'react';
import { Home, Dumbbell, Activity, UtensilsCrossed, TrendingUp, UserCheck } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export type TabType = 'home' | 'workout' | 'exercises' | 'diet' | 'progress' | 'trainer';

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
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'exercises', label: 'Exercises', icon: Activity },
    { id: 'diet', label: 'Diet', icon: UtensilsCrossed },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'trainer', label: 'Trainer', icon: UserCheck }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0d14]/95 backdrop-blur-2xl border-t border-white/10 px-1 pt-2 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const hasActiveWorkout = tab.id === 'workout' && isWorkoutActive;

          return (
            <button
              key={tab.id}
              onClick={() => {
                hapticTap();
                onSelectTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active workout indicator pulse */}
              {hasActiveWorkout && !isActive && (
                <span className="absolute -top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
              {hasActiveWorkout && (
                <span className="absolute -top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0a0d14]" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'text-slate-400'
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
