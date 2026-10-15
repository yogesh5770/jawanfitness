import React, { useState, useEffect } from 'react';
import { KeyRound, LogOut, Phone, ChevronRight, Bell, BellRing, Droplets, Dumbbell, MessageSquare, Check, Sparkles, UserX } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { ThemeToggle } from '../common/ThemeToggle';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { ClientData, TrainerData } from '../../services/syncedStore';
import { notificationService, NotificationPreferences } from '../../services/notificationService';

interface ProfileScreenProps {
  client: ClientData;
  assignedTrainer?: TrainerData | null;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  client,
  assignedTrainer,
  onOpenChangePassword,
  onLogout
}) => {
  const [hasNotifPermission, setHasNotifPermission] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() => notificationService.getPreferences());
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    notificationService.isPermissionGranted().then(setHasNotifPermission);
  }, []);

  const handleRequestPermission = async () => {
    hapticTap();
    const granted = await notificationService.requestPermission();
    setHasNotifPermission(granted);
    if (granted) {
      await notificationService.syncScheduledNotifications();
      setTestStatus('Notifications active! Reminders scheduled.');
      setTimeout(() => setTestStatus(null), 3500);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    hapticTap();
    if (!hasNotifPermission) {
      await handleRequestPermission();
    }
    const updated = await notificationService.updatePreferences({
      [key]: !notifPrefs[key]
    });
    setNotifPrefs(updated);
  };

  const handleTestAlert = async (type: 'workout' | 'water' | 'coach') => {
    hapticTap();
    const success = await notificationService.sendTestNotification(type);
    if (success) {
      setTestStatus(`Test ${type} notification dispatched!`);
      setTimeout(() => setTestStatus(null), 3000);
    } else {
      setTestStatus('Please grant notification permission first.');
      setTimeout(() => setTestStatus(null), 3000);
    }
  };
  const memberInitials = (client.name || 'Member')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const heightMeters = (client.heightCm || 170) / 100;
  const currentBmi = ((client.currentWeightKg || 80) / (heightMeters * heightMeters)).toFixed(1);

  const bmiValue = parseFloat(currentBmi);
  const bmiCategory =
    bmiValue < 18.5
      ? { label: 'Underweight', color: 'text-sky-600 dark:text-sky-400' }
      : bmiValue < 25
      ? { label: 'Normal', color: 'text-emerald-600 dark:text-emerald-400' }
      : bmiValue < 30
      ? { label: 'Overweight', color: 'text-amber-600 dark:text-amber-400' }
      : { label: 'Obese', color: 'text-rose-600 dark:text-rose-400' };

  return (
    <div className="space-y-4 pb-28 text-left animate-fadeIn max-w-xl mx-auto">
      {/* 1. Member Executive Profile Header */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-black font-black text-xl flex items-center justify-center font-display shadow-lg shadow-amber-500/20 border border-amber-300/40 flex-shrink-0">
            {memberInitials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display truncate">
                {client.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-tech border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-tech mt-0.5 truncate">
              ID: {client.loginId || client.id} • {client.gymId || 'JAWAN-SALEM-01'}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate mt-0.5">
              Goal: {client.goal || 'Weight Loss & Hypertrophy'}
            </p>
          </div>
        </div>

        {/* Biometrics Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">Height</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-tech">
              {client.heightCm} cm
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">Current</span>
            <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-tech">
              {client.currentWeightKg} kg
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">Target</span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-tech">
              {client.goalWeightKg} kg
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] font-tech uppercase text-slate-500 block">BMI</span>
            <span className="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400 font-tech">
              {currentBmi}
            </span>
            <span className={`text-[8px] font-tech font-bold leading-tight block ${bmiCategory.color}`}>
              {bmiCategory.label}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Personal Coach Card */}
      {assignedTrainer && assignedTrainer.name && assignedTrainer.name !== 'Unassigned' ? (
        <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 font-bold block">
              ASSIGNED PERSONAL COACH
            </span>
            <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-amber-500/30">
                {assignedTrainer.avatarUrl ? (
                  <img src={assignedTrainer.avatarUrl} alt={assignedTrainer.name} className="w-full h-full object-cover" />
                ) : (
                  assignedTrainer.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white font-display">
                  {assignedTrainer.name}
                </h4>
                <span className="text-xs text-slate-500 font-tech block">
                  {assignedTrainer.role || 'Personal Fitness Coach'}
                </span>
              </div>
            </div>

            {assignedTrainer.phone && (
              <a
                href={`https://wa.me/${assignedTrainer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hapticTap()}
                className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 text-xs font-tech font-bold transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c101a] border border-amber-500/20 rounded-3xl p-4 shadow-sm dark:shadow-md transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 font-bold block">
              ASSIGNED PERSONAL COACH
            </span>
            <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Unassigned
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white font-display">
                  No Coach Assigned
                </h4>
                <span className="text-xs text-slate-500 font-tech block">
                  Gym Director will assign your coach
                </span>
              </div>
            </div>

            <a
              href="https://wa.me/919790228874?text=Hello%20Jawan%20Fitness%2C%20please%20assign%20a%20personal%20coach%20to%20my%20membership."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticTap()}
              className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center space-x-1 text-xs font-tech font-bold transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Front Desk</span>
            </a>
          </div>
        </div>
      )}

      {/* 3. Real Native Push Notifications & Scheduled Reminders */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-md space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 font-bold block mb-0.5">
              DEVICE NOTIFICATIONS & ALARMS
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">
              Push & Scheduled Reminders
            </h3>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
              hasNotifPermission
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasNotifPermission ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{hasNotifPermission ? 'Active (Works Offline)' : 'Permission Needed'}</span>
          </span>
        </div>

        {/* Permission Request Prompt if not granted */}
        {!hasNotifPermission && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5">
              <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">Enable Phone Alerts</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Receive workout & hydration alarms even when the app is closed.</span>
              </div>
            </div>
            <button
              onClick={handleRequestPermission}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider shadow active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer flex-shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Allow Notifications</span>
            </button>
          </div>
        )}

        {/* Feedback message banner */}
        {testStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-tech flex items-center space-x-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{testStatus}</span>
          </div>
        )}

        {/* Notification Channels List */}
        <div className="space-y-2.5">
          {/* Channel 1: Daily Workout Reminder */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Daily Workout Reminder</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-tech">
                  "Time for your workout today! Push Day is waiting 💪"
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-tech">Scheduled daily at 07:30 AM</span>
              </div>
            </div>

            <button
              onClick={() => handleTogglePref('workoutReminders')}
              aria-label="Toggle workout reminders"
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                notifPrefs.workoutReminders ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${
                  notifPrefs.workoutReminders ? 'translate-x-6 left-0' : 'translate-x-1 left-0'
                }`}
              />
            </button>
          </div>

          {/* Channel 2: Hydration Reminders */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Drink Water Reminders</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-tech">
                  "Drink water reminder 💧"
                </p>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-tech">4x daily: 10 AM, 1 PM, 4 PM, 7 PM</span>
              </div>
            </div>

            <button
              onClick={() => handleTogglePref('waterReminders')}
              aria-label="Toggle water reminders"
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                notifPrefs.waterReminders ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${
                  notifPrefs.waterReminders ? 'translate-x-6 left-0' : 'translate-x-1 left-0'
                }`}
              />
            </button>
          </div>

          {/* Channel 3: Coach Messages */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Coach Message Alerts</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-tech">
                  "Coach replied to your message"
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-tech">Instant alert with message preview</span>
              </div>
            </div>

            <button
              onClick={() => handleTogglePref('coachMessages')}
              aria-label="Toggle coach message alerts"
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                notifPrefs.coachMessages ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${
                  notifPrefs.coachMessages ? 'translate-x-6 left-0' : 'translate-x-1 left-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Live Test Trigger Buttons */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/5">
          <span className="text-[10px] font-tech uppercase text-slate-500 block mb-2 font-bold">
            Test Native Notifications Now
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTestAlert('workout')}
              className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-[11px] font-tech font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-1 border border-slate-200/80 dark:border-white/5 transition-all cursor-pointer"
            >
              <Dumbbell className="w-3 h-3 text-amber-500" />
              <span>Workout</span>
            </button>
            <button
              onClick={() => handleTestAlert('water')}
              className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-[11px] font-tech font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-1 border border-slate-200/80 dark:border-white/5 transition-all cursor-pointer"
            >
              <Droplets className="w-3 h-3 text-cyan-500" />
              <span>Water</span>
            </button>
            <button
              onClick={() => handleTestAlert('coach')}
              className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-[11px] font-tech font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-1 border border-slate-200/80 dark:border-white/5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 text-emerald-500" />
              <span>Coach</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Settings & Appearance */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md space-y-3 transition-colors duration-200">
        <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 font-bold block mb-1">
          PREFERENCES & SECURITY
        </span>

        {/* Theme Switcher Row */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Interface Theme</h4>
            <p className="text-[10px] text-slate-500 font-tech">Toggle between Obsidian Dark and Clean Light</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Change Password Row */}
        <button
          onClick={() => {
            hapticTap();
            onOpenChangePassword();
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-white/5 transition-all text-left"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Change Account Password</h4>
              <p className="text-[10px] text-slate-500 font-tech">Update your secure member login password</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* 4. App Information & PWA Status */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md space-y-2 text-xs transition-colors duration-200">
        <div className="flex items-center justify-between text-slate-500">
          <span>Application Engine</span>
          <span className="font-tech font-bold text-slate-900 dark:text-white">Jawan Fitness 2.0 PWA</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Cloud Sync & Database</span>
          <span className="font-tech font-bold flex items-center space-x-2">
            <SyncStatusBadge />
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Gym Headquarters</span>
          <span className="font-tech font-bold text-slate-900 dark:text-white">Salem, Tamil Nadu</span>
        </div>
      </div>

      {/* 5. Sign Out Button */}
      <button
        onClick={() => {
          hapticTap();
          onLogout();
        }}
        className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out from Member Portal</span>
      </button>
    </div>
  );
};
