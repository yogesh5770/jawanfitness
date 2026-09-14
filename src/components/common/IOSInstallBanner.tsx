import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Download, Monitor, Smartphone } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

export const IOSInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA / APK mode
    const standaloneCheck =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;

    setIsStandalone(standaloneCheck);

    // 2. Check OS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    const isDesktopDevice = !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsDesktop(isDesktopDevice);

    // 3. Check dismissal in session
    if (sessionStorage.getItem('jawan_pwa_banner_dismissed') === 'true') {
      setDismissed(true);
    }

    // 4. Capture standard Chromium install prompt (Android, Windows, Mac, Linux)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // If already running as an installed PWA or dismissed, don't show the floating prompt
  if (isStandalone || dismissed) return null;

  // Don't show if neither native prompt ready nor iOS
  if (!deferredPrompt && !isIOS && !isDesktop) return null;

  const handleInstallClick = async () => {
    hapticTap();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    hapticTap();
    sessionStorage.setItem('jawan_pwa_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom duration-300">
      <div className="relative bg-[#0c101a]/95 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-left">
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-black border border-amber-500/40 p-1 flex-shrink-0 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <h4 className="text-sm font-black text-white font-display uppercase tracking-wide">
                Install Jawan App
              </h4>
              <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded font-black font-tech uppercase">
                {isIOS ? 'iOS' : isDesktop ? 'Desktop / Laptop' : 'Android'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              {isDesktop
                ? 'Install on your Laptop/PC for a dedicated desktop window without browser URL bars!'
                : 'Install to your Home Screen for instant 1-tap launch, offline support & full-screen view!'}
            </p>
          </div>
        </div>

        {/* Action Button: One-Tap Install for Android & Laptop Chrome/Edge */}
        {deferredPrompt ? (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-tech">
              {isDesktop ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>Ready to install</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" />
              <span>Install Now</span>
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Safari Share instructions */
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <div className="flex items-center space-x-1.5">
              <span>1. Tap Share</span>
              <div className="p-1 rounded bg-slate-800 border border-white/20 text-sky-400 inline-flex">
                <Share className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-amber-400 font-bold">➔</span>
            <div className="flex items-center space-x-1.5">
              <span>2. 'Add to Home Screen'</span>
              <div className="p-1 rounded bg-slate-800 border border-white/20 text-emerald-400 inline-flex">
                <PlusSquare className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ) : (
          /* Desktop fallback instructions if prompt not fired yet */
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-tech">
            <span>Tip: Click the Install icon (⤓) in your browser address bar</span>
          </div>
        )}
      </div>
    </div>
  );
};
