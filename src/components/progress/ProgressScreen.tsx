import React, { useState } from 'react';
import { WeightRecord } from '../../types';
import { TrendingDown, Plus, Check } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface ProgressScreenProps {
  weightHistory: WeightRecord[];
  startingWeightKg: number;
  goalWeightKg: number;
  currentWeightKg: number;
  onLogWeight: (weight: number) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  weightHistory,
  startingWeightKg,
  goalWeightKg,
  currentWeightKg,
  onLogWeight
}) => {
  const [newWeightInput, setNewWeightInput] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  // Current and goal metrics
  const startingWeight = startingWeightKg;
  const goalWeight = goalWeightKg;
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weightKg : currentWeightKg;

  const totalToLose = startingWeight - goalWeight;
  const lostSoFar = startingWeight - currentWeight;
  const progressPercent = totalToLose > 0 
    ? Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100))) 
    : 100;

  const handleSaveWeight = () => {
    const val = parseFloat(newWeightInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      hapticTap();
      onLogWeight(val);
      setNewWeightInput('');
      setIsLoggingWeight(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 text-left">
      {/* Goal Progress Card */}
      <div className="rounded-3xl bg-[#0c101a] border border-amber-500/30 p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 font-bold">
              WEIGHT TRANSFORMATION
            </span>
            <h3 className="text-base font-black text-white font-display">Target: {goalWeight.toFixed(1)} kg</h3>
          </div>
          <button
            onClick={() => setIsLoggingWeight(!isLoggingWeight)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-display shadow active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log Weight</span>
          </button>
        </div>

        {/* Input Field if open */}
        {isLoggingWeight && (
          <div className="my-3 p-3 bg-slate-900/80 rounded-2xl border border-white/10 flex items-center space-x-2">
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 102.8"
              value={newWeightInput}
              onChange={(e) => setNewWeightInput(e.target.value)}
              className="flex-1 bg-slate-800 px-3 py-2 rounded-xl text-white text-xs font-tech font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleSaveWeight}
              className="px-3 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save</span>
            </button>
          </div>
        )}

        {/* Big Weight Numbers */}
        <div className="flex items-baseline space-x-2 my-2">
          <span className="text-3xl font-black text-white font-tech">{currentWeight.toFixed(1)}</span>
          <span className="text-xs text-slate-400 font-tech">kg</span>
          <div className="flex items-center space-x-1 text-emerald-400 text-xs font-tech ml-2 font-bold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-{(startingWeight - currentWeight).toFixed(1)} kg total</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden my-3 p-0.5 border border-white/5">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-tech text-slate-400">
          <span>Start: {startingWeight}kg</span>
          <span className="text-amber-400 font-bold">{progressPercent}% Goal Achieved</span>
          <span>Target: {goalWeight}kg</span>
        </div>
      </div>

      {/* Logged Weight History Timeline */}
      {weightHistory.length > 0 && (
        <div className="rounded-3xl bg-[#0c101a] border border-white/10 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-display uppercase tracking-wider">
              Weight Logs ({weightHistory.length})
            </span>
            <span className="text-[10px] text-slate-400 font-tech">Latest entries</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {weightHistory.slice().reverse().map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-white/5 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-tech text-slate-300">{rec.date}</span>
                </div>
                <span className="font-tech font-black text-white text-sm">
                  {rec.weightKg.toFixed(1)} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
