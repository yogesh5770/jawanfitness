import {
  AssignedWorkout,
  AssignedMealPlan,
  WorkoutSession,
  LoggedMealItem,
  ChatMessage,
  WeightRecord
} from '../types';
import { ExerciseService } from './exerciseService';

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
}

const STORAGE_KEY = 'jawan_fitness_scratch_clean_v1';

const DEFAULT_STATE: AppSyncState = {
  clients: [],
  activeClientId: '',
  trainers: [
    {
      id: 'trainer-ravi',
      name: 'Coach Ravi',
      email: 'ravi.strength@jawan.fit',
      phone: '+91 98940 11223',
      role: 'Senior Strength & Conditioning Specialist',
      status: 'Active',
      clientsCount: 0,
      avgAdherence: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'trainer-vignesh',
      name: 'Coach Vignesh',
      email: 'vignesh.head@jawan.fit',
      phone: '+91 98421 99887',
      role: 'Head Performance Coach',
      status: 'Active',
      clientsCount: 0,
      avgAdherence: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'trainer-suresh',
      name: 'Coach Suresh',
      email: 'suresh.conditioning@jawan.fit',
      phone: '+91 99420 33445',
      role: 'Conditioning & Mobility Specialist',
      status: 'Active',
      clientsCount: 0,
      avgAdherence: 0
    }
  ],
  activeTrainerId: 'trainer-ravi',
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
  events: []
};

type Listener = (state: AppSyncState) => void;

class SyncedStore {
  private state: AppSyncState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): AppSyncState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          clients: parsed.clients || DEFAULT_STATE.clients,
          trainers: parsed.trainers || DEFAULT_STATE.trainers
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

  private notify() {
    this.persist();
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

  // 1. ADMIN ACTIONS
  public createClient(clientData: Omit<ClientData, 'id' | 'workoutAdherence' | 'dietAdherence' | 'lastWorkout' | 'status' | 'firstLoginCompleted'>) {
    const newClient: ClientData = {
      ...clientData,
      id: `client-${Date.now()}`,
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
      `Admin created client ${newClient.name} (Height: ${newClient.heightCm}cm, Start: ${newClient.startingWeightKg}kg, Goal: ${newClient.goalWeightKg}kg) assigned to ${newClient.trainerName}`,
      'Client'
    );
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

  public toggleGoogleFit(connected: boolean, steps: number = 8420) {
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
        ? `${client?.name || 'Client'} synced live pedometer steps: ${steps.toLocaleString()} steps`
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

  // Reset demo state back to standard Arun baseline
  public resetToSpecBaseline() {
    this.state = DEFAULT_STATE;
    this.persist();
    this.notify();
  }
}

export const syncedStore = new SyncedStore();
