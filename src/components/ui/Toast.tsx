import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'success',
  message,
  onDismiss
}) => {
  const icon = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center space-x-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.3)] text-xs text-slate-900 dark:text-white max-w-sm w-full animate-in slide-in-from-top-2 duration-200"
    >
      {icon}
      <p className="flex-1 font-medium leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={() => {
          hapticTap();
          onDismiss(id);
        }}
        aria-label="Dismiss notification"
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer rounded-xl"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
