import React from 'react';
import { hapticTap } from '../../utils/audioHaptics';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = ''
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1 -mx-1 px-1 select-none ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              hapticTap();
              onChange(tab.id);
            }}
            className={`min-h-[48px] px-4 py-2 rounded-2xl text-xs font-tech font-bold uppercase tracking-wider flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/5'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? 'bg-black/20 text-black'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
