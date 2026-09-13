import { Exercise, MuscleGroup } from '../types';
import rawExercises from '../data/allExercises.json';

// Cast JSON to typed Exercise list
export const ALL_EXERCISES: Exercise[] = (rawExercises as unknown as Exercise[]).map((ex) => {
  // Check if we have a Vital Animations override for first 50 exercises
  return {
    ...ex,
    // Ensure default values if any are missing
    difficulty: ex.difficulty || 'Intermediate',
    secondaryMuscles: ex.secondaryMuscles || [],
    instructions: ex.instructions || ['Assume starting position.', 'Execute the repetition with strict form.', 'Return to start.'],
    commonMistakes: ex.commonMistakes || ['Rushing tempo', 'Improper joint alignment'],
    trainerTip: ex.trainerTip || 'Maintain total mind-muscle contraction through full range of motion.'
  };
});

// Fast in-memory lookup map by id
const EXERCISE_MAP = new Map<string, Exercise>();
ALL_EXERCISES.forEach((ex) => EXERCISE_MAP.set(ex.id, ex));

export const ExerciseService = {
  getAll(): Exercise[] {
    return ALL_EXERCISES;
  },

  getById(id: string): Exercise | undefined {
    return EXERCISE_MAP.get(id);
  },

  getByCategory(category: MuscleGroup | 'All'): Exercise[] {
    if (category === 'All') return ALL_EXERCISES;
    return ALL_EXERCISES.filter((ex) => ex.category.toLowerCase() === category.toLowerCase());
  },

  search(
    query: string,
    category?: MuscleGroup | 'All',
    equipment?: string
  ): Exercise[] {
    const q = query.trim().toLowerCase();
    return ALL_EXERCISES.filter((ex) => {
      // Category filter
      if (category && category !== 'All' && ex.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      // Equipment filter
      if (equipment && equipment !== 'All' && !ex.equipment.toLowerCase().includes(equipment.toLowerCase())) {
        return false;
      }
      // Text query
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q) ||
        ex.secondaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
        ex.equipment.toLowerCase().includes(q) ||
        (ex.bodyPart && ex.bodyPart.toLowerCase().includes(q))
      );
    });
  },

  getFavorites(favoriteIds: string[]): Exercise[] {
    const set = new Set(favoriteIds);
    return ALL_EXERCISES.filter((ex) => set.has(ex.id));
  },

  getRandomWorkout(count: number = 6, category?: MuscleGroup): Exercise[] {
    const pool = category ? this.getByCategory(category) : ALL_EXERCISES;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};
