import React, { forwardRef, useRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      className = '',
      onFocus,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
    const reactGeneratedId = useId();
    const inputId = id || reactGeneratedId;

    // Scroll input into visible view when mobile software keyboard opens
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        if (e.target) {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      if (onFocus) onFocus(e);
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 px-0.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={inputRef}
            onFocus={handleFocus}
            className={`w-full min-h-[48px] bg-slate-100 dark:bg-[#07090e] border ${
              error
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-200 dark:border-white/10 focus:border-amber-500'
            } rounded-2xl text-sm text-slate-900 dark:text-white outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              leftIcon ? 'pl-11' : 'pl-4'
            } ${rightIcon ? 'pr-11' : 'pr-4'} ${className}`.trim()}
            {...rest}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 group-focus-within:text-amber-500 transition-colors">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] text-rose-500 font-medium px-1 animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
