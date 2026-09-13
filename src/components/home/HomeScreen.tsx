import React from 'react';
import { 
  Dumbbell, 
  Flame, 
  Droplets, 
  Footprints, 
  TrendingDown, 
  MessageSquare, 
  Play, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar
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
  assignedWorkout: AssignedWorkout | null;
  assignedMealPlan?: AssignedMealPlan | null;
  activeWorkoutSession?: WorkoutSession | null;
  loggedMeals: LoggedMealItem[];
  goals: DailyNutritionGoals;
  waterMl: number;
  stepsCount: number;
  stepsGoal: number;
  weightHistory: WeightRecord[];
  latestMessage?: ChatMessage | null;
  isGoogleFitConnected?: boolean;
  onToggleGoogleFit?: () => void;
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
  currentWeightKg = 103.6,
  assignedWorkout,
  assignedMealPlan,
  activeWorkoutSession,
  loggedMeals,
  goals,
  waterMl,
  stepsCount,
  stepsGoal,
  latestMessage,
  isGoogleFitConnected = false,
  onToggleGoogleFit,
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

  return (
    <div className="space-y-4 pb-20 text-left animate-fadeIn">
      {/* 1. Header Greeting & Date */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-tech font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayStr}</span>
          </div>
          <h1 className="text-2xl font-black text-white font-display tracking-tight mt-0.5">
            {getGreeting()}, {clientName}
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
          YS
        </div>
      </div>

      {/* 2. Target Goal Hero Banner */}
      <div className="bg-gradient-to-br from-[#121929] via-[#0d1322] to-[#0a0e1a] rounded-2xl p-4 border border-white/10 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5 text-xs font-tech font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Physique Mission</span>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-tech">
            {progressPercent}% Achieved
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-slate-400 text-xs">
            Start: <span className="font-bold text-white">{startWeightKg} kg</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-amber-400 font-display tracking-tight">
              {currentWeightKg}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-tech">kg current</span>
          </div>
          <div className="text-slate-400 text-xs">
            Goal: <span className="font-bold text-emerald-400">{goalWeightKg} kg</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[11px] text-slate-400">
          <span>↓ {weightLostSoFar.toFixed(1)} kg dropped since joining</span>
          <button
            onClick={() => {
              hapticTap();
              onNavigateToProgress();
            }}
            className="text-amber-400 font-bold hover:underline flex items-center space-x-1"
          >
            <span>View Progress</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2.5 UNFINISHED WORKOUT RECOVERY BANNER (Master Workflow Rule 13) */}
      {activeWorkoutSession && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 shadow-lg space-y-2.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-bold font-tech">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>UNFINISHED WORKOUT RECOVERED</span>
            </div>
            <span className="text-[10px] font-tech text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
              In Progress
            </span>
          </div>

          <div>
            <h4 className="text-sm font-black text-white font-display">
              {activeWorkoutSession.routineName}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
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
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 font-tech font-bold text-xs border border-white/10 transition-all"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* 3. TODAY'S WORKOUT COMMAND CARD */}
      <div className="bg-[#0e1422] rounded-2xl p-4 border border-white/10 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-tech font-bold tracking-widest text-slate-400">
                Today's Workout
              </h3>
              <p className="text-base font-black text-white font-display">
                {assignedWorkout ? assignedWorkout.title : 'No Workout Assigned Yet'}
              </p>
            </div>
          </div>
          {assignedWorkout && (
            <span className="text-[11px] font-tech text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
              {assignedWorkout.estimatedMinutes} min
            </span>
          )}
        </div>

        {assignedWorkout ? (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{assignedWorkout.exercises.length} Exercises prescribed by Coach Vignesh</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {assignedWorkout.exercises.slice(0, 4).map((ex, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-slate-300"
                  >
                    {ex.exerciseName}
                  </span>
                ))}
                {assignedWorkout.exercises.length > 4 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/50 text-slate-500">
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
            <p className="text-xs text-slate-400 leading-relaxed">
              Your workout hasn't been assigned yet. Your coach will prepare your personalized split.
            </p>
            <button
              onClick={() => {
                hapticTap();
                if (onExploreExercises) onExploreExercises();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-white/10 font-tech font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Explore 1,324 Exercise Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. TODAY'S NUTRITION COMMAND CARD */}
      <div className="bg-[#0e1422] rounded-2xl p-4 border border-white/10 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-tech font-bold tracking-widest text-slate-400">
                Today's Nutrition
              </h3>
              <p className="text-base font-black text-white font-display">
                {totalCalories} <span className="text-xs font-normal text-slate-400">/ {goals.calories} kcal</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticTap();
              onNavigateToDiet();
            }}
            className="text-xs text-amber-400 font-bold hover:underline flex items-center space-x-1"
          >
            <span>View Diet</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Macros Breakdown Bar Grid */}
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
            <span className="text-[10px] font-tech text-slate-400 uppercase">Protein</span>
            <div className="text-xs font-bold text-amber-400 mt-0.5">
              {totalProtein} <span className="text-[10px] text-slate-500">/ {goals.protein}g</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (totalProtein / goals.protein) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
            <span className="text-[10px] font-tech text-slate-400 uppercase">Carbs</span>
            <div className="text-xs font-bold text-cyan-400 mt-0.5">
              {totalCarbs} <span className="text-[10px] text-slate-500">/ {goals.carbs}g</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (totalCarbs / goals.carbs) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
            <span className="text-[10px] font-tech text-slate-400 uppercase">Fat</span>
            <div className="text-xs font-bold text-rose-400 mt-0.5">
              {totalFat} <span className="text-[10px] text-slate-500">/ {goals.fat}g</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (totalFat / goals.fat) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
            <span className="text-[10px] font-tech text-slate-400 uppercase">Fiber</span>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              {totalFiber} <span className="text-[10px] text-slate-500">/ {goals.fiber}g</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (totalFiber / goals.fiber) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. DAILY ACTIVITY & WATER TRACKER */}
      <div className="grid grid-cols-2 gap-3">
        {/* Steps Card with Zero Fabrication Google Fit Enforcement */}
        <div className="bg-[#0e1422] rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-tech">
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Steps</span>
              </div>
              {isGoogleFitConnected ? (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-tech font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GFit Live</span>
                </span>
              ) : (
                <span className="text-[9px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded font-tech">
                  Disconnected (0)
                </span>
              )}
            </div>

            <div className="text-xl font-black text-white font-display">
              {isGoogleFitConnected ? stepsCount.toLocaleString() : '0'}{' '}
              <span className="text-xs font-normal text-slate-400">/ {stepsGoal.toLocaleString()}</span>
            </div>

            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              {isGoogleFitConnected
                ? 'Synced live from Google Fit • cadet.yogesh@gmail.com'
                : 'Zero fabrication: Connect Google Fit to show live steps'}
            </p>

            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${isGoogleFitConnected ? Math.min(100, (stepsCount / stepsGoal) * 100) : 0}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              hapticTap();
              if (onToggleGoogleFit) onToggleGoogleFit();
            }}
            className={`mt-2.5 w-full py-1.5 px-2 rounded-xl text-[11px] font-bold font-tech flex items-center justify-center space-x-1 transition-all ${
              isGoogleFitConnected
                ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            }`}
          >
            <span>{isGoogleFitConnected ? 'Disconnect Google Fit' : '⚡ Connect Google Fit'}</span>
          </button>
        </div>

        {/* Water Hydration Card */}
        <div className="bg-[#0e1422] rounded-2xl p-3.5 border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-tech">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hydration</span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  hapticTap();
                  onAddWater(250);
                }}
                className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold hover:bg-cyan-500/30"
              >
                +250ml
              </button>
              <button
                onClick={() => {
                  hapticTap();
                  onAddWater(500);
                }}
                className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold hover:bg-cyan-500/30"
              >
                +500ml
              </button>
            </div>
          </div>
          <div className="text-lg font-black text-white font-display">
            {(waterMl / 1000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">/ {(goals.waterMl / 1000).toFixed(1)}L</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (waterMl / goals.waterMl) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6. COACH VIGNESH / TRAINER DIRECT NOTICE */}
      <div className="bg-[#0e1422] rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold">
              CV
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Coach Vignesh (Salem HQ)</h4>
              <span className="text-[10px] text-slate-400">Head Strength & Conditioning Coach</span>
            </div>
          </div>
          <button
            onClick={() => {
              hapticTap();
              onNavigateToTrainer();
            }}
            className="text-xs text-amber-400 font-bold hover:underline flex items-center space-x-1"
          >
            <span>Chat</span>
            <MessageSquare className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900/70 rounded-xl p-2.5 border border-white/5 text-xs text-slate-300 italic">
          "{latestMessage ? latestMessage.text : 'Focus on controlling the 2-second negative on your chest presses today. Keep elbows at 60 degrees to safeguard shoulders!'}"
        </div>
      </div>
    </div>
  );
};
