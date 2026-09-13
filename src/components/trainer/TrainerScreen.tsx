import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Dumbbell,
  Apple,
  Send,
  Plus,
  Trash2,
  Check,
  Search,
  X,
  MessageSquare,
  Activity,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  Smartphone,
  Eye
} from 'lucide-react';
import { ExerciseService } from '../../services/exerciseService';
import { FoodService } from '../../data/foodDatabase';
import { Exercise, FoodItem, AssignedWorkout, AssignedMealPlan, ChatMessage } from '../../types';
import { syncedStore, AppSyncState, ClientData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

interface TrainerScreenProps {
  onSwitchToAdmin?: () => void;
  onSwitchToClient?: () => void;
  onSwitchToSyncView?: () => void;
}

export const TrainerScreen: React.FC<TrainerScreenProps> = ({
  onSwitchToAdmin,
  onSwitchToClient,
  onSwitchToSyncView
}) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'builder_workout' | 'builder_diet' | 'history' | 'chat'>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string>('client-arun');
  const [inputMessage, setInputMessage] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Specification 5: Monday Chest + Triceps workout builder state
  const [workoutTitle, setWorkoutTitle] = useState('Monday — Chest + Triceps');
  const [workoutSplit, setWorkoutSplit] = useState('Push Day');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [builderExercises, setBuilderExercises] = useState([
    {
      exerciseId: '0314',
      exerciseName: 'Incline Dumbbell Press',
      targetSets: 3,
      targetReps: 10,
      targetWeightKg: 12,
      restSeconds: 90,
      notes: 'Upper chest angle. 2s negative.'
    },
    {
      exerciseId: '0025',
      exerciseName: 'Machine Chest Press',
      targetSets: 3,
      targetReps: 12,
      targetWeightKg: 40,
      restSeconds: 90,
      notes: 'Drive through sternum.'
    },
    {
      exerciseId: '0319',
      exerciseName: 'Cable Fly',
      targetSets: 3,
      targetReps: 12,
      targetWeightKg: 15,
      restSeconds: 60,
      notes: 'Peak contraction.'
    },
    {
      exerciseId: '0251',
      exerciseName: 'Triceps Pushdown',
      targetSets: 3,
      targetReps: 12,
      targetWeightKg: 25,
      restSeconds: 60,
      notes: 'Lock elbows.'
    },
    {
      exerciseId: '0314',
      exerciseName: 'Overhead Triceps Extension',
      targetSets: 3,
      targetReps: 10,
      targetWeightKg: 14,
      restSeconds: 60,
      notes: 'Deep stretch.'
    }
  ]);

  // Specification 19: Weight Loss Diet Plan builder state
  const [dietTitle, setDietTitle] = useState('Weight Loss Diet Plan');
  const [dietCalories, setDietCalories] = useState(2300);
  const [dietProtein, setDietProtein] = useState(150);
  const [dietCarbs, setDietCarbs] = useState(250);
  const [dietFat, setDietFat] = useState(70);
  const [dietMeals, setDietMeals] = useState([
    {
      type: 'breakfast' as const,
      title: 'Breakfast',
      items: ['3 Idli', '2 Eggs', 'Sambar'],
      suggestedCalories: 460,
      suggestedProtein: 26
    },
    {
      type: 'lunch' as const,
      title: 'Lunch',
      items: ['Rice', 'Chicken', 'Vegetables', 'Curd'],
      suggestedCalories: 680,
      suggestedProtein: 52
    },
    {
      type: 'snack' as const,
      title: 'Snack',
      items: ['Peanuts', 'Fruit'],
      suggestedCalories: 240,
      suggestedProtein: 10
    },
    {
      type: 'dinner' as const,
      title: 'Dinner',
      items: ['Chapati', 'Paneer', 'Vegetables'],
      suggestedCalories: 480,
      suggestedProtein: 28
    }
  ]);

  // Exercise picker modal
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [tempSets, setTempSets] = useState(3);
  const [tempReps, setTempReps] = useState(10);
  const [tempWeight, setTempWeight] = useState(12);
  const [tempRest, setTempRest] = useState(60);

  // Food picker modal
  const [targetMealType, setTargetMealType] = useState<null | 'breakfast' | 'lunch' | 'snack' | 'dinner'>(null);
  const [foodQuery, setFoodQuery] = useState('');
  const [trainerFoodCategory, setTrainerFoodCategory] = useState('All');

  // Selected client with scratch fallback
  const defaultClientFallback = {
    id: 'client-none',
    name: 'No Clients Assigned',
    email: 'No client enrolled yet',
    phone: '',
    heightCm: 0,
    startingWeightKg: 0,
    currentWeightKg: 0,
    goal: 'None',
    goalWeightKg: 0,
    trainerId: 'trainer-ravi',
    trainerName: 'Coach Ravi',
    status: 'Inactive' as const,
    firstLoginCompleted: false,
    gymId: '',
    workoutAdherence: 0,
    dietAdherence: 0,
    lastWorkout: 'Never'
  };

  const activeClient = syncState.clients.find((c) => c.id === selectedClientId) || syncState.clients[0] || defaultClientFallback;
  const assignedWorkout = syncState.assignedWorkouts[activeClient.id] || null;
  const assignedDiet = syncState.assignedDietPlans[activeClient.id] || null;

  // Listen to syncedStore
  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  // Handle assign workout (Specification Step 5)
  const handleAssignWorkoutToClient = () => {
    hapticTap();
    if (!activeClient || activeClient.id === 'client-none') {
      setActionNotice('Please enroll a client first in the Admin console before assigning workouts.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    const newAssigned: AssignedWorkout = {
      id: `asg-${Date.now()}`,
      title: workoutTitle,
      split: workoutSplit,
      assignedBy: 'Coach Ravi',
      assignedDate: 'Today',
      estimatedMinutes,
      exercises: builderExercises
    };

    syncedStore.assignWorkout(activeClient.id, newAssigned);
    setActionNotice(`Assigned "${workoutTitle}" (${builderExercises.length} movements) to ${activeClient.name}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Handle assign diet (Specification Step 19)
  const handleAssignDietToClient = () => {
    hapticTap();
    if (!activeClient || activeClient.id === 'client-none') {
      setActionNotice('Please enroll a client first in the Admin console before assigning diet plans.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    const newPlan: AssignedMealPlan = {
      id: `plan-${Date.now()}`,
      title: dietTitle,
      dailyCalories: dietCalories,
      dailyProtein: dietProtein,
      dailyCarbs: dietCarbs,
      dailyFat: dietFat,
      assignedBy: 'Coach Ravi',
      meals: dietMeals
    };

    syncedStore.assignDietPlan(activeClient.id, newPlan);
    setActionNotice(`Assigned "${dietTitle}" (${dietCalories} kcal) to ${activeClient.name}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    hapticTap();
    syncedStore.sendMessage('trainer', inputMessage);
    setInputMessage('');
  };

  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans text-left">
      {/* 1. TOP TRAINER WEB / PWA HEADER */}
      <header className="w-full bg-[#0b0f1a] border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-40 backdrop-blur-xl gap-2">
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-base sm:text-lg shadow">
            🧑‍🏫
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-xs sm:text-base font-black text-white font-display tracking-tight">
                TRAINER WORKSPACE
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded font-tech font-bold">
                PWA
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-tech truncate">
              Coach Ravi • {syncState.clients.length} Cadets • Live D1 Sync
            </p>
          </div>
        </div>

        {/* Global Nav Switchers */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {onSwitchToSyncView && (
            <button
              onClick={() => {
                hapticTap();
                onSwitchToSyncView();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] sm:text-xs font-bold font-tech flex items-center space-x-1"
            >
              <span>⚡ 3-Sync</span>
            </button>
          )}

          {onSwitchToAdmin && (
            <button
              onClick={() => {
                hapticTap();
                onSwitchToAdmin();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] sm:text-xs font-bold font-tech flex items-center space-x-1"
            >
              <span>👑 Admin</span>
            </button>
          )}

          {onSwitchToClient && (
            <button
              onClick={() => {
                hapticTap();
                syncedStore.setActiveClient(activeClient.id);
                onSwitchToClient();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] sm:text-xs font-black font-display uppercase tracking-wider flex items-center space-x-1 shadow"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Arun App</span>
            </button>
          )}
        </div>
      </header>

      {/* MOBILE HORIZONTAL SUB-NAVIGATION TABS (Phones & tablets < md) */}
      <nav className="md:hidden flex space-x-1.5 overflow-x-auto p-2 bg-[#090d16] border-b border-white/10 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'clients', label: activeClient.name, icon: Users },
          { id: 'builder_workout', label: '🏋️ Workout', icon: Dumbbell },
          { id: 'builder_diet', label: '🥗 Diet', icon: Apple },
          { id: 'history', label: '📊 Logs & PRs', icon: Eye },
          { id: 'chat', label: '💬 Chat', icon: MessageSquare }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                hapticTap();
                setActiveTab(item.id as any);
              }}
              className={`flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-black font-black shadow'
                  : 'bg-slate-900 text-slate-400 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Notification */}
      {actionNotice && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 sm:px-6 py-2 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. MAIN LAYOUT: SIDEBAR + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* TRAINER DESKTOP/TABLET SIDEBAR (Hidden on mobile < md) */}
        <aside className="hidden md:flex w-64 bg-[#090c15] border-r border-white/10 p-4 flex-col justify-between flex-shrink-0">
          <div className="space-y-4">
            {/* Active Client Selector Dropdown */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-1.5">
              <span className="text-[10px] font-tech uppercase text-slate-400 font-bold block">
                Selected Cadet
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#151a24] text-white font-bold text-xs rounded-xl p-2 border border-white/10 outline-none"
              >
                {syncState.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.currentWeightKg}kg • Goal: {c.goalWeightKg}kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-1">
              {[
                { id: 'dashboard', label: 'Trainer Dashboard', icon: Activity },
                { id: 'clients', label: `Client Profile (${activeClient.name})`, icon: Users },
                { id: 'builder_workout', label: '🏋️ Workout Builder', icon: Dumbbell },
                { id: 'builder_diet', label: '🥗 Diet Builder', icon: Apple },
                { id: 'history', label: '📊 Workout Review & PRs', icon: Eye },
                { id: 'chat', label: `💬 Chat (${syncState.messages.length})`, icon: MessageSquare }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      hapticTap();
                      setActiveTab(item.id as any);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-500 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Push Assignment Bar */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <button
              onClick={handleAssignWorkoutToClient}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>ASSIGN TO {activeClient.name.toUpperCase()}</span>
            </button>
          </div>
        </aside>

        {/* MAIN TRAINER CONTENT WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SUB-VIEW 1: TRAINER DASHBOARD (Specification Step 27) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-white font-display">
                  Good morning, Coach Ravi 👋
                </h2>
                <p className="text-xs text-slate-400 font-tech">
                  Senior Strength Coach • Salem HQ Facility Direct Telemetry
                </p>
              </div>

              {/* 3 Metric Cards (Rule 27) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="text-xs text-slate-400 font-tech uppercase">Active Cadets</div>
                  <div className="text-3xl font-black text-white font-display mt-1">18</div>
                  <div className="text-xs text-emerald-400 font-tech mt-1">Arun, Karthik, Priya + 15</div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="text-xs text-slate-400 font-tech uppercase">Today's Workouts</div>
                  <div className="text-3xl font-black text-emerald-400 font-display mt-1">14 Completed</div>
                  <div className="text-xs text-slate-400 font-tech mt-1">3 pending today</div>
                </div>

                <div className="bg-[#0b0f1a] border border-red-500/30 rounded-2xl p-5 shadow-lg">
                  <div className="text-xs text-red-400 font-tech uppercase">Needs Attention</div>
                  <div className="text-3xl font-black text-red-400 font-display mt-1">4 Cadets</div>
                  <div className="text-xs text-slate-400 font-tech mt-1">Diet lag {'>'} 2 days</div>
                </div>
              </div>

              {/* Today's Client Quick Follow-ups */}
              <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  Cadet Follow-up Queue
                </h3>

                <div className="divide-y divide-white/5">
                  <div className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        AR
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm">Arun</span>
                        <div className="text-slate-400 text-xs">
                          {assignedWorkout ? `Assigned: ${assignedWorkout.title}` : 'Workout pending assignment'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-emerald-400 font-tech font-bold">✓ Active 92% Adherence</span>
                      <button
                        onClick={() => {
                          hapticTap();
                          setSelectedClientId('client-arun');
                          setActiveTab('builder_workout');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs"
                      >
                        Adjust Plan
                      </button>
                    </div>
                  </div>

                  <div className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                        KA
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm">Karthik</span>
                        <div className="text-slate-400 text-xs">No workout for 4 days ⚠</div>
                      </div>
                    </div>
                    <span className="text-amber-400 font-tech font-bold">Nudge Needed</span>
                  </div>

                  <div className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                        PR
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm">Priya</span>
                        <div className="text-slate-400 text-xs">Diet logged today (1,650 kcal)</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-tech font-bold">✓ On Track</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: CLIENT PROFILE (Specification Step 27 overview) */}
          {activeTab === 'clients' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white font-display">{activeClient.name} (Cadet)</h2>
                    <p className="text-xs text-slate-400">{activeClient.email} • {activeClient.phone}</p>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-tech font-bold">
                    {activeClient.status} Mission
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Starting Weight</span>
                    <div className="font-bold text-white text-base mt-0.5">{activeClient.startingWeightKg} kg</div>
                  </div>
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Current Weight</span>
                    <div className="font-bold text-amber-400 text-base mt-0.5">{activeClient.currentWeightKg} kg</div>
                    <span className="text-[10px] text-emerald-400 font-tech">↓ 4.4 kg dropped</span>
                  </div>
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Target Goal</span>
                    <div className="font-bold text-emerald-400 text-base mt-0.5">{activeClient.goalWeightKg} kg</div>
                    <span className="text-[10px] text-slate-400 font-tech">{activeClient.goal}</span>
                  </div>
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Adherence</span>
                    <div className="font-bold text-cyan-400 text-base mt-0.5">
                      {activeClient.workoutAdherence}% W / {activeClient.dietAdherence}% D
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveTab('builder_workout')}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase rounded-xl shadow"
                  >
                    Program Workout Split
                  </button>
                  <button
                    onClick={() => setActiveTab('builder_diet')}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs uppercase rounded-xl border border-white/10"
                  >
                    Program Nutrition
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-display font-bold text-xs rounded-xl border border-white/10"
                  >
                    View Set Logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: WORKOUT BUILDER (Specification Step 5) */}
          {activeTab === 'builder_workout' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-display">
                    Prescribe Workout Routine (Specification Step 5)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Target Cadet: <span className="text-white font-bold">{activeClient.name}</span>
                  </p>
                </div>

                <button
                  onClick={handleAssignWorkoutToClient}
                  className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all"
                >
                  ASSIGN TO {activeClient.name.toUpperCase()}
                </button>
              </div>

              {/* Title & Timing Config */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0b0f1a] border border-white/10 p-4 rounded-2xl">
                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase font-bold block mb-1">
                    Routine Title
                  </label>
                  <input
                    type="text"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase font-bold block mb-1">
                    Split
                  </label>
                  <input
                    type="text"
                    value={workoutSplit}
                    onChange={(e) => setWorkoutSplit(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase font-bold block mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold font-tech"
                  />
                </div>
              </div>

              {/* 5 Movements Specified in Rule 5 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-tech font-bold uppercase">
                  <span>Prescribed Movements ({builderExercises.length})</span>
                  <button
                    onClick={() => {
                      hapticTap();
                      setIsAddingExercise(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add From 1,324 Dataset</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {builderExercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#0b0f1a] border border-white/10 rounded-2xl flex items-center justify-between shadow-md"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center font-tech">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white">{ex.exerciseName}</h4>
                        </div>
                        <div className="flex items-center space-x-4 text-xs font-tech text-slate-300 mt-1.5 ml-8">
                          <span>🎯 {ex.targetSets} sets × {ex.targetReps} reps</span>
                          <span>•</span>
                          <span>Weight: <span className="text-amber-400 font-bold">{ex.targetWeightKg || 12} kg</span></span>
                          <span>•</span>
                          <span>Rest: <span className="text-cyan-400 font-bold">{ex.restSeconds} sec</span></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setBuilderExercises(builderExercises.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: DIET BUILDER (Specification Step 19) */}
          {activeTab === 'builder_diet' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-display">
                    Prescribe Tamil Nadu Nutrition (Specification Step 19)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Target Cadet: <span className="text-white font-bold">{activeClient.name}</span>
                  </p>
                </div>

                <button
                  onClick={handleAssignDietToClient}
                  className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all"
                >
                  ASSIGN TO {activeClient.name.toUpperCase()}
                </button>
              </div>

              {/* Macro Targets */}
              <div className="grid grid-cols-4 gap-3 bg-[#0b0f1a] border border-white/10 p-4 rounded-2xl text-center text-xs">
                <div>
                  <span className="text-[10px] font-tech text-slate-400 uppercase block mb-1">Calories</span>
                  <input
                    type="number"
                    value={dietCalories}
                    onChange={(e) => setDietCalories(Number(e.target.value))}
                    className="w-full bg-slate-900 rounded-lg p-2 text-center text-amber-400 font-tech font-bold text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-tech text-slate-400 uppercase block mb-1">Protein (g)</span>
                  <input
                    type="number"
                    value={dietProtein}
                    onChange={(e) => setDietProtein(Number(e.target.value))}
                    className="w-full bg-slate-900 rounded-lg p-2 text-center text-cyan-400 font-tech font-bold text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-tech text-slate-400 uppercase block mb-1">Carbs (g)</span>
                  <input
                    type="number"
                    value={dietCarbs}
                    onChange={(e) => setDietCarbs(Number(e.target.value))}
                    className="w-full bg-slate-900 rounded-lg p-2 text-center text-slate-200 font-tech font-bold text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-tech text-slate-400 uppercase block mb-1">Fat (g)</span>
                  <input
                    type="number"
                    value={dietFat}
                    onChange={(e) => setDietFat(Number(e.target.value))}
                    className="w-full bg-slate-900 rounded-lg p-2 text-center text-rose-400 font-tech font-bold text-sm"
                  />
                </div>
              </div>

              {/* 4 Prescribed Meals from Specification 19 */}
              <div className="space-y-3">
                {dietMeals.map((meal) => (
                  <div key={meal.type} className="p-4 bg-[#0b0f1a] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 font-display uppercase tracking-wider">
                        {meal.title}
                      </span>
                      <span className="text-xs font-tech text-slate-400">
                        {meal.suggestedCalories} kcal • {meal.suggestedProtein}g Protein
                      </span>
                    </div>

                    <div className="space-y-1">
                      {meal.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-200 py-1 border-b border-white/5">
                          <span>• {it}</span>
                          <button
                            onClick={() => {
                              setDietMeals((prev) =>
                                prev.map((m) =>
                                  m.type === meal.type
                                    ? { ...m, items: m.items.filter((_, i) => i !== idx) }
                                    : m
                                )
                              );
                            }}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        hapticTap();
                        setTargetMealType(meal.type);
                        setFoodQuery('');
                      }}
                      className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/30 text-xs font-bold font-tech flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Tamil Gym Food Item</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: COMPLETED WORKOUT INSPECTOR (Specification Steps 17 & 18) */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-display">
                    Workout Execution Review & Adherence (Specification Steps 17–18)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cadet Arun performed set-by-set telemetry.
                  </p>
                </div>
              </div>

              {/* Arun's Logged Workout Details */}
              <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-tech uppercase text-amber-400 font-bold block">
                      TODAY'S WORKOUT COMPLETED
                    </span>
                    <h3 className="text-base font-black text-white font-display">
                      Chest + Triceps • 47 min • 15 / 15 Sets
                    </h3>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-tech font-bold border border-emerald-500/30">
                    92% Adherence
                  </span>
                </div>

                {/* Performed Set Details */}
                <div className="space-y-3 pt-2">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">1. Incline Dumbbell Press</span>
                      <span className="text-amber-400 font-tech font-bold">Target: 12 kg × 10 (3 sets)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-tech">
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Set 1</span>
                        <span className="text-emerald-400 font-bold">12 kg × 10 reps ✓</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Set 2</span>
                        <span className="text-emerald-400 font-bold">12 kg × 10 reps ✓</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Set 3 (Actual)</span>
                        <span className="text-amber-400 font-bold">10 kg × 8 reps ✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">2. Machine Chest Press</span>
                      <span className="text-amber-400 font-tech font-bold">Target: 40 kg × 12 (3 sets)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-tech">
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Set 1</span>
                        <span className="text-emerald-400 font-bold">40 kg × 12 reps ✓</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Set 2</span>
                        <span className="text-emerald-400 font-bold">40 kg × 12 reps ✓</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Set 3 (Actual)</span>
                        <span className="text-emerald-400 font-bold">40 kg × 10 reps ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trainer Next Decision Adjuster (Step 18) */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-amber-400 block">
                    Coach Decision: Adjust Next Workout Target
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        hapticTap();
                        alert('Updated Arun’s next Incline DB Press target to 14 kg × 10!');
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                    >
                      Progress (+2.5 kg next session)
                    </button>
                    <button
                      onClick={() => {
                        hapticTap();
                        alert('Updated Arun’s next Incline DB Press target to 10 kg × 10 for form mastery!');
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 border border-white/10 text-xs font-bold"
                    >
                      Deload / Consolidate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 6: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col h-[500px]">
              <div className="pb-3 border-b border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Direct Channel with {activeClient.name}</span>
                <span className="text-[10px] text-emerald-400 font-tech">● Synchronized Live</span>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {syncState.messages.map((msg) => {
                  const isMe = msg.sender === 'trainer';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-amber-500 text-black font-medium rounded-br-none'
                            : 'bg-slate-800 text-white rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 font-tech">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Send coaching instruction to ${activeClient.name}...`}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. EXERCISE PICKER MODAL (1,324 Dataset) */}
      {isAddingExercise && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white font-display">Pick From 1,324 Gym Exercises</h3>
              </div>
              <button onClick={() => setIsAddingExercise(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by movement, muscle, equipment..."
                value={exerciseQuery}
                onChange={(e) => setExerciseQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3 bg-slate-900/60 p-2 rounded-xl text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Sets</span>
                <input
                  type="number"
                  value={tempSets}
                  onChange={(e) => setTempSets(Number(e.target.value))}
                  className="w-full bg-slate-800 rounded p-1 text-center font-bold text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Reps</span>
                <input
                  type="number"
                  value={tempReps}
                  onChange={(e) => setTempReps(Number(e.target.value))}
                  className="w-full bg-slate-800 rounded p-1 text-center font-bold text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Weight (kg)</span>
                <input
                  type="number"
                  value={tempWeight}
                  onChange={(e) => setTempWeight(Number(e.target.value))}
                  className="w-full bg-slate-800 rounded p-1 text-center font-bold text-amber-400"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Rest (s)</span>
                <input
                  type="number"
                  value={tempRest}
                  onChange={(e) => setTempRest(Number(e.target.value))}
                  className="w-full bg-slate-800 rounded p-1 text-center font-bold text-cyan-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {ExerciseService.search(exerciseQuery).slice(0, 30).map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    hapticTap();
                    setBuilderExercises((prev) => [
                      ...prev,
                      {
                        exerciseId: ex.id,
                        exerciseName: ex.name,
                        targetSets: tempSets,
                        targetReps: tempReps,
                        targetWeightKg: tempWeight,
                        restSeconds: tempRest,
                        notes: 'Prescribed by Coach Ravi'
                      }
                    ]);
                    setIsAddingExercise(false);
                  }}
                  className="p-2.5 bg-slate-900/80 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/40 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={ex.animationUrl || ex.thumbnailUrl}
                      alt={ex.name}
                      className="w-10 h-10 rounded-lg object-contain bg-black flex-shrink-0"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-white capitalize">{ex.name}</h5>
                      <span className="text-[10px] text-slate-400 font-tech">
                        {ex.primaryMuscle} • {ex.equipment}
                      </span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-amber-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOD PICKER MODAL (Tamil Nadu Gym DB) */}
      {targetMealType && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-tech text-amber-400 font-bold uppercase">
                  Adding to {targetMealType.toUpperCase()}
                </span>
                <h3 className="text-sm font-black text-white font-display">Pick From 10,000+ Nutrition Database</h3>
              </div>
              <button onClick={() => setTargetMealType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search any fruit, vegetable, chicken, egg, rice, oats, paneer..."
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            {/* English Category Pills */}
            <div className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none text-[10px] font-tech font-bold">
              {[
                { id: 'All', label: 'All Items' },
                { id: 'Fruits', label: '🍎 Fruits' },
                { id: 'Vegetables & Greens', label: '🥦 Veggies & Greens' },
                { id: 'Meats & Seafood', label: '🍗 Meats & Fish' },
                { id: 'Eggs & Dairy', label: '🥚 Eggs & Dairy' },
                { id: 'Grains & Millets', label: '🌾 Rice & Grains' },
                { id: 'Pulses & Legumes', label: '🌱 Dal & Soya' },
                { id: 'Nuts & Healthy Fats', label: '🥜 Nuts & Seeds' },
                { id: 'Beverages & Drinks', label: '🥥 Drinks' },
                { id: 'Supplements', label: '⚡ Supplements' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    hapticTap();
                    setTrainerFoodCategory(c.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex-shrink-0 transition-all ${
                    trainerFoodCategory === c.id
                      ? 'bg-amber-500 text-black font-extrabold shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {FoodService.searchCurated(foodQuery, trainerFoodCategory).map((food) => (
                <div
                  key={food.id}
                  onClick={() => {
                    hapticTap();
                    setDietMeals((prev) =>
                      prev.map((m) =>
                        m.type === targetMealType
                          ? {
                              ...m,
                              items: [...m.items, `${food.name} (${food.servingSize})`],
                              suggestedCalories: Math.round(m.suggestedCalories + food.calories),
                              suggestedProtein: Math.round((m.suggestedProtein + food.protein) * 10) / 10
                            }
                          : m
                      )
                    );
                    setDietCalories((prev) => prev + food.calories);
                    setDietProtein((prev) => Math.round(prev + food.protein));
                    setDietCarbs((prev) => Math.round(prev + food.carbs));
                    setDietFat((prev) => Math.round(prev + food.fat));
                    setTargetMealType(null);
                  }}
                  className="p-2.5 bg-slate-900/80 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/40 rounded-xl flex items-center justify-between cursor-pointer transition-all text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white">{food.name}</h5>
                    <span className="text-[10px] text-slate-400 font-tech">
                      {food.servingSize} • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                    </span>
                  </div>
                  <div className="text-right font-tech font-bold text-amber-400">
                    {food.calories} kcal
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
