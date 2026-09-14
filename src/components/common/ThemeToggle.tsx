import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { themeService, ThemeMode } from '../../services/themeService';
import { hapticTap } from '../../utils/audioHaptics';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => themeService.getTheme());

  useEffect(() => {
    return themeService.subscribe((newTheme) => {
      setTheme(newTheme);
    });
  }, []);

  const handleToggle = () => {
    hapticTap();
    themeService.toggleTheme();
  };

  const isLight = theme === 'light';

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border active:scale-95 ${
        isLight
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 hover:bg-amber-500/20 shadow-sm'
          : 'bg-slate-900/80 border-white/10 text-amber-400 hover:bg-slate-800 shadow-md'
      } ${className}`}
      title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
      aria-label={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isLight ? (
          <Sun className="w-4 h-4 text-amber-600 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-amber-400 transition-transform duration-300 -rotate-12 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-tech font-bold uppercase tracking-wider">
          {isLight ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
