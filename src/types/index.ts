export type MuscleGroup = 
  | 'Chest' 
  | 'Back' 
  | 'Shoulders' 
  | 'Biceps' 
  | 'Triceps' 
  | 'Arms'
  | 'Legs' 
  | 'Glutes' 
  | 'Abs' 
  | 'Cardio'
  | 'Full Body'
  | 'Mobility'
  | 'Stretching';

export type EquipmentType = 
  | 'Barbell' 
  | 'Dumbbell' 
  | 'Machine' 
  | 'Cable' 
  | 'Bodyweight' 
  | 'Kettlebell'
  | 'Band'
  | string;

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  bodyPart?: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: EquipmentType;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  animationUrl: string; // loopable animation / video demonstration
  thumbnailUrl: string;
  trainerVideoUrl?: string;
  instructions: string[];
  instructionsHi?: string[];
  breathing?: {
    eccentric: string;
    concentric: string;
  };
  commonMistakes: string[];
  trainerTip: string;
  caloriesBurnedPerMin?: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  isWarmup?: boolean;
  isDropSet?: boolean;
}

export interface ActiveWorkoutExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  routineName: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  totalVolumeKg: number;
  exercises: ActiveWorkoutExercise[];
  feeling?: '🔥 Crushed it' | '💪 Good' | '⚡ Tough' | '😴 Exhausted';
  notes?: string;
  prsBroken?: string[];
}

export interface RoutineTemplate {
  id: string;
  title: string;
  split: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  description: string;
  coverImage: string;
  exerciseIds: string[];
}

export type FoodCategory =
  | 'High Protein Non-Veg'
  | 'High Protein Veg & Sundal'
  | 'Millets & Traditional Grains'
  | 'South Indian Breakfast'
  | 'Greens, Veggies & Sambar'
  | 'Dairy & Hydration'
  | 'Nuts & Healthy Fats'
  | 'South Indian'
  | 'North Indian'
  | 'High Protein'
  | 'Grains & Rice'
  | 'Snacks'
  | 'Dairy & Drinks'
  | string;

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isIndian?: boolean;
  verified?: boolean;
}

export interface LoggedMealItem {
  id: string;
  foodId: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servingQuantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  time: string;
}

export interface DailyNutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

export interface WeightRecord {
  id: string;
  date: string;
  weightKg: number;
  bodyFat?: number;
  notes?: string;
}

export interface TrainerNote {
  id: string;
  trainerName: string;
  role: string;
  date: string;
  text: string;
  badge: 'Technique' | 'Diet' | 'Motivation';
}

export interface AssignedWorkout {
  id: string;
  title: string;
  split: string;
  assignedBy: string;
  assignedDate: string;
  estimatedMinutes: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    targetWeightKg?: number;
    restSeconds: number;
    notes?: string;
  }[];
}

export interface AssignedMealPlan {
  id: string;
  title: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  assignedBy: string;
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    title: string;
    items: string[];
    suggestedCalories: number;
    suggestedProtein: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'client' | 'trainer';
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface BodyMeasurements {
  date: string;
  waistCm: number;
  chestCm: number;
  armCm: number;
  thighCm: number;
}

