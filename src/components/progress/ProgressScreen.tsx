import React, { useState } from 'react';
import { WeightRecord } from '../../types';
import { TrendingDown, Plus, Ruler, Sparkles, Camera, Check } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface ProgressScreenProps {
  weightHistory: WeightRecord[];
  onLogWeight: (weight: number) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  weightHistory,
  onLogWeight
}) => {
  const [newWeightInput, setNewWeightInput] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%

  // Current and goal metrics
  const startingWeight = 108.0;
  const goalWeight = 80.0;
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weightKg : 103.6;

  const totalToLose = startingWeight - goalWeight;
  const lostSoFar = startingWeight - currentWeight;
  const progressPercent = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));

  const handleSaveWeight = () => {
    const val = parseFloat(newWeightInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      hapticTap();
      onLogWeight(val);
      setNewWeightInput('');
      setIsLoggingWeight(false);
    }
  };

  // Generate SVG points for weight chart
  const weights = weightHistory.map((w) => w.weightKg);
  const minW = Math.min(...weights, 75);
  const maxW = Math.max(...weights, 110);
  const chartHeight = 100;
  const chartWidth = 300;

  const points = weightHistory.map((w, index) => {
    const x = (index / (weightHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((w.weightKg - minW) / (maxW - minW || 1)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-4 pb-28 text-left">
      {/* Goal Progress Card */}
      <div className="rounded-3xl bg-[#0c101a] border border-amber-500/30 p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 font-bold">
              WEIGHT TRANSFORMATION
            </span>
            <h3 className="text-base font-black text-white font-display">Target: 80.0 kg</h3>
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

      {/* SVG Weight History Line Chart */}
      <div className="rounded-3xl bg-[#0c101a] border border-white/10 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-slate-400 font-bold">
              ANALYTICS
            </span>
            <h4 className="text-sm font-black text-white font-display">Weight Trend History</h4>
          </div>
          <span className="text-xs text-emerald-400 font-tech font-bold">Consistent Deficit</span>
        </div>

        <div className="w-full h-32 flex items-center justify-center relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            {/* Grid line */}
            <line x1="0" y1="25" x2={chartWidth} y2="25" stroke="#1e2433" strokeDasharray="3,3" />
            <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="#1e2433" strokeDasharray="3,3" />
            <line x1="0" y1="75" x2={chartWidth} y2="75" stroke="#1e2433" strokeDasharray="3,3" />

            {/* Path line */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Glowing dots */}
            {weightHistory.map((w, idx) => {
              const x = (idx / (weightHistory.length - 1 || 1)) * chartWidth;
              const y = chartHeight - ((w.weightKg - minW) / (maxW - minW || 1)) * chartHeight;
              return (
                <circle
                  key={w.id}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#0c101a"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between text-[10px] font-tech text-slate-500 mt-2">
          <span>{weightHistory[0]?.date || 'Week 1'}</span>
          <span>{weightHistory[Math.floor(weightHistory.length / 2)]?.date || 'Week 4'}</span>
          <span>{weightHistory[weightHistory.length - 1]?.date || 'Today'}</span>
        </div>
      </div>

      {/* Body Measurements */}
      <div className="rounded-3xl bg-[#0c101a] border border-white/10 p-5 shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-bold text-white font-display mb-3">
          <Ruler className="w-4 h-4 text-amber-400" />
          <span>Body Anthropometry Measurements</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-tech block">Chest</span>
            <span className="text-base font-black text-white font-tech">42.5"</span>
            <span className="text-[10px] text-emerald-400 font-tech block mt-0.5">-1.2" (Lean)</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-tech block">Waist</span>
            <span className="text-base font-black text-white font-tech">36.0"</span>
            <span className="text-[10px] text-emerald-400 font-tech block mt-0.5">-3.5" (Fat loss)</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-tech block">Arms</span>
            <span className="text-base font-black text-white font-tech">16.2"</span>
            <span className="text-[10px] text-amber-400 font-tech block mt-0.5">+0.4" (Hypertrophy)</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-tech block">Body Fat %</span>
            <span className="text-base font-black text-white font-tech">18.4%</span>
            <span className="text-[10px] text-emerald-400 font-tech block mt-0.5">-5.1% dropped</span>
          </div>
        </div>
      </div>

      {/* Interactive Before & After Photo Comparison Slider */}
      <div className="rounded-3xl bg-[#0c101a] border border-white/10 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-black text-white font-display">Physique Comparison</h4>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-tech font-bold">
            SLIDER
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Drag slider horizontally to inspect Day 1 vs Day 90 physique transformation:
        </p>

        {/* Split comparison viewport */}
        <div className="relative w-full h-72 rounded-2xl overflow-hidden select-none border border-white/15 shadow-inner">
          {/* After Photo (Base layer) */}
          <img
            src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80"
            alt="After"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <span className="absolute top-3 right-3 bg-black/80 backdrop-blur px-2.5 py-1 rounded-xl text-xs font-black text-emerald-400 font-tech border border-emerald-500/30">
            DAY 90 (84 kg)
          </span>

          {/* Before Photo (Clipped overlay) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
              alt="Before"
              className="absolute inset-0 w-[340px] sm:w-[500px] h-full object-cover max-w-none pointer-events-none"
            />
            <span className="absolute top-3 left-3 bg-black/80 backdrop-blur px-2.5 py-1 rounded-xl text-xs font-black text-amber-400 font-tech border border-amber-500/30">
              DAY 1 (108 kg)
            </span>
          </div>

          {/* Vertical Divider line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-black text-black">↔</span>
            </div>
          </div>

          {/* Transparent Range Input Slider on top */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />
        </div>
      </div>
    </div>
  );
};
