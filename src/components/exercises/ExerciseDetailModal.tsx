import React, { useState } from 'react';
import { Exercise } from '../../types';
import { X, Play, AlertTriangle, Lightbulb, Dumbbell, Flame, CheckCircle2 } from 'lucide-react';
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
  const [isPlayingTutorial, setIsPlayingTutorial] = useState(false);
  const [isHindi, setIsHindi] = useState(false);

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c101a] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Floating Close Button */}
        <button
          onClick={() => {
            hapticTap();
            onClose();
          }}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/70 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-black transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Biomechanics & 3D Motion Visualizer */}
        <div className="flex-shrink-0">
          <BiomechanicsVisualizer exercise={exercise} />
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
          {/* Title & Muscles */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
              <span className="uppercase tracking-wider font-tech">{exercise.category}</span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-slate-300">
                <Dumbbell className="w-3 h-3 text-amber-500" />
                <span>{exercise.equipment}</span>
              </span>
              <span>•</span>
              <span className="text-slate-400">{exercise.difficulty}</span>
            </div>
            <h2 className="text-xl font-black text-white font-display leading-snug">
              {exercise.name}
            </h2>
          </div>

          {/* Muscle Activation Pills */}
          <div className="bg-[#131926] p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Primary Target:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {exercise.primaryMuscle}
              </span>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Secondary:</span>
                <span className="text-slate-300 font-medium">
                  {exercise.secondaryMuscles.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* How To Perform (Step-by-Step with Language Toggle) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase font-tech tracking-widest text-slate-400 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>How To Perform</span>
              </h3>
              {exercise.instructionsHi && exercise.instructionsHi.length > 0 && (
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-white/10 text-[10px] font-tech font-bold">
                  <button
                    onClick={() => setIsHindi(false)}
                    className={`px-2 py-0.5 rounded ${!isHindi ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setIsHindi(true)}
                    className={`px-2 py-0.5 rounded ${isHindi ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
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
                <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-200 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-white/10 text-amber-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Breathing Cues (Inhale / Exhale) */}
          <div className="bg-[#101726] border border-cyan-500/20 rounded-xl p-3">
            <h4 className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5 mb-2">
              <span>🫁 Breathing Rhythm</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-tech text-slate-400 block">Lowering / Eccentric</span>
                <span className="font-medium text-cyan-200">
                  {exercise.breathing?.eccentric || 'Inhale slowly and deeply'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-tech text-slate-400 block">Exertion / Concentric</span>
                <span className="font-medium text-cyan-200">
                  {exercise.breathing?.concentric || 'Exhale powerfully at peak'}
                </span>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          {exercise.commonMistakes.length > 0 && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-red-400 flex items-center space-x-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Common Mistakes to Avoid</span>
              </h4>
              <ul className="space-y-1.5">
                {exercise.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="text-xs text-red-200/90 flex items-start space-x-2">
                    <span className="text-red-400">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trainer's Pro Tip */}
          {exercise.trainerTip && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Coach's Form Cue</span>
              </h4>
              <p className="text-xs text-amber-200/90 italic leading-relaxed">
                "{exercise.trainerTip}"
              </p>
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Button */}
        {onStartExercise && (
          <div className="p-4 bg-[#0a0d14] border-t border-white/10 flex-shrink-0 pb-safe">
            <button
              onClick={() => {
                hapticTap();
                onStartExercise(exercise);
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm rounded-xl font-display uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all"
            >
              <Flame className="w-4 h-4 fill-black" />
              <span>Start This Exercise</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
