/**
 * JAWAN FITNESS — UNIVERSAL PWA INSTALL BANNER
 *
 * Handles every install surface across all OS / browsers:
 *
 * 1. iOS Safari (iPhone / iPad / iPod) — Share → Add to Home Screen instructions
 * 2. Android Chrome / Samsung Internet / Edge / Brave — beforeinstallprompt one-tap
 * 3. Windows 10/11 Chrome & Edge — beforeinstallprompt desktop install
 * 4. macOS Chrome & Edge — beforeinstallprompt desktop install
 * 5. Linux Chrome — beforeinstallprompt desktop install
 * 6. Firefox (Android & Desktop) — manual browser menu instructions
 * 7. Safari macOS — manual instructions (File > Add to Dock / Favorites)
 * 8. Already installed as standalone / Capacitor APK — hidden (no duplicate prompt)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Share, PlusSquare, X, Download, Monitor, Smartphone, Laptop, Apple } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

// ─── Platform detection helpers ──────────────────────────────────────────────

function detectPlatform() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isWindows: false, isMacOS: false, isLinux: false, isSamsungBrowser: false, isFirefox: false, isSafariDesktop: false, isChromeLike: false };
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  // iPadOS 13+ reports as Macintosh — detect via touch points
  const isIPadOS = !isIOS && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) && !isIPadOS;
  const isLinux = /Linux/i.test(ua) && !isAndroid;
  const isSamsungBrowser = /SamsungBrowser/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const isSafariDesktop = /Safari/i.test(ua) && !/Chrome|CriOS|OPR|Edge/i.test(ua) && isMacOS;
  const isChromeLike = /Chrome|CriOS|Chromium|Edg|OPR|Brave/i.test(ua);

  return {
    isIOS: isIOS || isIPadOS,
    isAndroid,
    isWindows,
    isMacOS,
    isLinux,
    isSamsungBrowser,
    isFirefox,
    isSafariDesktop,
    isChromeLike
  };
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const DISMISS_KEY = 'jawan_pwa_banner_dismissed_v2';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days before re-showing

export const IOSInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState<boolean>(() => isRunningStandalone());
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        return !isNaN(ts) && Date.now() - ts < DISMISS_DURATION_MS;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [platform] = useState<ReturnType<typeof detectPlatform> | null>(() =>
    typeof window !== 'undefined' ? detectPlatform() : null
  );

  useEffect(() => {
    if (installed) return;

    // 3. Capture standard Chromium beforeinstallprompt
    //    (Android Chrome, Samsung Internet, Windows/macOS/Linux Chrome & Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Track if the user installs via any other mechanism
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [installed]);

  const handleInstallClick = useCallback(async () => {
    hapticTap();
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setDeferredPrompt(null);
      }
    } catch {
      // prompt() can throw if called after user gesture window expires
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    hapticTap();
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  // ─── Guard conditions ───────────────────────────────────────────────────────
  if (installed || dismissed || !platform) return null;

  const { isIOS, isAndroid, isWindows, isMacOS, isLinux, isSamsungBrowser, isFirefox, isSafariDesktop } = platform;

  // Determine what label/icon/instruction to show
  const isDesktop = isWindows || isMacOS || isLinux;

  // We always want to show the banner on:
  //  - iOS Safari (manual instructions)
  //  - Any device where beforeinstallprompt fired
  //  - Firefox mobile/desktop (manual instructions)
  //  - Safari macOS (manual instructions)
  //  - Desktop if prompt available
  const shouldShow =
    deferredPrompt != null ||   // Chromium-based: Android/Windows/macOS/Linux
    isIOS ||                    // iOS / iPadOS Safari
    isFirefox ||                // Firefox
    isSafariDesktop;            // Safari macOS

  if (!shouldShow) return null;

  // ─── OS label and icon ─────────────────────────────────────────────────────
  const osLabel =
    isIOS ? 'iOS / iPadOS' :
    isAndroid && isSamsungBrowser ? 'Samsung Internet' :
    isAndroid ? 'Android' :
    isWindows ? 'Windows' :
    isMacOS ? 'macOS' :
    isLinux ? 'Linux' :
    'Browser';

  const OsIcon = isIOS ? Apple : isDesktop ? (isWindows ? Monitor : Laptop) : Smartphone;

  // ─── Instruction content ───────────────────────────────────────────────────
  const renderInstructions = () => {
    // One-tap native install (Chromium beforeinstallprompt — Android, Windows, macOS, Linux)
    if (deferredPrompt) {
      return (
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-tech">
            <OsIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Ready to install on {osLabel}</span>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center space-x-1.5 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[3]" />
            <span>Install Now</span>
          </button>
        </div>
      );
    }

    // iOS / iPadOS Safari — Share → Add to Home Screen
    if (isIOS) {
      return (
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Two quick steps in Safari:</p>
          <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-medium gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/60 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
              <span className="text-slate-500 dark:text-slate-400">1.</span>
              <span>Tap</span>
              <div className="p-1 rounded bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 inline-flex">
                <Share className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-700 dark:text-slate-300">Share</span>
            </div>
            <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">→</span>
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/60 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
              <span className="text-slate-500 dark:text-slate-400">2.</span>
              <div className="p-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 inline-flex">
                <PlusSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-[10px]">'Add to Home Screen'</span>
            </div>
          </div>
        </div>
      );
    }

    // Firefox (Android or Desktop) — manual instructions
    if (isFirefox) {
      return (
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
          <span className="text-slate-500 dark:text-slate-400">In Firefox:</span>{' '}
          tap the <span className="text-amber-600 dark:text-amber-400 font-bold">⋮ menu</span> → "Install" or "Add to Home Screen"
        </div>
      );
    }

    // Safari macOS — manual instructions
    if (isSafariDesktop) {
      return (
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
          <span className="text-slate-500 dark:text-slate-400">In Safari on Mac:</span>{' '}
          go to <span className="text-amber-600 dark:text-amber-400 font-bold">File → Add to Dock…</span> to install
        </div>
      );
    }

    return null;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-[60] max-w-md mx-auto"
      role="complementary"
      aria-label="Install Jawan Fitness App"
    >
      <div
        className="relative bg-white dark:bg-[#0c101a]/96 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-left"
        style={{ animation: 'slideUpFadeIn 0.35s ease both' }}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header row */}
        <div className="flex items-start space-x-3 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-black border border-amber-500/40 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 mb-0.5 flex-wrap gap-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wide leading-none">
                Install Jawan Fitness
              </h4>
              <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black font-tech uppercase leading-none flex-shrink-0">
                {osLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {isDesktop
                ? 'Install on your PC / Laptop for a dedicated window — no browser bar, instant launch.'
                : 'Install to your Home Screen for instant launch, offline support & full-screen workout view.'}
            </p>
          </div>
        </div>

        {renderInstructions()}
      </div>

      {/* Keyframe for the slide-up animation */}
      <style>{`
        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
