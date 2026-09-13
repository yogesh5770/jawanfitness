import { RoutineTemplate } from '../types';

export const DEFAULT_ROUTINES: RoutineTemplate[] = [
  {
    id: 'push-hypertrophy',
    title: 'Push Day (Chest, Shoulders & Triceps)',
    split: 'Push / Pull / Legs',
    level: 'Intermediate',
    estimatedMinutes: 50,
    description: 'Target clavicular upper chest, shoulder overhead pressing, lateral head isolation, and triceps lockout power.',
    coverImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
    exerciseIds: [
      'barbell-bench-press',
      'incline-dumbbell-press',
      'overhead-barbell-press',
      'dumbbell-lateral-raise',
      'triceps-rope-pushdown',
      'bodyweight-pushups'
    ]
  },
  {
    id: 'pull-power',
    title: 'Pull Day (Lats, Upper Back & Biceps)',
    split: 'Push / Pull / Legs',
    level: 'Intermediate',
    estimatedMinutes: 52,
    description: 'Develop a wide V-taper lat width, dense mid-back rhomboid thickness, and peaked biceps brachii.',
    coverImage: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&auto=format&fit=crop&q=80',
    exerciseIds: [
      'lat-pulldown',
      'bent-over-barbell-row',
      'seated-cable-row',
      'face-pull',
      'standing-barbell-curl'
    ]
  },
  {
    id: 'leg-destruction',
    title: 'Leg Day (Quads, Hamstrings & Glutes)',
    split: 'Lower Body Strength',
    level: 'Advanced',
    estimatedMinutes: 60,
    description: 'Heavy compound squatting mechanics, posterior chain Romanian deadlifts, and high-volume leg press pump.',
    coverImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    exerciseIds: [
      'barbell-back-squat',
      'leg-press',
      'romanian-deadlift'
    ]
  },
  {
    id: 'core-abs-15',
    title: '15-Min Bulletproof Core & Abs',
    split: 'Core Conditioning',
    level: 'Beginner',
    estimatedMinutes: 18,
    description: 'Decompress lumbar spine, engage deep transverse abdominis, and chisel lower abdominal definition.',
    coverImage: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80',
    exerciseIds: [
      'hanging-leg-raise',
      'standard-plank',
      'bodyweight-pushups'
    ]
  }
];
