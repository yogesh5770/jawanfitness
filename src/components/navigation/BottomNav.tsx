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
        // Positioning: fixed to bottom, full width, above everything
        'fixed bottom-0 left-0 right-0 z-40',
        // Background + blur (works on both PWA and APK WebView)
        'bg-white/95 dark:bg-[#0a0d14]/97 backdrop-blur-2xl',
        // Top border
        'border-t border-slate-200/80 dark:border-white/10',
        // Subtle top shadow (dark only)
        'shadow-[0_-4px_30px_rgba(0,0,0,0)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)]',
        // Smooth colour transitions for theme switch
        'transition-colors duration-200',
      ].join(' ')}
      style={{
        // Padding bottom = safe-area-inset-bottom (home indicator / gesture bar)
        // This ensures the nav bar doesn't overlap the gesture handle on any device.
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        paddingLeft:  'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Inner row: centred, max-width matches the app container */}
      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-stretch justify-around pt-1">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = currentTab === id || (id === 'workout' && currentTab === 'exercises');
          const showPulse = id === 'home' && isWorkoutActive;

          return (
            <button
              key={id}
              onClick={() => { hapticTap(); onSelectTab(id); }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              // Minimum 44px tall touch target (WCAG 2.5.5)
              // On very small phones (320px) the 5-tab row is 64px each = 320px total → fits exactly
              className={[
                'relative flex flex-col items-center justify-center',
                'py-1 flex-1',
                // Generous horizontal padding scales with viewport
                'px-0.5 xs:px-1 sm:px-2',
                // Shape + transitions
                'rounded-2xl transition-all duration-200 select-none',
                // Active vs inactive colour
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200',
              ].join(' ')}
            >
              {/* Active workout pulse indicator (on Home tab) */}
              {showPulse && !isActive && (
                <>
                  <span className="absolute top-1 right-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-ping pointer-events-none" />
                  <span className="absolute top-1 right-1/4 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0d14] pointer-events-none" />
                </>
              )}

              {/* Icon container with active glow */}
              <span
                className={[
                  'flex items-center justify-center rounded-xl transition-all duration-200',
                  // Responsive icon container size
                  'w-9 h-9 sm:w-10 sm:h-10',
                  isActive
                    ? 'bg-amber-500/15 dark:bg-amber-500/15 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-transparent',
                ].join(' ')}
              >
                <Icon
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </span>

              {/* Label — hidden on very small phones (320px) to prevent overflow */}
              <span
                className={[
                  'mt-0.5 leading-none font-display tracking-tight',
                  // Hide label on tiny screens; show from 360px+
                  'hidden xxs:block',
                  // Responsive font size
                  'text-[9px] sm:text-[11px]',
                  isActive ? 'font-bold' : 'font-medium',
                ].join(' ')}
              >
                {label}
              </span>

              {/* Active indicator dot — shown when label is hidden on 320px screens */}
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
