import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  Exercise,
  ActiveWorkoutExercise,
  AssignedWorkout,
  AssignedMealPlan
} from '../../types';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { ExerciseService } from '../../services/exerciseService';
import { HomeScreen } from '../home/HomeScreen';
import { TrainerChatScreen } from './TrainerChatScreen';
import { ExercisesScreen } from '../exercises/ExercisesScreen';
import { DietScreen } from '../diet/DietScreen';
import { ProgressScreen } from '../progress/ProgressScreen';
import { BottomNav, TabType } from '../navigation/BottomNav';
import { ActiveWorkoutModal } from '../workout/ActiveWorkoutModal';
import { FirstLoginModal } from '../onboarding/FirstLoginModal';
import { IOSInstallBanner } from '../common/IOSInstallBanner';
import { hapticTap } from '../../utils/audioHaptics';
import { Users, Sparkles, LogOut, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';
import { authService, AuthUser } from '../../services/authService';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkoutHubScreen } from '../workout/WorkoutHubScreen';
import { ProfileScreen } from '../profile/ProfileScreen';
import { FloatingCoachButton } from '../common/FloatingCoachButton';
import { NotificationCenterModal, NotificationItem } from '../common/NotificationCenterModal';

export interface ClientAppProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Workout Prescribed',
      description: 'Your coach configured your training session. Review movements and crush today!',
      type: 'workout',
      timestamp: Date.now() - 1000 * 60 * 35,
      read: false,
      actionTab: 'workout'
    },
    {
      id: 'n-2',
      title: 'Hydration Target',
      description: 'Keep your daily water intake on track to support recovery and performance.',
      type: 'water',
      timestamp: Date.now() - 1000 * 60 * 120,
      read: false,
      actionTab: 'diet'
    },
    {
      id: 'n-3',
      title: 'Transformation Momentum',
      description: 'Consistent adherence logged this week! Check your updated body telemetry.',
      type: 'achievement',
      timestamp: Date.now() - 1000 * 60 * 360,
      read: true,
      actionTab: 'progress'
    }
  ]);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

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
      }) || (syncState.clients.length === 1 ? syncState.clients[0] : null))
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

    // 2. Coach assignment synchronization:
    // If activeClient has an assigned coach in syncState, preserve it and update cached currentUser!
    const clientHasTrainer = Boolean(
      activeClient.trainerId &&
      activeClient.trainerId.trim() !== '' &&
      activeClient.trainerId !== 'Unassigned'
    );

    if (clientHasTrainer) {
      if (currentUser && (currentUser.trainerId !== activeClient.trainerId || currentUser.trainerName !== activeClient.trainerName)) {
        const updatedUser: AuthUser = {
          ...currentUser,
          trainerId: activeClient.trainerId,
          trainerName: activeClient.trainerName || 'Assigned Coach'
        };
        authService.saveUser(updatedUser);
        setCurrentUser(updatedUser);
      }
    } else if (currentUser?.trainerId && currentUser.trainerId.trim() !== '' && currentUser.trainerId !== 'Unassigned') {
      // Fallback: If DB login user has a trainer but syncState client didn't have it set yet
      activeClient.trainerId = currentUser.trainerId;
      activeClient.trainerName = currentUser.trainerName || 'Assigned Coach';
    }
  }

  const handleSelectClient = (clientId: string) => {
    hapticTap();
    setPersistedClientId(clientId);
    localStorage.setItem('jawan_active_client_id_v1', clientId);
    syncedStore.setActiveClient(clientId);
  };

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

  // If activeClient is not resolved, transition back to Unified Auth Gateway
  if (!activeClient) {
    if (onLogout) {
      setTimeout(() => onLogout(), 50);
    }
    return (
      <div className="min-h-screen bg-[#04060a] text-white flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
        </div>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
        <span className="text-xs text-slate-400 font-tech tracking-wider">Accessing Jawan Member Session...</span>
      </div>
    );
  }

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

    if (validKeys.length === 1) {
      return workouts[validKeys[0]];
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

    if (validKeys.length === 1) {
      return diets[validKeys[0]];
    }
    return null;
  };

  const assignedWorkout = resolveAssignedWorkout();
  const assignedDiet = resolveAssignedDiet();

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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const isTrainerIdValid = Boolean(activeClient?.trainerId && activeClient.trainerId.trim() !== '' && activeClient.trainerId !== 'Unassigned');
  const isTrainerNameValid = Boolean(activeClient?.trainerName && activeClient.trainerName.trim() !== '' && activeClient.trainerName !== 'Unassigned');

  const assignedTrainer = (isTrainerIdValid ? syncState.trainers.find(t => t.id === activeClient.trainerId) : null) ||
    (isTrainerNameValid ? syncState.trainers.find(t => t.name.toLowerCase() === (activeClient.trainerName || '').toLowerCase()) : null) ||
    (syncState.trainers.length === 1 ? syncState.trainers[0] : null);

  const isCoachAssigned = Boolean(assignedTrainer || isTrainerIdValid || isTrainerNameValid);

  const currentTrainerName = isCoachAssigned 
    ? (assignedTrainer?.name || activeClient.trainerName) 
    : 'Unassigned';
  const currentTrainerRole = isCoachAssigned 
    ? (assignedTrainer?.role || 'Personal Fitness Coach') 
    : 'No Trainer Assigned';
  const currentTrainerPhone = isCoachAssigned 
    ? (assignedTrainer?.phone || '') 
    : '';
  const currentTrainerAvatarUrl = isCoachAssigned
    ? (assignedTrainer?.avatarUrl || '')
    : '';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#04060a] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-0 font-sans select-none transition-colors duration-200">
      {/* Responsive executive container: fluid on phone, wide and spacious on laptop/desktop */}
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl min-h-screen bg-white dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden shadow-2xl text-left border-x border-slate-200 dark:border-white/5 transition-colors duration-200">
        {/* Top Status Bar with Member Name, Assigned Coach, Password & Logout */}
        <header className="px-3 sm:px-4 pt-safe py-2.5 sm:py-3 flex items-center justify-between bg-white/95 dark:bg-[#0c101a] border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 gap-2">
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
            <div className="hidden sm:flex items-center space-x-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
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
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto scrollbar-none pb-24">
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
              loggedMeals={syncState.loggedMeals}
              goals={{
                calories: assignedDiet ? assignedDiet.dailyCalories : 2300,
                protein: assignedDiet ? assignedDiet.dailyProtein : 150,
                carbs: assignedDiet ? assignedDiet.dailyCarbs : 250,
                fat: assignedDiet ? assignedDiet.dailyFat : 70,
                fiber: 30,
                waterMl: 3000
              }}
              waterMl={syncState.waterMl}
              weightHistory={syncState.weightHistory}
              latestMessage={syncState.messages.filter((m) => {
                if (!m.clientId) return true;
                if (m.clientId === activeClient.id) return true;
                if (activeClient.loginId && m.clientId.toLowerCase() === activeClient.loginId.toLowerCase()) return true;
                if (activeClient.email && m.clientId.toLowerCase() === activeClient.email.toLowerCase()) return true;
                if (syncState.clients.length <= 1) return true;
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
                  workoutHistory={syncState.workoutHistory || []}
                  assignedWorkout={assignedWorkout}
                  onStartRoutine={handleStartRoutineTemplate}
                  onStartAssignedWorkout={handleStartAssignedWorkout}
                  onStartCustomWorkout={handleStartCustomWorkout}
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
              loggedMeals={syncState.loggedMeals}
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
              weightHistory={syncState.weightHistory}
              startingWeightKg={activeClient.startingWeightKg}
              goalWeightKg={activeClient.goalWeightKg}
              currentWeightKg={activeClient.currentWeightKg}
              onLogWeight={(w) => syncedStore.logWeight(w)}
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
            isOnline={true}
            unreadCount={
              syncState.messages.filter(
                (m) => m.sender === 'trainer' && (!m.clientId || m.clientId === activeClient.id)
              ).length > 0 ? 1 : 0
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

        {/* First Login Onboarding Modal if client hasn't completed setup */}
        {!activeClient.firstLoginCompleted && (
          <FirstLoginModal
            clientName={activeClient.name}
            initialHeightCm={activeClient.heightCm}
            initialWeightKg={activeClient.startingWeightKg}
            initialGoal={activeClient.goal}
            initialGoalWeightKg={activeClient.goalWeightKg}
            trainerName={activeClient.trainerName}
            onComplete={(data) => {
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
