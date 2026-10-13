/**
 * JAWAN FITNESS — BOTTOM NAVIGATION
 *
 * Supports every screen size and platform:
 *  • 320px (iPhone SE 1st gen, Galaxy A01)
 *  • 360–390px (most mid-range Android phones)
 *  • 390–430px (iPhone 14/15 Pro Max, S24 Ultra)
 *  • 768px+ (tablets — switches to sidebar-style on landscape)
 *  • Landscape phone (compact height, horizontal label placement)
 *  • PWA window-controls-overlay desktop mode
 *
 * Safe-area handling:
 *  • iOS notch / Dynamic Island / home indicator (env(safe-area-inset-bottom))
 *  • Android edge-to-edge gesture bar
 *  • Capacitor APK — same CSS env() values work inside the WebView
 */

import React from 'react';
import { Home, Dumbbell, UtensilsCrossed, TrendingUp, User } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export type TabType = 'home' | 'workout' | 'diet' | 'progress' | 'profile' | 'exercises' | 'trainer';

interface Tab {
  id: TabType;
  label: string;
  Icon: React.FC<{ className?: string; strokeWidth?: number }>;
}

const TABS: Tab[] = [
  { id: 'home',     label: 'Home',      Icon: Home },
  { id: 'workout',  label: 'Workout',   Icon: Dumbbell },
  { id: 'diet',     label: 'Nutrition', Icon: UtensilsCrossed },
  { id: 'progress', label: 'Progress',  Icon: TrendingUp },
  { id: 'profile',  label: 'Profile',   Icon: User },
];

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isWorkoutActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isWorkoutActive = false,
}) => {
  return (
    <nav
      aria-label="Main navigation"
      className={[
        // Mobile: fixed bottom bar
        'fixed bottom-0 left-0 right-0 z-40',
        // Tablet: fixed left rail (width 5rem = 80px)
        'md:top-0 md:bottom-0 md:right-auto md:w-20',
        // Desktop: fixed left sidebar (width 16rem = 256px)
        'lg:w-64',
        // Surfaces & styling
        'bg-white/95 dark:bg-[#0a0d14]/97 backdrop-blur-2xl',
        // Borders: top border on phone, right border on tablet/desktop
        'border-t md:border-t-0 md:border-r border-slate-200/80 dark:border-white/10',
        // Shadows
        'shadow-[0_-4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)] md:shadow-[4px_0_30px_rgba(0,0,0,0.05)]',
        'transition-colors duration-200 flex flex-col justify-between'
      ].join(' ')}
      style={{
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Tablet & Desktop Header: Logo & Brand */}
      <div className="hidden md:flex items-center space-x-3 p-4 pb-2 border-b border-slate-100 dark:border-white/5">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-1 flex items-center justify-center shadow flex-shrink-0">
          <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain drop-shadow" />
        </div>
        <div className="hidden lg:block min-w-0">
          <h2 className="text-sm font-black text-slate-900 dark:text-white font-display tracking-wider uppercase leading-none">
            JAWAN <span className="text-amber-500">FITNESS</span>
          </h2>
          <p className="text-[10px] font-tech text-slate-400 uppercase tracking-widest mt-1">
            Athlete OS
          </p>
        </div>
      </div>

      {/* Navigation Links: Horizontal on mobile, vertical stack on tablet/desktop */}
      <div className="w-full max-w-lg md:max-w-none mx-auto flex md:flex-col items-stretch justify-around md:justify-start md:space-y-1.5 pt-1 md:pt-4 md:px-2 flex-1">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = currentTab === id || (id === 'workout' && currentTab === 'exercises');
          const showPulse = id === 'home' && isWorkoutActive;

          return (
            <button
              key={id}
              onClick={() => { hapticTap(); onSelectTab(id); }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'relative flex flex-col md:flex-col lg:flex-row items-center justify-center lg:justify-start',
                'py-1 md:py-2.5 lg:py-3 flex-1 md:flex-none',
                'px-0.5 xs:px-1 sm:px-2 lg:px-4',
                'rounded-2xl transition-all duration-200 select-none cursor-pointer',
                // Active vs inactive colors
                isActive
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 md:bg-amber-500/15 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5',
              ].join(' ')}
            >
              {/* Active workout pulse indicator (on Home tab) */}
              {showPulse && !isActive && (
                <>
                  <span className="absolute top-1 right-1/4 md:top-2 md:right-2 w-2 h-2 bg-emerald-500 rounded-full animate-ping pointer-events-none" />
                  <span className="absolute top-1 right-1/4 md:top-2 md:right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0d14] pointer-events-none" />
                </>
              )}

              {/* Icon container with active glow */}
              <span
                className={[
                  'flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0',
                  'w-9 h-9 sm:w-10 sm:h-10 lg:mr-3',
                  isActive
                    ? 'scale-105'
                    : 'bg-transparent',
                ].join(' ')}
              >
                <Icon
                  className="w-5 h-5 sm:w-[20px] sm:h-[20px]"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </span>

              {/* Label */}
              <span
                className={[
                  'mt-0.5 lg:mt-0 leading-none font-display tracking-tight text-center lg:text-left',
                  'hidden xxs:block md:block',
                  'text-[10px] sm:text-[11px] lg:text-sm',
                  isActive ? 'font-bold' : 'font-medium',
                ].join(' ')}
              >
                {label}
              </span>

              {/* Active dot indicator on 320px screens where text is hidden */}
              {isActive && (
                <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400 xxs:hidden" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
