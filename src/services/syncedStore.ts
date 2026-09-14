import {
  AssignedWorkout,
  AssignedMealPlan,
  WorkoutSession,
  LoggedMealItem,
  ChatMessage,
  WeightRecord,
  FoodItem
} from '../types';
export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  heightCm: number;
  startingWeightKg: number;
  currentWeightKg: number;
  goal: string;
  goalWeightKg: number;
  trainerId: string;
  trainerName: string;
  status: 'Active' | 'Inactive';
  firstLoginCompleted: boolean;
  gymId: string;
  workoutAdherence: number;
  dietAdherence: number;
  lastWorkout: string;
  loginId?: string;
  temporaryPassword?: string;
}

export interface TrainerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive';
  clientsCount: number;
  avgAdherence: number;
  avatarUrl?: string;
  loginId?: string;
  temporaryPassword?: string;
}

export interface SyncEvent {
  id: string;
  timestamp: number;
  sourceRole: 'ADMIN' | 'TRAINER' | 'CLIENT';
  title: string;
  description: string;
  badge: 'Workout' | 'Diet' | 'Client' | 'Session' | 'Activity' | 'Admin';
}

export interface AppSyncState {
  clients: ClientData[];
  activeClientId: string;
  trainers: TrainerData[];
  activeTrainerId: string;
  assignedWorkouts: Record<string, AssignedWorkout | null>;
  assignedDietPlans: Record<string, AssignedMealPlan | null>;
  activeWorkoutSession: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  loggedMeals: LoggedMealItem[];
  waterMl: number;
  isGoogleFitConnected: boolean;
  googleFitSteps: number;
  weightHistory: WeightRecord[];
  messages: ChatMessage[];
  events: SyncEvent[];
  customFoods: FoodItem[];
}

import { cloudDbService } from './cloudDatabaseService';

const STORAGE_KEY = 'jawan_fitness_clean_slate_v5';

const DEFAULT_STATE: AppSyncState = {
  clients: [],
  activeClientId: '',
  trainers: [],
  activeTrainerId: '',
  assignedWorkouts: {},
  assignedDietPlans: {},
  activeWorkoutSession: null,
  workoutHistory: [],
  loggedMeals: [],
  waterMl: 0,
  isGoogleFitConnected: false,
  googleFitSteps: 0,
  weightHistory: [],
  messages: [],
  events: [],
  customFoods: []
};

type Listener = (state: AppSyncState) => void;

class SyncedStore {
  private state: AppSyncState;
  private listeners: Set<Listener> = new Set();
  private cloudPushTimeout: any = null;

  constructor() {
    this.purgeLegacyKeys();
    this.state = this.loadInitialState();
    this.syncFromCloud();
  }

  private purgeLegacyKeys() {
    try {
      localStorage.removeItem('jawan_fitness_spec_v10');
      localStorage.removeItem('jawan_fitness_scratch_clean_v1');
      localStorage.removeItem('jawan_fitness_clean_slate_v2');
      localStorage.removeItem('jawan_fitness_clean_slate_v3');
      localStorage.removeItem('jawan_fitness_clean_slate_v4');
    } catch {
      // fallback
    }
  }

  public async syncFromCloud(): Promise<AppSyncState | null> {
    try {
      const cloudData = await cloudDbService.fetchStateFromCloud();
      if (cloudData) {
        this.state = {
          ...this.state,
          ...cloudData,
          clients: Array.isArray(cloudData.clients) ? cloudData.clients : [],
          trainers: Array.isArray(cloudData.trainers) ? cloudData.trainers : [],
          events: Array.isArray(cloudData.events) ? cloudData.events : []
        };
        this.persist();
        this.listeners.forEach((listener) => {
          try {
            listener(this.state);
          } catch (err) {
            console.error('Listener error in SyncedStore:', err);
          }
        });
        return this.state;
      }
    } catch (err) {
      console.warn('Cloud sync on init skipped:', err);
    }
    return null;
  }

