import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hapticTap();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl'
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hapticTap();
          onClose();
        }
      }}
    >
      {/* Container: Bottom Sheet on Mobile (<768px), Centered Modal on Tablet/Desktop (>=768px) */}
      <div
        ref={modalRef}
        className={`w-full ${maxWidthClasses} bg-white dark:bg-[#0c101a] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-[32px] sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[90dvh] flex flex-col text-left overflow-hidden animate-in slide-in-from-bottom duration-250`}
      >
        {/* Mobile Swipe Handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-4 sm:p-6 pb-2 sm:pb-3 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
            <div className="min-w-0 flex-1 pr-4">
              {typeof title === 'string' ? (
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display tracking-tight truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                }}
                aria-label="Close dialog"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body with smooth touch scrolling */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
