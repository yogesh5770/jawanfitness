import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Weight, Flame, CheckCircle, Share2 } from 'lucide-react';
import { WorkoutSession } from '../../types';
import { hapticTap } from '../../utils/audioHaptics';

interface WorkoutCompleteModalProps {
  session: WorkoutSession | null;
  onFinish: (feeling: string, notes: string) => void;
}

export const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  session,
  onFinish
}) => {
  const [feeling, setFeeling] = useState<string>('🔥 Crushed it');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (session) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#ffffff']
        });
      } catch {
        // Fallback
      }
    }
  }, [session]);

  if (!session) return null;

  const minutes = Math.floor(session.durationSeconds / 60);
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
  const estimatedCalories = Math.round(minutes * 7.5);

  const feelings = ['🔥 Crushed it', '💪 Good', '⚡ Tough', '😴 Exhausted'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#0c101a] border border-amber-500/40 rounded-3xl p-6 text-center shadow-[0_20px_60px_rgba(245,158,11,0.2)] max-h-[92vh] overflow-y-auto">
        {/* Trophy Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>

        <span className="text-[11px] font-tech uppercase tracking-widest text-amber-400 font-bold">
          CADET PROTOCOL COMPLETE
        </span>
        <h2 className="text-2xl font-black text-white font-display mt-0.5">
          Workout Finished! 🎉
        </h2>
        <p className="text-xs text-slate-400 mt-1">{session.routineName}</p>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col items-center">
            <Clock className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-lg font-black text-white font-tech">{minutes} min</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Duration</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col items-center">
            <Weight className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-lg font-black text-white font-tech">{session.totalVolumeKg.toLocaleString()} kg</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Tonnage</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col items-center">
            <CheckCircle className="w-4 h-4 text-sky-400 mb-1" />
            <span className="text-lg font-black text-white font-tech">{totalSets}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Sets Completed</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col items-center">
            <Flame className="w-4 h-4 text-orange-400 mb-1" />
            <span className="text-lg font-black text-white font-tech">~{estimatedCalories}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Est. Calories</span>
          </div>
        </div>

        {/* Feeling Selector */}
        <div className="text-left mb-4">
          <label className="text-xs font-bold text-slate-300 block mb-2 font-display">
            How did this session feel?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {feelings.map((f) => (
              <button
                key={f}
                onClick={() => {
                  hapticTap();
                  setFeeling(f);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  feeling === f
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Workout Notes */}
        <div className="text-left mb-5">
          <label className="text-xs font-bold text-slate-300 block mb-1.5 font-display">
            Training Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Felt strong on incline press, shoulder felt smooth..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              hapticTap();
              onFinish(feeling, notes);
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm rounded-xl font-display uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all"
          >
            Save Workout & Update Streak
          </button>

          <button
            onClick={() => {
              hapticTap();
              if (navigator.share) {
                navigator.share({
                  title: 'Jawan Fitness Workout Complete!',
                  text: `Crushed ${session.routineName}! Total volume: ${session.totalVolumeKg}kg in ${minutes} minutes. 🏋️🔥`
                }).catch(() => {});
              } else {
                alert(`Workout summary copied to clipboard! 🏋️ ${session.routineName} - ${session.totalVolumeKg}kg lifted.`);
              }
            }}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Share Achievement Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};
