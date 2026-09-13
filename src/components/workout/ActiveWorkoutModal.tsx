import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutSession, ActiveWorkoutExercise, WorkoutSet } from '../../types';
import { RestTimerModal } from './RestTimerModal';
import { WorkoutCompleteModal } from './WorkoutCompleteModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { CalorieCalculator } from '../../utils/calorieCalculator';
import {
  X,
  Check,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  Flame,
  Clock,
  Dumbbell,
  Play,
  Sparkles
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active set index tracking for sequential execution
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [activePlateCalcSetIdx, setActivePlateCalcSetIdx] = useState(0);

  // Timer counter
  useEffect(() => {
    if (!session) return;
    const initialElapsed = Math.floor((Date.now() - session.startTime) / 1000);
    setElapsedSeconds(initialElapsed > 0 ? initialElapsed : 0);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.startTime]);

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
    <div className="fixed inset-0 z-50 bg-[#07090e] text-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
      {/* 1. Header Bar with Elapsed Time, Volume, and LIVE Calorie Counter */}
      <div className="bg-[#0c101a] border-b border-white/10 px-4 py-3 flex items-center justify-between flex-shrink-0 pt-safe">
        <div>
          <span className="text-[10px] font-tech uppercase tracking-wider text-amber-500 font-bold block">
            LIVE WORKOUT
          </span>
          <h2 className="text-sm sm:text-base font-black text-white font-display truncate max-w-[200px] sm:max-w-xs">
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
              className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white flex items-center space-x-1 text-xs active:scale-95 transition-all"
              title="Minimize workout session"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span className="font-tech text-[11px] text-slate-300">Minimize</span>
            </button>
          )}

          {/* Real MET Biometric Calories Burned */}
          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400 font-tech">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{caloriesBurnedLive} kcal</span>
          </div>

          {/* Stopwatch */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-xl text-xs font-mono text-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={onCancelWorkout}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
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
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-tech">
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
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-white/5'
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
        <div className="relative rounded-2xl bg-[#0e1320] border border-white/10 p-3.5 shadow-lg">
          <div className="flex items-center space-x-3.5">
            {/* 3D Loop Frame */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 flex items-center justify-center">
              {currentExercise.animationUrl?.endsWith('.gif') ? (
                <img
                  src={currentExercise.animationUrl}
                  alt={currentExercise.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={currentExercise.animationUrl}
                  poster={currentExercise.thumbnailUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] font-tech text-amber-400">
                3D
              </div>
            </div>

            {/* Title & Muscle Tags */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-bold uppercase font-tech">
                <span>{currentExercise.category}</span>
                <span>•</span>
                <span>{currentExercise.equipment}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white font-display mt-0.5 truncate">
                {currentExercise.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Primary: <span className="text-slate-200">{currentExercise.primaryMuscle}</span>
              </p>
            </div>
          </div>

          {currentExercise.trainerTip && (
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-start space-x-2 text-xs text-amber-200/90 italic">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{currentExercise.trainerTip}"</span>
            </div>
          )}
        </div>

        {/* 3. GUIDED SETS TABLE (Thumb-friendly mobile steppers) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-tech uppercase font-bold text-amber-400">
              SET LOGGING ({currentActiveExercise.sets.filter((s) => s.completed).length} / {currentActiveExercise.sets.length} COMPLETE)
            </span>
            <button
              onClick={handleAddSet}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Set</span>
            </button>
          </div>

          {currentActiveExercise.sets.map((set, idx) => {
            const isSetCompleted = set.completed;
            const isFocused = idx === activeSetIndex;

            return (
              <div
                key={set.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSetCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isFocused
                    ? 'bg-[#121827] border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-[#0c101a] border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Set Badge */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-tech font-black text-xs ${
                        isSetCompleted
                          ? 'bg-emerald-500 text-black'
                          : isFocused
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {set.setNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Set {set.setNumber}
                    </span>
                  </div>

                  {/* Complete / Checkmark Button (Min 44px touch target) */}
                  <button
                    onClick={() => handleCompleteCurrentSet(idx)}
                    className={`min-h-[42px] px-4 rounded-xl flex items-center justify-center space-x-1.5 font-bold text-xs active:scale-95 transition-all ${
                      isSetCompleted
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isSetCompleted ? 'Completed' : 'Log Set & Rest'}</span>
                  </button>
                </div>

                {/* Steppers for Weight (KG) and Reps */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5">
                  {/* Weight Stepper */}
                  <div className="bg-slate-900/80 rounded-xl p-2 flex items-center justify-between border border-white/5">
                    <button
                      onClick={() => handleAdjustWeight(idx, -2.5)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-center">
                      <span className="text-sm font-black text-white font-tech block">
                        {set.weightKg} kg
                      </span>
                      <span className="text-[9px] uppercase font-tech text-slate-400">Weight</span>
                    </div>
                    <button
                      onClick={() => handleAdjustWeight(idx, 2.5)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reps Stepper */}
                  <div className="bg-slate-900/80 rounded-xl p-2 flex items-center justify-between border border-white/5">
                    <button
                      onClick={() => handleAdjustReps(idx, -1)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-center">
                      <span className="text-sm font-black text-white font-tech block">
                        {set.reps}
                      </span>
                      <span className="text-[9px] uppercase font-tech text-slate-400">Reps</span>
                    </div>
                    <button
                      onClick={() => handleAdjustReps(idx, 1)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live 1RM & Barbell Plate Calculator Button */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] font-tech">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">
                      Est. 1RM: <strong className="text-amber-400">{Math.round(set.weightKg * (1 + set.reps / 30) * 10) / 10} kg</strong>
                    </span>
                    <button
                      onClick={() => {
                        hapticTap();
                        setActivePlateCalcSetIdx(idx);
                        setIsPlateCalcOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-amber-500/30 flex items-center space-x-1 active:scale-95"
                      title="Open Olympic Barbell Plate Calculator"
                    >
                      <Dumbbell className="w-3 h-3 text-amber-400" />
                      <span>Plates</span>
                    </button>
                  </div>

                  {set.completed && set.reps >= 10 && (
                    <span className="text-emerald-400 font-bold flex items-center space-x-1 animate-pulse">
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
      <div className="p-4 bg-[#0a0d14] border-t border-white/10 flex items-center space-x-3 flex-shrink-0 pb-safe">
        {/* Previous Exercise */}
        <button
          disabled={currentExerciseIndex === 0}
          onClick={() => {
            hapticTap();
            setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
            setActiveSetIndex(0);
          }}
          className="p-3.5 rounded-xl bg-slate-800 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
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
            className="flex-1 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-95 transition-all"
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
            className={`flex-1 py-3.5 px-4 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              allExercisesCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10'
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
    </div>
  );
};
