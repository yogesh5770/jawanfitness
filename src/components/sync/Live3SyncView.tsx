import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle2,
  Dumbbell,
  Apple,
  Activity,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { syncedStore, AppSyncState } from '../../services/syncedStore';
import { ExerciseService } from '../../services/exerciseService';
import { AdminScreen } from '../admin/AdminScreen';
import { TrainerScreen } from '../trainer/TrainerScreen';
import { HomeScreen } from '../home/HomeScreen';
import { BottomNav } from '../navigation/BottomNav';
import { ActiveWorkoutModal } from '../workout/ActiveWorkoutModal';
import { FirstLoginModal } from '../onboarding/FirstLoginModal';
import { hapticTap } from '../../utils/audioHaptics';

interface Live3SyncViewProps {
  onSelectFullView: (role: 'admin' | 'trainer' | 'client') => void;
}

export const Live3SyncView: React.FC<Live3SyncViewProps> = ({ onSelectFullView }) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTabInPhone, setActiveTabInPhone] = useState<'home' | 'workout' | 'exercises' | 'diet' | 'progress'>('home');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(true);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const activeClient = syncState.clients.find((c) => c.id === syncState.activeClientId) || syncState.clients[0] || {
    id: 'demo-client',
    name: 'New Member',
    email: '',
    phone: '',
    heightCm: 170,
    startingWeightKg: 0,
    currentWeightKg: 0,
    goal: 'General Fitness',
    goalWeightKg: 0,
    trainerId: '',
    trainerName: 'Unassigned',
    status: 'Active',
    firstLoginCompleted: false,
    gymId: 'JAWAN-SALEM-01',
    workoutAdherence: 0,
    dietAdherence: 0,
    lastWorkout: 'Ready'
  };
  const assignedTrainer = activeClient.trainerId
    ? syncState.trainers.find((t) => t.id === activeClient.trainerId)
    : (activeClient.trainerName && activeClient.trainerName !== 'Unassigned' && activeClient.trainerName !== 'Head Coach'
      ? syncState.trainers.find((t) => t.name.toLowerCase() === activeClient.trainerName.toLowerCase())
      : null);
  const isCoachAssigned = Boolean(
    assignedTrainer || 
    (activeClient.trainerId && activeClient.trainerId.trim() !== '') ||
    (activeClient.trainerName && activeClient.trainerName !== 'Unassigned' && activeClient.trainerName !== 'Head Coach')
  );
  const currentTrainerName = isCoachAssigned ? (assignedTrainer?.name || activeClient.trainerName) : 'Unassigned';
  const currentTrainerRole = isCoachAssigned ? (assignedTrainer?.role || 'Fitness Coach') : 'No Trainer Assigned';
  const currentTrainerPhone = isCoachAssigned ? (assignedTrainer?.phone || '') : '';

  const assignedWorkout = syncState.assignedWorkouts[activeClient.id];
  const assignedDiet = syncState.assignedDietPlans[activeClient.id];

  const handleStartAssignedWorkout = () => {
    if (!assignedWorkout) return;
    hapticTap();

    const exercises = assignedWorkout.exercises.map((asgEx) => {
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

    syncedStore.startWorkoutSession({
      id: `session-${Date.now()}`,
      routineName: assignedWorkout.title,
      startTime: Date.now(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      exercises
    });
    setIsWorkoutModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#04060a] text-slate-100 flex flex-col font-sans text-left">
      {/* 1. TOP SYNCHRONOUS COMMAND BANNER */}
      <header className="w-full bg-[#080b13] border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-white font-display">
                INSTANT 3-SYSTEM SYNCHRONOUS MULTI-DEVICE SIMULATOR
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-tech font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected Reactive Bus</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-tech">
              Admin Web (Desktop) ↔ Trainer Web/PWA (Tablet) ↔ Client Mobile App (Arun's Phone)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              hapticTap();
              syncedStore.resetToSpecBaseline();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech font-bold flex items-center space-x-1 transition-all"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN REAL-TIME MULTI-DEVICE WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* COLUMN 1: 👑 ADMIN WEB (4 Columns) */}
        <div className="xl:col-span-4 bg-[#080b13] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[860px]">
          <div className="bg-[#0e1422] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">👑</span>
              <div>
                <h3 className="text-xs font-black text-white font-display">ADMIN WEB CONSOLE</h3>
                <span className="text-[9px] text-slate-400 font-tech">Facility Management</span>
              </div>
            </div>

            <button
              onClick={() => onSelectFullView('admin')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-tech font-bold flex items-center space-x-1"
              title="Open Fullscreen Admin Web"
            >
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>Full View</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Quick Enrolled Clients Card */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-tech uppercase text-[10px] text-slate-400 font-bold">
                  Enrolled Members ({syncState.clients.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-tech">Salem HQ</span>
              </div>
              <div className="space-y-1.5">
                {syncState.clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => syncedStore.setActiveClient(c.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      c.id === syncState.activeClientId
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-[#121824] border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.startingWeightKg}kg → {c.goalWeightKg}kg • {c.trainerName}
                      </span>
                    </div>
                    {c.id === syncState.activeClientId && (
                      <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black font-tech">
                        ACTIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Staff Trainers Card */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-3.5 space-y-2">
              <span className="font-tech uppercase text-[10px] text-slate-400 font-bold block">
                Staff Trainers ({syncState.trainers.length})
              </span>
              <div className="space-y-1.5">
                {syncState.trainers.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-[#121824] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{t.name}</span>
                      <span className="text-[10px] text-slate-400">{t.role}</span>
                    </div>
                    <span className="text-[10px] font-tech text-amber-400 font-bold">{t.clientsCount} Clients</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise & Nutrition DB Stat */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-3.5 space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Exercise Master DB:</span>
                <span className="font-bold text-white">3D Biomechanics</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tamil Nadu Gym Foods:</span>
                <span className="font-bold text-amber-400">85+ Verified Items</span>
              </div>
            </div>

            {/* Live Audit Log Stream */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-3.5 space-y-2">
              <span className="font-tech uppercase text-[10px] text-slate-400 font-bold block">
                Live Audit Broadcast
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {syncState.events.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="p-2 rounded-lg bg-[#121824] border border-white/5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400 font-tech">[{ev.sourceRole}] {ev.title}</span>
                      <span className="text-[9px] text-slate-500 font-tech">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[10px] mt-0.5">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: 🧑‍🏫 TRAINER WEB / PWA (4 Columns) */}
        <div className="xl:col-span-4 bg-[#080b13] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[860px]">
          <div className="bg-[#0e1422] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">🧑‍🏫</span>
              <div>
                <h3 className="text-xs font-black text-white font-display">TRAINER DASHBOARD (COACH RAVI)</h3>
                <span className="text-[9px] text-slate-400 font-tech">Selected Member: {activeClient.name}</span>
              </div>
            </div>

            <button
              onClick={() => onSelectFullView('trainer')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-tech font-bold flex items-center space-x-1"
              title="Open Fullscreen Trainer Workspace"
            >
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>Full View</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Active Member Telemetry Card */}
            <div className="bg-[#0e1422] border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{activeClient.name} (Member)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-tech font-bold">
                  {activeClient.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-tech">Current</span>
                  <div className="font-bold text-amber-400">{activeClient.currentWeightKg} kg</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-tech">Target</span>
                  <div className="font-bold text-emerald-400">{activeClient.goalWeightKg} kg</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-tech">Adherence</span>
                  <div className="font-bold text-cyan-400">{activeClient.workoutAdherence}%</div>
                </div>
              </div>
            </div>

            {/* Prescribe Workout Action (Specification Step 5) */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Dumbbell className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">Program Workout for {activeClient.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-tech">Monday Split</span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[11px]">
                <div className="font-bold text-amber-400">Chest + Triceps (5 Movements)</div>
                <div className="text-slate-300">1. Incline DB Press (3 × 10, 12kg, 90s)</div>
                <div className="text-slate-300">2. Machine Chest Press (3 × 12, 40kg, 90s)</div>
                <div className="text-slate-300">3. Cable Fly (3 × 12, 15kg, 60s)</div>
                <div className="text-slate-300">4. Triceps Pushdown (3 × 12, 25kg, 60s)</div>
                <div className="text-slate-300">5. Overhead Triceps Extension (3 × 10, 14kg, 60s)</div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    hapticTap();
                    syncedStore.assignWorkout(activeClient.id, {
                      id: `asg-${Date.now()}`,
                      title: 'Chest + Triceps',
                      split: 'Push Day',
                      assignedBy: 'Coach Ravi',
                      assignedDate: 'Today',
                      estimatedMinutes: 45,
                      exercises: [
                        { exerciseId: '0314', exerciseName: 'Incline Dumbbell Press', targetSets: 3, targetReps: 10, targetWeightKg: 12, restSeconds: 90 },
                        { exerciseId: '0025', exerciseName: 'Machine Chest Press', targetSets: 3, targetReps: 12, targetWeightKg: 40, restSeconds: 90 },
                        { exerciseId: '0319', exerciseName: 'Cable Fly', targetSets: 3, targetReps: 12, targetWeightKg: 15, restSeconds: 60 },
                        { exerciseId: '0251', exerciseName: 'Triceps Pushdown', targetSets: 3, targetReps: 12, targetWeightKg: 25, restSeconds: 60 },
                        { exerciseId: '0314', exerciseName: 'Overhead Triceps Extension', targetSets: 3, targetReps: 10, targetWeightKg: 14, restSeconds: 60 }
                      ]
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ASSIGN TO {activeClient.name.toUpperCase()}</span>
                </button>

                <button
                  onClick={() => {
                    hapticTap();
                    syncedStore.removeAssignedWorkout(activeClient.id);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 font-tech font-bold text-xs border border-white/10"
                  title="Test unassigned state on client phone"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Prescribe Diet Action (Specification Step 19) */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Apple className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">Tamil Gym Diet (2,300 kcal)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-tech">Macros Locked</span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[11px]">
                <div className="font-bold text-cyan-400">P: 150g • C: 250g • F: 70g</div>
                <div className="text-slate-300">Breakfast: 3 Idli, 2 Eggs, Sambar</div>
                <div className="text-slate-300">Lunch: Rice, Chicken, Vegetables, Curd</div>
                <div className="text-slate-300">Snack: Peanuts, Fruit</div>
                <div className="text-slate-300">Dinner: Chapati, Paneer, Vegetables</div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    hapticTap();
                    syncedStore.assignDietPlan(activeClient.id, {
                      id: `diet-${Date.now()}`,
                      title: 'Weight Loss Diet Plan',
                      dailyCalories: 2300,
                      dailyProtein: 150,
                      dailyCarbs: 250,
                      dailyFat: 70,
                      assignedBy: 'Coach Ravi',
                      meals: [
                        { type: 'breakfast', title: 'Breakfast', items: ['3 Idli', '2 Eggs', 'Sambar'], suggestedCalories: 460, suggestedProtein: 26 },
                        { type: 'lunch', title: 'Lunch', items: ['Rice', 'Chicken', 'Vegetables', 'Curd'], suggestedCalories: 680, suggestedProtein: 52 },
                        { type: 'snack', title: 'Snack', items: ['Peanuts', 'Fruit'], suggestedCalories: 240, suggestedProtein: 10 },
                        { type: 'dinner', title: 'Dinner', items: ['Chapati', 'Paneer', 'Vegetables'], suggestedCalories: 480, suggestedProtein: 28 }
                      ]
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ASSIGN DIET</span>
                </button>

                <button
                  onClick={() => {
                    hapticTap();
                    syncedStore.removeAssignedDietPlan(activeClient.id);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 font-tech font-bold text-xs border border-white/10"
                  title="Test unassigned diet state on client phone"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick Trainer Message sender */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-3 flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Nudge ${activeClient.name}...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    syncedStore.sendMessage('trainer', (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
              />
              <span className="text-[10px] text-slate-500 font-tech">Press ↵</span>
            </div>
          </div>
        </div>

        {/* COLUMN 3: 📱 CLIENT MOBILE APP (Arun's Phone) (4 Columns) */}
        <div className="xl:col-span-4 flex flex-col items-center justify-start h-[860px]">
          {/* Smartphone Bezel */}
          <div className="w-full max-w-[390px] h-full bg-[#07090e] border-4 border-slate-800 rounded-[44px] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative">
            {/* Dynamic Island / Speaker notch */}
            <div className="w-full bg-[#07090e] pt-3 pb-1 px-6 flex items-center justify-between z-30">
              <span className="text-[11px] font-bold text-slate-300 font-tech">06:15 PM</span>
              <div className="w-20 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-emerald-400 font-tech font-bold">5G</span>
                <button
                  onClick={() => onSelectFullView('client')}
                  className="text-amber-400 hover:text-white"
                  title="Open Fullscreen Client App"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Client App Content Screen */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
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
                onExploreExercises={() => onSelectFullView('client')}
                onNavigateToDiet={() => onSelectFullView('client')}
                onNavigateToProgress={() => onSelectFullView('client')}
                onNavigateToTrainer={() => onSelectFullView('trainer')}
                onAddWater={(ml) => syncedStore.updateWater(ml)}
              />
            </div>

            {/* Bottom Smartphone Navigation */}
            <div className="bg-[#090c15] border-t border-white/10 px-4 py-2 flex items-center justify-around text-slate-400 text-[10px] font-tech font-bold">
              <div className="text-amber-400 flex flex-col items-center">
                <span>🏠</span>
                <span>Home</span>
              </div>
              <div className="flex flex-col items-center opacity-60">
                <span>🏋️</span>
                <span>Workout</span>
              </div>
              <div className="flex flex-col items-center opacity-60">
                <span>🥗</span>
                <span>Diet</span>
              </div>
              <div className="flex flex-col items-center opacity-60">
                <span>📈</span>
                <span>Progress</span>
              </div>
            </div>

            {/* Home indicator bar */}
            <div className="w-full pb-2 flex justify-center bg-[#090c15]">
              <div className="w-28 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Active Workout Modal in Phone view if opened */}
            {syncState.activeWorkoutSession && isWorkoutModalOpen && (
              <div className="absolute inset-0 z-40">
                <ActiveWorkoutModal
                  session={syncState.activeWorkoutSession}
                  userWeightKg={activeClient.currentWeightKg}
                  userHeightCm={activeClient.heightCm}
                  onUpdateSession={(session) => syncedStore.updateActiveWorkoutSession(session)}
                  onFinishWorkout={(session) => syncedStore.finishWorkoutSession(session)}
                  onCancelWorkout={() => syncedStore.discardWorkoutSession()}
                  onMinimize={() => setIsWorkoutModalOpen(false)}
                />
              </div>
            )}

            {/* First Login Onboarding Modal if not completed */}
            {!activeClient.firstLoginCompleted && (
              <div className="absolute inset-0 z-50">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
