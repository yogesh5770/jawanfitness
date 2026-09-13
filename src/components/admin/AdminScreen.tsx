import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Dumbbell,
  Apple,
  ClipboardList,
  FileText,
  Search,
  Plus,
  Trash2,
  X,
  Activity,
  Sparkles,
  Check,
  Menu,
  UserCheck,
  UserPlus,
  RefreshCw,
  Award
} from 'lucide-react';
import { ExerciseService } from '../../services/exerciseService';
import { FoodService } from '../../data/foodDatabase';
import { syncedStore, AppSyncState, ClientData, TrainerData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

type AdminTab =
  | 'dashboard'
  | 'clients'
  | 'trainers'
  | 'exercises'
  | 'foods'
  | 'templates'
  | 'audit';

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

  // Add Client Modal State
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientHeight, setNewClientHeight] = useState(170);
  const [newClientStartWeight, setNewClientStartWeight] = useState(75);
  const [newClientGoal, setNewClientGoal] = useState('Weight Loss & Hypertrophy');
  const [newClientGoalWeight, setNewClientGoalWeight] = useState(70);
  const [newClientTrainer, setNewClientTrainer] = useState('');

  // Add Trainer Modal State (Admin Only Adds Trainers)
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [newTrainerPhone, setNewTrainerPhone] = useState('');
  const [newTrainerRole, setNewTrainerRole] = useState('Senior Strength & Conditioning Coach');

  // Reassign Client Modal State
  const [reassigningClient, setReassigningClient] = useState<ClientData | null>(null);
  const [selectedTrainerForReassign, setSelectedTrainerForReassign] = useState('');

  // Notifications
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Client search & filter state
  const [clientSearch, setClientSearch] = useState('');

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

  // Sync default trainer selection when trainers change
  useEffect(() => {
    if (syncState.trainers.length > 0 && !newClientTrainer) {
      setNewClientTrainer(syncState.trainers[0].id);
    }
  }, [syncState.trainers, newClientTrainer]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // ADMIN ACTION: Appoint New Trainer
  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerName.trim()) return;
    hapticTap();

    const created = syncedStore.createTrainer({
      name: newTrainerName.trim(),
      email: newTrainerEmail.trim() || `${newTrainerName.toLowerCase().replace(/\s+/g, '')}@jawan.fit`,
      phone: newTrainerPhone.trim() || '+91 98765 43210',
      role: newTrainerRole.trim(),
      status: 'Active'
    });

    setIsAddTrainerOpen(false);
    setNewTrainerName('');
    setNewTrainerEmail('');
    setNewTrainerPhone('');
    showNotification(`Trainer ${created.name} successfully appointed to coaching staff!`);
  };

  // ADMIN ACTION: Remove Trainer
  const handleDeleteTrainer = (trainerId: string, trainerName: string) => {
    if (window.confirm(`Are you sure you want to remove ${trainerName}? Any assigned clients will become unassigned.`)) {
      hapticTap();
      syncedStore.deleteTrainer(trainerId);
      showNotification(`Trainer ${trainerName} removed.`);
    }
  };

  // ADMIN ACTION: Enroll Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    hapticTap();

    const selectedTrainer = syncState.trainers.find((t) => t.id === newClientTrainer);

    syncedStore.createClient({
      name: newClientName.trim(),
      email: newClientEmail.trim() || `${newClientName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: newClientPhone.trim() || '+91 98420 12345',
      heightCm: newClientHeight,
      startingWeightKg: newClientStartWeight,
      currentWeightKg: newClientStartWeight,
      goal: newClientGoal,
      goalWeightKg: newClientGoalWeight,
      trainerId: selectedTrainer ? selectedTrainer.id : '',
      trainerName: selectedTrainer ? selectedTrainer.name : 'Unassigned',
      gymId: 'JAWAN-SALEM-01'
    });

    setIsAddClientOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    showNotification(
      `Client ${newClientName} enrolled! ${selectedTrainer ? `Assigned to ${selectedTrainer.name}.` : 'No trainer assigned yet.'}`
    );
  };

  // ADMIN ACTION: Remove Client
  const handleDeleteClient = (clientId: string, clientName: string) => {
    if (window.confirm(`Remove client ${clientName} from gym records?`)) {
      hapticTap();
      syncedStore.deleteClient(clientId);
      showNotification(`Client ${clientName} removed.`);
    }
  };

  // ADMIN ACTION: Assign / Reassign Client to Trainer
  const handleReassignClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningClient) return;
    hapticTap();

    syncedStore.assignClientToTrainer(reassigningClient.id, selectedTrainerForReassign);
    const trainer = syncState.trainers.find((t) => t.id === selectedTrainerForReassign);
    showNotification(`Cadet ${reassigningClient.name} assigned to ${trainer ? trainer.name : 'Unassigned'}.`);
    setReassigningClient(null);
  };

  const allExercises = ExerciseService.getAll();
  const filteredExercises = allExercises.filter((ex) => {
    const matchesCat = exerciseCategory === 'All' || ex.category === exerciseCategory;
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const allFoods = FoodService.searchCurated(foodSearch, foodCategory);

  const avgAdherence = syncState.clients.length > 0
    ? Math.round(syncState.clients.reduce((sum, c) => sum + (c.workoutAdherence || 0), 0) / syncState.clients.length)
    : 0;

  const MODULE_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'clients', label: `Clients (${syncState.clients.length})`, icon: Users },
    { id: 'trainers', label: `Trainers (${syncState.trainers.length})`, icon: ShieldCheck },
    { id: 'exercises', label: '1,324 Exercises', icon: Dumbbell },
    { id: 'foods', label: '10,000+ Foods', icon: Apple },
    { id: 'templates', label: 'Templates', icon: ClipboardList },
    { id: 'audit', label: `Audit (${syncState.events.length})`, icon: FileText }
  ];

  return (
    <div className="w-full min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans text-left">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-4 z-50 bg-amber-500 text-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-top duration-200 flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. TOP RESPONSIVE ADMIN HEADER */}
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
                <span>Zero Billing Platform</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-tech truncate">
              Director Master Console • Admin-Only Authority
            </p>
          </div>
        </div>

        {/* Global Action Switchers & Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              hapticTap();
              setIsAddTrainerOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold font-tech flex items-center space-x-1.5 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>+ Add Trainer</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setIsAddClientOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-tech flex items-center space-x-1.5 transition-all shadow"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Enroll Client</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0c101a] border-b border-white/10 p-3 flex flex-wrap gap-1.5 z-30">
          {MODULE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  hapticTap();
                  setActiveTab(item.id as AdminTab);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. BODY LAYOUT: DESKTOP SIDEBAR + EXPANSIVE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col justify-between w-64 bg-[#0a0e18] border-r border-white/10 p-4 flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-tech font-bold uppercase text-slate-500 px-3 pb-2 block">
              Administration Modules
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

          <div className="pt-4 border-t border-white/5 space-y-2">
            <button
              onClick={() => {
                hapticTap();
                setIsAddTrainerOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-400 font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Appoint Trainer</span>
            </button>

            <button
              onClick={() => {
                hapticTap();
                setIsAddClientOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Enroll Client</span>
            </button>
          </div>
        </aside>

        {/* EXPANSIVE MAIN CONTENT PANEL */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {/* Stat Cards Grid (100% Real Live State) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Enrolled Clients</span>
                    <Users className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-display mt-1">
                    {syncState.clients.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-emerald-400 font-tech mt-0.5">
                    {syncState.clients.length === 0 ? 'No clients enrolled yet' : `${syncState.clients.length} Active Cadets`}
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Staff Trainers</span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-display mt-1">
                    {syncState.trainers.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-tech mt-0.5 truncate">
                    {syncState.trainers.length === 0
                      ? 'No trainers appointed'
                      : syncState.trainers.map((t) => t.name).join(', ')}
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Workouts Executed</span>
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-display mt-1">
                    {syncState.workoutHistory.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-tech mt-0.5">
                    Live Gym Sessions Logged
                  </div>
                </div>

                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Avg Adherence</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-display mt-1">
                    {avgAdherence}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-tech mt-0.5">
                    Overall Squad Compliance
                  </div>
                </div>
              </div>

              {/* Dynamic Gym Squad Overview */}
              {syncState.clients.length === 0 ? (
                <div className="bg-[#0b0f1a] border border-dashed border-amber-500/30 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
                    🏋️‍♂️
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-lg font-bold text-white font-display">Clean Gym Registry (0 Static Data)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      All static demo profiles have been purged. As the Director, begin by appointing your trainers, then enroll clients and assign them to coaches.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        hapticTap();
                        setIsAddTrainerOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Step 1: Appoint Staff Trainer</span>
                    </button>
                    <button
                      onClick={() => {
                        hapticTap();
                        setIsAddClientOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Step 2: Enroll Client</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-tech font-bold uppercase text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Active Cadets Quick Telemetry</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-tech bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      {syncState.clients.length} Total Enrolled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {syncState.clients.slice(0, 6).map((cadet) => (
                      <div key={cadet.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm">{cadet.name}</h4>
                          <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {cadet.currentWeightKg} kg
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>Coach: <span className="text-slate-200 font-semibold">{cadet.trainerName || 'None'}</span></span>
                          <button
                            onClick={() => {
                              hapticTap();
                              setReassigningClient(cadet);
                              setSelectedTrainerForReassign(cadet.trainerId || (syncState.trainers[0]?.id || ''));
                            }}
                            className="text-[10px] text-amber-400 hover:underline font-tech font-bold"
                          >
                            Reassign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  {syncState.events.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Audit stream active. System events will log here in real-time.
                    </div>
                  ) : (
                    syncState.events.map((ev) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRAINERS MANAGEMENT (ADMIN ONLY APPOINTS TRAINERS) */}
          {activeTab === 'trainers' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    Staff Trainers & Coaching Roster
                  </h2>
                  <p className="text-xs text-slate-400">
                    Admin-only authority: Appoint coaches, monitor assigned cadet volume, and manage staff credentials.
                  </p>
                </div>
                <button
                  onClick={() => {
                    hapticTap();
                    setIsAddTrainerOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 shadow self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Appoint Trainer</span>
                </button>
              </div>

              {syncState.trainers.length === 0 ? (
                <div className="p-8 bg-[#0b0f1a] border border-dashed border-white/10 rounded-2xl text-center space-y-3">
                  <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
                  <h4 className="font-bold text-white text-sm">No Trainers Appointed Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Appoint your first personal trainer or strength coach. They will receive credentials to build workouts and diets on the Trainer PWA.
                  </p>
                  <button
                    onClick={() => {
                      hapticTap();
                      setIsAddTrainerOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                  >
                    + Appoint First Trainer
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {syncState.trainers.map((trainer) => {
                    const assignedCadets = syncState.clients.filter((c) => c.trainerId === trainer.id);
                    return (
                      <div
                        key={trainer.id}
                        className="p-4 bg-[#0b0f1a] border border-white/10 rounded-2xl space-y-3 relative hover:border-amber-500/40 transition-all shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
                              {trainer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">{trainer.name}</h4>
                              <span className="text-[11px] text-amber-400 font-tech font-bold block">
                                {trainer.role}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTrainer(trainer.id, trainer.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Remove Trainer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-white/5">
                          <div className="flex justify-between">
                            <span>Email:</span>
                            <span className="text-slate-200 font-mono text-[11px]">{trainer.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="text-slate-200">{trainer.phone}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-tech uppercase text-[10px]">Assigned Cadets</span>
                            <span className="font-bold text-amber-400 font-tech">{assignedCadets.length} Active</span>
                          </div>

                          {assignedCadets.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No cadets assigned yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedCadets.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLIENT ROSTER MANAGEMENT */}
          {activeTab === 'clients' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    Client Roster Management
                  </h2>
                  <p className="text-xs text-slate-400">
                    Admin creates client profiles and assigns them directly to staff trainers.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search cadets..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="bg-transparent text-xs text-white outline-none w-28 sm:w-44"
                    />
                  </div>

                  <button
                    onClick={() => {
                      hapticTap();
                      setIsAddClientOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1 shadow whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Enroll Client</span>
                  </button>
                </div>
              </div>

              {syncState.clients.length === 0 ? (
                <div className="p-8 bg-[#0b0f1a] border border-dashed border-white/10 rounded-2xl text-center space-y-3">
                  <Users className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
                  <h4 className="font-bold text-white text-sm">No Clients Enrolled Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Enroll your first gym member. You can enter their starting weight, target goal, and assign them directly to a coach.
                  </p>
                  <button
                    onClick={() => {
                      hapticTap();
                      setIsAddClientOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                  >
                    + Enroll First Client
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile & Tablet Card Stack */}
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
                            <button
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-xs text-slate-300 flex items-center justify-between">
                            <span>Coach: <span className="font-bold text-white">{client.trainerName || 'Unassigned'}</span></span>
                            <button
                              onClick={() => {
                                hapticTap();
                                setReassigningClient(client);
                                setSelectedTrainerForReassign(client.trainerId || (syncState.trainers[0]?.id || ''));
                              }}
                              className="text-[11px] text-amber-400 font-bold hover:underline"
                            >
                              Change Coach
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 font-tech">
                            <span className="text-slate-400">{client.heightCm} cm • {client.currentWeightKg} kg</span>
                            <span className="text-amber-400 font-bold">Target: {client.goalWeightKg} kg</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-[#0b0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-tech uppercase text-[10px]">
                        <tr>
                          <th className="p-4">Cadet Name</th>
                          <th className="p-4">Assigned Coach</th>
                          <th className="p-4">Biometrics & Goal</th>
                          <th className="p-4">Workout Adherence</th>
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
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-200">{client.trainerName || 'Unassigned'}</span>
                                  <button
                                    onClick={() => {
                                      hapticTap();
                                      setReassigningClient(client);
                                      setSelectedTrainerForReassign(client.trainerId || (syncState.trainers[0]?.id || ''));
                                    }}
                                    className="p-1 rounded bg-slate-800 text-amber-400 hover:bg-slate-700 text-[10px] font-bold"
                                    title="Reassign Trainer"
                                  >
                                    Reassign
                                  </button>
                                </div>
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
                                  <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-amber-400 h-full rounded-full"
                                      style={{ width: `${client.workoutAdherence}%` }}
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
                                  onClick={() => handleDeleteClient(client.id, client.name)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Delete Client"
                                >
                                  <Trash2 className="w-4 h-4" />
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

          {/* TAB 4: 10,000+ COMPREHENSIVE ENGLISH FOOD DATABASE */}
          {activeTab === 'foods' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    10,000+ Comprehensive English Nutrition Database
                  </h2>
                  <p className="text-xs text-slate-400">
                    Clean English names, fruits, vegetables, grains, meats, fish, pulses, nuts, seeds, beverages with verified macros.
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
                    placeholder="Search chicken, rice, apple, banana, spinach, oats, egg, whey, paneer..."
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                  />
                </div>

                {/* Category Pills */}
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

              {/* Foods List Grid */}
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

          {/* TAB 5: 1,324 EXERCISES AUDITOR */}
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
                <span className="text-xs font-tech font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                  {allExercises.length} Total Exercises
                </span>
              </div>

              {/* Search & Muscle Filters */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 bg-slate-900/80 border border-white/10 rounded-xl p-2">
                  <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search exercises by name (e.g. Bench Press, Squat, Lat Pulldown)..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                  />
                </div>

                <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-tech font-bold">
                  {['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Abs / Core'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        hapticTap();
                        setExerciseCategory(cat);
                      }}
                      className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                        exerciseCategory === cat
                          ? 'bg-amber-500 text-black font-extrabold shadow'
                          : 'bg-[#101522] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredExercises.slice(0, 30).map((exercise) => (
                  <div
                    key={exercise.id}
                    className="p-3.5 bg-[#0b0f1a] border border-white/10 rounded-2xl hover:border-amber-500/40 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-tech font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {exercise.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-tech">
                        {exercise.equipment}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm truncate">{exercise.name}</h4>
                    <p className="text-slate-400 text-[11px] line-clamp-2">
                      {exercise.trainerTip || exercise.instructions?.[0] || 'Targeted biomechanics movement'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-display">
                  Master Program Templates
                </h2>
                <p className="text-xs text-slate-400">
                  Reusable training blocks available to trainers for 1-click assignment to cadets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Push-Pull-Legs (Hypertrophy Split)',
                    days: '6 Days / Week',
                    focus: 'Maximum muscle hypertrophy and volume density',
                    level: 'Intermediate - Advanced'
                  },
                  {
                    title: 'Upper / Lower Power & Mass',
                    days: '4 Days / Week',
                    focus: 'Heavy compound strength + progressive overload',
                    level: 'All Levels'
                  },
                  {
                    title: 'Full Body Cadet Conditioning',
                    days: '3 Days / Week',
                    focus: 'Metabolic conditioning, stamina & fat burn',
                    level: 'Beginner - Intermediate'
                  },
                  {
                    title: 'Functional Mobility & Core Shred',
                    days: '3 Days / Week',
                    focus: 'Joint health, posture correction & rotational power',
                    level: 'All Levels'
                  }
                ].map((tmpl, idx) => (
                  <div key={idx} className="p-4 bg-[#0b0f1a] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{tmpl.title}</h4>
                      <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {tmpl.days}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{tmpl.focus}</p>
                    <div className="text-[10px] font-tech text-slate-500">Target: {tmpl.level}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-display">
                  System Audit Trail
                </h2>
                <p className="text-xs text-slate-400">
                  Complete immutable log of all admin appointments, client enrollments, and workout completions.
                </p>
              </div>

              <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                {syncState.events.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No events logged yet.</div>
                ) : (
                  syncState.events.map((ev) => (
                    <div key={ev.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[9px] font-tech font-bold px-2 py-0.5 rounded ${
                              ev.sourceRole === 'ADMIN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : ev.sourceRole === 'TRAINER'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {ev.sourceRole}
                          </span>
                          <span className="font-bold text-white">{ev.title}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">{ev.description}</p>
                      </div>
                      <span className="text-slate-500 font-tech text-[10px]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: APPOINT TRAINER (ADMIN ONLY) */}
      {isAddTrainerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white font-display">
                  Appoint Staff Trainer
                </h3>
              </div>
              <button
                onClick={() => setIsAddTrainerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Trainer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTrainerName}
                  onChange={(e) => setNewTrainerName(e.target.value)}
                  placeholder="e.g. Coach Ravi"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Official Email
                </label>
                <input
                  type="email"
                  value={newTrainerEmail}
                  onChange={(e) => setNewTrainerEmail(e.target.value)}
                  placeholder="coach.ravi@jawan.fit"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={newTrainerPhone}
                  onChange={(e) => setNewTrainerPhone(e.target.value)}
                  placeholder="+91 98940 11223"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Specialization / Coaching Role
                </label>
                <input
                  type="text"
                  value={newTrainerRole}
                  onChange={(e) => setNewTrainerRole(e.target.value)}
                  placeholder="e.g. Senior Strength & Conditioning Coach"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Appoint Trainer to Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENROLL CLIENT (ADMIN ONLY) */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-3 sm:space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white font-display">
                  Enroll Client Profile
                </h3>
              </div>
              <button
                onClick={() => setIsAddClientOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
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
                    placeholder="arun@gmail.com"
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
                    placeholder="+91 98420 12345"
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
                    Fitness Mission
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
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Assign Staff Coach
                </label>
                {syncState.trainers.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-[11px] space-y-1">
                    <p className="font-bold">No trainers appointed yet.</p>
                    <p className="text-slate-400">
                      You can enroll this client now and assign a trainer later, or appoint a trainer first.
                    </p>
                  </div>
                ) : (
                  <select
                    value={newClientTrainer}
                    onChange={(e) => setNewClientTrainer(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-bold text-xs"
                  >
                    <option value="">-- Select Coach --</option>
                    {syncState.trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Create Client Account (Status = ACTIVE)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REASSIGN CLIENT TO TRAINER (ADMIN ONLY) */}
      {reassigningClient && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Assign Coach for {reassigningClient.name}
                </h3>
              </div>
              <button
                onClick={() => setReassigningClient(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReassignClient} className="space-y-3 text-xs">
              <p className="text-slate-400 text-xs">
                Current Coach: <span className="text-white font-bold">{reassigningClient.trainerName || 'Unassigned'}</span>
              </p>

              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Select New Staff Coach
                </label>
                <select
                  value={selectedTrainerForReassign}
                  onChange={(e) => setSelectedTrainerForReassign(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-bold text-xs"
                >
                  <option value="">Unassign / No Coach</option>
                  {syncState.trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all"
              >
                Save Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreen;
