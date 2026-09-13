import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  Exercise,
  ActiveWorkoutExercise
} from '../../types';
import { syncedStore, AppSyncState, ClientData } from '../../services/syncedStore';
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
import { Users, ArrowRight, Sparkles, LogOut, Smartphone } from 'lucide-react';
import { navigateToRole } from '../../services/appRouter';

export const ClientApp: React.FC = () => {
  const [clientTab, setClientTab] = useState<TabType>('home');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  // Permanent client session state: never logs out unless explicitly chosen
  const [persistedClientId, setPersistedClientId] = useState<string>(() => {
    return localStorage.getItem('jawan_active_client_id_v1') || '';
  });

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const activeClient = syncState.clients.find((c) => c.id === persistedClientId);

  const handleSelectClient = (clientId: string) => {
    hapticTap();
    setPersistedClientId(clientId);
    localStorage.setItem('jawan_active_client_id_v1', clientId);
    syncedStore.setActiveClient(clientId);
  };

  const handleLogoutClient = () => {
    hapticTap();
    setPersistedClientId('');
    localStorage.removeItem('jawan_active_client_id_v1');
  };

  // If no cadet logged in or no profile chosen, show Cadet Access Gate
  if (!activeClient) {
    return (
      <div className="min-h-screen bg-[#04060a] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm bg-[#090d16]/95 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl text-left animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl">
              ⚔️
            </div>
            <div>
              <h1 className="font-display font-black text-lg tracking-wider text-white uppercase">
                JAWAN <span className="text-amber-500">FITNESS</span>
              </h1>
              <p className="text-[11px] text-neutral-400">Cadet Portal (Mobile & APK)</p>
            </div>
          </div>

          <div className="mb-5 bg-slate-900/60 border border-white/5 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold font-tech uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cadet Identification</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Select your cadet profile to access your custom workouts, diet programs, and coach telemetry. You will stay permanently logged in on this device.
            </p>
          </div>

          {syncState.clients.length === 0 ? (
            <div className="p-5 bg-black/40 border border-dashed border-amber-500/30 rounded-2xl text-center space-y-3">
              <Users className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
              <h3 className="font-bold text-white text-sm">No Cadets Enrolled Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your Gym Director must enroll your cadet profile in the Admin Console before you can log in.
              </p>
              <button
                onClick={() => navigateToRole('admin')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Go to Admin Console
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[11px] font-tech uppercase text-slate-400 font-bold block">
                Select Your Cadet Profile
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {syncState.clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex items-center justify-between text-left transition-all group"
                  >
                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Coach: <span className="text-slate-200">{client.trainerName || 'Unassigned'}</span>
                      </div>
                      <div className="text-[10px] text-amber-400 font-tech mt-0.5">
                        {client.currentWeightKg} kg • Target: {client.goalWeightKg} kg
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-white/5 text-center text-[11px] text-neutral-500">
            Jawan Fitness Platform &copy; 2026 • Persistent Cadet Session
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

  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 font-sans select-none">
      {/* Mobile viewport frame for Desktop / 100% full screen on Mobile & APK */}
      <div className="w-full sm:max-w-md h-screen sm:h-[880px] bg-[#07090e] text-slate-100 flex flex-col sm:rounded-[44px] sm:border-4 sm:border-slate-800 relative overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-left">
        {/* Top Status Bar with Cadet Name, Assigned Coach, and Logout */}
        <header className="px-4 pt-3 pb-2.5 flex items-center justify-between bg-[#0c101a] border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xs shadow-md shadow-amber-500/20">
              {activeClient.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wider uppercase font-display">
                JAWAN <span className="text-amber-500">CADET</span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-medium block truncate max-w-[170px]">
                {activeClient.name} • Coach: {activeClient.trainerName || 'None'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>

            <button
              onClick={handleLogoutClient}
              title="Switch Cadet Profile"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
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
