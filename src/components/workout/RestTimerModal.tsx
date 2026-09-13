import React, { useEffect, useState } from 'react';
import { Play, Pause, FastForward, Plus, X, Timer } from 'lucide-react';
import { playBeep, playRestFinishedSound, hapticTap } from '../../utils/audioHaptics';

interface RestTimerModalProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  onFinished?: () => void;
  exerciseName?: string;
  nextSetNumber?: number;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds = 90,
  isOpen,
  onClose,
  onFinished,
  exerciseName = 'Bench Press',
  nextSetNumber = 2
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(initialSeconds);
      setSecondsRemaining(initialSeconds);
      setIsPaused(false);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen || isPaused) return;

    if (secondsRemaining <= 0) {
      playRestFinishedSound();
      if (onFinished) onFinished();
      onClose();
      return;
    }

    // Play warning beeps at 3, 2, 1
    if (secondsRemaining <= 3 && secondsRemaining > 0) {
      playBeep(440, 0.1);
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, secondsRemaining, onClose, onFinished]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0e121d] border border-amber-500/40 rounded-3xl p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        {/* Dismiss Button */}
        <button
          onClick={() => {
            hapticTap();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center space-x-1.5 text-xs font-tech text-amber-400 font-bold uppercase tracking-wider mb-2">
          <Timer className="w-4 h-4 text-amber-500 animate-spin" />
          <span>Rest Interval</span>
        </div>

        <p className="text-xs text-slate-400">
          Up next: <span className="text-white font-semibold">{exerciseName}</span> (Set {nextSetNumber})
        </p>

        {/* Circular Countdown Progress Dial */}
        <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="88"
              cy="88"
              r="76"
              stroke="#1e2433"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active progress ring */}
            <circle
              cx="88"
              cy="88"
              r="76"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 76}
              strokeDashoffset={(2 * Math.PI * 76) * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white font-tech tracking-wider">
              {formattedTime}
            </span>
            <span className="text-[11px] text-amber-400 font-semibold tracking-wider uppercase mt-1">
              Seconds
            </span>
          </div>
        </div>

        {/* Quick Interval Presets */}
        <div className="flex items-center justify-center space-x-1.5 mb-3">
          {[45, 60, 90, 120, 180].map((secs) => (
            <button
              key={secs}
              onClick={() => {
                hapticTap();
                setTotalSeconds(secs);
                setSecondsRemaining(secs);
                setIsPaused(false);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-tech font-bold transition-all ${
                secondsRemaining === secs
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>

        {/* Control Buttons: +30s, Pause/Resume, Skip */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => {
              hapticTap();
              setSecondsRemaining((prev) => prev + 30);
              setTotalSeconds((prev) => prev + 30);
            }}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95 transition-all text-xs font-semibold"
          >
            <Plus className="w-4 h-4 text-amber-400 mb-0.5" />
            <span>+30s</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setIsPaused(!isPaused);
            }}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95 transition-all text-xs font-semibold"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-emerald-400 mb-0.5" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-amber-400 mb-0.5" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 active:scale-95 transition-all text-xs font-bold"
          >
            <FastForward className="w-4 h-4 text-amber-400 mb-0.5" />
            <span>Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
