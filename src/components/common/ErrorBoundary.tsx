/**
 * JAWAN FITNESS — REACT ERROR BOUNDARY
 *
 * Wraps each role shell (ClientApp, TrainerApp, AdminApp) so an unhandled
 * component-level JS error cannot crash the entire application. Shows a
 * recovery UI with a "Try Again" button and an optional "Go to Login" escape hatch.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional human-readable label shown in the error card (e.g. "Member Portal") */
  portalLabel?: string;
  /** Called when user clicks "Back to Login" */
  onResetToLogin?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console so it's visible in Cloudflare Pages deployment logs / browser devtools
    console.error('[JawanFitness ErrorBoundary]', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { portalLabel = 'App', onResetToLogin } = this.props;

    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-[#04060a] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-white dark:bg-[#0c101a] border border-rose-500/30 rounded-3xl p-6 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white font-display">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              The <span className="font-bold text-slate-700 dark:text-slate-300">{portalLabel}</span> encountered
              an unexpected error. Your workout and nutrition data are safe — this is a UI error only.
            </p>
          </div>

          {/* Error detail (collapsed by default for cleanliness) */}
          {this.state.error && (
            <details className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 leading-relaxed cursor-pointer">
              <summary className="font-bold text-rose-700 dark:text-rose-300 cursor-pointer select-none">
                Error details (tap to expand)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all opacity-80">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack
                  ? `\n\nComponent stack:${this.state.errorInfo.componentStack}`
                  : ''}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={this.handleRetry}
              className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase font-display tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            {onResetToLogin && (
              <button
                onClick={onResetToLogin}
                className="w-full min-h-[48px] py-3 px-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center space-x-2 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
