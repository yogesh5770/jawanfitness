import React, { useState, useEffect, useRef } from 'react';
import {
  WorkoutSession,
  Exercise,
  ActiveWorkoutExercise,
  AssignedWorkout,
  AssignedMealPlan
} from '../../types';
import { syncedStore, AppSyncState, ClientData } from '../../services/syncedStore';
import { ExerciseService } from '../../services/exerciseService';
import { HomeScreen } from '../home/HomeScreen';
import { TrainerChatScreen } from './TrainerChatScreen';
import { ExercisesScreen } from '../exercises/ExercisesScreen';
import { DietScreen } from '../diet/DietScreen';
import { ProgressScreen } from '../progress/ProgressScreen';
import { BottomNav, TabType } from '../navigation/BottomNav';
import { ActiveWorkoutModal } from '../workout/ActiveWorkoutModal';
import { FirstLoginModal } from '../onboarding/FirstLoginModal';
import { isMemberOnboarded, markMemberOnboarded } from '../../utils/onboardingStorage';
import { IOSInstallBanner } from '../common/IOSInstallBanner';
import { hapticTap } from '../../utils/audioHaptics';
import { LogOut, KeyRound, Loader2 } from 'lucide-react';

import { authService, AuthUser } from '../../services/authService';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkoutHubScreen } from '../workout/WorkoutHubScreen';
import { ProfileScreen } from '../profile/ProfileScreen';
import { FloatingCoachButton } from '../common/FloatingCoachButton';
import { NotificationCenterModal, NotificationItem } from '../common/NotificationCenterModal';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { notificationService } from '../../services/notificationService';

export interface ClientAppProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

// Per-member record filter — records with no clientId are treated as belonging
// to the active client (legacy data written before clientId stamping existed).
function filterByClient<T extends { clientId?: string }>(
  arr: T[] | undefined,
  active: { id?: string; loginId?: string; email?: string } | null | undefined
): T[] {
  const list = arr || [];
  if (!active) return list;
  const id = active.id?.toLowerCase();
  const login = active.loginId?.toLowerCase();
  const email = active.email?.toLowerCase();
  if (!id && !login && !email) return list;
  return list.filter((r) => {
    const cid = r.clientId?.toLowerCase();
    if (!cid) return true;
    if (id && cid === id) return true;
    if (login && cid === login) return true;
    if (email && cid === email) return true;
    return false;
  });
}

function getNotificationFirstSeen(key: string): number {
  try {
    const store = JSON.parse(localStorage.getItem('jawan_notif_firstseen_v1') || '{}');
    if (store[key]) return store[key];
    const now = Date.now();
    store[key] = now;
    localStorage.setItem('jawan_notif_firstseen_v1', JSON.stringify(store));
    return now;
  } catch {
    return Date.now();
  }
}

