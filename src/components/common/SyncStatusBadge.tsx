import React from 'react';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface SyncStatusBadgeProps {
  /** Compact mode for tight headers */
  compact?: boolean;
}

/**
 * Real, honest sync indicator driven by cloudDbService state.
 * LIVE only appears after a successful sync — never faked.
 */
export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ compact = false }) => {
  const status = useSyncStatus();

  const view = (() => {
    switch (status.syncStatus) {
      case 'synced':
        return {
          label: compact ? 'LIVE' : 'LIVE SYNC',
          className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          dotClass: 'bg-emerald-500 animate-pulse'
        };
      case 'syncing':
        return {
          label: compact ? 'SYNC' : 'SYNCING',
          className: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
          dotClass: 'bg-amber-500 animate-pulse'
        };
      case 'error':
        return {
          label: compact ? 'OFFLINE' : 'OFFLINE',
          className: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
          dotClass: 'bg-rose-500'
        };
      default:
        return {
          label: compact ? 'IDLE' : 'STANDBY',
          className: 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
          dotClass: 'bg-slate-400'
        };
    }
  })();

  return (
    <div
      title={status.errorMessage || `${status.activeProvider} — last sync ${status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'never'}`}
      className={`flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${view.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${view.dotClass}`} />
      <span>{view.label}</span>
    </div>
  );
};
