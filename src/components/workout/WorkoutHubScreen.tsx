import React, { useState } from 'react';
import { WorkoutSession, Exercise, AssignedWorkout } from '../../types';
import { ExerciseService } from '../../services/exerciseService';
import {
  Play,
  Plus,
  Clock,
  Dumbbell,
  Calendar,
  Flame,
  Trophy,
  Sparkles,
  MessageSquare,
  Eye,
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { ExerciseDetailModal } from '../exercises/ExerciseDetailModal';
import { AnatomicalExerciseIllustration } from '../anatomy/AnatomicalExerciseIllustration';

interface WorkoutHubScreenProps {
  workoutHistory: WorkoutSession[];
  assignedWorkout?: AssignedWorkout | null;
  onStartAssignedWorkout?: () => void;
  onStartCustomWorkout: () => void;
  onStartSingleExercise?: (exercise: Exercise) => void;
  onNavigateToTrainer?: () => void;
  onExploreExercises?: () => void;
  onViewExerciseDetail?: (exercise: Exercise) => void;
}

export const WorkoutHubScreen: React.FC<WorkoutHubScreenProps> = ({
  workoutHistory = [],
  assignedWorkout,
  onStartAssignedWorkout,
  onStartCustomWorkout,
  onStartSingleExercise,
  onNavigateToTrainer,
  onExploreExercises,
  onViewExerciseDetail
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Calculate volume & sessions stats
  const totalWorkouts = workoutHistory.length;
  const totalVolumeAllTime = workoutHistory.reduce((acc, curr) => acc + (curr.totalVolumeKg || 0), 0);

  const handleOpenExercise = (ex: Exercise) => {
    hapticTap();
    if (onViewExerciseDetail) {
      onViewExerciseDetail(ex);
    } else {
      setSelectedExercise(ex);
    }
  };

  return (
    <div className="space-y-5 pb-28 text-left">
      {/* 1. ASSIGNED WORKOUT HERO OR DEDICATED COACH EMPTY STATE */}
      {assignedWorkout ? (
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 p-5 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/40 dark:via-[#0e1320] dark:to-[#07090e] shadow-[0_10px_35px_rgba(245,158,11,0.18)]">
          {/* Background ambient glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Coach Verified Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-tech text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 fill-amber-400 text-amber-600 dark:text-amber-400" />
              <span>COACH ASSIGNED WORKOUT</span>
            </div>
            <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-tech font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>{assignedWorkout.assignedBy || 'Personal Coach'}</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
            {assignedWorkout.title}
          </h2>

          {assignedWorkout.notes && (
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed max-w-lg bg-amber-500/10 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
              <strong className="text-amber-700 dark:text-amber-300">Coach's Plan: </strong>
              {assignedWorkout.notes}
            </p>
          )}

          {/* Telemetry Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-tech text-slate-600 dark:text-slate-400 mt-4 mb-5">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>~{assignedWorkout.estimatedMinutes || 45} Mins</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{assignedWorkout.exercises.length} Exercises Planned</span>
            </div>
            {assignedWorkout.split && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[10px] text-slate-900 dark:text-white font-bold capitalize">
                {assignedWorkout.split}
              </span>
            )}
            {assignedWorkout.assignedDate && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Assigned: {assignedWorkout.assignedDate}
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          {onStartAssignedWorkout && (
            <button
              onClick={() => {
                hapticTap();
                onStartAssignedWorkout();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black text-black" />
              <span>START TODAY'S WORKOUT</span>
            </button>
          )}
        </div>
      ) : (
        /* Empty State: Only Coach gives assigned workouts */
        <div className="rounded-3xl border border-dashed border-amber-500/30 p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50 dark:from-[#0d121e] dark:to-[#07090e] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-md">
            <Dumbbell className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <span className="text-[10px] font-tech uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
              TODAY'S WORKOUT
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
              No Workout Assigned Yet
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your assigned fitness coach has not prescribed a workout routine for today. Once your trainer assigns your routine, it will appear here with complete movement guides, targets, and sets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 max-w-sm mx-auto">
            {onNavigateToTrainer && (
              <button
                onClick={() => {
                  hapticTap();
                  onNavigateToTrainer();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Coach</span>
              </button>
            )}

            {onExploreExercises && (
              <button
                onClick={() => {
                  hapticTap();
                  onExploreExercises();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-tech font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Browse 1,300+ Library</span>
              </button>
            )}

            <button
              onClick={() => {
                hapticTap();
                onStartCustomWorkout();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white font-tech font-bold text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Empty Session</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. PRESCRIBED EXERCISES LIST (Tap any exercise to view 3D GIF & Technique Guide) */}
      {assignedWorkout && assignedWorkout.exercises && assignedWorkout.exercises.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-tech uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
                PRESCRIBED MOVEMENTS ({assignedWorkout.exercises.length})
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                Today's Exercises
              </h3>
            </div>
            <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              Tap to view GIF & Form
            </span>
          </div>

          <div className="space-y-2.5">
            {assignedWorkout.exercises.map((asgEx, idx) => {
              const fullEx =
                ExerciseService.getById(asgEx.exerciseId) ||
                ExerciseService.getAll().find((e) => e.name.toLowerCase() === asgEx.exerciseName.toLowerCase()) ||
                ExerciseService.getAll()[idx % ExerciseService.getAll().length];

              return (
                <div
                  key={`${asgEx.exerciseId}-${idx}`}
                  onClick={() => handleOpenExercise(fullEx)}
                  className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0c101a] hover:bg-slate-50 dark:hover:bg-[#121826] border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-3 select-none active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Exercise Thumbnail / Illustration with GIF badge */}
                    <div className="w-16 h-14 sm:w-18 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#07090e] border border-slate-200 dark:border-white/10 flex-shrink-0 flex items-center justify-center relative">
                      {fullEx?.thumbnailUrl ? (
                        <img
                          src={fullEx.thumbnailUrl}
                          alt={asgEx.exerciseName}
                          loading="lazy"
                          className="w-full h-full object-contain filter contrast-125"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: fullEx?.thumbnailUrl ? 'none' : 'block' }}
                        className="w-full h-full"
                      >
                        <AnatomicalExerciseIllustration
                          exerciseId={fullEx?.id || '0001'}
                          category={fullEx?.category || 'Chest'}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/85 backdrop-blur px-1 py-0.2 rounded text-[7px] font-tech font-black text-amber-300 border border-amber-500/30 flex items-center space-x-0.5">
                        <span>GIF</span>
                      </div>
                    </div>

                    {/* Exercise Info & Prescribed Targets */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 text-[10px] font-tech text-amber-600 dark:text-amber-400 font-bold uppercase truncate">
                        <span>{idx + 1}. {fullEx?.category || 'Movement'}</span>
                        {fullEx?.equipment && <span>• {fullEx.equipment}</span>}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors font-display truncate">
                        {asgEx.exerciseName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-tech">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                          {asgEx.targetSets} Sets × {asgEx.targetReps} Reps
                        </span>
                        {asgEx.targetWeightKg !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold">
                            {asgEx.targetWeightKg} kg
                          </span>
                        )}
                        {asgEx.restSeconds ? (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {asgEx.restSeconds}s Rest
                          </span>
                        ) : null}
                      </div>

                      {asgEx.notes && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 truncate">
                          "{asgEx.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View Form Action Pill */}
                  <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-amber-500/20 dark:bg-white/5 dark:group-hover:bg-amber-500/20 text-slate-600 group-hover:text-amber-600 dark:text-slate-300 dark:group-hover:text-amber-400 border border-slate-200/80 dark:border-white/5 text-[11px] font-tech font-bold transition-all flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">How To Do</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIFETIME STATS SUMMARY */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 flex items-center space-x-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold font-tech block">
              Completed Sessions
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-tech">{totalWorkouts}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 flex items-center space-x-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold font-tech block">
              Volume Lifted
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-tech">
              {(totalVolumeAllTime / 1000).toFixed(1)}t
            </span>
          </div>
        </div>
      </div>

      {/* 4. WORKOUT HISTORY SECTION */}
      {workoutHistory.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-tech uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold block">
                COMPLETED LOGS
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                Recent Workout History
              </h3>
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
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {historyItem.totalVolumeKg} kg
                    </span>
                  </div>
                </div>

                {historyItem.feeling && (
                  <span className="text-xs bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200/80 dark:border-white/5 font-tech">
                    {historyItem.feeling}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EXERCISE DETAIL PAGE / MODAL (WITH 3D GIF & PROMINENT CROSS BUTTON) */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onStartExercise={(ex) => {
            setSelectedExercise(null);
            if (onStartSingleExercise) onStartSingleExercise(ex);
          }}
        />
      )}
    </div>
  );
};

export default WorkoutHubScreen;
