import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      onClick,
      disabled,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;
      hapticTap();
      if (onClick) onClick(e);
    };

    // Base styling ensuring 48dp minimum touch target
    const baseClasses =
      'relative inline-flex items-center justify-center font-display font-bold select-none cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-50 disabled:pointer-events-none min-h-[48px] min-w-[48px]';

    const sizeClasses = {
      sm: 'px-3 py-2 text-xs rounded-xl',
      md: 'px-4 py-2.5 text-sm rounded-2xl',
      lg: 'px-6 py-3.5 text-base rounded-2xl'
    }[size];

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_4px_20px_rgba(245,158,11,0.25)] border border-amber-400/40',
      secondary:
        'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm',
      outline:
        'bg-transparent hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/40',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
      danger:
        'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30'
    }[variant];

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`.trim()}
        {...rest}
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Loading...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
