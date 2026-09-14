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
  Eye,
  Camera,
  Upload
} from 'lucide-react';
import { ExerciseService } from '../../services/exerciseService';
import { FoodService, FOOD_CATEGORIES } from '../../data/foodDatabase';
import { Exercise, FoodItem, AssignedWorkout, AssignedMealPlan, ChatMessage } from '../../types';
import { syncedStore, AppSyncState, ClientData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';
import { compressImageFile } from '../../utils/imageUtils';
import { AddFoodModal } from '../common/AddFoodModal';

interface TrainerScreenProps {
  activeTrainerId?: string;
  onSwitchToAdmin?: () => void;
  onSwitchToClient?: () => void;
  onSwitchToSyncView?: () => void;
}

export const TrainerScreen: React.FC<TrainerScreenProps> = ({
  activeTrainerId,
  onSwitchToAdmin,
  onSwitchToClient,
  onSwitchToSyncView
}) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'builder_workout' | 'builder_diet' | 'history' | 'chat'>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
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
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);

  const currentTrainer = syncState.trainers.find((t) => t.id === activeTrainerId) || syncState.trainers[0];
  const myAssignedClients = currentTrainer
    ? syncState.clients.filter((c) => c.trainerId === currentTrainer.id)
    : syncState.clients;

  // Selected client with scratch fallback
  const defaultClientFallback = {
    id: 'client-none',
    name: 'No Client Assigned',
    email: 'Awaiting Admin assignment',
    phone: '',
    heightCm: 0,
    startingWeightKg: 0,
    currentWeightKg: 0,
    goal: 'None',
    goalWeightKg: 0,
    trainerId: currentTrainer?.id || '',
    trainerName: currentTrainer?.name || 'Coach',
    status: 'Inactive' as const,
    firstLoginCompleted: false,
    gymId: '',
    workoutAdherence: 0,
    dietAdherence: 0,
    lastWorkout: 'Never'
  };

  const activeClient = myAssignedClients.find((c) => c.id === selectedClientId) || myAssignedClients[0] || defaultClientFallback;
  const assignedWorkout = syncState.assignedWorkouts[activeClient.id] || null;
  const assignedDiet = syncState.assignedDietPlans[activeClient.id] || null;

  // Listen to syncedStore
  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  // Sync selectedClientId if current selection is invalid
  useEffect(() => {
    if (myAssignedClients.length > 0 && (!selectedClientId || !myAssignedClients.some((c) => c.id === selectedClientId))) {
      setSelectedClientId(myAssignedClients[0].id);
    }
  }, [myAssignedClients, selectedClientId]);

  // Live 2-second cloud sync when trainer has chat open
  useEffect(() => {
    if (activeTab === 'chat') {
      syncedStore.syncFromCloud(true);
      const interval = setInterval(() => {
        syncedStore.syncFromCloud(true);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Handle assign workout
  const handleAssignWorkoutToClient = () => {
    hapticTap();
    if (!activeClient || activeClient.id === 'client-none') {
      setActionNotice('Please wait for the Gym Director to assign clients to your roster before assigning workouts.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    const newAssigned: AssignedWorkout = {
      id: `asg-${Date.now()}`,
      title: workoutTitle,
      split: workoutSplit,
      assignedBy: currentTrainer ? currentTrainer.name : 'Coach',
      assignedDate: 'Today',
      estimatedMinutes,
      exercises: builderExercises
    };

    syncedStore.assignWorkout(activeClient.id, newAssigned);
    syncedStore.forcePushToCloud();
    setActionNotice(`Assigned "${workoutTitle}" (${builderExercises.length} movements) to ${activeClient.name}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Handle assign diet
  const handleAssignDietToClient = () => {
    hapticTap();
    if (!activeClient || activeClient.id === 'client-none') {
      setActionNotice('Please wait for the Gym Director to assign clients to your roster before assigning diet plans.');
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
      assignedBy: currentTrainer ? currentTrainer.name : 'Coach',
      meals: dietMeals
    };

    syncedStore.assignDietPlan(activeClient.id, newPlan);
    syncedStore.forcePushToCloud();
    setActionNotice(`Assigned "${dietTitle}" (${dietCalories} kcal) to ${activeClient.name}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };


  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeClient) return;
    hapticTap();
    syncedStore.sendMessage(
      'trainer',
      inputMessage.trim(),
      activeClient.id,
      currentTrainer?.id || activeTrainerId,
      currentTrainer?.name || 'Coach'
    );
    setInputMessage('');
  };

  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans text-left overflow-x-hidden">
      {/* 1. TOP TRAINER WEB / PWA HEADER */}
      <header className="w-full bg-[#0b0f1a] border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-40 backdrop-blur-xl gap-2">
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          <div className="relative group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-base sm:text-lg shadow overflow-hidden flex-shrink-0">
              {currentTrainer?.avatarUrl ? (
                <img src={currentTrainer.avatarUrl} alt={currentTrainer.name} className="w-full h-full object-cover" />
              ) : (
                currentTrainer?.name ? currentTrainer.name.slice(0, 2).toUpperCase() : '🧑‍🏫'
              )}
            </div>
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
              {currentTrainer ? currentTrainer.name : 'Staff Coach'} • {myAssignedClients.length} Assigned Clients • Live Sync
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
                if (activeClient.id !== 'client-none') {
                  syncedStore.setActiveClient(activeClient.id);
                }
                onSwitchToClient();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] sm:text-xs font-black font-display uppercase tracking-wider flex items-center space-x-1 shadow"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{activeClient.id !== 'client-none' ? activeClient.name.split(' ')[0] : 'Client'} App</span>
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
                Selected Client
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#151a24] text-white font-bold text-xs rounded-xl p-2 border border-white/10 outline-none"
              >
                {myAssignedClients.length === 0 ? (
                  <option value="">No Clients Assigned</option>
                ) : (
                  myAssignedClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currentWeightKg}kg • Goal: {c.goalWeightKg}kg)
                    </option>
                  ))
                )}
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* SUB-VIEW 1: TRAINER DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Coach Profile Card with Photo & Instant Upload */}
              <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xl font-display shadow-lg overflow-hidden flex-shrink-0">
                      {currentTrainer?.avatarUrl ? (
                        <img src={currentTrainer.avatarUrl} alt={currentTrainer.name} className="w-full h-full object-cover" />
                      ) : (
                        currentTrainer?.name ? currentTrainer.name.slice(0, 2).toUpperCase() : 'CO'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black text-white font-display">
                        {currentTrainer ? currentTrainer.name : 'Coach'}
                      </h3>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-tech font-bold">
                        ACTIVE COACH
                      </span>
                    </div>
                    <p className="text-xs text-amber-400 font-tech font-bold">
                      {currentTrainer?.role || 'Staff Personal Trainer'}
                    </p>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {currentTrainer?.phone || '+91 98420 12345'} • {currentTrainer?.email}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 font-tech font-bold text-xs flex items-center space-x-1.5 self-start sm:self-auto shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official Profile Photo (Managed by Director)</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-white font-display">
                  Performance & Roster Telemetry
                </h2>
                <p className="text-xs text-slate-400 font-tech">
                  Real-time client synchronization and session tracking
                </p>
              </div>

              {/* 3 Metric Cards (100% Real Live State) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="text-xs text-slate-400 font-tech uppercase">My Assigned Clients</div>
                  <div className="text-3xl font-black text-white font-display mt-1">{myAssignedClients.length}</div>
                  <div className="text-xs text-emerald-400 font-tech mt-1 truncate">
                    {myAssignedClients.length === 0
                      ? 'No clients assigned yet'
                      : myAssignedClients.map((c) => c.name).join(', ')}
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="text-xs text-slate-400 font-tech uppercase">Sessions Logged</div>
                  <div className="text-3xl font-black text-emerald-400 font-display mt-1">
                    {syncState.workoutHistory.length}
                  </div>
                  <div className="text-xs text-slate-400 font-tech mt-1">Total gym completions</div>
                </div>

                <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
                  <div className="text-xs text-amber-400 font-tech uppercase">Client Adherence</div>
                  <div className="text-3xl font-black text-amber-400 font-display mt-1">
                    {myAssignedClients.length > 0
                      ? Math.round(myAssignedClients.reduce((sum, c) => sum + (c.workoutAdherence || 0), 0) / myAssignedClients.length)
                      : 0}%
                  </div>
                  <div className="text-xs text-slate-400 font-tech mt-1">Routine compliance average</div>
                </div>
              </div>

              {/* Client Follow-up Queue */}
              <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  Assigned Clients ({myAssignedClients.length})
                </h3>

                {myAssignedClients.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Users className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-white">No Clients Assigned to Your Roster</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      The Gym Director enrolls and assigns clients from the Admin Console. Once assigned to you, their profiles, workout plans, and diets will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {myAssignedClients.map((client) => {
                      const clientWorkout = syncState.assignedWorkouts[client.id];
                      return (
                        <div key={client.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                              {client.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white text-sm">{client.name}</span>
                              <div className="text-slate-400 text-xs">
                                {clientWorkout ? `Assigned: ${clientWorkout.title}` : 'Workout pending assignment'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-emerald-400 font-tech font-bold">
                              {client.workoutAdherence || 0}% Adherence
                            </span>
                            <button
                              onClick={() => {
                                hapticTap();
                                setSelectedClientId(client.id);
                                setActiveTab('builder_workout');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs"
                            >
                              Program Workout
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: CLIENT PROFILE */}
          {activeTab === 'clients' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white font-display">{activeClient.name}</h2>
                    <p className="text-xs text-slate-400">{activeClient.email} • {activeClient.phone}</p>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-tech font-bold">
                    {activeClient.status} Member
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

          {/* SUB-VIEW 3: WORKOUT BUILDER */}
          {activeTab === 'builder_workout' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-display">
                    Prescribe Workout Routine
                  </h2>
                  <p className="text-xs text-slate-400">
                    Client: <span className="text-white font-bold">{activeClient.name}</span>
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
                    <span>+ Add Exercise</span>
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

          {/* SUB-VIEW 4: DIET BUILDER */}
          {activeTab === 'builder_diet' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-display">
                    Prescribe Nutrition Plan
                  </h2>
                  <p className="text-xs text-slate-400">
                    Client: <span className="text-white font-bold">{activeClient.name}</span>
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

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          hapticTap();
                          setTargetMealType(meal.type);
                          setFoodQuery('');
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/30 text-xs font-bold font-tech flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Food Catalog</span>
                      </button>
                      <button
                        onClick={() => {
                          hapticTap();
                          setTargetMealType(meal.type);
                          setIsAddFoodOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-tech flex items-center space-x-1"
                        title="Create & Add Custom Food"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Custom</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: DYNAMIC WORKOUT LOGS & PRS */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-display">
                    Member Workout Logs & Telemetry
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live recorded workout sessions, sets, completed reps, and weights for {activeClient.name}.
                  </p>
                </div>
              </div>

              {syncState.workoutHistory.length === 0 ? (
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">No Completed Workouts Recorded Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    When {activeClient.name} completes an active workout session in the member app, full set logs, weights, reps, and duration will automatically synchronize here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncState.workoutHistory.map((session) => (
                    <div key={session.id} className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-tech uppercase text-amber-400 font-bold block">
                            WORKOUT COMPLETED • {new Date(session.startTime).toLocaleDateString()}
                          </span>
                          <h3 className="text-base font-black text-white font-display">
                            {session.routineName} • {Math.round(session.durationSeconds / 60)} min • {session.exercises.length} Exercises
                          </h3>
                        </div>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-tech font-bold border border-amber-500/30">
                          {session.totalVolumeKg.toLocaleString()} kg Total Volume
                        </span>
                      </div>

                      <div className="space-y-3 pt-2">
                        {session.exercises.map((ex, exIdx) => (
                          <div key={ex.exercise.id || exIdx} className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{exIdx + 1}. {ex.exercise.name}</span>
                              <span className="text-amber-400 font-tech font-bold">{ex.sets.length} Sets</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-tech">
                              {ex.sets.map((set, sIdx) => (
                                <div key={set.id || sIdx} className="bg-black/40 p-2 rounded-lg border border-white/5">
                                  <span className="text-slate-400 block text-[10px]">Set {set.setNumber}</span>
                                  <span className={set.completed ? "text-emerald-400 font-bold" : "text-slate-300 font-bold"}>
                                    {set.weightKg} kg × {set.reps} reps {set.completed ? '✓' : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {(() => {
                  const clientMessages = syncState.messages.filter((msg) => {
                    if (!msg.clientId) return true;
                    if (msg.clientId === activeClient.id) return true;
                    if (activeClient.loginId && msg.clientId.toLowerCase() === activeClient.loginId.toLowerCase()) return true;
                    if (activeClient.email && msg.clientId.toLowerCase() === activeClient.email.toLowerCase()) return true;
                    if (syncState.clients.length <= 1) return true;
                    return false;
                  });

                  if (clientMessages.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                        <MessageSquare className="w-8 h-8 text-amber-500/40 mb-2" />
                        <p className="text-xs font-bold text-slate-400">Direct Channel with {activeClient.name}</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                          Send direct advice, motivation, or technique feedback to your client.
                        </p>
                      </div>
                    );
                  }

                  return clientMessages.map((msg) => {
                    const isMe = msg.sender === 'trainer';
                    // Resolve the member's display name for client messages
                    const memberName = !isMe
                      ? msg.senderName ||
                        syncState.clients.find((c) =>
                          c.id === msg.clientId ||
                          (c.loginId && msg.clientId && c.loginId.toLowerCase() === msg.clientId.toLowerCase()) ||
                          (c.email && msg.clientId && c.email.toLowerCase() === msg.clientId.toLowerCase())
                        )?.name ||
                        'Member'
                      : null;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sender name label */}
                        <span className={`text-[10px] font-tech font-bold px-1 mb-0.5 ${
                          isMe ? 'text-amber-400/70' : 'text-cyan-400/80'
                        }`}>
                          {isMe ? 'You' : (
                            <span className="flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                              <span>{memberName}</span>
                            </span>
                          )}
                        </span>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-br-none'
                              : 'bg-slate-800/90 text-white border border-white/10 rounded-bl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[8px] text-slate-500 mt-0.5 px-1 font-tech">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  });
                })()}
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

      {/* 3. EXERCISE PICKER MODAL */}
      {isAddingExercise && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white font-display">Exercise Library</h3>
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
                <h3 className="text-sm font-black text-white font-display">Food & Nutrition Database</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    hapticTap();
                    setIsAddFoodOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-tech font-black flex items-center space-x-1 shadow"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Custom</span>
                </button>
                <button onClick={() => setTargetMealType(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
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

            {/* Verified Category Pills */}
            <div className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none text-[10px] font-tech font-bold">
              {FOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    hapticTap();
                    setTrainerFoodCategory(cat);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex-shrink-0 transition-all ${
                    trainerFoodCategory === cat
                      ? 'bg-amber-500 text-black font-extrabold shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
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

      {/* 5. ADD CUSTOM FOOD MODAL */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        sourceRole="TRAINER"
        onFoodAdded={(newFood) => {
          if (targetMealType) {
            setDietMeals((prev) =>
              prev.map((m) =>
                m.type === targetMealType
                  ? {
                      ...m,
                      items: [...m.items, `${newFood.name} (${newFood.servingSize})`]
                    }
                  : m
              )
            );
            setDietCalories((prev) => prev + newFood.calories);
            setDietProtein((prev) => Math.round(prev + newFood.protein));
            setDietCarbs((prev) => Math.round(prev + newFood.carbs));
            setDietFat((prev) => Math.round(prev + newFood.fat));
            setTargetMealType(null);
          }
        }}
      />
    </div>
  );
};
