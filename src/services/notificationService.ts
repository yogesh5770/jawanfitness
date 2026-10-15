/**
 * JAWAN FITNESS — NATIVE PUSH & SCHEDULED LOCAL NOTIFICATIONS
 *
 * Provides real OS-level notifications on both:
 *  1. Native Android APK (via @capacitor/local-notifications)
 *     – Works even when the app is completely closed or killed.
 *     – Creates dedicated Android Notification Channels with sound and vibration.
 *     – Reschedules alarms on device reboot.
 *  2. Web PWA / Desktop (via HTML5 Web Notifications API & Service Worker)
 *
 * Core Notifications:
 *  • "Time for your workout today! [Split] is waiting 💪" (Daily scheduled)
 *  • "Drink water reminder 💧" (Hydration intervals: 10 AM, 1 PM, 4 PM, 7 PM)
 *  • "Coach replied to your message" (Instant alert on new trainer message)
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications, Channel } from '@capacitor/local-notifications';

export interface NotificationPreferences {
  workoutReminders: boolean;
  waterReminders: boolean;
  coachMessages: boolean;
  workoutTime: string; // '07:30' | '18:00' etc.
}

const DEFAULT_PREFS: NotificationPreferences = {
  workoutReminders: true,
  waterReminders: true,
  coachMessages: true,
  workoutTime: '07:30'
};

const PREFS_STORAGE_KEY = 'jawan_notification_preferences_v1';

// Notification IDs
const ID_WORKOUT_REMINDER = 1001;
const ID_WATER_MORNING = 2001;
const ID_WATER_NOON = 2002;
const ID_WATER_AFTERNOON = 2003;
const ID_WATER_EVENING = 2004;

class NotificationService {
  private initialized = false;
  private actionCallback: ((actionTab: 'home' | 'workout' | 'diet' | 'trainer') => void) | null = null;

  public async init(onAction?: (actionTab: 'home' | 'workout' | 'diet' | 'trainer') => void) {
    if (this.initialized) {
      if (onAction) this.actionCallback = onAction;
      return;
    }
    this.initialized = true;
    if (onAction) this.actionCallback = onAction;

    if (Capacitor.isNativePlatform()) {
      try {
        // 1. Create Android Notification Channels (Android 8.0+)
        await this.setupAndroidChannels();

        // 2. Listen for user tapping on a notification
        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          const extra = notificationAction.notification.extra;
          const targetTab = extra?.actionTab || 'home';
          if (this.actionCallback) {
            this.actionCallback(targetTab);
          }
        });
      } catch (err) {
        console.warn('[NotificationService] Native init warning:', err);
      }
    }
  }

  /**
   * Set callback for navigation when notification is tapped
   */
  public setActionHandler(handler: (actionTab: 'home' | 'workout' | 'diet' | 'trainer') => void) {
    this.actionCallback = handler;
  }

  /**
   * Request user permission for notifications (Android 13+ & Web PWA)
   */
  public async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } catch (err) {
        console.error('[NotificationService] Failed to request native permission:', err);
        return false;
      }
    }

    // Web / PWA fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch (err) {
        console.error('[NotificationService] Web notification permission error:', err);
        return false;
      }
    }

    return false;
  }

  /**
   * Check if notification permission is currently granted
   */
  public async isPermissionGranted(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        return status.display === 'granted';
      } catch {
        return false;
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }

    return false;
  }

  /**
   * Create dedicated Android Notification Channels
   */
  private async setupAndroidChannels() {
    if (!Capacitor.isNativePlatform()) return;

    const channels: Channel[] = [
      {
        id: 'jawan_workout_channel',
        name: 'Workout Missions',
        description: 'Daily workout reminders and routine prompts',
        importance: 4, // High priority
        visibility: 1, // Public on lockscreen
        sound: undefined,
        vibration: true,
        lights: true,
        lightColor: '#f59e0b' // Amber brand color
      },
      {
        id: 'jawan_water_channel',
        name: 'Hydration Reminders',
        description: 'Periodic reminders to drink water and log hydration',
        importance: 3, // Default priority
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#06b6d4' // Cyan color
      },
      {
        id: 'jawan_coach_channel',
        name: 'Coach Communications',
        description: 'Instant alerts when your trainer replies to your chat',
        importance: 5, // Max priority
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#10b981' // Emerald color
      }
    ];

    for (const channel of channels) {
      try {
        await LocalNotifications.createChannel(channel);
      } catch {
        // Channel already exists or unsupported
      }
    }
  }

  /**
   * Get user preferences from localStorage
   */
  public getPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  }

  /**
   * Update preferences and re-sync scheduled alarms
   */
  public async updatePreferences(prefs: Partial<NotificationPreferences>, assignedWorkoutTitle?: string) {
    const updated = { ...this.getPreferences(), ...prefs };
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await this.syncScheduledNotifications(assignedWorkoutTitle);
    return updated;
  }

  /**
   * Synchronize all scheduled alarms (Workout + Hydration)
   * Runs daily in the background even if the app is killed!
   */
  public async syncScheduledNotifications(assignedWorkoutTitle?: string) {
    const granted = await this.isPermissionGranted();
    if (!granted) return;

    const prefs = this.getPreferences();

    if (Capacitor.isNativePlatform()) {
      try {
        // Cancel existing workout & water notifications before rescheduling
        await LocalNotifications.cancel({
          notifications: [
            { id: ID_WORKOUT_REMINDER },
            { id: ID_WATER_MORNING },
            { id: ID_WATER_NOON },
            { id: ID_WATER_AFTERNOON },
            { id: ID_WATER_EVENING }
          ]
        });

        const pending = [];

        // 1. Schedule Daily Workout Reminder
        if (prefs.workoutReminders) {
          const [hourStr, minStr] = (prefs.workoutTime || '07:30').split(':');
          const targetHour = parseInt(hourStr, 10) || 7;
          const targetMin = parseInt(minStr, 10) || 30;

          const workoutName = assignedWorkoutTitle || 'Today\'s Routine';

          pending.push({
            id: ID_WORKOUT_REMINDER,
            title: 'Time for your workout today! 💪',
            body: `${workoutName} is waiting. Let's crush today's mission!`,
            channelId: 'jawan_workout_channel',
            schedule: {
              on: {
                hour: targetHour,
                minute: targetMin
              },
              allowWhileIdle: true
            },
            extra: {
              actionTab: 'workout'
            }
          });
        }

        // 2. Schedule Daily Hydration Reminders (10:00, 13:00, 16:00, 19:00)
        if (prefs.waterReminders) {
          const waterTimes = [
            { id: ID_WATER_MORNING, hour: 10, minute: 0, text: 'Morning hydration: drink a glass of water 💧' },
            { id: ID_WATER_NOON, hour: 13, minute: 0, text: 'Midday check-in: stay hydrated after lunch 💧' },
            { id: ID_WATER_AFTERNOON, hour: 16, minute: 0, text: 'Afternoon power: drink water for peak workout energy 💧' },
            { id: ID_WATER_EVENING, hour: 19, minute: 0, text: 'Evening hydration: finish your daily water goal 💧' }
          ];

          for (const item of waterTimes) {
            pending.push({
              id: item.id,
              title: 'Drink water reminder 💧',
              body: item.text,
              channelId: 'jawan_water_channel',
              schedule: {
                on: {
                  hour: item.hour,
                  minute: item.minute
                },
                allowWhileIdle: true
              },
              extra: {
                actionTab: 'diet'
              }
            });
          }
        }

        if (pending.length > 0) {
          await LocalNotifications.schedule({ notifications: pending });
        }
      } catch (err) {
        console.error('[NotificationService] Error scheduling native notifications:', err);
      }
    }
  }

  /**
   * Trigger Immediate Notification when Coach Replies to Message
   */
  public async notifyCoachMessage(trainerName: string, messageText: string) {
    const prefs = this.getPreferences();
    if (!prefs.coachMessages) return;

    const granted = await this.isPermissionGranted();
    if (!granted) return;

    const notifTitle = `Coach ${trainerName} replied to your message 💬`;
    const snippet = messageText.length > 70 ? `${messageText.substring(0, 67)}...` : messageText;

    // 1. Native Android Notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 8000) + 3000,
              title: notifTitle,
              body: snippet,
              channelId: 'jawan_coach_channel',
              schedule: { at: new Date(Date.now() + 200) },
              extra: {
                actionTab: 'trainer'
              }
            }
          ]
        });
        return;
      } catch (err) {
        console.error('[NotificationService] Error showing native coach notification:', err);
      }
    }

    // 2. Web / PWA Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(notifTitle, {
          body: snippet,
          icon: '/logo-3d-tight.png',
          badge: '/logo-3d-tight.png',
          tag: 'jawan-coach-msg'
        });

        notif.onclick = () => {
          window.focus();
          if (this.actionCallback) this.actionCallback('trainer');
        };
      } catch (err) {
        console.warn('[NotificationService] Web notification trigger error:', err);
      }
    }
  }

  /**
   * Trigger Immediate Test Notification (useful for settings screen verification)
   */
  public async sendTestNotification(type: 'workout' | 'water' | 'coach'): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) return false;

    let title = '';
    let body = '';
    let channelId = '';
    let actionTab: 'home' | 'workout' | 'diet' | 'trainer' = 'home';

    if (type === 'workout') {
      title = 'Time for your workout today! Push Day is waiting 💪';
      body = 'Your coach assigned Chest + Triceps. Tap to open your session!';
      channelId = 'jawan_workout_channel';
      actionTab = 'workout';
    } else if (type === 'water') {
      title = 'Drink water reminder 💧';
      body = 'Stay hydrated! Tap to quickly log +250ml water.';
      channelId = 'jawan_water_channel';
      actionTab = 'diet';
    } else {
      title = 'Coach replied to your message 💬';
      body = 'Coach: "Great form on your bench press today! Keep pushing."';
      channelId = 'jawan_coach_channel';
      actionTab = 'trainer';
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 8000) + 9000,
              title,
              body,
              channelId,
              schedule: { at: new Date(Date.now() + 500) },
              extra: { actionTab }
            }
          ]
        });
        return true;
      } catch (err) {
        console.error('[NotificationService] Native test error:', err);
        return false;
      }
    }

    // Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/logo-3d-tight.png',
        tag: `jawan-test-${type}`
      });
      notif.onclick = () => {
        window.focus();
        if (this.actionCallback) this.actionCallback(actionTab);
      };
      return true;
    }

    return false;
  }
}

export const notificationService = new NotificationService();
