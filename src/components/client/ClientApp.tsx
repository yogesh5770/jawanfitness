import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  Exercise,
  ActiveWorkoutExercise
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
import { Users, Sparkles, LogOut, Eye, EyeOff, KeyRound } from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';
import { authService, AuthUser } from '../../services/authService';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { ThemeToggle } from '../common/ThemeToggle';

export const ClientApp: React.FC = () => {
  const [clientTab, setClientTab] = useState<TabType>('home');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  // Permanent client session state: requires explicit login credentials
  const [persistedClientId, setPersistedClientId] = useState<string>(() => {
    return localStorage.getItem('jawan_active_client_id_v1') || '';
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getUser());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showQuickList, setShowQuickList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  // Require active authentication - prevents automatically defaulting to Arun without login
  const isAuthValid = authService.isAuthenticated('CLIENT') && !!currentUser;
  let activeClient = isAuthValid
    ? syncState.clients.find((c) => {
        if (persistedClientId && c.id === persistedClientId) return true;
        if (currentUser?.loginId && c.loginId && c.loginId.toLowerCase() === currentUser.loginId.toLowerCase()) return true;
        if (currentUser?.email && c.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
        return false;
      })
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

  // Heal stale 0 starting weight from real DB biometrics
  if (activeClient && (!activeClient.startingWeightKg || activeClient.startingWeightKg === 0) && currentUser?.startingWeightKg) {
    activeClient.startingWeightKg = currentUser.startingWeightKg;
    activeClient.currentWeightKg = currentUser.currentWeightKg || currentUser.startingWeightKg;
    if (currentUser.goalWeightKg) activeClient.goalWeightKg = currentUser.goalWeightKg;
    if (currentUser.goal) activeClient.goal = currentUser.goal;
    if (currentUser.heightCm) activeClient.heightCm = currentUser.heightCm;
  }

  const handleSelectClient = (clientId: string) => {
    hapticTap();
    setPersistedClientId(clientId);
    localStorage.setItem('jawan_active_client_id_v1', clientId);
    syncedStore.setActiveClient(clientId);
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const identifier = loginIdentifier.trim();
    const password = loginPassword;

    if (!identifier || !password) {
      setLoginError('Please enter your Member ID (or Phone) and Password.');
      return;
    }

    setIsLoading(true);
    const result = await authService.login(identifier, password, 'CLIENT', true);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setLoginError(result.error || 'Member login failed. Please verify the credentials received on WhatsApp.');
      return;
    }

    const verifiedUser = result.user;
    const latestState = await syncedStore.syncFromCloud();
    const state = latestState || syncedStore.getState();
    const cleanDigits = identifier.replace(/\D/g, '');
    const matched = state.clients.find((c) => {
      // Match by loginId from verified user
      const matchLoginId = c.loginId && verifiedUser.loginId && c.loginId.toLowerCase() === verifiedUser.loginId.toLowerCase();
      // Match by raw identifier against loginId (fallback if auth API didn't return loginId)
      const matchRawId = c.loginId && c.loginId.toLowerCase() === identifier.trim().toLowerCase();
      // Match by email
      const matchEmail = c.email && verifiedUser.email && c.email.toLowerCase() === verifiedUser.email.toLowerCase();
      // Match by phone digits
      const matchPhone = cleanDigits.length >= 10 && c.phone && c.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
      return matchLoginId || matchRawId || matchEmail || matchPhone;
    });

    let activeMatched = matched;
    if (!activeMatched) {
      activeMatched = {
        id: verifiedUser.id,
        name: verifiedUser.name || 'Member',
        email: verifiedUser.email || '',
        phone: verifiedUser.phone || cleanDigits || '',
        loginId: verifiedUser.loginId || identifier,
        heightCm: verifiedUser.heightCm || 170,
        startingWeightKg: verifiedUser.startingWeightKg || 108,
        currentWeightKg: verifiedUser.currentWeightKg || verifiedUser.startingWeightKg || 108,
        goal: verifiedUser.goal || 'Weight Loss & Hypertrophy',
        goalWeightKg: verifiedUser.goalWeightKg || 80,
        trainerId: verifiedUser.trainerId || '',
        trainerName: verifiedUser.trainerName || 'Unassigned',
        status: 'Active',
        firstLoginCompleted: true,
        gymId: 'JAWAN-SALEM-01',
        workoutAdherence: 0,
        dietAdherence: 0,
        lastWorkout: 'Ready'
      };
      syncedStore.enrollClient(activeMatched);
    } else {
      // Heal any stale 0 weights with verified user data from D1 database
      if ((!activeMatched.startingWeightKg || activeMatched.startingWeightKg === 0) && verifiedUser.startingWeightKg) {
        activeMatched.startingWeightKg = verifiedUser.startingWeightKg;
        activeMatched.currentWeightKg = verifiedUser.currentWeightKg || verifiedUser.startingWeightKg;
      }
      if ((!activeMatched.goalWeightKg || activeMatched.goalWeightKg === 0) && verifiedUser.goalWeightKg) {
        activeMatched.goalWeightKg = verifiedUser.goalWeightKg;
      }
      if (verifiedUser.goal && (!activeMatched.goal || activeMatched.goal === 'General Fitness')) {
        activeMatched.goal = verifiedUser.goal;
      }
      if (verifiedUser.heightCm && (!activeMatched.heightCm || activeMatched.heightCm === 170)) {
        activeMatched.heightCm = verifiedUser.heightCm;
      }
    }

    hapticTap();
    setCurrentUser(verifiedUser);
    setPersistedClientId(activeMatched.id);
    localStorage.setItem('jawan_active_client_id_v1', activeMatched.id);
    syncedStore.setActiveClient(activeMatched.id);
  };

  const handleLogoutClient = () => {
    hapticTap();
    authService.logout();
    setCurrentUser(null);
    setPersistedClientId('');
    localStorage.removeItem('jawan_active_client_id_v1');
  };

  // If no member logged in or no profile chosen, show Member Access Gate
  if (!activeClient) {
    return (
      <div className="min-h-screen bg-[#04060a] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm bg-[#090d16]/95 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-1.5 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain drop-shadow" />
              </div>
              <div>
                <h1 className="font-display font-black text-lg tracking-wider text-white uppercase">
                  JAWAN <span className="text-amber-500">FITNESS</span>
                </h1>
                <p className="text-[11px] text-neutral-400">Member Portal (Mobile & Web)</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="mb-5 bg-slate-900/60 border border-white/5 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold font-tech uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Member Secure Login</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter the User ID or Phone Number and Password received via WhatsApp from the Gym Director.
            </p>
          </div>

          <form onSubmit={handleClientLogin} className="space-y-3.5">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <span className="font-bold">Error:</span>
                <span>{loginError}</span>
              </div>
            )}

              <div>
                <label className="text-[10px] font-tech uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Member ID / Phone / Email
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-tech uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pr-11 text-white text-xs outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] mt-2"
              >
                {isLoading ? 'Verifying Member...' : 'Log In to Jawan Fitness'}
              </button>

              {/* Quick Select Accordion for testing */}
              <div className="pt-3 border-t border-white/5">
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => setShowQuickList(!showQuickList)}
                    className="w-full text-center text-[11px] text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>{showQuickList ? '▲ Hide Enrolled Members' : '▼ Quick One-Tap Log In (Testing)'}</span>
                  </button>
                )}

                {import.meta.env.DEV && showQuickList && (
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {syncState.clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client.id)}
                        className="w-full p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/40 rounded-xl flex items-center justify-between text-left transition-all"
                      >
                        <div>
                          <div className="text-white text-xs font-bold">{client.name}</div>
                          <div className="text-[10px] text-slate-400 font-tech">ID: {client.loginId || client.phone}</div>
                        </div>
                        <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          Enter &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>

          <div className="mt-5 pt-3 border-t border-white/5 text-center text-[10px] text-neutral-500">
            Jawan Fitness &copy; 2026 • Verified Member Session
          </div>
        </div>
      </div>
    );
  }

  const assignedWorkout = syncState.assignedWorkouts[activeClient.id] || null;
  const assignedDiet = syncState.assignedDietPlans[activeClient.id] || null;

  const handleStartAssignedWorkout = () => {
    if (!assignedWorkout) return;
    hapticTap();

    const exercises: ActiveWorkoutExercise[] = assignedWorkout.exercises.map((asgEx) => {
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

  const assignedTrainer = (activeClient.trainerId ? syncState.trainers.find(t => t.id === activeClient.trainerId) : null) ||
    (activeClient.trainerName && activeClient.trainerName !== 'Unassigned' && activeClient.trainerName !== 'Head Coach'
      ? syncState.trainers.find(t => t.name.toLowerCase() === (activeClient.trainerName || '').toLowerCase())
      : null);

  const isCoachAssigned = Boolean(
    assignedTrainer || 
    (activeClient.trainerId && activeClient.trainerId.trim() !== '') || 
    (activeClient.trainerName && activeClient.trainerName !== 'Unassigned' && activeClient.trainerName !== 'Head Coach')
  );

  const currentTrainerName = isCoachAssigned 
    ? (assignedTrainer?.name || activeClient.trainerName) 
    : 'Unassigned';
  const currentTrainerRole = isCoachAssigned 
    ? (assignedTrainer?.role || 'Fitness Coach') 
    : 'No Trainer Assigned';
  const currentTrainerPhone = isCoachAssigned 
    ? (assignedTrainer?.phone || '') 
    : '';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#04060a] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-0 font-sans select-none transition-colors duration-200">
      {/* Responsive executive container: fluid on phone, wide and spacious on laptop/desktop */}
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl min-h-screen bg-white dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden shadow-2xl text-left border-x border-slate-200 dark:border-white/5 transition-colors duration-200">
        {/* Top Status Bar with Member Name, Assigned Coach, Password & Logout */}
        <header className="px-4 pt-safe py-3 flex items-center justify-between bg-white/95 dark:bg-[#0c101a] border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xs shadow-md shadow-amber-500/20">
              {activeClient.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase font-display">
                JAWAN <span className="text-amber-500">MEMBER</span>
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium block truncate max-w-[180px] sm:max-w-xs">
                {activeClient.name} • {isCoachAssigned ? `Coach: ${currentTrainerName}` : 'Coach: Unassigned'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle className="scale-90" />
            <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>

            <button
              onClick={() => {
                hapticTap();
                setIsChangePasswordOpen(true);
              }}
              title="Change Password"
              className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors flex items-center space-x-1 text-[11px] font-bold border border-slate-200 dark:border-transparent"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Password</span>
            </button>

            <button
              onClick={handleLogoutClient}
              title="Sign Out / Switch Member"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors border border-slate-200 dark:border-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Tab Router */}
        <main className="flex-1 p-4 overflow-y-auto scrollbar-none pb-24">
          {clientTab === 'home' && (
            <HomeScreen
              clientName={activeClient.name}
              startWeightKg={activeClient.startingWeightKg}
              goalWeightKg={activeClient.goalWeightKg}
              currentWeightKg={activeClient.currentWeightKg}
              trainerName={currentTrainerName}
              trainerRole={currentTrainerRole}
              trainerPhone={currentTrainerPhone}
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
              latestMessage={syncState.messages[syncState.messages.length - 1] || null}
              onStartWorkout={handleStartAssignedWorkout}
              onResumeWorkout={() => setIsWorkoutModalOpen(true)}
              onDiscardWorkout={() => syncedStore.discardWorkoutSession()}
              onExploreExercises={() => setClientTab('exercises')}
              onNavigateToDiet={() => setClientTab('diet')}
              onNavigateToProgress={() => setClientTab('progress')}
              onNavigateToTrainer={() => setClientTab('trainer')}
              onAddWater={(ml) => syncedStore.updateWater(ml)}
            />
          )}

          {clientTab === 'exercises' && (
            <ExercisesScreen onStartExercise={handleStartSingleExercise} clientId={activeClient.id} />
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

          {clientTab === 'trainer' && (
            <TrainerChatScreen
              client={activeClient}
              trainerName={activeClient.trainerName}
            />
          )}
        </main>

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
