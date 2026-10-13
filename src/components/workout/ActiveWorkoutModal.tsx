import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutSession, ActiveWorkoutExercise, WorkoutSet } from '../../types';
import { RestTimerModal } from './RestTimerModal';
import { WorkoutCompleteModal } from './WorkoutCompleteModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { CalorieCalculator } from '../../utils/calorieCalculator';
import { X, Check, Plus, Minus, ChevronLeft, ChevronRight, Info, Flame, Clock, Dumbbell, Sparkles } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { Cinematic3DMotionViewer } from '../exercises/Cinematic3DMotionViewer';
import { ExerciseDetailModal } from '../exercises/ExerciseDetailModal';
import { registerBackButtonHandler } from '../../services/nativePlatformService';

interface ActiveWorkoutModalProps {
  session: WorkoutSession | null;
  userWeightKg?: number;
  userHeightCm?: number;
  onUpdateSession: (session: WorkoutSession) => void;
  onFinishWorkout: (session: WorkoutSession) => void;
  onCancelWorkout: () => void;
  onMinimize?: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  session,
  userWeightKg = 103.6,
  userHeightCm = 178,
  onUpdateSession,
  onFinishWorkout,
  onCancelWorkout,
  onMinimize
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const sessionStartTime = session?.startTime;
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    sessionStartTime ? Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)) : 0
  );

  // Active set index tracking for sequential execution
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [activePlateCalcSetIdx, setActivePlateCalcSetIdx] = useState(0);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Android hardware back button handler
  useEffect(() => {
    if (!session) return;

    return registerBackButtonHandler(() => {
      hapticTap();
      if (isDetailModalOpen) {
        setIsDetailModalOpen(false);
        return true;
      }
      if (isPlateCalcOpen) {
        setIsPlateCalcOpen(false);
        return true;
      }
      if (isRestTimerOpen) {
        setIsRestTimerOpen(false);
        return true;
      }
      if (showCompletionModal) {
        setShowCompletionModal(false);
        return true;
      }
      if (onMinimize) {
        onMinimize();
        return true;
      }
      if (window.confirm('Leave active workout session? Your progress will be saved.')) {
        onCancelWorkout();
      }
      return true;
    });
  }, [
    session,
    isDetailModalOpen,
    isPlateCalcOpen,
    isRestTimerOpen,
    showCompletionModal,
    onMinimize,
    onCancelWorkout
  ]);

  // Timer counter (resilient against background app sleep)
  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  if (!session || session.exercises.length === 0) return null;

  const currentActiveExercise: ActiveWorkoutExercise =
    session.exercises[currentExerciseIndex] || session.exercises[0];
  const currentExercise: Exercise = currentActiveExercise.exercise;

  // Format elapsed time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate live volume
  const calculateTotalVolume = (exercises: ActiveWorkoutExercise[]) => {
    let total = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          total += set.weightKg * set.reps;
        }
      });
    });
    return total;
  };

  const totalVolume = calculateTotalVolume(session.exercises);
  const totalCompletedSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  // Real-time scientific MET calorie calculation based on client Weight, Height, and Duration
  const caloriesBurnedLive = CalorieCalculator.calculateSessionCalories({
    weightKg: userWeightKg,
    heightCm: userHeightCm,
    durationMinutes: elapsedSeconds / 60,
    exerciseCategory: currentExercise.category,
    totalVolumeKg: totalVolume,
    completedSets: totalCompletedSets
  });

  // Handle Set completion -> triggers Rest Timer -> auto-unlocks next set
  const handleCompleteCurrentSet = (targetSetIndex: number) => {
    hapticTap();
    const updatedExercises = [...session.exercises];
    const targetEx = updatedExercises[currentExerciseIndex];

    const currentSet = targetEx.sets[targetSetIndex];
    if (!currentSet) return;

    // Toggle or complete
    const isNowCompleted = !currentSet.completed;
    targetEx.sets[targetSetIndex].completed = isNowCompleted;

    const updatedSession: WorkoutSession = {
      ...session,
      exercises: updatedExercises,
      durationSeconds: elapsedSeconds,
      totalVolumeKg: calculateTotalVolume(updatedExercises)
    };

    onUpdateSession(updatedSession);

    // If completed: open rest timer automatically!
    if (isNowCompleted) {
      setRestSeconds(90);
      setIsRestTimerOpen(true);
    }
  };

  // Called when rest timer finishes or user taps skip
  const handleRestFinished = () => {
    setIsRestTimerOpen(false);
    hapticTap();

    // Advance activeSetIndex to the next incomplete set
    const sets = currentActiveExercise.sets;
    const nextIncomplete = sets.findIndex((s, i) => !s.completed && i > activeSetIndex);
    if (nextIncomplete !== -1) {
      setActiveSetIndex(nextIncomplete);
    } else {
      const anyIncomplete = sets.findIndex((s) => !s.completed);
      if (anyIncomplete !== -1) {
        setActiveSetIndex(anyIncomplete);
      }
    }
  };

  const handleAdjustWeight = (setIdx: number, delta: number) => {
    hapticTap();
    const updatedExercises = [...session.exercises];
    const targetEx = updatedExercises[currentExerciseIndex];
    const targetSet = targetEx.sets[setIdx];
    if (targetSet) {
      targetSet.weightKg = Math.max(0, Math.round((targetSet.weightKg + delta) * 10) / 10);
      onUpdateSession({
        ...session,
        exercises: updatedExercises,
        totalVolumeKg: calculateTotalVolume(updatedExercises)
      });
    }
  };

  const handleAdjustReps = (setIdx: number, delta: number) => {
    hapticTap();
    const updatedExercises = [...session.exercises];
    const targetEx = updatedExercises[currentExerciseIndex];
    const targetSet = targetEx.sets[setIdx];
    if (targetSet) {
      targetSet.reps = Math.max(1, targetSet.reps + delta);
      onUpdateSession({
        ...session,
        exercises: updatedExercises,
        totalVolumeKg: calculateTotalVolume(updatedExercises)
      });
    }
  };

  const handleAddSet = () => {
    hapticTap();
    const updatedExercises = [...session.exercises];
    const targetEx = updatedExercises[currentExerciseIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1];

    const newSet: WorkoutSet = {
      id: `set-${Date.now()}-${targetEx.sets.length + 1}`,
      setNumber: targetEx.sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 20,
      reps: lastSet ? lastSet.reps : 10,
      completed: false
    };

    targetEx.sets.push(newSet);
    onUpdateSession({
      ...session,
      exercises: updatedExercises
    });
  };

  const handleFinish = (feeling: string, notes: string) => {
    const finalSession: WorkoutSession = {
      ...session,
      endTime: Date.now(),
      durationSeconds: elapsedSeconds,
      feeling: feeling as WorkoutSession['feeling'],
      notes,
      totalVolumeKg: totalVolume
    };
    onFinishWorkout(finalSession);
    setShowCompletionModal(false);
  };

  const allExercisesCompleted = session.exercises.every((ex) =>
    ex.sets.every((s) => s.completed)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
      {/* 1. Header Bar with Elapsed Time, Volume, and LIVE Calorie Counter */}
      <div className="bg-white dark:bg-[#0c101a] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between flex-shrink-0 pt-safe">
        <div>
          <span className="text-[10px] font-tech uppercase tracking-wider text-amber-600 dark:text-amber-500 font-bold block">
            LIVE WORKOUT
          </span>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-display truncate max-w-[200px] sm:max-w-xs">
            {session.routineName}
          </h2>
        </div>

        {/* Live Metrics Header Pill */}
        <div className="flex items-center space-x-2">
          {onMinimize && (
            <button
              onClick={() => {
                hapticTap();
                onMinimize();
              }}
              className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 text-xs active:scale-95 transition-all cursor-pointer"
              title="Minimize workout session"
            >
              <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="font-tech text-[11px] text-slate-700 dark:text-slate-300">Minimize</span>
            </button>
          )}

          {/* Real MET Biometric Calories Burned */}
          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 min-h-[44px] rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 font-tech">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{caloriesBurnedLive} kcal</span>
          </div>

          {/* Stopwatch */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-2.5 py-1 min-h-[44px] rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={onCancelWorkout}
            aria-label="Discard workout"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Discard workout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body: Exercise Navigation, 3D Preview & Set Steppers */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
        {/* Exercise Horizontal Switcher (1 of N) */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-tech">
            <span>
              EXERCISE {currentExerciseIndex + 1} OF {session.exercises.length}
            </span>
            <span>{Math.round(((currentExerciseIndex + 1) / session.exercises.length) * 100)}% DONE</span>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
            {session.exercises.map((item, idx) => {
              const isCurrent = idx === currentExerciseIndex;
              const allDone = item.sets.every((s) => s.completed);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    hapticTap();
                    setCurrentExerciseIndex(idx);
                    setActiveSetIndex(0);
                  }}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isCurrent
                      ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : allDone
                      ? 'bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/5'
                  }`}
                >
                  <span>{idx + 1}. {item.exercise.name.split(' ').slice(0, 2).join(' ')}</span>
                  {allDone && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Motion Demonstration Card (Full Visibility, No Crop) */}
        <div className="relative rounded-2xl bg-slate-100 dark:bg-[#0e1320] border border-slate-200 dark:border-white/10 p-3.5 shadow-lg">
          <div className="flex items-center space-x-3.5">
            {/* 3D Real Human Exercise Frame */}
            <div
              onClick={() => {
                hapticTap();
                setIsDetailModalOpen(true);
              }}
              className="relative w-24 h-24 rounded-2xl overflow-hidden bg-black/80 border border-amber-500/30 flex-shrink-0 flex items-center justify-center shadow-lg shadow-amber-500/10 cursor-pointer group"
              title="Tap for 3D Form Breakdown & Biomechanics"
            >
              {(() => {
                const animSrc = currentExercise.animationUrl || currentExercise.thumbnailUrl;
                const isVideo = Boolean(
                  animSrc &&
                  (animSrc.endsWith('.mp4') || animSrc.endsWith('.webm'))
                );

                if (isVideo) {
                  return (
                    <video
                      src={animSrc}
                      poster={currentExercise.thumbnailUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  );
                }

                if (animSrc) {
                  return (
                    <img
                      src={animSrc}
                      alt={currentExercise.name}
                      className="w-full h-full object-contain filter contrast-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                      onError={(e) => {
                        if (currentExercise.thumbnailUrl && e.currentTarget.src !== currentExercise.thumbnailUrl) {
                          e.currentTarget.src = currentExercise.thumbnailUrl;
                        }
                      }}
                    />
                  );
                }

                return (
                  <Cinematic3DMotionViewer
                    exercise={currentExercise}
                    className="w-full h-full"
                    showControls={false}
                    autoPlay={true}
                  />
                );
              })()}
              <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-tech text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center space-x-0.5 shadow">
                <Sparkles className="w-2.5 h-2.5 fill-amber-400" />
                <span>GIF</span>
              </div>
            </div>

            {/* Title & Muscle Tags */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase font-tech">
                  <span>{currentExercise.category}</span>
                  <span>•</span>
                  <span>{currentExercise.equipment}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setIsDetailModalOpen(true);
                  }}
                  className="flex items-center space-x-1 text-[10px] font-tech font-bold text-amber-600 dark:text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg transition-all"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>3D Form</span>
                </button>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-display mt-0.5 truncate">
                {currentExercise.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Primary: <span className="text-slate-800 dark:text-slate-200">{currentExercise.primaryMuscle}</span>
              </p>
            </div>
          </div>

          {currentExercise.trainerTip && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/5 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-200/90 italic">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{currentExercise.trainerTip}"</span>
            </div>
          )}
        </div>

        {/* 3. GUIDED SETS TABLE (Thumb-friendly mobile steppers) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="font-tech uppercase font-bold text-amber-600 dark:text-amber-400">
              SET LOGGING ({currentActiveExercise.sets.filter((s) => s.completed).length} / {currentActiveExercise.sets.length} COMPLETE)
            </span>
            <button
              onClick={handleAddSet}
              className="min-h-[44px] px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1.5 text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Set</span>
            </button>
          </div>

          {currentActiveExercise.sets.map((set, idx) => {
            const isSetCompleted = set.completed;
            const isFocused = idx === activeSetIndex;

            return (
              <div
                key={set.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isSetCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isFocused
                    ? 'bg-slate-100 dark:bg-[#121827] border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-white dark:bg-[#0c101a] border-slate-200/80 dark:border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Set Badge */}
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-tech font-black text-xs ${
                        isSetCompleted
                          ? 'bg-emerald-500 text-black'
                          : isFocused
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {set.setNumber}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Set {set.setNumber}
                    </span>
                  </div>

                  {/* Complete / Checkmark Button (Min 48dp touch target) */}
                  <button
                    onClick={() => handleCompleteCurrentSet(idx)}
                    className={`min-h-[48px] px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ${
                      isSetCompleted
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-amber-500/20 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-black border border-amber-500/40'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isSetCompleted ? 'Completed' : 'Log Set & Rest'}</span>
                  </button>
                </div>

                {/* Steppers for Weight (KG) and Reps */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/80 dark:border-white/5">
                  {/* Weight Stepper */}
                  <div className="bg-slate-100/80 dark:bg-slate-900/80 rounded-xl p-2 flex items-center justify-between border border-slate-200/80 dark:border-white/5">
                    <button
                      onClick={() => handleAdjustWeight(idx, -2.5)}
                      aria-label="Decrease weight by 2.5 kg"
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center px-1">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-tech block leading-tight">
                        {set.weightKg} kg
                      </span>
                      <span className="text-[10px] uppercase font-tech text-slate-500 dark:text-slate-400">Weight</span>
                    </div>
                    <button
                      onClick={() => handleAdjustWeight(idx, 2.5)}
                      aria-label="Increase weight by 2.5 kg"
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reps Stepper */}
                  <div className="bg-slate-100/80 dark:bg-slate-900/80 rounded-xl p-2 flex items-center justify-between border border-slate-200/80 dark:border-white/5">
                    <button
                      onClick={() => handleAdjustReps(idx, -1)}
                      aria-label="Decrease reps by 1"
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center px-1">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-tech block leading-tight">
                        {set.reps}
                      </span>
                      <span className="text-[10px] uppercase font-tech text-slate-500 dark:text-slate-400">Reps</span>
                    </div>
                    <button
                      onClick={() => handleAdjustReps(idx, 1)}
                      aria-label="Increase reps by 1"
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live 1RM & Barbell Plate Calculator Button */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/80 dark:border-white/5 text-[11px] font-tech">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      Est. 1RM: <strong className="text-amber-600 dark:text-amber-400">{Math.round(set.weightKg * (1 + set.reps / 30) * 10) / 10} kg</strong>
                    </span>
                    <button
                      onClick={() => {
                        hapticTap();
                        setActivePlateCalcSetIdx(idx);
                        setIsPlateCalcOpen(true);
                      }}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                      title="Open Olympic Barbell Plate Calculator"
                    >
                      <Dumbbell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Plates</span>
                    </button>
                  </div>

                  {set.completed && set.reps >= 10 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      <span>+2.5kg Overload Ready</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Guided Navigation & Finish Button */}
      <div className="p-4 bg-white dark:bg-[#0a0d14] border-t border-slate-200 dark:border-white/10 flex items-center space-x-3 flex-shrink-0 pb-safe">
        {/* Previous Exercise */}
        <button
          disabled={currentExerciseIndex === 0}
          onClick={() => {
            hapticTap();
            setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
            setActiveSetIndex(0);
          }}
          aria-label="Previous exercise"
          className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next Exercise or Complete Workout */}
        {currentExerciseIndex < session.exercises.length - 1 ? (
          <button
            onClick={() => {
              hapticTap();
              setCurrentExerciseIndex(currentExerciseIndex + 1);
              setActiveSetIndex(0);
            }}
            className="min-h-[48px] flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
          >
            <span>Next: {session.exercises[currentExerciseIndex + 1].exercise.name.split(' ')[0]}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            disabled={!allExercisesCompleted}
            onClick={() => {
              if (!allExercisesCompleted) return;
              hapticTap();
              setShowCompletionModal(true);
            }}
            className={`min-h-[48px] flex-1 py-3 px-4 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              allExercisesCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/10'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{allExercisesCompleted ? 'Complete Session' : 'Finish All Sets'}</span>
          </button>
        )}
      </div>

      {/* 5. Automatic Rest Timer Modal */}
      <RestTimerModal
        isOpen={isRestTimerOpen}
        initialSeconds={restSeconds}
        onClose={handleRestFinished}
        onFinished={handleRestFinished}
        exerciseName={session.exercises[currentExerciseIndex]?.exercise?.name || 'Workout'}
        nextSetNumber={activeSetIndex + 2}
      />

      {/* 6. Celebration Workout Complete Modal */}
      {showCompletionModal && (
        <WorkoutCompleteModal
          session={session}
          onFinish={handleFinish}
        />
      )}

      {/* 7. Olympic Barbell Plate Calculator Modal */}
      {isPlateCalcOpen && (
        <PlateCalculatorModal
          isOpen={isPlateCalcOpen}
          initialWeightKg={currentActiveExercise.sets[activePlateCalcSetIdx]?.weightKg || 60}
          exerciseName={currentExercise.name}
          onClose={() => setIsPlateCalcOpen(false)}
          onSelectWeight={(newWeight) => {
            const targetSet = currentActiveExercise.sets[activePlateCalcSetIdx];
            if (targetSet) {
              handleAdjustWeight(activePlateCalcSetIdx, newWeight - targetSet.weightKg);
            }
            setIsPlateCalcOpen(false);
          }}
        />
      )}

      {/* 8. 3D Biomechanics & Exercise Form Detail Modal */}
      {isDetailModalOpen && (
        <ExerciseDetailModal
          exercise={currentExercise}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};
