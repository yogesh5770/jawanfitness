import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...rest
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8'
  }[padding];

  const variantClasses = {
    default:
      'bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md',
    elevated:
      'bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)]',
    glass:
      'bg-white/80 dark:bg-[#0b0e18]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md',
    interactive:
      'bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-md'
  }[variant];

  return (
    <div
      className={`rounded-3xl relative overflow-hidden transition-colors ${paddingClasses} ${variantClasses} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
};