function buildClientNotifications(
  syncState: AppSyncState,
  assignedWorkout: AssignedWorkout | null,
  assignedDiet: AssignedMealPlan | null,
  activeClient: ClientData | null,
  readNotifIds: string[]
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const clientId = activeClient?.id;
  // 1. Coach message (latest) - strictly intended for this client
  const coachMsgs = (syncState.messages || []).filter(
    (m) =>
      m.sender === 'trainer' &&
      clientId &&
      (m.clientId === clientId ||
        (activeClient?.loginId && m.clientId && m.clientId.toLowerCase() === activeClient.loginId.toLowerCase()) ||
        (activeClient?.email && m.clientId && m.clientId.toLowerCase() === activeClient.email.toLowerCase()))
  );
  const lastCoachMsg = coachMsgs[coachMsgs.length - 1];
  if (lastCoachMsg) {
    items.push({
      id: `chat-${lastCoachMsg.id}`,
      title: `Message from ${lastCoachMsg.senderName || 'your coach'}`,
      description: lastCoachMsg.text,
      type: 'chat',
      timestamp: Number(lastCoachMsg.timestamp) || getNotificationFirstSeen(`chat-${lastCoachMsg.id}`),
      read: readNotifIds.includes(`chat-${lastCoachMsg.id}`),
      actionTab: 'trainer'
    });
  }

  // 2. Assigned workout / diet
  if (assignedWorkout) {
    const key = `assign-workout-${assignedWorkout.id}`;
    const parsed = Date.parse(assignedWorkout.assignedDate || '');
    items.push({
      id: key,
      title: 'Workout Assigned',
      description: `${assignedWorkout.title} — review your session plan.`,
      type: 'workout',
      timestamp: Number.isFinite(parsed) && parsed > 0 ? parsed : getNotificationFirstSeen(key),
      read: readNotifIds.includes(key),
      actionTab: 'workout'
    });
  }
  if (assignedDiet) {
    const key = `assign-diet-${assignedDiet.id}`;
    const parsed = Date.parse((assignedDiet as any).assignedDate || '');
    items.push({
      id: key,
      title: 'Diet Plan Assigned',
      description: `${assignedDiet.title} — your coach set up your nutrition plan.`,
      type: 'diet',
      timestamp: Number.isFinite(parsed) && parsed > 0 ? parsed : getNotificationFirstSeen(key),
      read: readNotifIds.includes(key),
      actionTab: 'diet'
    });
  }

  // 3. Latest completed workout session
  const sessions = [...(syncState.workoutHistory || [])]
    .filter((s) => !s.clientId || !clientId || s.clientId === clientId)
    .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));
  const lastSession = sessions[0];
  if (lastSession) {
    const key = `session-${lastSession.id}`;
    items.push({
      id: key,
      title: 'Workout Completed',
      description: `${lastSession.routineName} — ${Math.round((lastSession.totalVolumeKg || 0)).toLocaleString()} kg total volume.`,
      type: 'achievement',
      timestamp: lastSession.endTime || lastSession.startTime,
      read: readNotifIds.includes(key),
      actionTab: 'workout'
    });
  }

  // 4. Weight logged today
  const todayISO = new Date();
  const todayKey = `${todayISO.getFullYear()}-${String(todayISO.getMonth() + 1).padStart(2, '0')}-${String(todayISO.getDate()).padStart(2, '0')}`;
  const todayWeight = [...(syncState.weightHistory || [])].reverse().find((w) => w.date === todayKey);
  if (todayWeight) {
    const key = `weight-${todayKey}`;
    const midnight = new Date(todayISO.getFullYear(), todayISO.getMonth(), todayISO.getDate()).getTime();
    items.push({
      id: key,
      title: 'Weight Logged',
      description: `${todayWeight.weightKg.toFixed(1)} kg recorded today. Keep the streak going!`,
      type: 'achievement',
      timestamp: midnight,
      read: readNotifIds.includes(key),
      actionTab: 'progress'
    });
  }

  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
}

