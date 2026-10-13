/**
 * JAWAN FITNESS — NATIVE ANDROID & PWA PLATFORM BRIDGE
 * Handles native Material 3 status bar styling, hardware back-button stack,
 * and native haptic motor triggers.
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Global back-button handler stack (LIFO)
type BackHandler = () => boolean; // return true if handled, false to delegate down
const backHandlers: BackHandler[] = [];

export function registerBackButtonHandler(handler: BackHandler): () => void {
  backHandlers.push(handler);
  return () => {
    const idx = backHandlers.indexOf(handler);
    if (idx !== -1) backHandlers.splice(idx, 1);
  };
}

class NativePlatformService {
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    if (!Capacitor.isNativePlatform()) return;

    // 1. Configure Android Edge-to-Edge Status Bar
    this.updateStatusBar(document.documentElement.classList.contains('dark'));

    // 2. Configure Android Hardware Back Button (LIFO Stack)
    CapApp.addListener('backButton', ({ canGoBack }) => {
      // Execute the topmost registered handler (e.g. close active modal/sheet)
      for (let i = backHandlers.length - 1; i >= 0; i--) {
        const handled = backHandlers[i]();
        if (handled) return;
      }

      // If at root and cannot go back in browser history, exit app
      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });
  }

  public updateStatusBar(isDark: boolean) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light
      }).catch(() => {});

      if (Capacitor.getPlatform() === 'android') {
        StatusBar.setBackgroundColor({
          color: isDark ? '#07090e' : '#f4f6fb'
        }).catch(() => {});
      }
    } catch {
      // Ignore if unsupported
    }
  }

  public async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    if (Capacitor.isNativePlatform()) {
      try {
        if (type === 'light') await Haptics.impact({ style: ImpactStyle.Light });
        else if (type === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
        else if (type === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
        else if (type === 'success') await Haptics.notification({ type: NotificationType.Success });
        else if (type === 'warning') await Haptics.notification({ type: NotificationType.Warning });
        else if (type === 'error') await Haptics.notification({ type: NotificationType.Error });
        return;
      } catch {
        // Fallback
      }
    }

    // Web vibration API fallback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') navigator.vibrate(20);
      else if (type === 'medium') navigator.vibrate(40);
      else if (type === 'heavy') navigator.vibrate(80);
      else if (type === 'success') navigator.vibrate([40, 60, 80]);
      else if (type === 'error') navigator.vibrate([100, 50, 100]);
    }
  }
}

export const nativePlatform = new NativePlatformService();
