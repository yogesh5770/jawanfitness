import React from 'react';
import { RoutineTemplate, WorkoutSession, Exercise, AssignedWorkout } from '../../types';
import { DEFAULT_ROUTINES } from '../../data/defaultRoutines';

import { Play, Plus, Clock, Dumbbell, Calendar, Flame, Trophy, Sparkles } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface WorkoutHubScreenProps {
  workoutHistory: WorkoutSession[];
  assignedWorkout?: AssignedWorkout | null;
  onStartRoutine: (routine: RoutineTemplate) => void;
  onStartAssignedWorkout?: () => void;
  onStartCustomWorkout: () => void;
  onViewExerciseDetail?: (exercise: Exercise) => void;
}

export const WorkoutHubScreen: React.FC<WorkoutHubScreenProps> = ({
  workoutHistory,
  assignedWorkout,
  onStartRoutine,
  onStartAssignedWorkout,
  onStartCustomWorkout
}) => {
  const recommendedRoutine = DEFAULT_ROUTINES[0]; // Push Day

  // Calculate stats
  const totalWorkouts = workoutHistory.length;
  const totalVolumeAllTime = workoutHistory.reduce((acc, curr) => acc + curr.totalVolumeKg, 0);

  const heroTitle = assignedWorkout ? assignedWorkout.title : recommendedRoutine.title;
  const heroDescription = assignedWorkout
    ? (assignedWorkout.notes || 'Personalized routine prescribed by your fitness coach.')
    : recommendedRoutine.description;
  const heroExerciseCount = assignedWorkout
    ? assignedWorkout.exercises.length
    : recommendedRoutine.exerciseIds.length;

  return (
    <div className="space-y-5 pb-28 text-left">
      {/* Hero: Today's Assigned / Recommended Workout Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 p-5 bg-gradient-to-br from-amber-950/40 via-white dark:via-[#0e1320] to-white dark:to-[#07090e] shadow-[0_10px_30px_rgba(245,158,11,0.15)]">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-2 text-xs font-tech text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-2">
          {assignedWorkout ? (
            <>
              <Sparkles className="w-4 h-4 fill-amber-400 text-amber-600 dark:text-amber-400" />
              <span>COACH ASSIGNED WORKOUT</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-amber-400 text-amber-600 dark:text-amber-400" />
              <span>RECOMMENDED SPLIT</span>
            </>
          )}
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
          {heroTitle}
        </h2>

        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed max-w-sm">
          {heroDescription}
        </p>

        <div className="flex items-center space-x-4 text-xs font-tech text-slate-500 dark:text-slate-400 mt-4 mb-5">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>~45-55 Mins</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{heroExerciseCount} Movements</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[10px] text-slate-900 dark:text-white font-bold">
            Hypertrophy
          </span>
        </div>

        <button
          onClick={() => {
            hapticTap();
            if (assignedWorkout && onStartAssignedWorkout) {
              onStartAssignedWorkout();
            } else {
              onStartRoutine(recommendedRoutine);
            }
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase font-display tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>START TODAY'S WORKOUT</span>
        </button>
      </div>

      {/* Quick Volume & Streak Telemetry */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold font-tech block">
              Total Sessions
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-tech">{totalWorkouts}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold font-tech block">
              Lifetime Volume
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-tech">
              {(totalVolumeAllTime / 1000).toFixed(1)}t
            </span>
          </div>
        </div>
      </div>

      {/* Training Programs / Splits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
              PROGRAMS & SPLITS
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-display">Training Splits</h3>
          </div>

          <button
            onClick={() => {
              hapticTap();
              onStartCustomWorkout();
            }}
            className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Empty Workout</span>
          </button>
        </div>

        <div className="space-y-3">
          {DEFAULT_ROUTINES.map((routine) => (
            <div
              key={routine.id}
              onClick={() => {
                hapticTap();
                onStartRoutine(routine);
              }}
              className="group p-4 rounded-2xl bg-white dark:bg-[#0c101a] hover:bg-slate-100 dark:hover:bg-[#121826] border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 transition-all cursor-pointer shadow-md flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex-shrink-0">
                  <img
                    src={routine.coverImage}
                    alt={routine.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-[10px] font-tech text-amber-600 dark:text-amber-400 font-bold uppercase">
                    <span>{routine.split}</span>
                    <span>•</span>
                    <span>{routine.estimatedMinutes}m</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors font-display line-clamp-1">
                    {routine.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {routine.exerciseIds.length} exercises ({routine.level})
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500 text-slate-500 dark:text-slate-400 group-hover:text-black flex items-center justify-center transition-all flex-shrink-0">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workout History Section */}
      {workoutHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                LOGGED LOGS
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display">Recent Completed Sessions</h3>
            </div>
          </div>

          <div className="space-y-2">
            {workoutHistory.slice(0, 5).map((historyItem) => (
              <div
                key={historyItem.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 flex items-center justify-between"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white font-display">
                    {historyItem.routineName}
                  </h5>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-tech">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(historyItem.startTime).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span>{Math.floor(historyItem.durationSeconds / 60)} mins</span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{historyItem.totalVolumeKg} kg</span>
                  </div>
                </div>

                {historyItem.feeling && (
                  <span className="text-xs bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200/80 dark:border-white/5">
                    {historyItem.feeling}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