export const ClientApp: React.FC<ClientAppProps> = ({ currentUser: initialUser, onLogout }) => {
  const [clientTab, setClientTab] = useState<TabType>('home');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  // Permanent client session state
  const [persistedClientId, setPersistedClientId] = useState<string>(() => {
    return localStorage.getItem('jawan_active_client_id_v1') || '';
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => initialUser || authService.getUser());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [workoutSubTab, setWorkoutSubTab] = useState<'assigned' | 'library'>('assigned');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDismissedOnboarding, setIsDismissedOnboarding] = useState(false);
  // Read-state for real notifications, persisted locally
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jawan_notif_read_v1') || '[]');
    } catch {
      return [];
    }
  });

  const [prevUserId, setPrevUserId] = useState(initialUser?.id);
  if (initialUser && initialUser.id !== prevUserId) {
    setPrevUserId(initialUser.id);
    setCurrentUser(initialUser);
  }

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    // Instant cloud synchronization from Cloudflare D1
    syncedStore.syncFromCloud(true);
    // Background 3-second live sync so assigned workouts/diets appear in real-time
    const interval = setInterval(() => {
      syncedStore.syncFromCloud(false);
    }, 3000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Require active authentication - match strictly to currentUser session
  const isAuthValid = !!currentUser;
  let activeClient = isAuthValid
    ? (syncState.clients.find((c) => {
        if (currentUser?.id && c.id === currentUser.id) return true;
        if (currentUser?.loginId && c.loginId && c.loginId.toLowerCase() === currentUser.loginId.toLowerCase()) return true;
        if (currentUser?.email && c.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
        if (currentUser?.phone && c.phone && c.phone.replace(/\D/g, '').endsWith(currentUser.phone.replace(/\D/g, '').slice(-10))) return true;
        if (persistedClientId && c.id === persistedClientId) return true;
        return false;
      }) || null)
    : null;

  // Fallback: If authenticated but syncState has not yet hydrated (e.g. on fresh APK launch),
  // build activeClient directly from verified user biometrics so the app is NEVER empty with 0 kg!
  if (isAuthValid && !activeClient && currentUser) {
    activeClient = {
      id: currentUser.id,
      name: currentUser.name || 'Member',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      loginId: currentUser.loginId || '',
      heightCm: currentUser.heightCm || 170,
      startingWeightKg: currentUser.startingWeightKg || 108,
      currentWeightKg: currentUser.currentWeightKg || currentUser.startingWeightKg || 108,
      goal: currentUser.goal || 'Weight Loss & Hypertrophy',
      goalWeightKg: currentUser.goalWeightKg || 80,
      trainerId: currentUser.trainerId || '',
      trainerName: currentUser.trainerName || 'Unassigned',
      status: 'Active',
      firstLoginCompleted: true,
      gymId: 'JAWAN-SALEM-01',
      workoutAdherence: 0,
      dietAdherence: 0,
      lastWorkout: 'Ready'
    };
  }

  // Heal stale biometrics and keep coach assignment synchronized with syncState as source of truth
  if (activeClient) {
    if (isMemberOnboarded(activeClient) || isMemberOnboarded(currentUser)) {
      activeClient.firstLoginCompleted = true;
    }
    // 1. Biometrics healing (only if activeClient has missing/0 values)
    if ((!activeClient.startingWeightKg || activeClient.startingWeightKg === 0) && currentUser?.startingWeightKg) {
      activeClient.startingWeightKg = currentUser.startingWeightKg;
      activeClient.currentWeightKg = currentUser.currentWeightKg || currentUser.startingWeightKg;
    }
    if (currentUser?.goalWeightKg && (!activeClient.goalWeightKg || activeClient.goalWeightKg === 0)) {
      activeClient.goalWeightKg = currentUser.goalWeightKg;
    }
    if (currentUser?.goal && (!activeClient.goal || activeClient.goal === 'General Fitness')) {
      activeClient.goal = currentUser.goal;
    }
    if (currentUser?.heightCm && (!activeClient.heightCm || activeClient.heightCm === 170)) {
      activeClient.heightCm = currentUser.heightCm;
    }

    // 2. Coach assignment validation:
    // If gym trainers are loaded, validate activeClient's assignment
    const hasTrainerAssigned = Boolean(
      (activeClient.trainerId && activeClient.trainerId.trim() !== '' && activeClient.trainerId !== 'Unassigned') ||
      (activeClient.trainerName && activeClient.trainerName.trim() !== '' && activeClient.trainerName !== 'Unassigned' && activeClient.trainerName.toLowerCase() !== 'none')
    );

    if (hasTrainerAssigned) {
      if (syncState.trainers.length > 0) {
        const assignedTrainerObj =
          (activeClient.trainerId ? syncState.trainers.find((t) => t.id === activeClient.trainerId) : null) ||
          (activeClient.trainerName ? syncState.trainers.find((t) => t.name.toLowerCase() === (activeClient.trainerName || '').toLowerCase()) : null) ||
          null;

        if (assignedTrainerObj) {
          activeClient.trainerId = assignedTrainerObj.id;
          activeClient.trainerName = assignedTrainerObj.name;
        } else {
          // Explicitly invalid or deleted trainer
          activeClient.trainerId = '';
          activeClient.trainerName = 'Unassigned';
        }
      }
    } else {
      activeClient.trainerId = '';
      activeClient.trainerName = 'Unassigned';
    }
  }


  const handleLogoutClient = () => {
    hapticTap();
    authService.logout();
    setCurrentUser(null);
    setPersistedClientId('');
    localStorage.removeItem('jawan_auth_session_token_v1');
    localStorage.removeItem('jawan_auth_user_v1');
    localStorage.removeItem('jawan_active_client_id_v1');
    if (onLogout) onLogout();
  };

  const resolveAssignedWorkout = (): AssignedWorkout | null => {
    const workouts = syncState.assignedWorkouts || {};
    const validKeys = Object.keys(workouts).filter((k) => workouts[k] != null);
    if (validKeys.length === 0) return null;

    const candidateIds = [
      activeClient?.id,
      activeClient?.loginId,
      activeClient?.email,
      currentUser?.id,
      currentUser?.loginId,
      currentUser?.email
    ].filter(Boolean) as string[];

    for (const cid of candidateIds) {
      if (workouts[cid]) return workouts[cid];
      const matchKey = validKeys.find((k) => k.toLowerCase() === cid.toLowerCase());
      if (matchKey && workouts[matchKey]) return workouts[matchKey];
    }

    for (const c of syncState.clients) {
      const isMatch =
        (activeClient && c.id === activeClient.id) ||
        (activeClient?.loginId && c.loginId && c.loginId.toLowerCase() === activeClient.loginId.toLowerCase()) ||
        (activeClient?.email && c.email && c.email.toLowerCase() === activeClient.email.toLowerCase()) ||
        (currentUser?.id && c.id === currentUser.id) ||
        (currentUser?.loginId && c.loginId && c.loginId.toLowerCase() === currentUser.loginId.toLowerCase());
      if (isMatch) {
        if (c.id && workouts[c.id]) return workouts[c.id];
        if (c.loginId && workouts[c.loginId]) return workouts[c.loginId];
        if (c.email && workouts[c.email]) return workouts[c.email];
      }
    }

    return null;
  };

  const resolveAssignedDiet = (): AssignedMealPlan | null => {
    const diets = syncState.assignedDietPlans || {};
    const validKeys = Object.keys(diets).filter((k) => diets[k] != null);
    if (validKeys.length === 0) return null;

    const candidateIds = [
      activeClient?.id,
      activeClient?.loginId,
      activeClient?.email,
      currentUser?.id,
      currentUser?.loginId,
      currentUser?.email
    ].filter(Boolean) as string[];

    for (const cid of candidateIds) {
      if (diets[cid]) return diets[cid];
      const matchKey = validKeys.find((k) => k.toLowerCase() === cid.toLowerCase());
      if (matchKey && diets[matchKey]) return diets[matchKey];
    }

    for (const c of syncState.clients) {
      const isMatch =
        (activeClient && c.id === activeClient.id) ||
        (activeClient?.loginId && c.loginId && c.loginId.toLowerCase() === activeClient.loginId.toLowerCase()) ||
        (activeClient?.email && c.email && c.email.toLowerCase() === activeClient.email.toLowerCase()) ||
        (currentUser?.id && c.id === currentUser.id) ||
        (currentUser?.loginId && c.loginId && c.loginId.toLowerCase() === currentUser.loginId.toLowerCase());
      if (isMatch) {
        if (c.id && diets[c.id]) return diets[c.id];
        if (c.loginId && diets[c.loginId]) return diets[c.loginId];
        if (c.email && diets[c.email]) return diets[c.email];
      }
    }

    return null;
  };

  const assignedWorkout = resolveAssignedWorkout();
  const assignedDiet = resolveAssignedDiet();

  // Per-member filtered history — computed once, reused by every child screen.
  const clientWorkoutHistory = React.useMemo(
    () => filterByClient(syncState.workoutHistory, activeClient),
    [syncState.workoutHistory, activeClient]
  );
  const clientWeightHistory = React.useMemo(
    () => filterByClient(syncState.weightHistory, activeClient),
    [syncState.weightHistory, activeClient]
  );
  const clientLoggedMeals = React.useMemo(
    () => filterByClient(syncState.loggedMeals, activeClient),
    [syncState.loggedMeals, activeClient]
  );

  // REAL notifications — derived from synced state, never fabricated
  const notifications = React.useMemo<NotificationItem[]>(() => {
    return buildClientNotifications(syncState, assignedWorkout, assignedDiet, activeClient, readNotifIds);
  }, [syncState, assignedWorkout, assignedDiet, activeClient, readNotifIds]);

  // If activeClient is not resolved, transition back to Unified Auth Gateway
  // (side effects belong in effects, never during render)
  useEffect(() => {
    if (!activeClient && onLogout) {
      const t = setTimeout(() => onLogout(), 50);
      return () => clearTimeout(t);
    }
  }, [activeClient, onLogout]);

  // Keep store's activeClientId in sync with the logged-in member
  // (logWeight and other member writes target activeClientId)
  useEffect(() => {
    const id = activeClient?.id;
    if (id && syncState.activeClientId !== id) {
      syncedStore.setActiveClient(id);
    }
  }, [activeClient?.id, syncState.activeClientId]);

  // 1. Initialize Native Push & Scheduled Alarms Service
  useEffect(() => {
    notificationService.init((targetTab) => {
      setClientTab(targetTab as TabType);
    });
  }, []);

  // 2. Reschedule daily alarms whenever assigned workout changes
  useEffect(() => {
    if (assignedWorkout?.title) {
      notificationService.syncScheduledNotifications(assignedWorkout.title);
    }
  }, [assignedWorkout?.id, assignedWorkout?.title]);

  // 3. Real-time Native Alert when Coach sends a message
  const lastTrainerMsgRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeClient) return;
    const trainerMsgs = (syncState.messages || []).filter(
      (m) =>
        m.sender === 'trainer' &&
        (m.clientId === activeClient.id ||
          (activeClient.loginId && m.clientId && m.clientId.toLowerCase() === activeClient.loginId.toLowerCase()) ||
          (activeClient.email && m.clientId && m.clientId.toLowerCase() === activeClient.email.toLowerCase()))
    );
    const latest = trainerMsgs[trainerMsgs.length - 1];
    if (!latest) return;

    if (!lastTrainerMsgRef.current) {
      lastTrainerMsgRef.current = latest.id;
      return;
    }

    if (latest.id !== lastTrainerMsgRef.current) {
      lastTrainerMsgRef.current = latest.id;
      if (clientTab !== 'trainer' || (typeof document !== 'undefined' && document.hidden)) {
        notificationService.notifyCoachMessage(latest.senderName || activeClient.trainerName || 'Coach', latest.text);
      }
    }
  }, [syncState.messages, activeClient?.id, activeClient?.trainerName, clientTab]);

  if (!activeClient) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#04060a] text-slate-900 dark:text-white flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
        </div>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-tech tracking-wider">Accessing Jawan Member Session...</span>
      </div>
    );
  }

  const handleStartAssignedWorkout = () => {
    if (!assignedWorkout) return;
    hapticTap();

    const exercises: ActiveWorkoutExercise[] = assignedWorkout.exercises.map((asgEx: any) => {
      const baseEx = ExerciseService.getById(asgEx.exerciseId) || ExerciseService.getAll()[0];
      return {
        exercise: baseEx,
        sets: Array.from({ length: asgEx.targetSets }, (_, i) => ({
          id: `s-${i + 1}-${Date.now()}`,
          setNumber: i + 1,
          weightKg: asgEx.targetWeightKg || 12,
          reps: asgEx.targetReps,
          completed: false
        })),
        notes: asgEx.notes
      };
    });

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineName: assignedWorkout.title,
      startTime: Date.now(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      exercises
    };

    syncedStore.startWorkoutSession(session);
    setIsWorkoutModalOpen(true);
  };

  const handleStartSingleExercise = (exercise: Exercise) => {
    hapticTap();
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineName: `${exercise.name} Focus`,
      startTime: Date.now(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      exercises: [
        {
          exercise,
          sets: [
            { id: `s-1-${Date.now()}`, setNumber: 1, weightKg: 20, reps: 10, completed: false },
            { id: `s-2-${Date.now()}`, setNumber: 2, weightKg: 20, reps: 10, completed: false }
          ]
        }
      ]
    };
    syncedStore.startWorkoutSession(session);
    setIsWorkoutModalOpen(true);
  };

  const handleStartRoutineTemplate = (routine: any) => {
    hapticTap();
    const exercises: ActiveWorkoutExercise[] = (routine.exerciseIds || []).map((exId: string, idx: number) => {
      const baseEx = ExerciseService.getById(exId) || ExerciseService.getAll()[idx % ExerciseService.getAll().length];
      return {
        exercise: baseEx,
        sets: [
          { id: `s-1-${Date.now()}-${idx}`, setNumber: 1, weightKg: 20, reps: 10, completed: false },
          { id: `s-2-${Date.now()}-${idx}`, setNumber: 2, weightKg: 20, reps: 10, completed: false },
          { id: `s-3-${Date.now()}-${idx}`, setNumber: 3, weightKg: 20, reps: 10, completed: false }
        ]
      };
    });

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineName: routine.title,
      startTime: Date.now(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      exercises
    };

    syncedStore.startWorkoutSession(session);
    setIsWorkoutModalOpen(true);
  };

  const handleStartCustomWorkout = () => {
    hapticTap();
    const firstEx = ExerciseService.getAll()[0];
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineName: 'Custom Session',
      startTime: Date.now(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      exercises: [
        {
          exercise: firstEx,
          sets: [
            { id: `s-1-${Date.now()}`, setNumber: 1, weightKg: 15, reps: 10, completed: false }
          ]
        }
      ]
    };
    syncedStore.startWorkoutSession(session);
    setIsWorkoutModalOpen(true);
  };

  const handleSelectNotificationAction = (tab: 'home' | 'workout' | 'diet' | 'progress' | 'trainer') => {
    setIsNotificationOpen(false);
    setClientTab(tab as TabType);
  };

  const handleMarkAllNotificationsRead = () => {
    const ids = notifications.map((n) => n.id);
    setReadNotifIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids])).slice(-200);
      try {
        localStorage.setItem('jawan_notif_read_v1', JSON.stringify(next));
      } catch {
        // fallback
      }
      return next;
    });
  };

  const isTrainerIdValid = Boolean(
    activeClient?.trainerId &&
    activeClient.trainerId.trim() !== '' &&
    activeClient.trainerId !== 'Unassigned'
  );

  const isTrainerNameValid = Boolean(
    activeClient?.trainerName &&
    activeClient.trainerName.trim() !== '' &&
    activeClient.trainerName !== 'Unassigned' &&
    activeClient.trainerName.toLowerCase() !== 'none'
  );

  const assignedTrainer = (isTrainerIdValid || isTrainerNameValid)
    ? ((isTrainerIdValid ? syncState.trainers.find((t) => t.id === activeClient.trainerId) : null) ||
       (isTrainerNameValid ? syncState.trainers.find((t) => t.name.toLowerCase() === (activeClient.trainerName || '').toLowerCase()) : null) ||
       null)
    : null;

  const isCoachAssigned = Boolean(assignedTrainer) || (isTrainerNameValid && activeClient?.trainerName !== 'Unassigned');

  const currentTrainerName = assignedTrainer ? assignedTrainer.name : (isTrainerNameValid ? activeClient!.trainerName : 'Unassigned');
  const currentTrainerRole = assignedTrainer ? (assignedTrainer.role || 'Personal Fitness Coach') : (isCoachAssigned ? 'Personal Fitness Coach' : 'No Trainer Assigned');
  const currentTrainerPhone = assignedTrainer ? (assignedTrainer.phone || '') : '';
  const currentTrainerAvatarUrl = assignedTrainer ? (assignedTrainer.avatarUrl || '') : '';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#04060a] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-0 font-sans transition-colors duration-200 md:pl-20 lg:pl-64">
      {/* Responsive executive container: fluid on phone, wide and spacious on laptop/desktop */}
      <div className="w-full max-w-lg md:max-w-4xl lg:max-w-6xl min-h-screen bg-white dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col relative shadow-2xl text-left border-x border-slate-200 dark:border-white/5 transition-colors duration-200">
        {/* Top Status Bar with Member Name, Assigned Coach, Password & Logout */}
        <header className="px-3 sm:px-4 pt-safe py-2.5 sm:py-3 flex items-center justify-between bg-white/95 dark:bg-[#0c101a]/95 border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xs shadow-md shadow-amber-500/20 flex-shrink-0">
              {activeClient.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase font-display truncate">
                JAWAN <span className="text-amber-500">MEMBER</span>
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium flex items-center space-x-1 truncate max-w-[150px] sm:max-w-xs">
                <span className="truncate">{activeClient.name} •</span>
                {isCoachAssigned && currentTrainerAvatarUrl ? (
                  <img
                    src={currentTrainerAvatarUrl}
                    alt={currentTrainerName}
                    className="w-3.5 h-3.5 rounded-full object-cover border border-amber-500/40 inline-block flex-shrink-0"
                  />
                ) : null}
                <span className="truncate">{isCoachAssigned ? `Coach: ${currentTrainerName}` : 'Coach: Unassigned'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
            <ThemeToggle />
            <div className="hidden sm:flex">
              <SyncStatusBadge compact />
            </div>

            <button
              onClick={() => {
                hapticTap();
                setIsChangePasswordOpen(true);
              }}
              title="Change Password"
              className="p-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors flex items-center space-x-1 text-[11px] font-bold border border-slate-200 dark:border-transparent"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Password</span>
            </button>

            <button
              onClick={handleLogoutClient}
              title="Sign Out / Switch Member"
              className="p-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors border border-slate-200 dark:border-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Tab Router */}
        <main className="flex-1 p-3 sm:p-4 pb-32">
          {clientTab === 'home' && (
            <HomeScreen
              clientName={activeClient.name}
              startWeightKg={activeClient.startingWeightKg}
              goalWeightKg={activeClient.goalWeightKg}
              currentWeightKg={activeClient.currentWeightKg}
              trainerName={currentTrainerName}
              trainerRole={currentTrainerRole}
              trainerPhone={currentTrainerPhone}
              trainerAvatarUrl={currentTrainerAvatarUrl}
              assignedWorkout={assignedWorkout}
              assignedMealPlan={assignedDiet}
              activeWorkoutSession={syncState.activeWorkoutSession}
              loggedMeals={clientLoggedMeals}
              goals={{
                calories: assignedDiet ? assignedDiet.dailyCalories : 2300,
                protein: assignedDiet ? assignedDiet.dailyProtein : 150,
                carbs: assignedDiet ? assignedDiet.dailyCarbs : 250,
                fat: assignedDiet ? assignedDiet.dailyFat : 70,
                fiber: 30,
                waterMl: 3000
              }}
              waterMl={syncState.waterMl}
              weightHistory={clientWeightHistory}
              workoutHistory={clientWorkoutHistory}
              latestMessage={syncState.messages.filter((m) => {
                if (!activeClient) return false;
                if (m.clientId === activeClient.id) return true;
                if (activeClient.loginId && m.clientId && m.clientId.toLowerCase() === activeClient.loginId.toLowerCase()) return true;
                if (activeClient.email && m.clientId && m.clientId.toLowerCase() === activeClient.email.toLowerCase()) return true;
                return false;
              }).slice(-1)[0] || null}
              unreadNotificationsCount={notifications.filter((n) => !n.read).length}
              onStartWorkout={handleStartAssignedWorkout}
              onResumeWorkout={() => setIsWorkoutModalOpen(true)}
              onDiscardWorkout={() => syncedStore.discardWorkoutSession()}
              onExploreExercises={() => {
                setWorkoutSubTab('library');
                setClientTab('workout');
              }}
              onNavigateToWorkout={() => setClientTab('workout')}
              onNavigateToDiet={() => setClientTab('diet')}
              onNavigateToProgress={() => setClientTab('progress')}
              onNavigateToTrainer={() => setClientTab('trainer')}
              onOpenNotifications={() => setIsNotificationOpen(true)}
              onOpenProfile={() => setClientTab('profile')}
              onAddWater={(ml) => syncedStore.updateWater(ml)}
            />
          )}

          {/* WORKOUT TAB: Combines Coach's Assigned Routine and 1,300+ Exercise Library */}
          {(clientTab === 'workout' || clientTab === 'exercises') && (
            <div className="space-y-4 animate-fadeIn">
              {/* Dual Sub-Tabs: Today's Routine vs 1,300+ Exercise Library */}
              <div className="flex p-1 bg-slate-200/80 dark:bg-white/5 rounded-2xl max-w-md mx-auto border border-slate-300/40 dark:border-white/5">
                <button
                  onClick={() => {
                    hapticTap();
                    setWorkoutSubTab('assigned');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
                    workoutSubTab === 'assigned'
                      ? 'bg-amber-500 text-black shadow-md font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Today's Workout
                </button>
                <button
                  onClick={() => {
                    hapticTap();
                    setWorkoutSubTab('library');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
                    workoutSubTab === 'library'
                      ? 'bg-amber-500 text-black shadow-md font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  1,300+ Exercises
                </button>
              </div>

              {workoutSubTab === 'assigned' ? (
                <WorkoutHubScreen
                  workoutHistory={clientWorkoutHistory}
                  assignedWorkout={assignedWorkout}
                  onStartAssignedWorkout={handleStartAssignedWorkout}
                  onStartCustomWorkout={handleStartCustomWorkout}
                  onStartSingleExercise={handleStartSingleExercise}
                  onNavigateToTrainer={() => setClientTab('trainer')}
                  onExploreExercises={() => setWorkoutSubTab('library')}
                />
              ) : (
                <ExercisesScreen
                  onStartExercise={handleStartSingleExercise}
                  clientId={activeClient.id}
                />
              )}
            </div>
          )}

          {clientTab === 'diet' && (
            <DietScreen
              trainerName={currentTrainerName}
              loggedMeals={clientLoggedMeals}
              waterMl={syncState.waterMl}
              goals={{
                calories: assignedDiet ? assignedDiet.dailyCalories : 2300,
                protein: assignedDiet ? assignedDiet.dailyProtein : 150,
                carbs: assignedDiet ? assignedDiet.dailyCarbs : 250,
                fat: assignedDiet ? assignedDiet.dailyFat : 70,
                fiber: 30,
                waterMl: 3000
              }}
              assignedMealPlan={assignedDiet}
              onAddMealItem={(item) => syncedStore.logMeal(item)}
              onRemoveMealItem={(id) => syncedStore.removeLoggedMeal(id)}
              onUpdateWater={(ml) => syncedStore.updateWater(ml)}
            />
          )}

          {clientTab === 'progress' && (
            <ProgressScreen
              weightHistory={clientWeightHistory}
              startingWeightKg={activeClient.startingWeightKg}
              goalWeightKg={activeClient.goalWeightKg}
              currentWeightKg={activeClient.currentWeightKg}
              onLogWeight={(w) => syncedStore.logWeight(w)}
              workoutHistory={clientWorkoutHistory}
              loggedMeals={clientLoggedMeals}
              dailyWaterLog={syncState.dailyWaterLog}
            />
          )}

          {/* PROFILE TAB: Biometrics, Assigned Coach Card, Theme, Password & App Stats */}
          {clientTab === 'profile' && (
            <ProfileScreen
              client={activeClient}
              assignedTrainer={assignedTrainer}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
              onLogout={handleLogoutClient}
            />
          )}

          {/* COACH CHAT SCREEN: Real-time 2-Way Messaging & Daily Check-in Chips */}
          {clientTab === 'trainer' && (
            <TrainerChatScreen
              client={activeClient}
              trainerName={currentTrainerName}
              onBack={() => setClientTab('home')}
            />
          )}
        </main>

        {/* Floating Coach Action Button - Jawan 2.0 UX */}
        {clientTab !== 'trainer' && (
          <FloatingCoachButton
            trainerName={currentTrainerName}
            trainerAvatarUrl={currentTrainerAvatarUrl}
            isOnline={isCoachAssigned}
            unreadCount={
              syncState.messages.filter(
                (m) =>
                  m.sender === 'trainer' &&
                  (m.clientId === activeClient.id ||
                    (activeClient.loginId && m.clientId && m.clientId.toLowerCase() === activeClient.loginId.toLowerCase())) &&
                  !m.read
              ).length
            }
            onClick={() => setClientTab('trainer')}
          />
        )}

        {/* Notification Center Modal */}
        <NotificationCenterModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onSelectNotificationAction={handleSelectNotificationAction}
        />

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={clientTab}
          onSelectTab={(tab) => setClientTab(tab)}
          isWorkoutActive={!!syncState.activeWorkoutSession}
        />

        {/* Active Workout Session Modal */}
        {syncState.activeWorkoutSession && isWorkoutModalOpen && (
          <ActiveWorkoutModal
            session={syncState.activeWorkoutSession}
            userWeightKg={activeClient.currentWeightKg}
            userHeightCm={activeClient.heightCm}
            onUpdateSession={(session) => syncedStore.updateActiveWorkoutSession(session)}
            onFinishWorkout={(session) => syncedStore.finishWorkoutSession(session)}
            onCancelWorkout={() => syncedStore.discardWorkoutSession()}
            onMinimize={() => setIsWorkoutModalOpen(false)}
          />
        )}

        {/* First Login Onboarding Modal — strictly shown ONCE in member lifetime */}
        {!isDismissedOnboarding && !activeClient.firstLoginCompleted && !isMemberOnboarded(activeClient) && !isMemberOnboarded(currentUser) && (
          <FirstLoginModal
            clientName={activeClient.name}
            initialHeightCm={activeClient.heightCm}
            initialWeightKg={activeClient.startingWeightKg}
            initialGoal={activeClient.goal}
            initialGoalWeightKg={activeClient.goalWeightKg}
            trainerName={activeClient.trainerName}
            onClose={() => {
              setIsDismissedOnboarding(true);
              markMemberOnboarded(activeClient);
              if (currentUser) markMemberOnboarded(currentUser);
              activeClient.firstLoginCompleted = true;
              authService.updateUser({ firstLoginCompleted: true });
              syncedStore.completeClientOnboarding(
                activeClient.id,
                activeClient.heightCm || 170,
                activeClient.startingWeightKg || 75,
                activeClient.goal || 'General Fitness',
                activeClient.goalWeightKg || 70
              );
            }}
            onComplete={(data) => {
              setIsDismissedOnboarding(true);
              markMemberOnboarded(activeClient);
              if (currentUser) markMemberOnboarded(currentUser);
              activeClient.firstLoginCompleted = true;
              authService.updateUser({
                firstLoginCompleted: true,
                startingWeightKg: data.startingWeightKg,
                currentWeightKg: data.startingWeightKg,
                goalWeightKg: data.goalWeightKg,
                heightCm: data.heightCm,
                goal: data.goal
              });
              syncedStore.completeClientOnboarding(
                activeClient.id,
                data.heightCm,
                data.startingWeightKg,
                data.goal,
                data.goalWeightKg
              );
            }}
          />
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userRole="CLIENT"
          userIdentifier={activeClient.loginId || activeClient.phone || activeClient.email}
          userName={activeClient.name}
        />

        <IOSInstallBanner />
      </div>
    </div>
  );
};

export default ClientApp;
