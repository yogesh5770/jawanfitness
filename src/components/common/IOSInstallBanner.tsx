import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IOSInstallBanner: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running on iOS Safari and NOT already installed as standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone = 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;

    // Check if dismissed previously in session
    const hasDismissed = sessionStorage.getItem('dismiss_ios_pwa_prompt');

    if (isIOS && !isStandalone && !hasDismissed) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom duration-300">
      <div className="relative bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8)] text-left">
        <button
          onClick={() => {
            sessionStorage.setItem('dismiss_ios_pwa_prompt', 'true');
            setShowPrompt(false);
          }}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3.5 pr-6">
          <div className="w-11 h-11 rounded-xl bg-black border border-amber-500/40 p-1 flex-shrink-0 flex items-center justify-center">
            <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display flex items-center space-x-1.5">
              <span>Install Jawan Fitness App</span>
              <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black">iOS</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Install this app on your iPhone for offline workout tracking and zero browser address bar!
            </p>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-medium">
          <div className="flex items-center space-x-1.5">
            <span>1. Tap Share</span>
            <div className="p-1 rounded bg-slate-800 border border-white/20 text-sky-400 inline-flex">
              <Share className="w-3.5 h-3.5" />
            </div>
          </div>
          <span>➔</span>
          <div className="flex items-center space-x-1.5">
            <span>2. 'Add to Home Screen'</span>
            <div className="p-1 rounded bg-slate-800 border border-white/20 text-emerald-400 inline-flex">
              <PlusSquare className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