  private loadInitialState(): AppSyncState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          clients: Array.isArray(parsed.clients) ? parsed.clients : [],
          trainers: Array.isArray(parsed.trainers) ? parsed.trainers : [],
          customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : []
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_STATE;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // fallback
    }
  }

  private pushToCloudDebounced() {
    if (this.cloudPushTimeout) clearTimeout(this.cloudPushTimeout);
    this.cloudPushTimeout = setTimeout(() => {
      cloudDbService.pushStateToCloud(this.state);
    }, 250);
  }

  public async forcePushToCloud(): Promise<boolean> {
    if (this.cloudPushTimeout) clearTimeout(this.cloudPushTimeout);
    return await cloudDbService.pushStateToCloud(this.state);
  }

  private notify() {
    this.persist();
    this.pushToCloudDebounced();
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Listener error in SyncedStore:', err);
      }
    });
  }

  public getState(): AppSyncState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Record audit log
  public logEvent(
    sourceRole: 'ADMIN' | 'TRAINER' | 'CLIENT',
    title: string,
    description: string,
    badge: SyncEvent['badge']
  ) {
    const newEvent: SyncEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      sourceRole,
      title,
      description,
      badge
    };
    this.state = {
      ...this.state,
      events: [newEvent, ...this.state.events.slice(0, 49)]
    };
    this.notify();
  }

  // 1. ADMIN ACTIONS - TRAINER MANAGEMENT
  public createTrainer(trainerData: Omit<TrainerData, 'id' | 'clientsCount' | 'avgAdherence'>) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newTrainer: TrainerData = {
      ...trainerData,
      id: `trainer-${Date.now()}`,
      loginId: trainerData.loginId || `JWT-${randomSuffix}`,
      temporaryPassword: trainerData.temporaryPassword || `Coach@${randomSuffix}`,
      clientsCount: 0,
      avgAdherence: 0
    };

    this.state = {
      ...this.state,
      trainers: [...this.state.trainers, newTrainer],
      activeTrainerId: this.state.activeTrainerId || newTrainer.id
    };

    this.logEvent(
      'ADMIN',
      'Trainer Appointed',
      `Admin added trainer ${newTrainer.name} (${newTrainer.role}, ${newTrainer.email})`,
      'Admin'
    );
    return newTrainer;
  }

  public deleteTrainer(trainerId: string) {
    const trainer = this.state.trainers.find((t) => t.id === trainerId);
    this.state = {
      ...this.state,
      trainers: this.state.trainers.filter((t) => t.id !== trainerId),
      activeTrainerId: this.state.activeTrainerId === trainerId ? (this.state.trainers[0]?.id || '') : this.state.activeTrainerId,
      // Unassign any clients assigned to this deleted trainer
      clients: this.state.clients.map((c) =>
        c.trainerId === trainerId ? { ...c, trainerId: '', trainerName: 'Unassigned' } : c
      )
    };

    this.logEvent(
      'ADMIN',
      'Trainer Removed',
      `Admin removed trainer ${trainer?.name || trainerId} from gym staff`,
      'Admin'
    );
  }

  public updateTrainer(trainerId: string, updates: Partial<TrainerData>) {
    this.state = {
      ...this.state,
      trainers: this.state.trainers.map((t) =>
        t.id === trainerId ? { ...t, ...updates } : t
      )
    };
    this.persist();
    this.notify();
  }

  public setActiveTrainer(trainerId: string) {
    if (this.state.trainers.some((t) => t.id === trainerId) || trainerId === '') {
      this.state = {
        ...this.state,
        activeTrainerId: trainerId
      };
      this.notify();
    }
  }

  public assignClientToTrainer(clientId: string, trainerId: string) {
    const trainer = this.state.trainers.find((t) => t.id === trainerId);
    const client = this.state.clients.find((c) => c.id === clientId);

    this.state = {
      ...this.state,
      clients: this.state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              trainerId: trainer ? trainer.id : '',
              trainerName: trainer ? trainer.name : 'Unassigned'
            }
          : c
      )
    };

    this.logEvent(
      'ADMIN',
      'Client Assigned to Trainer',
      `Admin assigned member ${client?.name || clientId} to coach ${trainer?.name || 'Unassigned'}`,
      'Admin'
    );
  }

  public deleteClient(clientId: string) {
    const client = this.state.clients.find((c) => c.id === clientId);
    const updatedAssignedWorkouts = { ...this.state.assignedWorkouts };
    delete updatedAssignedWorkouts[clientId];
    const updatedAssignedDiets = { ...this.state.assignedDietPlans };
    delete updatedAssignedDiets[clientId];

    this.state = {
      ...this.state,
      clients: this.state.clients.filter((c) => c.id !== clientId),
      activeClientId: this.state.activeClientId === clientId ? (this.state.clients[0]?.id || '') : this.state.activeClientId,
      assignedWorkouts: updatedAssignedWorkouts,
      assignedDietPlans: updatedAssignedDiets
    };

    this.logEvent(
      'ADMIN',
      'Client Enrolled Terminated',
      `Admin removed client ${client?.name || clientId}`,
      'Admin'
    );
  }

  // 1. ADMIN ACTIONS - CLIENT ENROLLMENT
  public createClient(clientData: Omit<ClientData, 'id' | 'workoutAdherence' | 'dietAdherence' | 'lastWorkout' | 'status' | 'firstLoginCompleted'>) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newClient: ClientData = {
      ...clientData,
      id: `client-${Date.now()}`,
      loginId: clientData.loginId || `JWM-${randomSuffix}`,
      temporaryPassword: clientData.temporaryPassword || `Fit@${randomSuffix}`,
      status: 'Active',
      workoutAdherence: 0,
      dietAdherence: 0,
      lastWorkout: 'Never',
      firstLoginCompleted: false
    };

    this.state = {
      ...this.state,
      clients: [newClient, ...this.state.clients],
      activeClientId: newClient.id,
      assignedWorkouts: {
        ...this.state.assignedWorkouts,
        [newClient.id]: null
      },
      assignedDietPlans: {
        ...this.state.assignedDietPlans,
        [newClient.id]: null
      }
    };

    this.logEvent(
      'ADMIN',
      'Client Enrolled',
      `Admin created client ${newClient.name} (ID: ${newClient.loginId}) assigned to ${newClient.trainerName || 'Unassigned'}`,
      'Client'
    );
    cloudDbService.pushStateToCloud(this.state);
    return newClient;
  }

  public enrollClient(client: ClientData) {
    const exists = this.state.clients.some((c) => c.id === client.id);
    this.state = {
      ...this.state,
      clients: exists
        ? this.state.clients.map((c) => (c.id === client.id ? client : c))
        : [client, ...this.state.clients],
      activeClientId: client.id
    };
    this.notify();
    cloudDbService.pushStateToCloud(this.state);
  }

  public updateTrainerCredentials(trainerId: string, loginId: string, temporaryPassword: string) {
    this.state = {
      ...this.state,
      trainers: this.state.trainers.map((t) =>
        t.id === trainerId ? { ...t, loginId, temporaryPassword } : t
      )
    };
    this.notify();
  }

  public updateClientCredentials(clientId: string, loginId: string, temporaryPassword: string) {
    this.state = {
      ...this.state,
      clients: this.state.clients.map((c) =>
        c.id === clientId ? { ...c, loginId, temporaryPassword } : c
      )
    };
    this.notify();
  }

  public setActiveClient(clientId: string) {
    if (this.state.clients.some((c) => c.id === clientId)) {
      this.state = {
        ...this.state,
        activeClientId: clientId
      };
      this.notify();
    }
  }

  public completeClientOnboarding(clientId: string, heightCm: number, startingWeightKg: number, goal: string, goalWeightKg: number) {
    this.state = {
      ...this.state,
      clients: this.state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              heightCm,
              startingWeightKg,
              currentWeightKg: startingWeightKg,
              goal,
              goalWeightKg,
              firstLoginCompleted: true
            }
          : c
      )
    };

    const client = this.state.clients.find((c) => c.id === clientId);
    this.logEvent(
      'CLIENT',
      'Profile Onboarding Completed',
      `${client?.name || 'Client'} confirmed biometric setup: ${heightCm}cm, ${startingWeightKg}kg → target ${goalWeightKg}kg`,
      'Client'
    );
  }

  // 2. TRAINER ACTIONS
  public assignWorkout(clientId: string, workout: AssignedWorkout) {
    this.state = {
      ...this.state,
      assignedWorkouts: {
        ...this.state.assignedWorkouts,
        [clientId]: workout
      }
    };

    const client = this.state.clients.find((c) => c.id === clientId);
    this.logEvent(
      'TRAINER',
      'Workout Assigned',
      `${workout.assignedBy} assigned ${workout.title} (${workout.exercises.length} exercises, ~${workout.estimatedMinutes} min) to ${client?.name || clientId}`,
      'Workout'
    );
  }

  public removeAssignedWorkout(clientId: string) {
    this.state = {
      ...this.state,
      assignedWorkouts: {
        ...this.state.assignedWorkouts,
        [clientId]: null
      }
    };
    this.notify();
  }

  public assignDietPlan(clientId: string, plan: AssignedMealPlan) {
    this.state = {
      ...this.state,
      assignedDietPlans: {
        ...this.state.assignedDietPlans,
        [clientId]: plan
      }
    };

    const client = this.state.clients.find((c) => c.id === clientId);
    this.logEvent(
      'TRAINER',
      'Diet Assigned',
      `${plan.assignedBy} assigned ${plan.title} (${plan.dailyCalories} kcal, ${plan.dailyProtein}g protein) to ${client?.name || clientId}`,
      'Diet'
    );
  }

  public removeAssignedDietPlan(clientId: string) {
    this.state = {
      ...this.state,
      assignedDietPlans: {
        ...this.state.assignedDietPlans,
        [clientId]: null
      }
    };
    this.notify();
  }

  // 2.5 CUSTOM FOOD CATALOG ACTIONS (ADMIN & TRAINER)
  public addCustomFood(
    food: Omit<FoodItem, 'id'> & { id?: string },
    sourceRole: 'ADMIN' | 'TRAINER' = 'ADMIN'
  ): FoodItem {
    const newFood: FoodItem = {
      ...food,
      id: food.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      verified: true
    };
    this.state = {
      ...this.state,
      customFoods: [newFood, ...(this.state.customFoods || []).filter((f) => f.id !== newFood.id)]
    };
    this.logEvent(
      sourceRole,
      'Food Item Added',
      `${sourceRole === 'ADMIN' ? 'Admin' : 'Trainer'} added "${newFood.name}" (${newFood.calories} kcal, ${newFood.protein}g protein, ${newFood.servingSize})`,
      'Diet'
    );
    return newFood;
  }

  public deleteCustomFood(foodId: string, sourceRole: 'ADMIN' | 'TRAINER' = 'ADMIN') {
    const food = (this.state.customFoods || []).find((f) => f.id === foodId);
    this.state = {
      ...this.state,
      customFoods: (this.state.customFoods || []).filter((f) => f.id !== foodId)
    };
    if (food) {
      this.logEvent(
        sourceRole,
        'Food Item Removed',
        `${sourceRole === 'ADMIN' ? 'Admin' : 'Trainer'} removed "${food.name}" from catalog`,
        'Diet'
      );
    } else {
      this.notify();
    }
  }

  public getCustomFoods(): FoodItem[] {
    return this.state.customFoods || [];
  }

  // 3. CLIENT WORKOUT EXECUTION ACTIONS
  public startWorkoutSession(session: WorkoutSession) {
    this.state = {
      ...this.state,
      activeWorkoutSession: session
    };

    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    this.logEvent(
      'CLIENT',
      'Workout Session Started',
      `${client?.name || 'Client'} started workout session for ${session.routineName}`,
      'Session'
    );
  }

  public updateActiveWorkoutSession(session: WorkoutSession) {
    this.state = {
      ...this.state,
      activeWorkoutSession: session
    };
    this.notify();
  }

  public discardWorkoutSession() {
    this.state = {
      ...this.state,
      activeWorkoutSession: null
    };

    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    this.logEvent(
      'CLIENT',
      'Workout Session Discarded',
      `${client?.name || 'Client'} discarded incomplete workout session`,
      'Session'
    );
  }

  public finishWorkoutSession(session: WorkoutSession) {
    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    const durationMin = Math.round(session.durationSeconds / 60);

    this.state = {
      ...this.state,
      activeWorkoutSession: null,
      workoutHistory: [session, ...this.state.workoutHistory],
      clients: this.state.clients.map((c) =>
        c.id === this.state.activeClientId
          ? {
              ...c,
              lastWorkout: 'Today',
              workoutAdherence: Math.min(100, (c.workoutAdherence || 80) + 2)
            }
          : c
      )
    };

    this.logEvent(
      'CLIENT',
      'Workout Completed! 🎉',
      `${client?.name || 'Client'} completed ${session.routineName} in ${durationMin} min. Total Volume: ${session.totalVolumeKg.toLocaleString()} kg lifted.`,
      'Session'
    );
  }

  // 4. DIET & ACTIVITY ACTIONS
  public logMeal(item: LoggedMealItem) {
    this.state = {
      ...this.state,
      loggedMeals: [...this.state.loggedMeals, item]
    };

    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    this.logEvent(
      'CLIENT',
      'Food Item Logged',
      `${client?.name || 'Client'} logged ${item.name} (${item.calories} kcal, ${item.protein}g protein) under ${item.mealType}`,
      'Diet'
    );
  }

  public removeLoggedMeal(id: string) {
    this.state = {
      ...this.state,
      loggedMeals: this.state.loggedMeals.filter((m) => m.id !== id)
    };
    this.notify();
  }

  public updateWater(deltaMl: number) {
    this.state = {
      ...this.state,
      waterMl: Math.max(0, this.state.waterMl + deltaMl)
    };
    this.notify();
  }

  public toggleGoogleFit(connected: boolean, steps: number = 0) {
    this.state = {
      ...this.state,
      isGoogleFitConnected: connected,
      googleFitSteps: connected ? steps : 0
    };

    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    this.logEvent(
      'CLIENT',
      connected ? 'Google Fit Connected' : 'Google Fit Disconnected',
      connected
        ? `${client?.name || 'Client'} connected Google Fit. Steps will stay 0 until a live Health Connect integration provides data.`
        : `${client?.name || 'Client'} disconnected Google Fit. Steps reset strictly to 0 (zero fabrication)`,
      'Activity'
    );
  }

  public logWeight(weightKg: number) {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newRecord: WeightRecord = {
      id: `w-${Date.now()}`,
      date: todayStr,
      weightKg
    };

    this.state = {
      ...this.state,
      weightHistory: [...this.state.weightHistory, newRecord],
      clients: this.state.clients.map((c) =>
        c.id === this.state.activeClientId
          ? { ...c, currentWeightKg: weightKg }
          : c
      )
    };

    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    this.logEvent(
      'CLIENT',
      'Weight Logged',
      `${client?.name || 'Client'} logged current weight: ${weightKg} kg`,
      'Client'
    );
  }

  // 5. MESSAGING ACTIONS
  public sendMessage(sender: 'client' | 'trainer', text: string) {
    const client = this.state.clients.find((c) => c.id === this.state.activeClientId);
    const trainer = this.state.trainers.find((t) => t.id === this.state.activeTrainerId);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName: sender === 'client' ? client?.name || 'Client' : trainer?.name || 'Coach',
      text,
      timestamp: Date.now(),
      read: true
    };

    this.state = {
      ...this.state,
      messages: [...this.state.messages, newMsg]
    };

    this.logEvent(
      sender === 'client' ? 'CLIENT' : 'TRAINER',
      'Message Sent',
      `${newMsg.senderName}: "${text.length > 40 ? text.substring(0, 40) + '...' : text}"`,
      'Client'
    );
  }

  // Complete Wipe to pure scratch (0 trainers, 0 clients, 0 history)
  public wipeAllDataToScratch() {
    this.state = {
      clients: [],
      activeClientId: '',
      trainers: [],
      activeTrainerId: '',
      assignedWorkouts: {},
      assignedDietPlans: {},
      activeWorkoutSession: null,
      workoutHistory: [],
      loggedMeals: [],
      waterMl: 0,
      isGoogleFitConnected: false,
      googleFitSteps: 0,
      weightHistory: [],
      messages: [],
      events: [],
      customFoods: []
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('jawan_fitness_scratch_clean_v1');
      localStorage.removeItem('jawan_fitness_spec_v10');
      localStorage.removeItem('jawan_active_client_id_v1');
      localStorage.removeItem('jawan_trainer_session_id_v1');
    } catch {
      // fallback
    }
    this.persist();
    this.notify();
  }

  // Reset demo state back to baseline
  public resetToSpecBaseline() {
    this.wipeAllDataToScratch();
  }
}

export const syncedStore = new SyncedStore();
