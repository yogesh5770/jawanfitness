import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface FloatingCoachButtonProps {
  trainerName?: string;
  trainerAvatarUrl?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export const FloatingCoachButton: React.FC<FloatingCoachButtonProps> = ({
  trainerName = 'Coach',
  trainerAvatarUrl,
  isOnline = true,
  unreadCount = 0,
  onClick
}) => {
  return (
    <div className="fixed bottom-20 right-3 sm:right-6 z-40">
      <button
        onClick={() => {
          hapticTap();
          onClick();
        }}
        aria-label={`Chat with ${trainerName}`}
        title={`Chat with ${trainerName}`}
        className="group relative flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-black shadow-[0_4px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 border border-amber-300/40"
      >
        {/* Coach photo if provided, else luxury chat icon */}
        {trainerAvatarUrl ? (
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-black/20">
            <img src={trainerAvatarUrl} alt={trainerName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <MessageSquare className="w-5 h-5 fill-black stroke-black" />
        )}

        {/* Online pulse indicator */}
        {isOnline && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-[#04060a]" />
          </span>
        )}

        {/* Unread message badge */}
        {unreadCount > 0 && (
          <span className="absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-tech font-black text-[9px] border border-white">
            {unreadCount}
          </span>
        )}

        {/* Hover pill tag for laptop / tablet */}
        <span className="hidden md:group-hover:inline-block ml-2 text-xs font-black font-display tracking-tight text-black pr-1 whitespace-nowrap">
          Coach Support
        </span>
      </button>
    </div>
  );
};
