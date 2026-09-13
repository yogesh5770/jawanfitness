import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  Exercise,
  ActiveWorkoutExercise
} from '../../types';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { ExerciseService } from '../../services/exerciseService';
import { HomeScreen } from '../home/HomeScreen';
import { WorkoutHubScreen } from '../workout/WorkoutHubScreen';
import { ExercisesScreen } from '../exercises/ExercisesScreen';
import { DietScreen } from '../diet/DietScreen';
import { ProgressScreen } from '../progress/ProgressScreen';
import { BottomNav, TabType } from '../navigation/BottomNav';
import { ActiveWorkoutModal } from '../workout/ActiveWorkoutModal';
import { FirstLoginModal } from '../onboarding/FirstLoginModal';
import { IOSInstallBanner } from '../common/IOSInstallBanner';
import { hapticTap } from '../../utils/audioHaptics';

export const ClientApp: React.FC = () => {
  const [clientTab, setClientTab] = useState<TabType>('home');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(true);
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const activeClient = syncState.clients.find((c) => c.id === syncState.activeClientId) || syncState.clients[0];
  const assignedWorkout = syncState.assignedWorkouts[activeClient.id];
  const assignedDiet = syncState.assignedDietPlans[activeClient.id];

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
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 font-sans select-none">
      {/* Mobile viewport frame for Desktop / 100% full screen on Mobile & APK */}
      <div className="w-full sm:max-w-md h-screen sm:h-[880px] bg-[#07090e] text-slate-100 flex flex-col sm:rounded-[44px] sm:border-4 sm:border-slate-800 relative overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-left">
        {/* Top Status Bar */}
        <header className="px-5 pt-3.5 pb-2.5 flex items-center justify-between bg-[#0c101a] border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xs shadow-md shadow-amber-500/20">
              YS
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wider uppercase font-display">
                JAWAN <span className="text-amber-500">FITNESS</span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-medium block">
                Cadet: {activeClient.name} • Coach: {activeClient.trainerName}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYNCED</span>
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
              onNavigateToTrainer={() => setClientTab('progress')}
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

        <IOSInstallBanner />
      </div>
    </div>
  );
};

export default ClientApp;
