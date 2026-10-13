import React from 'react';
import { Dumbbell, Flame, Droplets, Scale, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface TodayMissionCardProps {
  workoutCompleted: boolean;
  workoutTotalExercises: number;
  workoutLoggedExercises: number;
  consumedCalories: number;
  targetCalories: number;
  waterMl: number;
  targetWaterMl: number;
  weightLoggedToday: boolean;
  coachCheckinDone: boolean;
  onNavigateToWorkout: () => void;
  onNavigateToDiet: () => void;
  onNavigateToProgress: () => void;
  onOpenCoachChat: () => void;
  onAddWater: (ml: number) => void;
}

export const TodayMissionCard: React.FC<TodayMissionCardProps> = ({
  workoutCompleted,
  workoutTotalExercises,
  workoutLoggedExercises,
  consumedCalories,
  targetCalories,
  waterMl,
  targetWaterMl,
  weightLoggedToday,
  coachCheckinDone,
  onNavigateToWorkout,
  onNavigateToDiet,
  onNavigateToProgress,
  onOpenCoachChat,
  onAddWater
}) => {
  // Compute how many tasks of 5 are accomplished today
  const isWorkoutDone = workoutCompleted || (workoutTotalExercises > 0 && workoutLoggedExercises >= workoutTotalExercises);
  const isDietOnTrack = consumedCalories > 0 && consumedCalories <= targetCalories + 200;
  const isWaterDone = waterMl >= targetWaterMl * 0.75; // 75%+ counts towards daily completion
  const isWeightDone = weightLoggedToday;
  const isCoachDone = coachCheckinDone;

  const completedCount = [
    isWorkoutDone,
    isDietOnTrack,
    isWaterDone,
    isWeightDone,
    isCoachDone
  ].filter(Boolean).length;

  const totalTasks = 5;
  const missionPercent = Math.round((completedCount / totalTasks) * 100);

  return (
    <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Progress Counter */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 dark:text-amber-400 font-bold block">
              DAILY FOCUS
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
              Today's Mission
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-tech font-bold text-amber-600 dark:text-amber-400">
            {completedCount} / {totalTasks} Complete
          </span>
          <div className="w-24 sm:w-28 bg-slate-100 dark:bg-slate-900 rounded-full h-2 mt-1 overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(8, missionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5 Mission Task Items */}
      <div className="space-y-2 pt-1">
        {/* 1. Workout Task */}
        <div
          onClick={() => {
            hapticTap();
            onNavigateToWorkout();
          }}
          className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
              isWorkoutDone
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}>
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                Workout Session
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech">
                {isWorkoutDone 
                  ? 'Crushed Today 🎉' 
                  : workoutTotalExercises > 0 
                  ? `${workoutLoggedExercises} of ${workoutTotalExercises} exercises done`
                  : 'Ready to start'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isWorkoutDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <span className="text-[10px] font-tech font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Train &rarr;
              </span>
            )}
          </div>
        </div>

        {/* 2. Nutrition Calories Task */}
        <div
          onClick={() => {
            hapticTap();
            onNavigateToDiet();
          }}
          className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
              isDietOnTrack
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
            }`}>
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                Nutrition & Macros
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech">
                {consumedCalories} / {targetCalories} kcal ({Math.min(100, Math.round((consumedCalories / targetCalories) * 100))}%)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isDietOnTrack ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <span className="text-[10px] font-tech font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Log &rarr;
              </span>
            )}
          </div>
        </div>

        {/* 3. Hydration Water Task */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
          <div 
            onClick={() => {
              hapticTap();
              onNavigateToDiet();
            }}
            className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
              isWaterDone
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
            }`}>
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                Hydration Target
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech">
                {(waterMl / 1000).toFixed(2)}L / {(targetWaterMl / 1000).toFixed(1)}L target
              </span>
            </div>
          </div>

          {/* Quick-add water pills */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                hapticTap();
                onAddWater(250);
              }}
              className="px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 font-tech font-bold text-[10px] border border-cyan-500/30 transition-all active:scale-95"
            >
              +250ml
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hapticTap();
                onAddWater(500);
              }}
              className="px-2 py-0.5 rounded-lg bg-cyan-500 text-black font-tech font-bold text-[10px] hover:bg-cyan-400 transition-all active:scale-95 shadow-sm"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* 4. Morning Weight Check-in Task */}
        <div
          onClick={() => {
            hapticTap();
            onNavigateToProgress();
          }}
          className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
              isWeightDone
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10'
            }`}>
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                Morning Weight Check-in
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech">
                {isWeightDone ? 'Recorded for today ✓' : 'Log morning scale reading'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isWeightDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <span className="text-[10px] font-tech font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Log &rarr;
              </span>
            )}
          </div>
        </div>

        {/* 5. Coach Check-in Task */}
        <div
          onClick={() => {
            hapticTap();
            onOpenCoachChat();
          }}
          className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
              isCoachDone
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}>
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                Personal Coach Check-in
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech">
                {isCoachDone ? 'Daily check-in active ✓' : 'Send quick 1-tap check-in'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isCoachDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <span className="text-[10px] font-tech font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Check In &rarr;
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
