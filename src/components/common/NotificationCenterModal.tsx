import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Dumbbell, 
  Flame, 
  Droplets, 
  Trophy, 
  MessageSquare, 
  Check, 
  Trash2,
  ChevronRight,
  Clock
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'diet' | 'water' | 'chat' | 'achievement';
  timestamp: number;
  read: boolean;
  actionTab?: 'home' | 'workout' | 'diet' | 'progress' | 'trainer';
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotificationAction: (tab: 'home' | 'workout' | 'diet' | 'progress' | 'trainer') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotificationAction
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="w-4 h-4 text-amber-500" />;
      case 'diet':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatTime = (ts: number) => {
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 60) return `${Math.max(1, diffMin)}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">
                Notification Center
              </h3>
              <span className="text-[10px] text-slate-500 font-tech">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  hapticTap();
                  onMarkAllRead();
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-tech text-amber-600 dark:text-amber-400 font-bold border border-slate-200 dark:border-white/5 transition-all"
              >
                Mark Read
              </button>
            )}
            <button
              onClick={() => {
                hapticTap();
                onClose();
              }}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-none">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 opacity-60" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Notifications</p>
              <p className="text-[11px] text-slate-400">You will receive reminders for workouts, meals and coach notes here.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  hapticTap();
                  if (item.actionTab) {
                    onSelectNotificationAction(item.actionTab);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  !item.read
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-300/40 dark:border-white/10">
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[9px] font-tech text-slate-400 ml-1 flex-shrink-0">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {item.actionTab && (
                  <ChevronRight className="w-4 h-4 text-slate-400 self-center flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
