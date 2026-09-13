import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Dumbbell,
  Apple,
  ClipboardList,
  AlertTriangle,
  FileText,
  Settings,
  Search,
  Plus,
  CheckCircle2,
  X,
  Activity,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Smartphone,
  Check,
  Menu,
  Filter
} from 'lucide-react';
import { ExerciseService } from '../../services/exerciseService';
import { FoodService } from '../../data/foodDatabase';
import { Exercise, FoodItem } from '../../types';
import { syncedStore, AppSyncState, ClientData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

type AdminTab =
  | 'dashboard'
  | 'clients'
  | 'trainers'
  | 'exercises'
  | 'foods'
  | 'templates'
  | 'attention'
  | 'audit'
  | 'settings';

interface AdminScreenProps {
  onSwitchToClient?: () => void;
  onSwitchToTrainer?: () => void;
  onSwitchToSyncView?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onSwitchToClient,
  onSwitchToTrainer,
  onSwitchToSyncView
}) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Add Client Modal State (Starting from scratch)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientHeight, setNewClientHeight] = useState(170);
  const [newClientStartWeight, setNewClientStartWeight] = useState(75);
  const [newClientGoal, setNewClientGoal] = useState('Weight Loss & Hypertrophy');
  const [newClientGoalWeight, setNewClientGoalWeight] = useState(70);
  const [newClientTrainer, setNewClientTrainer] = useState('trainer-ravi');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Client search & filter state
  const [clientSearch, setClientSearch] = useState('');
  const [clientFilterStatus, setClientFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Exercise search in admin
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState('All');

  // Food search in admin
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('All');

  // Mobile menu drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen to syncedStore
  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    hapticTap();

    const selectedTrainer = syncState.trainers.find((t) => t.id === newClientTrainer) || syncState.trainers[0];

    syncedStore.createClient({
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone,
      heightCm: newClientHeight,
      startingWeightKg: newClientStartWeight,
      currentWeightKg: newClientStartWeight,
      goal: newClientGoal,
      goalWeightKg: newClientGoalWeight,
      trainerId: selectedTrainer.id,
      trainerName: selectedTrainer.name,
      gymId: 'JAWAN-SALEM-01'
    });

    setIsAddClientOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setActionNotice(`Client ${newClientName} enrolled! Assigned to ${selectedTrainer.name}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const allExercises = ExerciseService.getAll();
  const filteredExercises = allExercises.filter((ex) => {
    const matchesCat = exerciseCategory === 'All' || ex.category === exerciseCategory;
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const allFoods = FoodService.searchCurated(foodSearch, foodCategory);

  const MODULE_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'clients', label: `Clients (${syncState.clients.length})`, icon: Users },
    { id: 'trainers', label: `Trainers (${syncState.trainers.length})`, icon: ShieldCheck },
    { id: 'exercises', label: '1,324 Exercises', icon: Dumbbell },
    { id: 'foods', label: `10,000+ Foods`, icon: Apple },
    { id: 'templates', label: 'Templates', icon: ClipboardList },
    { id: 'attention', label: 'Attention (4)', icon: AlertTriangle },
    { id: 'audit', label: `Audit (${syncState.events.length})`, icon: FileText },
    { id: 'settings', label: 'Gym Settings', icon: Settings }
  ];

  return (
    <div className="w-full min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans text-left">
      {/* 1. TOP RESPONSIVE ADMIN HEADER (Optimized for Mobile & Desktop) */}
      <header className="w-full bg-[#0a0e18] border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-40 backdrop-blur-xl gap-2">
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-base sm:text-lg shadow">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-xs sm:text-base font-black text-white font-display tracking-tight">
                JAWAN ADMIN
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-tech font-extrabold uppercase">
                HQ
              </span>
              <span className="hidden sm:inline-flex text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-tech font-bold items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live D1</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-tech truncate">
              Salem HQ • Zero-Billing Fitness Platform
            </p>
          </div>
        </div>

        {/* Global Action Switchers (Responsive Buttons) */}
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

          {onSwitchToTrainer && (
            <button
              onClick={() => {
                hapticTap();
                onSwitchToTrainer();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] sm:text-xs font-bold font-tech flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Trainer PWA</span>
              <span className="sm:hidden">Trainer</span>
            </button>
          )}

          {onSwitchToClient && (
            <button
              onClick={() => {
                hapticTap();
                onSwitchToClient();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] sm:text-xs font-black font-display uppercase tracking-wider flex items-center space-x-1 shadow"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Client Arun</span>
              <span className="sm:hidden">Client</span>
            </button>
          )}
        </div>
      </header>

      {/* MOBILE HORIZONTAL SUB-NAVIGATION TABS (Visible on phones & tablets < md) */}
      <nav className="md:hidden flex space-x-1.5 overflow-x-auto p-2 bg-[#090d16] border-b border-white/10 scrollbar-none">
        {MODULE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                hapticTap();
                setActiveTab(item.id as AdminTab);
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

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 sm:px-6 py-2 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. MAIN LAYOUT: SIDEBAR (Desktop) + CONTENT AREA (Responsive) */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP ADMIN SIDEBAR (Hidden on mobile < md) */}
        <aside className="hidden md:flex w-64 bg-[#080b13] border-r border-white/10 p-4 flex-col justify-between flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-tech font-bold uppercase text-slate-500 px-3 pb-1 block">
              Command Modules
            </span>

            {MODULE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    hapticTap();
                    setActiveTab(item.id as AdminTab);
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

          {/* Quick Client Enroll Button */}
          <div className="pt-4 border-t border-white/5">
            <button
              onClick={() => {
                hapticTap();
                setIsAddClientOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Client</span>
            </button>
          </div>
        </aside>

        {/* EXPANSIVE MAIN CONTENT PANEL (Padded for both mobile and desktop) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {/* Stat Cards Grid (Mobile responsive 2 cols, desktop 4 cols) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Enrolled</span>
                    <Users className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-display mt-1">
                    {syncState.clients.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-emerald-400 font-tech mt-0.5">
                    100% Active in Salem
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Trainers</span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-display mt-1">
                    {syncState.trainers.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-tech mt-0.5 truncate">
                    Coach Ravi, Vignesh, Suresh
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Workouts</span>
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-display mt-1">
                    {syncState.workoutHistory.length + 14}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-tech mt-0.5">
                    Completed Today
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Adherence</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-display mt-1">
                    89.4%
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-tech mt-0.5">
                    Avg Routine Compliance
                  </div>
                </div>
              </div>

              {/* Active Client Spotlight (Arun) */}
              <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-tech font-bold uppercase text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Specification Focus • Arun</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-tech bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Active Mission
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Cadet</span>
                    <h3 className="text-sm sm:text-base font-black text-white font-display mt-0.5">Arun</h3>
                    <span className="text-xs text-slate-400">arun.fitness@gmail.com</span>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Biometrics</span>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      170 cm • <span className="text-amber-400">108 kg → 80 kg</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-tech">↓ 4.4 kg dropped (103.6 kg current)</span>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-tech">Coach</span>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">Coach Ravi</div>
                    <span className="text-xs text-slate-400">Senior S&C Specialist</span>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                    <button
                      onClick={() => {
                        hapticTap();
                        syncedStore.setActiveClient('client-arun');
                        if (onSwitchToClient) onSwitchToClient();
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all"
                    >
                      Open Arun's Phone
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Audit Log Stream */}
              <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-white font-display uppercase tracking-wider">
                    Instant Synchronous Audit Stream
                  </h3>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-tech">
                    Live Broadcast to Admin, Trainer & Client
                  </span>
                </div>

                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {syncState.events.map((ev) => (
                    <div key={ev.id} className="py-2.5 sm:py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[9px] font-tech font-bold px-1.5 sm:px-2 py-0.5 rounded ${
                              ev.sourceRole === 'ADMIN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : ev.sourceRole === 'TRAINER'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {ev.sourceRole}
                          </span>
                          <span className="font-bold text-white text-xs">{ev.title}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] sm:text-xs mt-0.5">{ev.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2 font-tech text-slate-500 text-[10px]">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENT ROSTER (Responsive Table / Card Stack on Mobile) */}
          {activeTab === 'clients' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    Client Roster Management
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage client profiles, starting weights, mission goals, and assigned trainers.
                  </p>
                </div>

                <button
                  onClick={() => {
                    hapticTap();
                    setIsAddClientOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Enroll New Client (Arun)</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-white/10 rounded-xl p-2">
                <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search clients by name, email, or trainer..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                />
              </div>

              {/* Empty State when starting from scratch */}
              {syncState.clients.length === 0 ? (
                <div className="p-8 text-center bg-[#0b0f1a] border border-white/10 rounded-2xl space-y-3 my-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-xl shadow-lg shadow-amber-500/10">
                    👥
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">No Clients Enrolled Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Start from scratch by enrolling your first gym client. You can assign them to a coach, define starting metrics, and mission goals.
                  </p>
                  <button
                    onClick={() => {
                      hapticTap();
                      setIsAddClientOpen(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs inline-flex items-center space-x-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Enroll First Client</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Responsive Client Cards for Mobile & Tablet */}
                  <div className="grid grid-cols-1 md:hidden gap-3">
                {syncState.clients
                  .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                  .map((client) => (
                    <div key={client.id} className="p-3.5 bg-[#0b0f1a] border border-white/10 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{client.name}</h4>
                          <span className="text-[11px] text-slate-400">{client.email}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-tech font-bold">
                          {client.status}
                        </span>
                      </div>
                      <div className="text-xs font-tech text-slate-300">
                        Coach: <span className="font-bold text-white">{client.trainerName}</span> • Goal: <span className="text-amber-400 font-bold">{client.goalWeightKg} kg</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="font-tech text-amber-400">Workout: {client.workoutAdherence}%</span>
                        <span className="font-tech text-cyan-400">Diet: {client.dietAdherence}%</span>
                        <button
                          onClick={() => {
                            hapticTap();
                            syncedStore.setActiveClient(client.id);
                            if (onSwitchToClient) onSwitchToClient();
                          }}
                          className="px-2.5 py-1 bg-amber-500 text-black font-bold text-xs rounded-lg"
                        >
                          App
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Full Table on Larger Screens */}
              <div className="hidden md:block bg-[#0b0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-tech uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Client Name</th>
                      <th className="p-4">Assigned Trainer</th>
                      <th className="p-4">Biometrics & Goal</th>
                      <th className="p-4">Workout Adherence</th>
                      <th className="p-4">Diet Adherence</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {syncState.clients
                      .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                      .map((client) => (
                        <tr key={client.id} className="hover:bg-white/5 transition-all">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{client.name}</div>
                            <div className="text-slate-400 text-[11px]">{client.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-200">{client.trainerName}</span>
                          </td>
                          <td className="p-4">
                            <div className="text-white font-tech">
                              {client.heightCm} cm • {client.currentWeightKg} kg
                            </div>
                            <div className="text-[11px] text-amber-400 font-bold">
                              Goal: {client.goalWeightKg} kg ({client.goal})
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-amber-400 font-tech">{client.workoutAdherence}%</span>
                              <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full"
                                  style={{ width: `${client.workoutAdherence}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-cyan-400 font-tech">{client.dietAdherence}%</span>
                              <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-cyan-400 h-full rounded-full"
                                  style={{ width: `${client.dietAdherence}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-tech font-bold">
                              {client.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                hapticTap();
                                syncedStore.setActiveClient(client.id);
                                if (onSwitchToClient) onSwitchToClient();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-xs font-bold"
                            >
                              Open App
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

          {/* TAB 3: 10,000+ COMPREHENSIVE ENGLISH FOOD DATABASE */}
          {activeTab === 'foods' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    10,000+ Comprehensive English Nutrition Database
                  </h2>
                  <p className="text-xs text-slate-400">
                    Clean English names, every fruit, vegetable, grain, meat, fish, pulse, nut, seed, beverage, and supplement with verified macros.
                  </p>
                </div>
                <span className="text-xs font-tech font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                  {FoodService.getCount().toLocaleString()} Items Indexed
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 bg-slate-900/80 border border-white/10 rounded-xl p-2">
                  <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search any fruit, vegetable, chicken, rice, apple, banana, spinach, oats, egg..."
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                  />
                </div>

                {/* English Category Pills */}
                <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-tech font-bold">
                  {[
                    'All',
                    'Fruits',
                    'Vegetables & Greens',
                    'Meats & Seafood',
                    'Eggs & Dairy',
                    'Grains & Millets',
                    'Pulses & Legumes',
                    'Nuts & Healthy Fats',
                    'Beverages & Drinks',
                    'Supplements',
                    'South Indian Breakfast'
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        hapticTap();
                        setFoodCategory(cat);
                      }}
                      className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                        foodCategory === cat
                          ? 'bg-amber-500 text-black font-extrabold shadow'
                          : 'bg-[#101522] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foods List Grid (Responsive on Mobile & Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {allFoods.map((food) => (
                  <div
                    key={food.id}
                    className="p-3 bg-[#0b0f1a] border border-white/10 rounded-2xl flex items-center justify-between hover:border-amber-500/40 transition-all text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-white truncate leading-tight">{food.name}</h4>
                      <span className="text-[10px] text-slate-400 font-tech">
                        {food.servingSize} • {food.category}
                      </span>
                      <div className="text-[11px] font-tech text-slate-300 mt-1 flex space-x-2">
                        <span>P: <span className="text-amber-400 font-bold">{food.protein}g</span></span>
                        <span>C: <span className="text-cyan-400 font-bold">{food.carbs}g</span></span>
                        <span>F: <span className="text-rose-400 font-bold">{food.fat}g</span></span>
                        <span>Fib: <span className="text-emerald-400 font-bold">{food.fiber}g</span></span>
                      </div>
                    </div>
                    <div className="text-right font-tech font-bold text-sm text-white flex-shrink-0">
                      {food.calories} <span className="text-[10px] text-slate-500 block">kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 1,324 EXERCISES AUDITOR */}
          {activeTab === 'exercises' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    1,324 Gym Exercise Master Dataset
                  </h2>
                  <p className="text-xs text-slate-400 font-tech">
                    Multilingual 3D human biomechanics animations with loopable playback.
                  </p>
                </div>
                <span className="text-xs font-tech text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                  {filteredExercises.length} / 1,324 Loaded
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-white/10 rounded-xl p-2">
                <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search exercise by name, muscle, equipment..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                />
              </div>

              {/* Grid of Exercises */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {filteredExercises.slice(0, 24).map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 bg-[#0b0f1a] border border-white/10 rounded-2xl flex items-center space-x-3 hover:border-amber-500/40 transition-all text-xs"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={ex.animationUrl || ex.thumbnailUrl}
                        alt={ex.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-tech uppercase text-amber-400 font-bold">
                        {ex.category} • {ex.equipment}
                      </span>
                      <h4 className="font-bold text-white truncate capitalize mt-0.5">
                        {ex.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-tech truncate">
                        Primary: {ex.primaryMuscle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-display">Live Synchronous Audit Trail</h2>
                <p className="text-xs text-slate-400">
                  Immutable event log capturing all state changes across Admin, Trainer, and Client.
                </p>
              </div>

              <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-4 divide-y divide-white/5 shadow-lg">
                {syncState.events.map((ev) => (
                  <div key={ev.id} className="py-2.5 sm:py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <span
                          className={`text-[9px] font-tech font-bold px-1.5 sm:px-2 py-0.5 rounded ${
                            ev.sourceRole === 'ADMIN'
                              ? 'bg-amber-500/20 text-amber-300'
                              : ev.sourceRole === 'TRAINER'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {ev.sourceRole}
                        </span>
                        <span className="font-bold text-white text-xs">{ev.title}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] sm:text-xs mt-0.5">{ev.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2 font-tech text-slate-500 text-[10px]">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TRAINERS */}
          {activeTab === 'trainers' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-display">Staff Trainer Supervision</h2>
                <p className="text-xs text-slate-400">
                  Salem HQ Fitness Staff coaches responsible for workout programming and nutrition prescriptions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {syncState.trainers.map((trainer) => (
                  <div key={trainer.id} className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 shadow-lg space-y-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0 flex items-center justify-center font-bold text-amber-400">
                        {trainer.name.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white font-display">{trainer.name}</h3>
                        <p className="text-[11px] text-slate-400 font-tech">{trainer.role}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-white/5">
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-tech">Cadets</span>
                        <div className="font-bold text-amber-400 text-sm mt-0.5">{trainer.clientsCount}</div>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-tech">Adherence</span>
                        <div className="font-bold text-emerald-400 text-sm mt-0.5">{trainer.avgAdherence}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. ADD CLIENT MODAL (Rule 2 from Specification - 100% Mobile Responsive) */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-3 sm:space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white font-display">
                  Enroll Client (Specification Step 2)
                </h3>
              </div>
              <button
                onClick={() => setIsAddClientOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Arun"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={newClientHeight}
                    onChange={(e) => setNewClientHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-tech font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                    Starting Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={newClientStartWeight}
                    onChange={(e) => setNewClientStartWeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-amber-400 outline-none focus:border-amber-500 font-tech font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                    Goal
                  </label>
                  <input
                    type="text"
                    value={newClientGoal}
                    onChange={(e) => setNewClientGoal(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                    Goal Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={newClientGoalWeight}
                    onChange={(e) => setNewClientGoalWeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-emerald-400 outline-none focus:border-amber-500 font-tech font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1">
                  Assign Staff Trainer
                </label>
                <select
                  value={newClientTrainer}
                  onChange={(e) => setNewClientTrainer(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-bold text-xs"
                >
                  {syncState.trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreateClient}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
              >
                Create Client Account (Status = ACTIVE)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
