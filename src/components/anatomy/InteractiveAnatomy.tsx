import React, { useState } from 'react';
import { MuscleGroup } from '../../types';
import { hapticTap } from '../../utils/audioHaptics';

interface InteractiveAnatomyProps {
  selectedMuscle: MuscleGroup | 'All';
  onSelectMuscle: (muscle: MuscleGroup | 'All') => void;
}

export const InteractiveAnatomy: React.FC<InteractiveAnatomyProps> = ({
  selectedMuscle,
  onSelectMuscle
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const muscleChips: { group: MuscleGroup | 'All'; label: string }[] = [
    { group: 'All', label: 'All Muscles' },
    { group: 'Chest', label: 'Chest' },
    { group: 'Back', label: 'Back & Lats' },
    { group: 'Shoulders', label: 'Shoulders' },
    { group: 'Biceps', label: 'Biceps' },
    { group: 'Triceps', label: 'Triceps' },
    { group: 'Legs', label: 'Quads & Legs' },
    { group: 'Abs', label: 'Abs & Core' }
  ];

  const handleSelect = (muscle: MuscleGroup | 'All') => {
    hapticTap();
    onSelectMuscle(muscle);
  };

  return (
    <div className="bg-[#0e121d] rounded-2xl border border-white/10 p-4 relative overflow-hidden shadow-lg">
      {/* View Switcher: Front / Back */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 font-bold">
            3D ANATOMY EXPLORER
          </span>
          <h3 className="text-sm font-bold text-white font-display">Target Muscle Group</h3>
        </div>

        <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setView('front')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              view === 'front' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              view === 'back' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* SVG Interactive Body Silhouette */}
      <div className="relative w-full h-56 flex items-center justify-center my-1">
        <svg
          viewBox="0 0 200 320"
          className="h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none"
        >
          {/* Head & Neck */}
          <circle cx="100" cy="24" r="16" fill="#1e2433" stroke="#334155" strokeWidth="1.5" />
          <path d="M94 40 L106 40 L108 50 L92 50 Z" fill="#1e2433" stroke="#334155" strokeWidth="1" />

          {view === 'front' ? (
            /* FRONT VIEW */
            <g id="front-body">
              {/* Shoulders (Left & Right) */}
              <path
                d="M60 52 C54 58 48 70 50 82 C55 80 66 65 72 58 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Shoulders'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Shoulders')}
              />
              <path
                d="M140 52 C146 58 152 70 150 82 C145 80 134 65 128 58 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Shoulders'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Shoulders')}
              />

              {/* Chest (Pectorals) */}
              <path
                d="M72 56 L128 56 C124 75 116 88 100 90 C84 88 76 75 72 56 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Chest'
                    ? 'fill-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                    : 'fill-[#253047] hover:fill-[#344466]'
                }`}
                stroke="#475569"
                strokeWidth="1.5"
                onClick={() => handleSelect('Chest')}
              />

              {/* Biceps (Left & Right) */}
              <path
                d="M48 83 C44 94 44 110 50 120 C54 118 58 104 56 86 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Biceps'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Biceps')}
              />
              <path
                d="M152 83 C156 94 156 110 150 120 C146 118 142 104 144 86 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Biceps'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Biceps')}
              />

              {/* Forearms */}
              <path d="M49 122 L38 160 L45 162 L56 126 Z" fill="#18202d" stroke="#334155" strokeWidth="1" />
              <path d="M151 122 L162 160 L155 162 L144 126 Z" fill="#18202d" stroke="#334155" strokeWidth="1" />

              {/* Abs & Core */}
              <path
                d="M78 92 C88 91 112 91 122 92 C120 122 118 146 120 152 C108 155 92 155 80 152 C82 146 80 122 78 92 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Abs'
                    ? 'fill-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                    : 'fill-[#212b3f] hover:fill-[#303e5a]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Abs')}
              />

              {/* Pelvis / Hips */}
              <path d="M78 153 L122 153 L114 175 L86 175 Z" fill="#18202d" stroke="#334155" strokeWidth="1" />

              {/* Quadriceps / Legs */}
              <path
                d="M84 176 L116 176 L114 235 C108 238 92 238 86 235 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Legs'
                    ? 'fill-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                    : 'fill-[#253047] hover:fill-[#344466]'
                }`}
                stroke="#475569"
                strokeWidth="1.5"
                onClick={() => handleSelect('Legs')}
              />

              {/* Calves & Lower Leg */}
              <path d="M85 240 L96 240 L93 295 L87 295 Z" fill="#1a2230" stroke="#334155" strokeWidth="1" />
              <path d="M104 240 L115 240 L113 295 L107 295 Z" fill="#1a2230" stroke="#334155" strokeWidth="1" />
            </g>
          ) : (
            /* BACK VIEW */
            <g id="back-body">
              {/* Traps & Upper Back */}
              <path
                d="M75 50 L125 50 L135 68 L100 88 L65 68 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Back'
                    ? 'fill-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                    : 'fill-[#253047] hover:fill-[#344466]'
                }`}
                stroke="#475569"
                strokeWidth="1.5"
                onClick={() => handleSelect('Back')}
              />

              {/* Lats (Wings) */}
              <path
                d="M66 69 L100 88 L134 69 C130 110 118 140 100 148 C82 140 70 110 66 69 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Back'
                    ? 'fill-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Back')}
              />

              {/* Triceps (Left & Right) */}
              <path
                d="M48 80 C44 92 44 110 50 120 C54 116 57 100 55 83 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Triceps'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Triceps')}
              />
              <path
                d="M152 80 C156 92 156 110 150 120 C146 116 143 100 145 83 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Triceps'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Triceps')}
              />

              {/* Glutes */}
              <path
                d="M77 150 L123 150 C125 178 116 195 100 195 C84 195 75 178 77 150 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Legs'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#253047] hover:fill-[#344466]'
                }`}
                stroke="#475569"
                strokeWidth="1.5"
                onClick={() => handleSelect('Legs')}
              />

              {/* Hamstrings */}
              <path
                d="M84 196 L116 196 L114 240 C108 242 92 242 86 240 Z"
                className={`cursor-pointer transition-all ${
                  selectedMuscle === 'Legs'
                    ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'fill-[#1e273a] hover:fill-[#2d3954]'
                }`}
                stroke="#334155"
                strokeWidth="1.5"
                onClick={() => handleSelect('Legs')}
              />

              {/* Calves */}
              <path d="M85 245 L96 245 L93 295 L87 295 Z" fill="#18202d" stroke="#334155" strokeWidth="1" />
              <path d="M104 245 L115 245 L113 295 L107 295 Z" fill="#18202d" stroke="#334155" strokeWidth="1" />
            </g>
          )}
        </svg>

        {/* Selected Muscle Overlay Badge */}
        <div className="absolute bottom-1 right-2 bg-black/70 backdrop-blur border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400">
          Target: {selectedMuscle}
        </div>
      </div>

      {/* Horizontal Muscle Category Scroll Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/5">
        {muscleChips.map((chip) => {
          const isSelected = selectedMuscle === chip.group;
          return (
            <button
              key={chip.group}
              onClick={() => handleSelect(chip.group)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
