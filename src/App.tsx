import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  RoutineTemplate,
  Exercise,
  LoggedMealItem,
  DailyNutritionGoals,
  WeightRecord,
  ActiveWorkoutExercise,
  AssignedWorkout,
  AssignedMealPlan,
  ChatMessage
} from './types';
import { syncedStore, AppSyncState } from './services/syncedStore';
import { ExerciseService } from './services/exerciseService';
import { AdminScreen } from './components/admin/AdminScreen';
import { TrainerScreen } from './components/trainer/TrainerScreen';
import { Live3SyncView } from './components/sync/Live3SyncView';
import { HomeScreen } from './components/home/HomeScreen';
import { WorkoutHubScreen } from './components/workout/WorkoutHubScreen';
import { ExercisesScreen } from './components/exercises/ExercisesScreen';
import { DietScreen } from './components/diet/DietScreen';
import { ProgressScreen } from './components/progress/ProgressScreen';
import { BottomNav, TabType } from './components/navigation/BottomNav';
import { ActiveWorkoutModal } from './components/workout/ActiveWorkoutModal';
import { FirstLoginModal } from './components/onboarding/FirstLoginModal';
import { IOSInstallBanner } from './components/common/IOSInstallBanner';
import { Dumbbell, ShieldCheck, Smartphone, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { hapticTap } from './utils/audioHaptics';

export type SystemViewMode = 'sync' | 'admin' | 'trainer' | 'client';

export const App: React.FC = () => {
  // View mode based on URL hash or default
  const [viewMode, setViewMode] = useState<SystemViewMode>(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin' || hash === 'trainer' || hash === 'client' || hash === 'sync') {
        return hash;
      }
      const saved = localStorage.getItem('jawan_view_mode');
      if (saved === 'admin' || saved === 'trainer' || saved === 'client' || saved === 'sync') {
        return saved;
      }
    } catch {
      // fallback
    }
    // Default to Live 3-System Sync on wide desktop, or client on phone
    return window.innerWidth >= 1200 ? 'sync' : 'client';
  });

  // Client Tab Navigation
  const [clientTab, setClientTab] = useState<TabType>('home');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(true);

  // Sync Store State
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  useEffect(() => {
    localStorage.setItem('jawan_view_mode', viewMode);
    window.location.hash = viewMode;
  }, [viewMode]);

  // Active client & assignments
  const activeClient = syncState.clients.find((c) => c.id === syncState.activeClientId) || syncState.clients[0];
  const assignedWorkout = syncState.assignedWorkouts[activeClient.id];
  const assignedDiet = syncState.assignedDietPlans[activeClient.id];

  // Start assigned workout from Trainer (Specification Step 7)
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

  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col items-center justify-start relative overflow-x-hidden font-sans">
      {/* 1. MASTER PLATFORM TOP SELECTOR (SEPARATE SYSTEMS SWITCHER) */}
      <nav className="w-full bg-[#070a12]/95 border-b border-white/10 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
            ⚡
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-[10px] font-tech text-amber-400 font-bold uppercase tracking-wider block">
              3-Connected Systems Architecture
            </span>
            <span className="text-xs font-black text-white font-display">
              ADMIN → TRAINER → CLIENT (NO BILLING/ERP)
            </span>
          </div>
        </div>

        {/* 4 Distinct Views Selector */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-[#0e1320] p-1 rounded-2xl border border-white/10 text-xs font-tech font-bold">
          <button
            onClick={() => {
              hapticTap();
              setViewMode('sync');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              viewMode === 'sync'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡ Live 3-Sync View</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setViewMode('admin');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              viewMode === 'admin'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👑 Admin Web</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setViewMode('trainer');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              viewMode === 'trainer'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🧑‍🏫 Trainer Web/PWA</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setViewMode('client');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              viewMode === 'client'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Client Arun App</span>
          </button>
        </div>
      </nav>

      {/* 2. RENDER ACTIVE SYSTEM VIEW */}
      {viewMode === 'sync' && (
        <Live3SyncView
          onSelectFullView={(role) => {
            hapticTap();
            setViewMode(role);
          }}
        />
      )}

      {viewMode === 'admin' && (
        <AdminScreen
          onSwitchToClient={() => setViewMode('client')}
          onSwitchToTrainer={() => setViewMode('trainer')}
          onSwitchToSyncView={() => setViewMode('sync')}
        />
      )}

      {viewMode === 'trainer' && (
        <TrainerScreen
          onSwitchToAdmin={() => setViewMode('admin')}
          onSwitchToClient={() => setViewMode('client')}
          onSwitchToSyncView={() => setViewMode('sync')}
        />
      )}

      {viewMode === 'client' && (
        <div className="w-full flex-1 flex items-center justify-center p-0 sm:p-6">
          {/* Authentic Smartphone Frame on Desktop; Full viewport on Mobile */}
          <div className="w-full sm:max-w-md h-screen sm:h-[880px] bg-[#07090e] text-slate-100 flex flex-col sm:rounded-[44px] sm:border-4 sm:border-slate-800 relative overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-left">
            {/* Top Phone Status Bar */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between bg-[#0c101a] border-b border-white/5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                  YS
                </div>
                <div>
                  <h3 className="text-xs font-black text-white font-display">JAWAN FITNESS</h3>
                  <span className="text-[9px] font-tech text-amber-400 font-bold">
                    Cadet: {activeClient.name} • Coach: {activeClient.trainerName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-tech text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>
            </div>

            {/* Client Tab Router */}
            <main className="flex-1 p-4 overflow-y-auto scrollbar-none pb-20">
              {clientTab === 'home' && (
                <HomeScreen
                  clientName={activeClient.name}
                  startWeightKg={activeClient.startingWeightKg}
                  goalWeightKg={activeClient.goalWeightKg}
                  currentWeightKg={activeClient.currentWeightKg}
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
                  stepsCount={syncState.isGoogleFitConnected ? syncState.googleFitSteps : 0}
                  stepsGoal={10000}
                  weightHistory={syncState.weightHistory}
                  latestMessage={syncState.messages[syncState.messages.length - 1] || null}
                  isGoogleFitConnected={syncState.isGoogleFitConnected}
                  onToggleGoogleFit={() => syncedStore.toggleGoogleFit(!syncState.isGoogleFitConnected)}
                  onStartWorkout={handleStartAssignedWorkout}
                  onResumeWorkout={() => setIsWorkoutModalOpen(true)}
                  onDiscardWorkout={() => syncedStore.discardWorkoutSession()}
                  onExploreExercises={() => setClientTab('exercises')}
                  onNavigateToDiet={() => setClientTab('diet')}
                  onNavigateToProgress={() => setClientTab('progress')}
                  onNavigateToTrainer={() => setViewMode('trainer')}
                  onAddWater={(ml) => syncedStore.updateWater(ml)}
                />
              )}

              {clientTab === 'workout' && (
                <WorkoutHubScreen
                  workoutHistory={syncState.workoutHistory}
                  onStartRoutine={() => handleStartAssignedWorkout()}
                  onStartCustomWorkout={() => {
                    handleStartSingleExercise(ExerciseService.getAll()[0]);
                  }}
                />
              )}

              {clientTab === 'exercises' && (
                <ExercisesScreen onStartExercise={handleStartSingleExercise} />
              )}

              {clientTab === 'diet' && (
                <DietScreen
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
                  onLogWeight={(w) => syncedStore.logWeight(w)}
                />
              )}

              {clientTab === 'trainer' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setViewMode('trainer')}
                    className="w-full py-3 bg-amber-500 text-black font-bold text-xs rounded-xl"
                  >
                    Open Full Trainer Dashboard
                  </button>
                </div>
              )}
            </main>

            {/* Bottom Client Navigation */}
            <BottomNav
              currentTab={clientTab}
              onSelectTab={(tab) => setClientTab(tab)}
              isWorkoutActive={!!syncState.activeWorkoutSession}
            />

            {/* Active Workout Live Session Modal */}
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

            {/* First Login Onboarding Modal if Arun hasn't completed setup */}
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

            <IOSInstallBanner />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
