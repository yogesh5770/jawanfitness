import React, { useState } from 'react';
import { WeightRecord } from '../../types';
import { 
  TrendingDown, 
  TrendingUp,
  Plus, 
  Check, 
  Trophy, 
  Calendar, 
  Ruler, 
  Sparkles, 
  Flame, 
  Dumbbell, 
  Droplets,
  Award,
  ChevronRight
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { calculateWeightProgress } from '../../utils/weightProgress';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'strength' | 'consistency'>('overview');
  const [newWeightInput, setNewWeightInput] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  // Measurements State (Stored locally for client demonstration)
  const [measurements, setMeasurements] = useState<{ waistCm: number; chestCm: number; armCm: number; thighCm: number }>(() => {
    const saved = localStorage.getItem('jawan_client_measurements_v1');
    return saved ? JSON.parse(saved) : { waistCm: 96, chestCm: 104, armCm: 37, thighCm: 61 };
  });
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [measForm, setMeasForm] = useState(measurements);

  // Strength Personal Records (PRs)
  const personalRecords = [
    { exercise: 'Bench Press', prWeightKg: 75, reps: 5, date: 'Sep 12', muscle: 'Chest' },
    { exercise: 'Barbell Back Squat', prWeightKg: 105, reps: 5, date: 'Sep 10', muscle: 'Legs' },
    { exercise: 'Deadlift', prWeightKg: 125, reps: 3, date: 'Sep 14', muscle: 'Back' },
    { exercise: 'Overhead Press', prWeightKg: 52.5, reps: 6, date: 'Sep 08', muscle: 'Shoulders' },
    { exercise: 'Lat Pulldown', prWeightKg: 70, reps: 8, date: 'Sep 15', muscle: 'Back' },
  ];

  // Current and goal metrics
  const startingWeight = startingWeightKg > 0 ? startingWeightKg : 70.0;
  const goalWeight = goalWeightKg > 0 ? goalWeightKg : 70.0;
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weightKg : (currentWeightKg || startingWeight);

  const weightProgress = calculateWeightProgress(startingWeight, currentWeight, goalWeight);
  const progressPercent = weightProgress.progressPercent;

  const handleSaveWeight = () => {
    const val = parseFloat(newWeightInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      hapticTap();
      onLogWeight(val);
      setNewWeightInput('');
      setIsLoggingWeight(false);
    }
  };

  const handleSaveMeasurements = () => {
    hapticTap();
    setMeasurements(measForm);
    localStorage.setItem('jawan_client_measurements_v1', JSON.stringify(measForm));
    setIsEditingMeasurements(false);
  };

  return (
    <div className="space-y-4 pb-28 text-left animate-fadeIn max-w-xl mx-auto">
      {/* Segmented Navigation Bar */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-2xl p-1 shadow-sm flex items-center justify-between transition-colors duration-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'measurements', label: 'Measurements' },
          { id: 'strength', label: 'Strength PRs' },
          { id: 'consistency', label: 'Consistency' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              hapticTap();
              setActiveTab(tab.id as any);
            }}
            className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-tech font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW: Transformation Story & Weight Logs */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-amber-500/30 p-5 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 font-bold">
                  TRANSFORMATION STORY
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                  Target: {goalWeight.toFixed(1)} kg
                </h3>
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
              <div className="my-3 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 102.8"
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white text-xs font-tech font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-transparent"
                />
                <button
                  onClick={handleSaveWeight}
                  className="px-3 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl flex items-center space-x-1 shadow"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save</span>
                </button>
              </div>
            )}

            {/* Big Weight Numbers */}
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-tech">
                {currentWeight.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-tech">kg</span>
              <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-tech ml-2 font-bold">
                {weightProgress.isWeightGain ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{weightProgress.displayChangeLabel}</span>
                {weightProgress.remainingKg > 0 && (
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    ({weightProgress.remainingKg.toFixed(1)} kg to go)
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden my-3 p-0.5 border border-slate-200 dark:border-white/5">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-tech text-slate-500">
              <span>Start: {startingWeight} kg</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{progressPercent}% Achieved</span>
              <span>Goal: {goalWeight} kg</span>
            </div>
          </div>

          {/* Logged Weight History Timeline */}
          {weightHistory.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 p-5 shadow-sm dark:shadow-lg space-y-3 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white font-display uppercase tracking-wider">
                  Logged History ({weightHistory.length})
                </span>
                <span className="text-[10px] text-slate-500 font-tech">Timeline</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {[...weightHistory].reverse().map((record) => (
                  <div key={record.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-tech text-slate-500">{record.date}</span>
                    <span className="font-tech font-black text-slate-900 dark:text-white">{record.weightKg.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MEASUREMENTS: Body Tape Circumferences */}
      {activeTab === 'measurements' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-md transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 font-bold block">
                  CIRCUMFERENCE TRACKER
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                  Body Measurements
                </h3>
              </div>
              <button
                onClick={() => setIsEditingMeasurements(!isEditingMeasurements)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-tech font-bold transition-all"
              >
                {isEditingMeasurements ? 'Cancel' : 'Update Tape'}
              </button>
            </div>

            {/* Editing Form if open */}
            {isEditingMeasurements && (
              <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-tech text-slate-500 block mb-1">Waist (cm)</label>
                    <input
                      type="number"
                      value={measForm.waistCm}
                      onChange={(e) => setMeasForm({ ...measForm, waistCm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-slate-800 p-2 rounded-xl text-xs font-tech font-bold border border-slate-200 dark:border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-tech text-slate-500 block mb-1">Chest (cm)</label>
                    <input
                      type="number"
                      value={measForm.chestCm}
                      onChange={(e) => setMeasForm({ ...measForm, chestCm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-slate-800 p-2 rounded-xl text-xs font-tech font-bold border border-slate-200 dark:border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-tech text-slate-500 block mb-1">Arms (cm)</label>
                    <input
                      type="number"
                      value={measForm.armCm}
                      onChange={(e) => setMeasForm({ ...measForm, armCm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-slate-800 p-2 rounded-xl text-xs font-tech font-bold border border-slate-200 dark:border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-tech text-slate-500 block mb-1">Thighs (cm)</label>
                    <input
                      type="number"
                      value={measForm.thighCm}
                      onChange={(e) => setMeasForm({ ...measForm, thighCm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-slate-800 p-2 rounded-xl text-xs font-tech font-bold border border-slate-200 dark:border-white/10"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveMeasurements}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow"
                >
                  Save Measurements
                </button>
              </div>
            )}

            {/* 4 Tape Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-tech uppercase text-slate-500 block">Waist</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-tech">{measurements.waistCm} cm</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-tech block">-4.0 cm vs joining</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-tech uppercase text-slate-500 block">Chest</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-tech">{measurements.chestCm} cm</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-tech block">+2.5 cm hypertrophy</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-tech uppercase text-slate-500 block">Arms (Bicep)</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-tech">{measurements.armCm} cm</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-tech block">+1.8 cm hypertrophy</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-tech uppercase text-slate-500 block">Thighs</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-tech">{measurements.thighCm} cm</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-tech block">-2.0 cm lean definition</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STRENGTH: Personal Records (PRs) */}
      {activeTab === 'strength' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white font-display">
                  5 Personal Records Logged
                </h4>
                <p className="text-[11px] text-slate-500 font-tech">Maximum verified strength feats</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-tech font-bold text-[10px]">
              Active Peak
            </span>
          </div>

          <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm dark:shadow-md divide-y divide-slate-100 dark:divide-white/5 transition-colors duration-200">
            {personalRecords.map((pr, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white font-display">{pr.exercise}</h5>
                  <span className="text-[10px] text-slate-500 font-tech block">
                    {pr.reps} reps • Verified on {pr.date}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 font-tech">
                    {pr.prWeightKg} kg
                  </span>
                  <span className="text-[10px] text-slate-400 font-tech block">{pr.muscle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONSISTENCY: Monthly Workout & Diet Adherence */}
      {activeTab === 'consistency' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-md space-y-4 transition-colors duration-200">
            <div>
              <span className="text-[10px] font-tech uppercase tracking-widest text-emerald-500 font-bold block">
                MONTHLY DISCIPLINE
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                Habit Adherence Score
              </h3>
            </div>

            {/* Overall Score */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-tech uppercase text-emerald-600 dark:text-emerald-400 font-bold block">Overall Adherence</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-tech">84% Elite</span>
              </div>
              <Award className="w-8 h-8 text-emerald-500" />
            </div>

            {/* 3 Pillars */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-tech mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Workout Attendance</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">18 / 22 sessions (82%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-tech mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Diet & Macro Logging</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">20 / 22 days (91%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-tech mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Hydration Target</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">17 / 22 days (77%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: '77%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
