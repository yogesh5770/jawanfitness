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
  Award,
  LogOut,
  Database,
  MessageCircle,
  Key,
  Lock,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { ExerciseService } from '../../services/exerciseService';
import { FoodService } from '../../data/foodDatabase';
import { syncedStore, AppSyncState, ClientData, TrainerData } from '../../services/syncedStore';
import { authService } from '../../services/authService';
import { hapticTap } from '../../utils/audioHaptics';
import { compressImageFile } from '../../utils/imageUtils';
import { CredentialShareModal } from './CredentialShareModal';
import { CredentialInfo } from '../../utils/credentialUtils';
import { ThemeToggle } from '../common/ThemeToggle';
import { AddFoodModal } from '../common/AddFoodModal';

type AdminTab =
  | 'dashboard'
  | 'clients'
  | 'trainers'
  | 'exercises'
  | 'foods'
  | 'audit';

interface AdminScreenProps {
  onSwitchToClient?: () => void;
  onSwitchToTrainer?: () => void;
  onSwitchToSyncView?: () => void;
  onLogout?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onSwitchToClient,
  onSwitchToTrainer,
  onSwitchToSyncView,
  onLogout
}) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Active WhatsApp / Credential Dispatch Modal State
  const [activeCredentialModal, setActiveCredentialModal] = useState<CredentialInfo | null>(null);

  // Add Client Modal State
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientLoginId, setNewClientLoginId] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
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
  const [newTrainerLoginId, setNewTrainerLoginId] = useState('');
  const [newTrainerPassword, setNewTrainerPassword] = useState('');
  const [newTrainerPhoto, setNewTrainerPhoto] = useState('');
  const [isUploadingTrainerPhoto, setIsUploadingTrainerPhoto] = useState(false);

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

  // Add Custom Food Modal State
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Listen to syncedStore and hydrate from Cloudflare D1 on mount
  useEffect(() => {
    syncedStore.syncFromCloud();

    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    hapticTap();
    setIsManualSyncing(true);
    await syncedStore.syncFromCloud();
    setIsManualSyncing(false);
    showNotification('Cloud Database synchronized!');
  };

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const openAddTrainerModal = () => {
    hapticTap();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    setNewTrainerLoginId(`JWT-${suffix}`);
    setNewTrainerPassword(`Coach@${suffix}`);
    setNewTrainerPhoto('');
    setIsAddTrainerOpen(true);
  };

  const handleTrainerPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingTrainerPhoto(true);
      const compressed = await compressImageFile(file, 360, 0.82);
      setNewTrainerPhoto(compressed);
    } catch (err) {
      console.error('Failed to compress trainer photo:', err);
    } finally {
      setIsUploadingTrainerPhoto(false);
    }
  };

  const handleUpdateExistingTrainerPhoto = async (trainerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      hapticTap();
      const compressed = await compressImageFile(file, 360, 0.82);
      syncedStore.updateTrainer(trainerId, { avatarUrl: compressed });
      await syncedStore.forcePushToCloud();
      showNotification('Trainer profile photo updated and synchronized!');
    } catch (err) {
      console.error('Failed to update trainer photo:', err);
    }
  };

  const openAddClientModal = () => {
    hapticTap();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    setNewClientLoginId(`JWM-${suffix}`);
    setNewClientPassword(`Fit@${suffix}`);
    setIsAddClientOpen(true);
  };

  // ADMIN ACTION: Appoint New Trainer
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerName.trim()) return;
    hapticTap();

    const fallbackSuffix = Math.floor(1000 + Math.random() * 9000);
    const assignedLoginId = newTrainerLoginId.trim() || `JWT-${fallbackSuffix}`;
    const assignedPassword = newTrainerPassword.trim() || `Coach@${fallbackSuffix}`;

    const created = syncedStore.createTrainer({
      name: newTrainerName.trim(),
      email: newTrainerEmail.trim() || `${newTrainerName.toLowerCase().replace(/\s+/g, '')}@jawan.fit`,
      phone: newTrainerPhone.trim() || '+91 98765 43210',
      role: 'Staff Trainer',
      status: 'Active',
      loginId: assignedLoginId,
      temporaryPassword: assignedPassword,
      avatarUrl: newTrainerPhoto || undefined
    });

    const portalUser = await authService.createPortalUser({
      email: created.email,
      password: assignedPassword,
      name: created.name,
      role: 'TRAINER',
      phone: created.phone,
      loginId: assignedLoginId
    });

    await syncedStore.forcePushToCloud();

    setIsAddTrainerOpen(false);
    setNewTrainerName('');
    setNewTrainerEmail('');
    setNewTrainerPhone('');
    setNewTrainerLoginId('');
    setNewTrainerPassword('');
    setNewTrainerPhoto('');
    showNotification(
      portalUser.success
        ? `Trainer ${created.name} appointed! Official credentials ready.`
        : `Trainer saved locally, but backend login failed: ${portalUser.error}`
    );

    // Automatically open WhatsApp & Credential dispatch modal!
    setActiveCredentialModal({
      name: created.name,
      phone: created.phone,
      email: created.email,
      role: 'TRAINER',
      loginId: created.loginId || assignedLoginId,
      temporaryPassword: created.temporaryPassword || assignedPassword,
      portalUrl: 'https://jawan-fitness-trainer.vercel.app'
    });
  };

  // ADMIN ACTION: Remove Trainer
  const handleDeleteTrainer = async (trainerId: string, trainerName: string) => {
    if (window.confirm(`Are you sure you want to remove ${trainerName}? Any assigned clients will become unassigned.`)) {
      hapticTap();
      syncedStore.deleteTrainer(trainerId);
      await syncedStore.forcePushToCloud();
      showNotification(`Trainer ${trainerName} removed.`);
    }
  };

  // ADMIN ACTION: Enroll Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    hapticTap();

    const selectedTrainer = syncState.trainers.find((t) => t.id === newClientTrainer);
    const fallbackSuffix = Math.floor(1000 + Math.random() * 9000);
    const assignedLoginId = newClientLoginId.trim() || `JWM-${fallbackSuffix}`;
    const assignedPassword = newClientPassword.trim() || `Fit@${fallbackSuffix}`;

    const created = syncedStore.createClient({
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
      gymId: 'JAWAN-SALEM-01',
      loginId: assignedLoginId,
      temporaryPassword: assignedPassword
    });

    const portalUser = await authService.createPortalUser({
      id: created.id,
      email: created.email,
      password: assignedPassword,
      name: created.name,
      role: 'CLIENT',
      phone: created.phone,
      loginId: assignedLoginId,
      startingWeightKg: created.startingWeightKg,
      currentWeightKg: created.currentWeightKg,
      goalWeightKg: created.goalWeightKg,
      heightCm: created.heightCm,
      goal: created.goal,
      trainerId: created.trainerId,
      trainerName: created.trainerName
    });

    await syncedStore.forcePushToCloud();

    setIsAddClientOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientLoginId('');
    setNewClientPassword('');
    setNewClientTrainer('');
    showNotification(
      portalUser.success
        ? `Member ${created.name} enrolled! Official credentials ready.`
        : `Member saved locally, but backend login failed: ${portalUser.error}`
    );

    // Automatically open WhatsApp & Credential dispatch modal!
    setActiveCredentialModal({
      name: created.name,
      phone: created.phone,
      email: created.email,
      role: 'CLIENT',
      loginId: created.loginId || assignedLoginId,
      temporaryPassword: created.temporaryPassword || assignedPassword,
      portalUrl: window.location.origin.includes('pages.dev') ? 'https://jawan-fitness-app.pages.dev' : window.location.origin,
      assignedCoach: created.trainerName || 'Unassigned'
    });
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
  const handleReassignClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningClient) return;
    hapticTap();

    syncedStore.assignClientToTrainer(reassigningClient.id, selectedTrainerForReassign);
    await syncedStore.forcePushToCloud();
    const trainer = syncState.trainers.find((t) => t.id === selectedTrainerForReassign);
    showNotification(`Member ${reassigningClient.name} assigned to ${trainer ? trainer.name : 'Unassigned'}.`);
    setReassigningClient(null);
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
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'foods', label: 'Food & Nutrition', icon: Apple },
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
      <header className="w-full bg-[#0a0e18] border-b border-white/10 px-3 sm:px-6 pt-safe py-2 sm:py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 p-1 flex items-center justify-center shadow flex-shrink-0">
            <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain drop-shadow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-xs sm:text-base font-black text-white font-display tracking-tight truncate">
                JAWAN ADMIN
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-tech font-extrabold uppercase">
                HQ
              </span>
              <span className="hidden md:inline-flex text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-tech font-bold items-center space-x-1">
                <span>Enterprise OS</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-tech truncate hidden xs:block">
              Headquarters Management Console
            </p>
          </div>
        </div>

        {/* Global Action Switchers & Actions - Clean single row on all mobile screens */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle className="scale-85 sm:scale-100" />

          {/* Live Cloud DB indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-tech font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Database className="w-3 h-3" />
            <span>Cloud DB: Synced</span>
          </div>

          {/* Quick Manual Cloud Sync Button */}
          <button
            onClick={handleManualSync}
            title="Refresh data from Cloudflare D1"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-white/5 text-xs font-tech font-bold flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={openAddTrainerModal}
            title="+ Appoint Trainer"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold font-tech flex items-center space-x-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">+ Appoint Trainer</span>
          </button>

          <button
            onClick={openAddClientModal}
            title="+ Enroll Member"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-tech flex items-center space-x-1.5 transition-all shadow"
          >
            <UserPlus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">+ Enroll Member</span>
          </button>

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Lock Console (Logout)"
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
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
              onClick={openAddTrainerModal}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-400 font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Appoint Trainer</span>
            </button>

            <button
              onClick={openAddClientModal}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-tech uppercase">
                    <span>Total Members</span>
                    <Users className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-display mt-1">
                    {syncState.clients.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-emerald-400 font-tech mt-0.5">
                    {syncState.clients.length === 0 ? 'No members registered' : `${syncState.clients.length} Active Members`}
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
              </div>

              {/* Dynamic Gym Squad Overview */}
              {syncState.clients.length === 0 ? (
                <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-base font-bold text-white font-display">Member Directory</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No members are currently enrolled. Appoint trainers and enroll members to begin assigning workouts, nutrition plans, and tracking attendance.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      onClick={openAddTrainerModal}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center space-x-2 transition-all shadow"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Appoint Trainer</span>
                    </button>
                    <button
                      onClick={openAddClientModal}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center space-x-2 transition-all shadow"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Enroll Member</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-tech font-bold uppercase text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Active Members Quick Overview</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-tech bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      {syncState.clients.length} Enrolled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {syncState.clients.slice(0, 6).map((member) => (
                      <div key={member.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm">{member.name}</h4>
                          <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {member.currentWeightKg} kg
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>Coach: <span className="text-slate-200 font-semibold">{member.trainerName || 'Unassigned'}</span></span>
                          <button
                            onClick={() => {
                              hapticTap();
                              setReassigningClient(member);
                              setSelectedTrainerForReassign(member.trainerId || '');
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
                    Admin-only authority: Appoint coaches, monitor assigned member volume, and manage staff credentials.
                  </p>
                </div>
                <button
                  onClick={openAddTrainerModal}
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
                    onClick={openAddTrainerModal}
                    className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                  >
                    + Appoint First Trainer
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {syncState.trainers.map((trainer) => {
                    const assignedMembers = syncState.clients.filter((c) => c.trainerId === trainer.id);
                    return (
                      <div
                        key={trainer.id}
                        className="p-4 bg-[#0b0f1a] border border-white/10 rounded-2xl space-y-3 relative hover:border-amber-500/40 transition-all shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative group">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm overflow-hidden flex-shrink-0 shadow-sm">
                                {trainer.avatarUrl ? (
                                  <img src={trainer.avatarUrl} alt={trainer.name} className="w-full h-full object-cover" />
                                ) : (
                                  trainer.name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <label
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-90"
                                title="Upload / Change Trainer Photo"
                              >
                                <Camera className="w-3 h-3" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleUpdateExistingTrainerPhoto(trainer.id, e)}
                                />
                              </label>
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
                            <span className="text-slate-400 font-tech uppercase text-[10px]">Assigned Members</span>
                            <span className="font-bold text-amber-400 font-tech">{assignedMembers.length} Active</span>
                          </div>

                          {assignedMembers.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No members assigned yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedMembers.map((c) => (
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

                        {/* WhatsApp Credentials Dispatch Action */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          <div className="text-[10px] font-tech text-slate-400">
                            ID: <strong className="text-amber-400">{trainer.loginId || trainer.email.split('@')[0]}</strong>
                          </div>
                          <button
                            onClick={() => {
                              hapticTap();
                              setActiveCredentialModal({
                                name: trainer.name,
                                phone: trainer.phone,
                                email: trainer.email,
                                role: 'TRAINER',
                                loginId: trainer.loginId || trainer.email,
                                temporaryPassword: trainer.temporaryPassword || '',
                                portalUrl: 'https://jawan-fitness-trainer.vercel.app'
                              });
                            }}
                            disabled={!trainer.temporaryPassword}
                            className="px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all"
                            title={trainer.temporaryPassword ? 'Send login credentials via WhatsApp' : 'Temporary password is no longer available'}
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>WhatsApp Pass</span>
                          </button>
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
                      placeholder="Search members..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="bg-transparent text-xs text-white outline-none w-28 sm:w-44"
                    />
                  </div>

                  <button
                    onClick={openAddClientModal}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1 shadow whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Enroll Member</span>
                  </button>
                </div>
              </div>

              {syncState.clients.length === 0 ? (
                <div className="p-8 bg-[#0b0f1a] border border-dashed border-white/10 rounded-2xl text-center space-y-3">
                  <Users className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
                  <h4 className="font-bold text-white text-sm">No Members Enrolled Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Enroll your first gym member. You can enter their starting weight, target goal, and assign them directly to a coach.
                  </p>
                  <button
                    onClick={openAddClientModal}
                    className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                  >
                    + Enroll First Member
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
                                setSelectedTrainerForReassign(client.trainerId || '');
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

                          {/* WhatsApp Credentials Dispatch Action */}
                          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                            <span className="text-[10px] font-tech text-slate-400">ID: <strong className="text-amber-400">{client.loginId || client.phone}</strong></span>
                            <button
                              onClick={() => {
                                hapticTap();
                                setActiveCredentialModal({
                                  name: client.name,
                                  phone: client.phone,
                                  email: client.email,
                                  role: 'CLIENT',
                                  loginId: client.loginId || client.phone || client.email,
                                  temporaryPassword: client.temporaryPassword || '',
                                  portalUrl: 'https://jawan-fitness-app.vercel.app',
                                  assignedCoach: client.trainerName
                                });
                              }}
                              disabled={!client.temporaryPassword}
                              className="px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center space-x-1.5 transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                              <span>WhatsApp Pass</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-[#0b0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-tech uppercase text-[10px]">
                        <tr>
                          <th className="p-4">Member Name</th>
                          <th className="p-4">Assigned Coach</th>
                          <th className="p-4">Biometrics & Goal</th>
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
                                <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                                  <span>{client.email}</span>
                                  <span className="text-amber-400/80 font-tech">({client.loginId || client.phone})</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-200">{client.trainerName || 'Unassigned'}</span>
                                  <button
                                    onClick={() => {
                                      hapticTap();
                                      setReassigningClient(client);
                                      setSelectedTrainerForReassign(client.trainerId || '');
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
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-tech font-bold">
                                  {client.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => {
                                      hapticTap();
                                      setActiveCredentialModal({
                                        name: client.name,
                                        phone: client.phone,
                                        email: client.email,
                                        role: 'CLIENT',
                                        loginId: client.loginId || client.phone || client.email,
                                        temporaryPassword: client.temporaryPassword || '',
                                        portalUrl: 'https://jawan-fitness-app.vercel.app',
                                        assignedCoach: client.trainerName
                                      });
                                    }}
                                    disabled={!client.temporaryPassword}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center space-x-1.5 transition-all"
                                    title="Send Credentials via WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                    <span>WhatsApp Pass</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClient(client.id, client.name)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Delete Client"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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

          {/* TAB 4: NUTRITION & FOOD DATABASE */}
          {activeTab === 'foods' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    Nutrition & Food Database
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive nutrition catalog with verified macros, custom items, and real-time cloud sync.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      hapticTap();
                      setIsAddFoodOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-tech font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Food</span>
                  </button>
                  <span className="text-xs font-tech font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                    {FoodService.getCount().toLocaleString()} Items
                  </span>
                </div>
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
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-bold text-white truncate leading-tight">{food.name}</h4>
                        {food.id.startsWith('custom-') && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-tech font-bold border border-amber-500/30 flex-shrink-0">
                            CUSTOM
                          </span>
                        )}
                      </div>
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
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-right font-tech font-bold text-sm text-white">
                        {food.calories} <span className="text-[10px] text-slate-500 block">kcal</span>
                      </div>
                      {food.id.startsWith('custom-') && (
                        <button
                          onClick={() => {
                            hapticTap();
                            syncedStore.deleteCustomFood(food.id, 'ADMIN');
                          }}
                          className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-900/60 transition-all"
                          title="Delete Custom Food"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXERCISES AUDITOR */}
          {activeTab === 'exercises' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display">
                    Gym Exercise Master Dataset
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
              {/* Trainer Photo Upload & Live Avatar Preview */}
              <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center space-x-3.5">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-lg overflow-hidden flex-shrink-0 shadow-md">
                  {newTrainerPhoto ? (
                    <img src={newTrainerPhoto} alt="Trainer Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-amber-500/60" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-white font-bold text-xs">Trainer Profile Photo</div>
                  <p className="text-[10px] text-slate-400">
                    Visible to all members and on trainer portal.
                  </p>
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingTrainerPhoto ? 'Processing...' : newTrainerPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleTrainerPhotoFileChange}
                      />
                    </label>
                    {newTrainerPhoto && (
                      <button
                        type="button"
                        onClick={() => setNewTrainerPhoto('')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[11px] font-tech font-bold transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-tech uppercase text-[10px] block mb-1 font-bold">
                  Trainer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTrainerName}
                  onChange={(e) => setNewTrainerName(e.target.value)}
                  placeholder=""
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
                  placeholder=""
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
                  placeholder=""
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              {/* Auto-generated Credentials Preview */}
              <div className="p-3 bg-black/60 border border-amber-500/20 rounded-2xl space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-400 font-tech font-bold text-[10px] uppercase">
                  <Key className="w-3.5 h-3.5" />
                  <span>Auto-Generated Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-tech uppercase block mb-0.5">
                      Trainer ID
                    </label>
                    <input
                      type="text"
                      value={newTrainerLoginId}
                      onChange={(e) => setNewTrainerLoginId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-amber-300 font-tech font-bold outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-tech uppercase block mb-0.5">
                      Temporary Password
                    </label>
                    <input
                      type="text"
                      value={newTrainerPassword}
                      onChange={(e) => setNewTrainerPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-emerald-300 font-tech font-bold outline-none text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400/90 flex items-center space-x-1.5 pt-0.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
                  <span>WhatsApp send button will open automatically after appointment.</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Appoint Staff Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENROLL MEMBER (ADMIN ONLY) */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c101a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-3 sm:space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white font-display">
                  Enroll Member
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
                  Member Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder=""
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
                    placeholder=""
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
                    placeholder=""
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
                    Fitness Goal
                  </label>
                  <input
                    type="text"
                    value={newClientGoal}
                    onChange={(e) => setNewClientGoal(e.target.value)}
                    placeholder=""
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
                  Assign Coach
                </label>
                {syncState.trainers.length === 0 ? (
                  <div className="p-3 bg-slate-900 border border-white/10 rounded-xl text-slate-300 text-xs space-y-1">
                    <p className="font-bold text-amber-400">No coaches appointed yet</p>
                    <p className="text-slate-400 text-[11px]">
                      You can enroll this member now and assign a coach anytime from the member directory.
                    </p>
                  </div>
                ) : (
                  <select
                    value={newClientTrainer}
                    onChange={(e) => setNewClientTrainer(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-bold text-xs"
                  >
                    <option value="">-- Select Coach (Optional) --</option>
                    {syncState.trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Auto-generated Credentials Preview */}
              <div className="p-3 bg-black/60 border border-amber-500/20 rounded-2xl space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-400 font-tech font-bold text-[10px] uppercase">
                  <Key className="w-3.5 h-3.5" />
                  <span>Auto-Generated Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-tech uppercase block mb-0.5">
                      Member ID
                    </label>
                    <input
                      type="text"
                      value={newClientLoginId}
                      onChange={(e) => setNewClientLoginId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-amber-300 font-tech font-bold outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-tech uppercase block mb-0.5">
                      Temporary Password
                    </label>
                    <input
                      type="text"
                      value={newClientPassword}
                      onChange={(e) => setNewClientPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-emerald-300 font-tech font-bold outline-none text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400/90 flex items-center space-x-1.5 pt-0.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
                  <span>WhatsApp send button will open automatically after enrollment.</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Enroll Member
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

      {/* MODAL 4: CREDENTIAL SHARE & WHATSAPP DISPATCH MODAL */}
      {activeCredentialModal && (
        <CredentialShareModal
          info={activeCredentialModal}
          onClose={() => setActiveCredentialModal(null)}
        />
      )}

      {/* MODAL 5: ADD CUSTOM FOOD MODAL */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        sourceRole="ADMIN"
      />
    </div>
  );
};

export default AdminScreen;
