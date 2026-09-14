import React from 'react';
import { 
  Dumbbell, 
  Flame, 
  Droplets, 
  TrendingDown, 
  MessageSquare, 
  Play, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle
} from 'lucide-react';
import { 
  AssignedWorkout, 
  AssignedMealPlan, 
  WorkoutSession, 
  DailyNutritionGoals, 
  LoggedMealItem, 
  WeightRecord, 
  ChatMessage 
} from '../../types';
import { hapticTap } from '../../utils/audioHaptics';

interface HomeScreenProps {
  clientName?: string;
  startWeightKg?: number;
  goalWeightKg?: number;
  currentWeightKg?: number;
  trainerName?: string;
  trainerRole?: string;
  trainerPhone?: string;
  assignedWorkout: AssignedWorkout | null;
  assignedMealPlan?: AssignedMealPlan | null;
  activeWorkoutSession?: WorkoutSession | null;
  loggedMeals: LoggedMealItem[];
  goals: DailyNutritionGoals;
  waterMl: number;
  weightHistory: WeightRecord[];
  latestMessage?: ChatMessage | null;
  onStartWorkout: () => void;
  onResumeWorkout?: () => void;
  onDiscardWorkout?: () => void;
  onExploreExercises?: () => void;
  onNavigateToDiet: () => void;
  onNavigateToProgress: () => void;
  onNavigateToTrainer: () => void;
  onAddWater: (amountMl: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  clientName = 'Yogesh',
  startWeightKg = 108.0,
  goalWeightKg = 80.0,
  currentWeightKg = 108.0,
  trainerName = 'Unassigned',
  trainerRole = 'No Trainer Assigned',
  trainerPhone = '',
  assignedWorkout,
  assignedMealPlan,
  activeWorkoutSession,
  loggedMeals,
  goals,
  waterMl,
  latestMessage,
  onStartWorkout,
  onResumeWorkout,
  onDiscardWorkout,
  onExploreExercises,
  onNavigateToDiet,
  onNavigateToProgress,
  onNavigateToTrainer,
  onAddWater
}) => {
  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate dynamic initials
  const clientInitials = clientName
    ? clientName
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'YT';

  const coachInitials = trainerName
    ? trainerName
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'YT';

  // Calculate actual daily consumed calories & macros
  const totalCalories = loggedMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = Math.round(loggedMeals.reduce((sum, m) => sum + m.protein, 0));
  const totalCarbs = Math.round(loggedMeals.reduce((sum, m) => sum + m.carbs, 0));
  const totalFat = Math.round(loggedMeals.reduce((sum, m) => sum + m.fat, 0));
  const totalFiber = Math.round(loggedMeals.reduce((sum, m) => sum + (m.fiber || 0), 0));

  // Goal weight calculations
  const totalWeightToLose = Math.max(0.1, startWeightKg - goalWeightKg);
  const weightLostSoFar = Math.max(0, startWeightKg - currentWeightKg);
  const progressPercent = Math.min(100, Math.round((weightLostSoFar / totalWeightToLose) * 100));

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const cleanPhone = trainerPhone.replace(/\D/g, '');

  return (
    <div className="space-y-4 pb-20 text-left animate-fadeIn">
      {/* 1. Header Greeting & Date */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-amber-500 dark:text-amber-400 font-tech font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayStr}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight mt-0.5">
            {getGreeting()}, {clientName}
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-sm shadow-sm">
          {clientInitials}
        </div>
      </div>

      {/* Responsive Grid: 1 column on Mobile, 12 columns on Desktop / Laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Target Physique Mission, Unfinished Workout, Today's Workout & Nutrition (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 2. Target Goal Hero Banner - Light Theme & Dark Theme Flawless */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#121929] dark:via-[#0d1322] dark:to-[#0a0e1a] rounded-2xl p-4 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-tech font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Target Physique Mission</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-tech">
                {progressPercent}% Achieved
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="text-slate-500 dark:text-slate-400 text-xs">
                Start: <span className="font-bold text-slate-900 dark:text-white">{startWeightKg} kg</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display tracking-tight">
                  {currentWeightKg}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-tech">kg current</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs">
                Goal: <span className="font-bold text-emerald-600 dark:text-emerald-400">{goalWeightKg} kg</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 dark:to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
              <span>↓ {weightLostSoFar.toFixed(1)} kg dropped since joining</span>
              <button
                onClick={() => {
                  hapticTap();
                  onNavigateToProgress();
                }}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center space-x-1"
              >
                <span>View Progress</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2.5 UNFINISHED WORKOUT RECOVERY BANNER */}
          {activeWorkoutSession && (
            <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 shadow-lg space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-amber-500 dark:text-amber-400 font-bold font-tech">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>UNFINISHED WORKOUT RECOVERED</span>
                </div>
                <span className="text-[10px] font-tech text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5">
                  In Progress
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white font-display">
                  {activeWorkoutSession.routineName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {activeWorkoutSession.exercises.filter((e) => e.sets.some((s) => s.completed)).length} of {activeWorkoutSession.exercises.length} exercises logged
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => {
                    hapticTap();
                    if (onResumeWorkout) onResumeWorkout();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Continue Workout</span>
                </button>
                <button
                  onClick={() => {
                    hapticTap();
                    if (onDiscardWorkout) onDiscardWorkout();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-900 hover:bg-red-500/20 text-slate-700 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-300 font-tech font-bold text-xs border border-slate-300 dark:border-white/10 transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* 3. TODAY'S WORKOUT COMMAND CARD */}
          <div className="bg-white dark:bg-[#0e1422] rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-tech font-bold tracking-widest text-slate-500 dark:text-slate-400">
                    Today's Workout
                  </h3>
                  <p className="text-base font-black text-slate-900 dark:text-white font-display">
                    {assignedWorkout ? assignedWorkout.title : 'No Workout Assigned Yet'}
                  </p>
                </div>
              </div>
              {assignedWorkout && (
                <span className="text-[11px] font-tech text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  {assignedWorkout.estimatedMinutes} min
                </span>
              )}
            </div>

            {assignedWorkout ? (
              <>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>{assignedWorkout.exercises.length} Exercises Planned</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedWorkout.exercises.slice(0, 4).map((ex, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300"
                      >
                        {ex.exerciseName}
                      </span>
                    ))}
                    {assignedWorkout.exercises.length > 4 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-500">
                        +{assignedWorkout.exercises.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    hapticTap();
                    onStartWorkout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-sm tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-2 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>START TODAY'S WORKOUT</span>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ready to train? Select any movement from the 1,300+ 3D exercise catalog to log sets, reps, and volume dynamically.
                </p>
                <button
                  onClick={() => {
                    hapticTap();
                    if (onExploreExercises) onExploreExercises();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-white/10 font-tech font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>Explore Exercise Library & Train</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 4. TODAY'S NUTRITION COMMAND CARD */}
          <div className="bg-white dark:bg-[#0e1422] rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-tech font-bold tracking-widest text-slate-500 dark:text-slate-400">
                    Today's Nutrition
                  </h3>
                  <p className="text-base font-black text-slate-900 dark:text-white font-display">
                    {totalCalories} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {goals.calories} kcal</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  hapticTap();
                  onNavigateToDiet();
                }}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center space-x-1"
              >
                <span>View Diet</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Macros Breakdown Bar Grid */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400 uppercase">Protein</span>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {totalProtein} <span className="text-[10px] text-slate-500">/ {goals.protein}g</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-amber-500 dark:bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalProtein / goals.protein) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400 uppercase">Carbs</span>
                <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                  {totalCarbs} <span className="text-[10px] text-slate-500">/ {goals.carbs}g</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-500 dark:bg-cyan-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalCarbs / goals.carbs) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400 uppercase">Fat</span>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {totalFat} <span className="text-[10px] text-slate-500">/ {goals.fat}g</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-rose-500 dark:bg-rose-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalFat / goals.fat) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400 uppercase">Fiber</span>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {totalFiber} <span className="text-[10px] text-slate-500">/ {goals.fiber}g</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalFiber / goals.fiber) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Hydration & Assigned Coach Direct Card (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 5. WATER HYDRATION TRACKER */}
          <div className="bg-white dark:bg-[#0e1422] rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-tech">
                  <Droplets className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                  <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Hydration</span>
                </div>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => {
                      hapticTap();
                      onAddWater(250);
                    }}
                    className="text-[11px] bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-lg font-bold hover:bg-cyan-500/25 transition-colors"
                  >
                    +250ml
                  </button>
                  <button
                    onClick={() => {
                      hapticTap();
                      onAddWater(500);
                    }}
                    className="text-[11px] bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-lg font-bold hover:bg-cyan-500/25 transition-colors"
                  >
                    +500ml
                  </button>
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-display">
                {(waterMl / 1000).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {(goals.waterMl / 1000).toFixed(1)}L Goal</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden">
                <div
                  className="bg-cyan-500 dark:bg-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (waterMl / goals.waterMl) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 6. REAL ASSIGNED COACH DIRECT NOTICE - 100% DB CONNECTED */}
          {(() => {
            const isAssigned = !!trainerName && trainerName !== 'Unassigned' && trainerName !== 'Head Coach';
            return (
              <div className="bg-white dark:bg-[#0e1422] rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-black font-display shadow-sm">
                      {isAssigned ? coachInitials : '—'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {isAssigned ? `Coach: ${trainerName}` : 'Coach: Unassigned'}
                        </h4>
                        {isAssigned && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-tech font-bold rounded border border-emerald-500/20">
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isAssigned ? trainerRole : 'No coach assigned by director'}
                      </span>
                    </div>
                  </div>

                  {isAssigned && (
                    <div className="flex items-center space-x-1.5">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chat on WhatsApp"
                          className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors border border-emerald-500/20"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          hapticTap();
                          onNavigateToTrainer();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center space-x-1 transition-colors"
                      >
                        <span>Chat</span>
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  {isAssigned
                    ? (latestMessage ? `"${latestMessage.text}"` : `"Welcome! Your assigned coach ${trainerName} is monitoring your workouts and diet in real-time."`)
                    : "No trainer is currently assigned to your account. Your Gym Director will assign a personal coach soon."}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};
