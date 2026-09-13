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

const STORAGE_KEY = 'jawan_fitness_master_sync_v2';

const DEFAULT_STATE: AppSyncState = {
  clients: [
    {
      id: 'client-arun',
      name: 'Arun',
      email: 'arun.fitness@gmail.com',
      phone: '+91 98427 12345',
      heightCm: 170,
      startingWeightKg: 108.0,
      currentWeightKg: 103.6,
      goal: 'Weight Loss & Hypertrophy',
      goalWeightKg: 80.0,
      trainerId: 'trainer-ravi',
      trainerName: 'Coach Ravi',
      status: 'Active',
      firstLoginCompleted: true,
      gymId: 'JAWAN-SALEM-01',
      workoutAdherence: 92,
      dietAdherence: 76,
      lastWorkout: 'Today'
    },
    {
      id: 'client-karthik',
      name: 'Karthik',
      email: 'karthik.r@gmail.com',
      phone: '+91 97890 54321',
      heightCm: 175,
      startingWeightKg: 82.0,
      currentWeightKg: 79.5,
      goal: 'Lean Muscle Gain',
      goalWeightKg: 75.0,
      trainerId: 'trainer-suresh',
      trainerName: 'Coach Suresh',
      status: 'Active',
      firstLoginCompleted: true,
      gymId: 'JAWAN-SALEM-01',
      workoutAdherence: 78,
      dietAdherence: 68,
      lastWorkout: '2 days ago'
    },
    {
      id: 'client-priya',
      name: 'Priya',
      email: 'priya.fitness@gmail.com',
      phone: '+91 94432 98765',
      heightCm: 162,
      startingWeightKg: 68.0,
      currentWeightKg: 63.2,
      goal: 'General Fitness & Tone',
      goalWeightKg: 58.0,
      trainerId: 'trainer-ravi',
      trainerName: 'Coach Ravi',
      status: 'Active',
      firstLoginCompleted: true,
      gymId: 'JAWAN-SALEM-01',
      workoutAdherence: 85,
      dietAdherence: 90,
      lastWorkout: 'Today'
    }
  ],
  activeClientId: 'client-arun',
  trainers: [
    {
      id: 'trainer-ravi',
      name: 'Coach Ravi',
      email: 'ravi.strength@jawan.fit',
      phone: '+91 98940 11223',
      role: 'Senior Strength & Conditioning Specialist',
      status: 'Active',
      clientsCount: 18,
      avgAdherence: 92,
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'trainer-vignesh',
      name: 'Coach Vignesh',
      email: 'vignesh.head@jawan.fit',
      phone: '+91 98421 99887',
      role: 'Head Performance Coach',
      status: 'Active',
      clientsCount: 24,
      avgAdherence: 88,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'trainer-suresh',
      name: 'Coach Suresh',
      email: 'suresh.conditioning@jawan.fit',
      phone: '+91 99420 33445',
      role: 'Conditioning & Mobility Specialist',
      status: 'Active',
      clientsCount: 21,
      avgAdherence: 84
    }
  ],
  activeTrainerId: 'trainer-ravi',
  assignedWorkouts: {
    'client-arun': {
      id: 'asg-arun-today',
      title: 'Chest + Triceps',
      split: 'Push Day',
      assignedBy: 'Coach Ravi',
      assignedDate: 'Today',
      estimatedMinutes: 45,
      exercises: [
        {
          exerciseId: '0314',
          exerciseName: 'Incline Dumbbell Press',
          targetSets: 3,
          targetReps: 10,
          targetWeightKg: 12,
          restSeconds: 90,
          notes: 'Upper chest focus. Maintain 2-second negative'
        },
        {
          exerciseId: '0025',
          exerciseName: 'Machine Chest Press',
          targetSets: 3,
          targetReps: 12,
          targetWeightKg: 40,
          restSeconds: 90,
          notes: 'Drive through sternum'
        },
        {
          exerciseId: '0319',
          exerciseName: 'Cable Fly',
          targetSets: 3,
          targetReps: 12,
          targetWeightKg: 15,
          restSeconds: 60,
          notes: 'Peak contraction squeeze'
        },
        {
          exerciseId: '0251',
          exerciseName: 'Triceps Pushdown',
          targetSets: 3,
          targetReps: 12,
          targetWeightKg: 25,
          restSeconds: 60,
          notes: 'Lock elbows to ribs'
        },
        {
          exerciseId: '0314',
          exerciseName: 'Overhead Triceps Extension',
          targetSets: 3,
          targetReps: 10,
          targetWeightKg: 14,
          restSeconds: 60,
          notes: 'Long head stretch'
        }
      ]
    }
  },
  assignedDietPlans: {
    'client-arun': {
      id: 'diet-arun-today',
      title: 'Weight Loss Diet Plan',
      dailyCalories: 2300,
      dailyProtein: 150,
      dailyCarbs: 250,
      dailyFat: 70,
      assignedBy: 'Coach Ravi',
      meals: [
        {
          type: 'breakfast',
          title: 'Morning Fuel',
          items: ['3 Steamed Idli', '2 Whole Eggs (Boiled)', 'Vegetable Sambar'],
          suggestedCalories: 460,
          suggestedProtein: 26
        },
        {
          type: 'lunch',
          title: 'Power Protein Lunch',
          items: ['Ponni Boiled Rice (150g)', 'Boiled Chicken Breast (150g)', 'Mixed Vegetables', 'Thick Curd (100g)'],
          suggestedCalories: 680,
          suggestedProtein: 52
        },
        {
          type: 'snack',
          title: 'Evening Recovery',
          items: ['Roasted Peanuts (30g)', 'Fresh Apple / Papaya', 'Green Tea'],
          suggestedCalories: 240,
          suggestedProtein: 10
        },
        {
          type: 'dinner',
          title: 'Night Restorative Meal',
          items: ['Whole Wheat Chapati (2 pcs)', 'Fresh Paneer (100g)', 'Stir Fry Vegetables'],
          suggestedCalories: 480,
          suggestedProtein: 28
        }
      ]
    }
  },
  activeWorkoutSession: null,
  workoutHistory: [
    {
      id: 'hist-arun-1',
      routineName: 'Chest + Triceps',
      startTime: Date.now() - 86400000 * 2,
      durationSeconds: 2820,
      totalVolumeKg: 4820,
      feeling: '🔥 Crushed it',
      exercises: [
        {
          exercise: ExerciseService.getById('0314') || ExerciseService.getAll()[0],
          sets: [
            { id: 's1', setNumber: 1, weightKg: 12, reps: 10, completed: true },
            { id: 's2', setNumber: 2, weightKg: 12, reps: 10, completed: true },
            { id: 's3', setNumber: 3, weightKg: 10, reps: 8, completed: true }
          ]
        },
        {
          exercise: ExerciseService.getById('0025') || ExerciseService.getAll()[0],
          sets: [
            { id: 's4', setNumber: 1, weightKg: 40, reps: 12, completed: true },
            { id: 's5', setNumber: 2, weightKg: 40, reps: 12, completed: true },
            { id: 's6', setNumber: 3, weightKg: 40, reps: 10, completed: true }
          ]
        }
      ]
    }
  ],
  loggedMeals: [
    {
      id: 'm-1',
      foodId: 'idli',
      name: 'Steamed Idli (3 pieces)',
      mealType: 'breakfast',
      servingQuantity: 3,
      calories: 260,
      protein: 7.8,
      carbs: 54,
      fat: 0.9,
      fiber: 3.5,
      time: '08:15 AM'
    },
    {
      id: 'm-2',
      foodId: 'eggs',
      name: 'Boiled Eggs (2 whole)',
      mealType: 'breakfast',
      servingQuantity: 2,
      calories: 144,
      protein: 12.6,
      carbs: 0.8,
      fat: 10.0,
      fiber: 0.0,
      time: '08:25 AM'
    },
    {
      id: 'm-3',
      foodId: 'sambar',
      name: 'Vegetable Sambar (1 bowl)',
      mealType: 'breakfast',
      servingQuantity: 1,
      calories: 120,
      protein: 4.2,
      carbs: 18.0,
      fat: 3.2,
      fiber: 4.0,
      time: '08:30 AM'
    },
    {
      id: 'm-4',
      foodId: 'chicken-lunch',
      name: 'Grilled Chicken (150g) + Rice & Curd',
      mealType: 'lunch',
      servingQuantity: 1,
      calories: 680,
      protein: 52.0,
      carbs: 65.0,
      fat: 14.0,
      fiber: 5.0,
      time: '01:30 PM'
    }
  ],
  waterMl: 1750,
  isGoogleFitConnected: false,
  googleFitSteps: 0,
  weightHistory: [
    { id: 'w-1', date: 'Aug 1', weightKg: 108.0 },
    { id: 'w-2', date: 'Aug 12', weightKg: 106.5 },
    { id: 'w-3', date: 'Aug 24', weightKg: 105.2 },
    { id: 'w-4', date: 'Sep 02', weightKg: 104.4 },
    { id: 'w-5', date: 'Sep 13', weightKg: 103.6 }
  ],
  messages: [
    {
      id: 'msg-1',
      sender: 'trainer',
      senderName: 'Coach Ravi',
      text: 'Good morning Arun! I have programmed your Chest + Triceps routine for today. Focus on slow 2-second negative on the Incline DB Press. Let me know once done!',
      timestamp: Date.now() - 3600000 * 4,
      read: true
    },
    {
      id: 'msg-2',
      sender: 'client',
      senderName: 'Arun',
      text: 'Got it Coach Ravi! Hitting the workout this evening. Protein goal is locked in.',
      timestamp: Date.now() - 3600000 * 3,
      read: true
    }
  ],
  events: [
    {
      id: 'ev-1',
      timestamp: Date.now() - 3600000 * 4,
      sourceRole: 'TRAINER',
      title: 'Workout Assigned',
      description: 'Coach Ravi assigned Chest + Triceps (5 exercises, 15 sets) to Arun',
      badge: 'Workout'
    },
    {
      id: 'ev-2',
      timestamp: Date.now() - 3600000 * 2,
      sourceRole: 'CLIENT',
      title: 'Breakfast & Lunch Logged',
      description: 'Arun logged 1,204 kcal (Protein: 76.6g) with authentic Tamil foods',
      badge: 'Diet'
    }
  ]
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
