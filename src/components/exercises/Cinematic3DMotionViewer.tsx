import React, { useState, useEffect } from 'react';
import { Exercise } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Flame,
  Layers,
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface Cinematic3DMotionViewerProps {
  exercise: Exercise;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
}

export const Cinematic3DMotionViewer: React.FC<Cinematic3DMotionViewerProps> = ({
  exercise,
  className = 'w-full h-64',
  showControls = true,
  autoPlay = true
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [motionPhase, setMotionPhase] = useState<'eccentric' | 'isometric' | 'concentric'>('concentric');
  const [repCount, setRepCount] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [activeView, setActiveView] = useState<'3d' | 'heatmap'>('3d');

  // Realistic biomechanical simulation loop (3 seconds per repetition: 1.5s down, 0.3s pause, 1.2s explode up)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = (prev + 2) % 100;
        if (next < 45) {
          setMotionPhase('concentric'); // Moving against resistance / lifting
        } else if (next >= 45 && next < 55) {
          setMotionPhase('isometric'); // Peak contraction hold
        } else {
          setMotionPhase('eccentric'); // Controlled lowering
        }

        if (prev > 95 && next < 10) {
          setRepCount((r) => r + 1);
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Color mappings for neon muscle activation
  const muscle = exercise.primaryMuscle.toLowerCase();
  const isChest = muscle.includes('chest') || muscle.includes('pec');
  const isBack = muscle.includes('back') || muscle.includes('lat') || muscle.includes('traps');
  const isLegs = muscle.includes('leg') || muscle.includes('quad') || muscle.includes('hamstring') || muscle.includes('glute') || muscle.includes('calf');
  const isShoulders = muscle.includes('shoulder') || muscle.includes('delt');
  const isArms = muscle.includes('bicep') || muscle.includes('tricep') || muscle.includes('arm');
  const isAbs = muscle.includes('ab') || muscle.includes('core') || muscle.includes('waist');

  // Compute 3D joint articulation angle based on sinusoidal phase
  const cycleRad = (progress / 100) * Math.PI * 2;
  const sinFactor = (Math.sin(cycleRad) + 1) / 2; // 0 to 1

  return (
    <div className={`relative rounded-2xl bg-[#070a12] border border-white/10 overflow-hidden shadow-2xl flex flex-col select-none ${className}`}>
      {/* 3D Viewport Header */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <span className="bg-amber-500 text-black px-2 py-0.5 rounded-full text-[10px] font-black font-tech tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            3D Motion
          </span>
          <span className="bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-tech">
            {motionPhase === 'concentric' ? '🔥 Concentric (Drive)' : motionPhase === 'isometric' ? '⚡ Peak Tension' : '🛡️ Eccentric (Control)'}
          </span>
        </div>

        {showControls && (
          <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-xl pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setActiveView(activeView === '3d' ? 'heatmap' : '3d');
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-tech font-bold transition-all ${
                activeView === 'heatmap' ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeView === '3d' ? 'Heatmap' : '3D Wire'}
            </button>
          </div>
        )}
      </div>

      {/* 3D Vector Biomechanical Canvas Simulation */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-gradient-to-b from-[#090e1a] via-[#060911] to-[#04060a] overflow-hidden">
        {/* Dynamic perspective grid lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 3D Rotating & Contracting Muscular Figure SVG */}
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full max-h-56 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-transform duration-75"
        >
          <defs>
            {/* Neon Glow Filters */}
            <filter id="neonPulse" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="cyberAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="targetRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            <linearGradient id="bodyMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Range of Motion Trajectory Arc */}
          <path
            d={`M 70 140 A 50 50 0 0 1 170 140`}
            fill="none"
            stroke="rgba(245, 158, 11, 0.25)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Active trajectory puck */}
          <circle
            cx={70 + sinFactor * 100}
            cy={140 - Math.sin(sinFactor * Math.PI) * 45}
            r="4"
            fill="#f59e0b"
            filter="url(#neonPulse)"
          />

          {/* HEAD & NECK */}
          <circle cx="120" cy="52" r="14" fill="url(#bodyMetallic)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Cyber Visor */}
          <path d="M 112 50 Q 120 54 128 50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#neonPulse)" />

          {/* TORSO / CHEST / RIBS */}
          <path
            d="M 102 70 L 138 70 L 132 120 L 108 120 Z"
            fill="url(#bodyMetallic)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />

          {/* CHEST MUSCLE HEATMAP (PECS) */}
          <path
            d="M 104 74 Q 120 84 136 74 L 134 94 Q 120 100 106 94 Z"
            fill={isChest || activeView === 'heatmap' ? 'url(#targetRed)' : 'rgba(245, 158, 11, 0.15)'}
            stroke={isChest ? '#ef4444' : '#f59e0b'}
            strokeWidth={isChest ? '2' : '1'}
            filter={isChest ? 'url(#neonPulse)' : undefined}
            opacity={isChest ? 0.6 + sinFactor * 0.4 : 0.4}
          />

          {/* CORE / ABS PACK */}
          <g opacity={isAbs ? 0.9 : 0.4}>
            <rect x="113" y="98" width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
            <rect x="121" y="98" width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
            <rect x="113" y="105" width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
            <rect x="121" y="105" width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
          </g>

          {/* SHOULDERS (DELTOIDS) */}
          <circle
            cx="96"
            cy="75"
            r="8"
            fill={isShoulders ? 'url(#targetRed)' : 'url(#bodyMetallic)'}
            stroke={isShoulders ? '#ef4444' : 'rgba(255,255,255,0.2)'}
            strokeWidth="1.5"
            filter={isShoulders ? 'url(#neonPulse)' : undefined}
          />
          <circle
            cx="144"
            cy="75"
            r="8"
            fill={isShoulders ? 'url(#targetRed)' : 'url(#bodyMetallic)'}
            stroke={isShoulders ? '#ef4444' : 'rgba(255,255,255,0.2)'}
            strokeWidth="1.5"
            filter={isShoulders ? 'url(#neonPulse)' : undefined}
          />

          {/* ARMS with dynamic biomechanical motion articulation */}
          {/* Left Arm Upper & Forearm */}
          <line
            x1="94"
            y1="78"
            x2={78 - sinFactor * 16}
            y2={102 - sinFactor * 24}
            stroke={isArms ? '#ef4444' : '#475569'}
            strokeWidth={isArms ? '5' : '4'}
            strokeLinecap="round"
          />
          <line
            x1={78 - sinFactor * 16}
            y1={102 - sinFactor * 24}
            x2={66 + sinFactor * 12}
            y2={132 - sinFactor * 35}
            stroke={isArms ? '#ef4444' : '#334155'}
            strokeWidth={isArms ? '4' : '3.5'}
            strokeLinecap="round"
          />

          {/* Right Arm Upper & Forearm */}
          <line
            x1="146"
            y1="78"
            x2={162 + sinFactor * 16}
            y2={102 - sinFactor * 24}
            stroke={isArms ? '#ef4444' : '#475569'}
            strokeWidth={isArms ? '5' : '4'}
            strokeLinecap="round"
          />
          <line
            x1={162 + sinFactor * 16}
            y1={102 - sinFactor * 24}
            x2={174 - sinFactor * 12}
            y2={132 - sinFactor * 35}
            stroke={isArms ? '#ef4444' : '#334155'}
            strokeWidth={isArms ? '4' : '3.5'}
            strokeLinecap="round"
          />

          {/* LEGS / QUADS with movement */}
          {/* Left Leg */}
          <line
            x1="112"
            y1="122"
            x2={104 - sinFactor * 8}
            y2={165 + sinFactor * 6}
            stroke={isLegs ? '#ef4444' : '#475569'}
            strokeWidth={isLegs ? '7' : '5.5'}
            strokeLinecap="round"
            filter={isLegs ? 'url(#neonPulse)' : undefined}
          />
          <line
            x1={104 - sinFactor * 8}
            y1={165 + sinFactor * 6}
            x2="100"
            y2="205"
            stroke={isLegs ? '#ef4444' : '#334155'}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Right Leg */}
          <line
            x1="128"
            y1="122"
            x2={136 + sinFactor * 8}
            y2={165 + sinFactor * 6}
            stroke={isLegs ? '#ef4444' : '#475569'}
            strokeWidth={isLegs ? '7' : '5.5'}
            strokeLinecap="round"
            filter={isLegs ? 'url(#neonPulse)' : undefined}
          />
          <line
            x1={136 + sinFactor * 8}
            y1={165 + sinFactor * 6}
            x2="140"
            y2="205"
            stroke={isLegs ? '#ef4444' : '#334155'}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        {/* Biomechanical Telemetry Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-tech">
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-slate-400">Target:</span>
            <span className="text-amber-400 font-bold">{exercise.primaryMuscle}</span>
            <span className="text-slate-600">•</span>
            <span className="text-red-400 font-bold">{Math.round(65 + sinFactor * 35)}% LOAD</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-white font-bold">{Math.round(progress)}% ROM</span>
          </div>
        </div>
      </div>

      {/* Repetition Progression Bar */}
      <div className="w-full bg-slate-900 h-1 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
