import React, { useState } from 'react';
import { X, Dumbbell, Sparkles } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeightKg?: number;
  exerciseName?: string;
  onSelectWeight?: (weightKg: number) => void;
}

interface PlateSpec {
  weight: number;
  color: string;
  borderColor: string;
  textColor: string;
  height: string;
}

const PLATES: PlateSpec[] = [
  { weight: 25, color: '#dc2626', borderColor: '#ef4444', textColor: '#ffffff', height: 'h-24' },   // Red
  { weight: 20, color: '#2563eb', borderColor: '#3b82f6', textColor: '#ffffff', height: 'h-22' },   // Blue
  { weight: 15, color: '#eab308', borderColor: '#facc15', textColor: '#000000', height: 'h-20' },   // Yellow
  { weight: 10, color: '#16a34a', borderColor: '#22c55e', textColor: '#ffffff', height: 'h-18' },   // Green
  { weight: 5, color: '#f8fafc', borderColor: '#e2e8f0', textColor: '#000000', height: 'h-14' },    // White
  { weight: 2.5, color: '#1e293b', borderColor: '#475569', textColor: '#ffffff', height: 'h-11' },  // Black
  { weight: 1.25, color: '#94a3b8', borderColor: '#cbd5e1', textColor: '#000000', height: 'h-9' }   // Chrome
];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeightKg = 60,
  exerciseName = 'Barbell Bench Press',
  onSelectWeight
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeightKg);
  const [barWeight, setBarWeight] = useState<number>(20); // 20kg standard Olympic bar

  if (!isOpen) return null;

  // Calculate plates needed on ONE side: (targetWeight - barWeight) / 2
  const weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);

  const calculatePlates = (neededWeight: number) => {
    let remaining = neededWeight;
    const result: { plate: PlateSpec; count: number }[] = [];

    PLATES.forEach((plate) => {
      const count = Math.floor(remaining / plate.weight);
      if (count > 0) {
        result.push({ plate, count });
        remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
      }
    });

    return { plates: result, remainingRemainder: remaining };
  };

  const { plates, remainingRemainder } = calculatePlates(weightPerSide);

  const handleAdjustWeight = (delta: number) => {
    hapticTap();
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0d111c] border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-left shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm sm:text-base text-white uppercase tracking-wide">
                Olympic Plate Calculator
              </h3>
              <p className="text-[10px] text-slate-400 font-tech">{exerciseName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Weight Selector */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 text-center space-y-2">
          <span className="text-[10px] font-tech uppercase text-slate-400 font-bold block">
            Target Total Weight
          </span>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleAdjustWeight(-5)}
              className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold text-sm active:scale-95"
            >
              -5
            </button>
            <button
              onClick={() => handleAdjustWeight(-2.5)}
              className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs active:scale-95"
            >
              -2.5
            </button>

            <div className="text-3xl sm:text-4xl font-black text-white font-display">
              {targetWeight} <span className="text-base text-amber-400 font-tech">kg</span>
            </div>

            <button
              onClick={() => handleAdjustWeight(2.5)}
              className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs active:scale-95"
            >
              +2.5
            </button>
            <button
              onClick={() => handleAdjustWeight(5)}
              className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold text-sm active:scale-95"
            >
              +5
            </button>
          </div>

          {/* Bar Selector */}
          <div className="flex items-center justify-center space-x-2 pt-2 text-[11px] font-tech font-bold text-slate-400">
            <span>Bar:</span>
            {[
              { label: '20kg Olympic Men', w: 20 },
              { label: '15kg Women/Tech', w: 15 },
              { label: '10kg Junior', w: 10 }
            ].map((bar) => (
              <button
                key={bar.w}
                onClick={() => {
                  hapticTap();
                  setBarWeight(bar.w);
                  setTargetWeight((prev) => Math.max(bar.w, prev));
                }}
                className={`px-2 py-0.5 rounded-md border transition-all ${
                  barWeight === bar.w
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-black/30 border-white/5 text-slate-500'
                }`}
              >
                {bar.w}kg
              </button>
            ))}
          </div>
        </div>

        {/* Visual Barbell Graphic (Loaded Side View) */}
        <div className="bg-[#080b13] p-4 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-tech text-slate-400 uppercase text-[10px] font-bold">
              Load Each Side ({weightPerSide} kg per sleeve)
            </span>
            {remainingRemainder > 0 && (
              <span className="text-[10px] text-amber-400 font-tech">
                ±{remainingRemainder} kg unaccounted
              </span>
            )}
          </div>

          {/* SVG/CSS Barbell representation */}
          <div className="h-28 flex items-center justify-center relative overflow-hidden bg-black/40 rounded-xl p-2 border border-white/5">
            {/* Bar sleeve */}
            <div className="absolute w-full h-3 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-700 rounded-full shadow" />

            {/* Collar stopper */}
            <div className="z-10 w-4 h-16 bg-slate-800 border border-slate-600 rounded-sm shadow-md" />

            {/* Render Plates Side Stack */}
            <div className="z-10 flex items-center space-x-1 pl-2">
              {plates.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">Empty Bar ({barWeight} kg)</span>
              ) : (
                plates.flatMap(({ plate, count }, pIdx) =>
                  Array.from({ length: count }).map((_, cIdx) => (
                    <div
                      key={`${pIdx}-${cIdx}`}
                      style={{ backgroundColor: plate.color, borderColor: plate.borderColor }}
                      className={`w-4 ${plate.height} rounded border shadow-lg flex items-center justify-center text-[9px] font-black font-tech transform transition-all hover:scale-105`}
                      title={`${plate.weight} kg`}
                    >
                      <span
                        style={{ color: plate.textColor }}
                        className="-rotate-90 whitespace-nowrap text-[8px]"
                      >
                        {plate.weight}
                      </span>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Outer Collar Lock */}
            {plates.length > 0 && (
              <div className="z-10 w-3 h-10 bg-amber-500 border border-amber-300 rounded-sm ml-1.5 shadow" title="Barbell Collar Lock" />
            )}
          </div>
        </div>

        {/* Plate Count Breakdown List */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-tech uppercase text-slate-400 font-bold block">
            Plates Required Per Sleeve (Load 2 Sleeves)
          </span>

          {plates.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No plates needed. Just the {barWeight}kg barbell.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {plates.map(({ plate, count }) => (
                <div
                  key={plate.weight}
                  className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center space-x-2 text-xs"
                >
                  <div
                    style={{ backgroundColor: plate.color }}
                    className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                  />
                  <div className="font-tech text-white">
                    <span className="font-bold">{count}x</span> {plate.weight} kg
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply Weight Button */}
        {onSelectWeight && (
          <div className="pt-1">
            <button
              onClick={() => {
                hapticTap();
                onSelectWeight(targetWeight);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider transition-all"
            >
              Apply {targetWeight} kg to Workout Set
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
