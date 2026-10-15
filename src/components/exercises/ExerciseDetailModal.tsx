import React, { useState } from 'react';
import { Exercise } from '../../types';
import { X, AlertTriangle, Lightbulb, Dumbbell, Flame, CheckCircle2 } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

import { BiomechanicsVisualizer } from './BiomechanicsVisualizer';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onStartExercise?: (exercise: Exercise) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  onStartExercise
}) => {
  const [isHindi, setIsHindi] = useState(false);

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl h-[92dvh] max-h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl overscroll-contain">
        {/* Dedicated Sticky Top Header with Prominent Cross (✕) Button */}
        <div className="px-4 py-3 bg-white/95 dark:bg-[#0c101a]/95 backdrop-blur border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-tech uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                Exercise Technique Guide
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white font-display truncate">
                {exercise.name}
              </h3>
            </div>
          </div>

          {/* Prominent Accessible Cross (✕) Close Button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            aria-label="Close Exercise Guide"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-white/5 active:scale-95 ml-2 flex-shrink-0"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Biomechanics & 3D Motion Visualizer */}
        <div className="flex-shrink-0">
          <BiomechanicsVisualizer exercise={exercise} />
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
          {/* Title & Muscles */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              <span className="uppercase tracking-wider font-tech">{exercise.category}</span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                <Dumbbell className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                <span>{exercise.equipment}</span>
              </span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400">{exercise.difficulty}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white font-display leading-snug">
              {exercise.name}
            </h2>
          </div>

          {/* Muscle Activation Pills */}
          <div className="bg-white dark:bg-[#131926] p-3 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Primary Target:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                {exercise.primaryMuscle}
              </span>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Secondary:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {exercise.secondaryMuscles.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* How To Perform (Step-by-Step with Language Toggle) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase font-tech tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>How To Perform</span>
              </h3>
              {exercise.instructionsHi && exercise.instructionsHi.length > 0 && (
                <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-tech font-bold">
                  <button
                    onClick={() => setIsHindi(false)}
                    className={`px-2 py-0.5 rounded ${!isHindi ? 'bg-amber-500 text-black' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setIsHindi(true)}
                    className={`px-2 py-0.5 rounded ${isHindi ? 'bg-amber-500 text-black' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    हिंदी
                  </button>
                </div>
              )}
            </div>

            <ol className="space-y-2">
              {((isHindi && exercise.instructionsHi && exercise.instructionsHi.length > 0)
                ? exercise.instructionsHi
                : exercise.instructions
              ).map((step, idx) => (
                <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Breathing Cues (Inhale / Exhale) */}
          <div className="bg-white dark:bg-[#101726] border border-cyan-500/20 rounded-xl p-3">
            <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center space-x-1.5 mb-2">
              <span>🫁 Breathing Rhythm</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-100/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] uppercase font-tech text-slate-500 dark:text-slate-400 block">Lowering / Eccentric</span>
                <span className="font-medium text-cyan-800 dark:text-cyan-200">
                  {exercise.breathing?.eccentric || 'Inhale slowly and deeply'}
                </span>
              </div>
              <div className="bg-slate-100/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] uppercase font-tech text-slate-500 dark:text-slate-400 block">Exertion / Concentric</span>
                <span className="font-medium text-cyan-800 dark:text-cyan-200">
                  {exercise.breathing?.concentric || 'Exhale powerfully at peak'}
                </span>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          {exercise.commonMistakes.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center space-x-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Common Mistakes to Avoid</span>
              </h4>
              <ul className="space-y-1.5">
                {exercise.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="text-xs text-rose-950 dark:text-rose-200/90 flex items-start space-x-2">
                    <span className="text-rose-600 dark:text-rose-400">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trainer's Pro Tip */}
          {exercise.trainerTip && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Coach's Form Cue</span>
              </h4>
              <p className="text-xs text-amber-950 dark:text-amber-200/90 italic leading-relaxed">
                "{exercise.trainerTip}"
              </p>
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-3.5 bg-white dark:bg-[#0a0d14] border-t border-slate-200 dark:border-white/10 flex-shrink-0 pb-safe flex items-center gap-2">
          {onStartExercise && (
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onStartExercise(exercise);
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl font-display uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Start This Exercise</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-tech font-bold text-xs rounded-xl border border-slate-200 dark:border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
