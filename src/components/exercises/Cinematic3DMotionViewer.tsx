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
  Compass,
  Eye,
  Sparkles
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface Cinematic3DMotionViewerProps {
  exercise: Exercise;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
}

export type MovementPattern =
  | 'squat'
  | 'press'
  | 'deadlift'
  | 'overhead'
  | 'curl'
  | 'pull'
  | 'lateral'
  | 'core'
  | 'general';

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
  const [viewAngle, setViewAngle] = useState<'front' | 'angle' | 'side'>('front');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Determine movement archetype from exercise name, category, and equipment
  const exerciseName = (exercise.name || '').toLowerCase();
  const category = (exercise.category || '').toLowerCase();
  const primary = (exercise.primaryMuscle || '').toLowerCase();

  let pattern: MovementPattern = 'general';
  if (
    exerciseName.includes('squat') ||
    exerciseName.includes('lunge') ||
    exerciseName.includes('leg press') ||
    exerciseName.includes('step-up') ||
    exerciseName.includes('hack')
  ) {
    pattern = 'squat';
  } else if (
    exerciseName.includes('bench') ||
    exerciseName.includes('push-up') ||
    exerciseName.includes('pushup') ||
    exerciseName.includes('chest press') ||
    exerciseName.includes('dip') ||
    exerciseName.includes('pec fly') ||
    exerciseName.includes('svend')
  ) {
    pattern = 'press';
  } else if (
    exerciseName.includes('deadlift') ||
    exerciseName.includes('hip thrust') ||
    exerciseName.includes('good morning') ||
    exerciseName.includes('hinge')
  ) {
    pattern = 'deadlift';
  } else if (
    exerciseName.includes('overhead') ||
    exerciseName.includes('military') ||
    exerciseName.includes('shoulder press') ||
    exerciseName.includes('arnold')
  ) {
    pattern = 'overhead';
  } else if (
    exerciseName.includes('curl') ||
    primary.includes('bicep')
  ) {
    pattern = 'curl';
  } else if (
    exerciseName.includes('pull-up') ||
    exerciseName.includes('pullup') ||
    exerciseName.includes('pulldown') ||
    exerciseName.includes('row') ||
    category.includes('back')
  ) {
    pattern = 'pull';
  } else if (
    exerciseName.includes('lateral raise') ||
    exerciseName.includes('front raise') ||
    exerciseName.includes('rear delt')
  ) {
    pattern = 'lateral';
  } else if (
    category.includes('abs') ||
    exerciseName.includes('crunch') ||
    exerciseName.includes('sit-up') ||
    exerciseName.includes('plank') ||
    primary.includes('waist')
  ) {
    pattern = 'core';
  }

  // Realistic biomechanical cadence simulation
  useEffect(() => {
    if (!isPlaying) return;

    const stepMs = Math.round(40 / playbackSpeed);
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
    }, stepMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Color mappings for neon muscle activation
  const isChest = primary.includes('chest') || primary.includes('pec');
  const isBack = primary.includes('back') || primary.includes('lat') || primary.includes('trap');
  const isLegs =
    primary.includes('leg') ||
    primary.includes('quad') ||
    primary.includes('hamstring') ||
    primary.includes('glute') ||
    primary.includes('calf');
  const isShoulders = primary.includes('shoulder') || primary.includes('delt');
  const isArms = primary.includes('bicep') || primary.includes('tricep') || primary.includes('arm');
  const isAbs = primary.includes('ab') || primary.includes('core') || primary.includes('waist');

  // Sinusoidal movement factor: 0 (bottom/start) to 1 (top/peak)
  const cycleRad = (progress / 100) * Math.PI * 2;
  const sinFactor = (Math.sin(cycleRad) + 1) / 2; // 0 to 1

  // 3D rotation transform based on viewAngle
  const rotationStyle =
    viewAngle === 'front'
      ? 'rotateY(0deg)'
      : viewAngle === 'angle'
      ? 'rotateY(25deg) rotateX(4deg)'
      : 'rotateY(60deg) rotateX(2deg)';

  // Calculate dynamic joint coordinates according to pattern
  // Torso / Hip Y displacement
  let hipY = 120;
  let shoulderY = 70;
  let kneeY = 165;
  let headY = 52;
  let armLeftHandX = 66;
  let armLeftHandY = 132;
  let armRightHandX = 174;
  let armRightHandY = 132;
  let armLeftElbowX = 78;
  let armLeftElbowY = 102;
  let armRightElbowX = 162;
  let armRightElbowY = 102;

  switch (pattern) {
    case 'squat':
      // Deep knee bend & hip descent
      hipY = 120 + sinFactor * 22;
      shoulderY = 70 + sinFactor * 18;
      headY = 52 + sinFactor * 18;
      kneeY = 165 + sinFactor * 12;
      armLeftHandX = 76;
      armLeftHandY = 75 + sinFactor * 18;
      armRightHandX = 164;
      armRightHandY = 75 + sinFactor * 18;
      armLeftElbowX = 82;
      armLeftElbowY = 90 + sinFactor * 18;
      armRightElbowX = 158;
      armRightElbowY = 90 + sinFactor * 18;
      break;

    case 'press':
      // Pressing forward/upward with chest expansion
      armLeftElbowX = 78 + sinFactor * 10;
      armLeftElbowY = 102 - sinFactor * 14;
      armRightElbowX = 162 - sinFactor * 10;
      armRightElbowY = 102 - sinFactor * 14;
      armLeftHandX = 82 + sinFactor * 24;
      armLeftHandY = 96 - sinFactor * 16;
      armRightHandX = 158 - sinFactor * 24;
      armRightHandY = 96 - sinFactor * 16;
      break;

    case 'deadlift':
      // Hip hinge back, torso pivots forward
      hipY = 120 + sinFactor * 15;
      shoulderY = 70 + sinFactor * 28;
      headY = 52 + sinFactor * 24;
      armLeftHandX = 104;
      armLeftHandY = 140 + sinFactor * 40;
      armRightHandX = 136;
      armRightHandY = 140 + sinFactor * 40;
      armLeftElbowX = 98;
      armLeftElbowY = 100 + sinFactor * 25;
      armRightElbowX = 142;
      armRightElbowY = 100 + sinFactor * 25;
      break;

    case 'overhead':
      // Pressing overhead to full lockout
      armLeftElbowX = 76 - sinFactor * 6;
      armLeftElbowY = 90 - sinFactor * 30;
      armRightElbowX = 164 + sinFactor * 6;
      armRightElbowY = 90 - sinFactor * 30;
      armLeftHandX = 90 + sinFactor * 14;
      armLeftHandY = 74 - sinFactor * 48;
      armRightHandX = 150 - sinFactor * 14;
      armRightHandY = 74 - sinFactor * 48;
      break;

    case 'curl':
      // Fixed elbow, forearm curls upward with peak bicep bulge
      armLeftElbowX = 84;
      armLeftElbowY = 104;
      armRightElbowX = 156;
      armRightElbowY = 104;
      armLeftHandX = 84 + sinFactor * 12;
      armLeftHandY = 138 - sinFactor * 52;
      armRightHandX = 156 - sinFactor * 12;
      armRightHandY = 138 - sinFactor * 52;
      break;

    case 'pull':
      // Pulling from overhead down to chest
      armLeftElbowX = 74 + sinFactor * 14;
      armLeftElbowY = 55 + sinFactor * 45;
      armRightElbowX = 166 - sinFactor * 14;
      armRightElbowY = 55 + sinFactor * 45;
      armLeftHandX = 80 + sinFactor * 16;
      armLeftHandY = 35 + sinFactor * 45;
      armRightHandX = 160 - sinFactor * 16;
      armRightHandY = 35 + sinFactor * 45;
      break;

    case 'lateral':
      // Arms raise outward laterally in an arc
      armLeftElbowX = 78 - sinFactor * 26;
      armLeftElbowY = 102 - sinFactor * 22;
      armRightElbowX = 162 + sinFactor * 26;
      armRightElbowY = 102 - sinFactor * 22;
      armLeftHandX = 66 - sinFactor * 38;
      armLeftHandY = 132 - sinFactor * 44;
      armRightHandX = 174 + sinFactor * 38;
      armRightHandY = 132 - sinFactor * 44;
      break;

    case 'core':
      // Torso curls forward
      shoulderY = 70 + sinFactor * 12;
      headY = 52 + sinFactor * 15;
      break;

    default:
      // Standard articulation
      armLeftHandX = 66 + sinFactor * 12;
      armLeftHandY = 132 - sinFactor * 35;
      armRightHandX = 174 - sinFactor * 12;
      armRightHandY = 132 - sinFactor * 35;
      break;
  }

  // Equipment rendering
  const isBarbell = (exercise.equipment || '').toLowerCase().includes('barbell');
  const isDumbbell = (exercise.equipment || '').toLowerCase().includes('dumbbell');
  const isCable = (exercise.equipment || '').toLowerCase().includes('cable');
  const isKettlebell = (exercise.equipment || '').toLowerCase().includes('kettlebell');

  return (
    <div className={`relative rounded-2xl bg-[#070a12] border border-white/10 overflow-hidden shadow-2xl flex flex-col select-none ${className}`}>
      {/* 3D Viewport Header Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-black px-2 py-0.5 rounded-full text-[10px] font-black font-tech tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center space-x-1">
            <Sparkles className="w-3 h-3 fill-black" />
            <span>3D Biomechanics</span>
          </span>
          <span className="bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-tech">
            {motionPhase === 'concentric'
              ? '🔥 Concentric'
              : motionPhase === 'isometric'
              ? '⚡ Peak Tension'
              : '🛡️ Eccentric'}
          </span>
        </div>

        {showControls && (
          <div className="flex items-center space-x-1 bg-black/70 backdrop-blur-md border border-white/10 p-1 rounded-xl pointer-events-auto">
            {/* View Angle Switcher */}
            {(['front', 'angle', 'side'] as const).map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => {
                  hapticTap();
                  setViewAngle(angle);
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase transition-all ${
                  viewAngle === angle ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {angle}
              </button>
            ))}

            {/* Heatmap Toggle */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setActiveView(activeView === '3d' ? 'heatmap' : '3d');
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-tech font-bold transition-all ml-1 ${
                activeView === 'heatmap' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeView === '3d' ? 'Heat' : 'Wire'}
            </button>
          </div>
        )}
      </div>

      {/* 3D Vector Biomechanical Canvas Simulation */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0f1d] via-[#060911] to-[#04060a] overflow-hidden">
        {/* Dynamic perspective grid lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 3D Rotating & Contracting Muscular Figure SVG */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: rotationStyle, perspective: 800 }}
        >
          <svg
            viewBox="0 0 240 240"
            className="w-full h-full max-h-56 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.2)]"
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

              <linearGradient id="chromeBar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            {/* Range of Motion Trajectory Arc */}
            <path
              d={`M 70 140 A 50 50 0 0 1 170 140`}
              fill="none"
              stroke="rgba(245, 158, 11, 0.2)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Active trajectory puck */}
            <circle
              cx={70 + sinFactor * 100}
              cy={140 - Math.sin(sinFactor * Math.PI) * 45}
              r="3.5"
              fill="#f59e0b"
              filter="url(#neonPulse)"
            />

            {/* HEAD & NECK */}
            <circle
              cx="120"
              cy={headY}
              r="13"
              fill="url(#bodyMetallic)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            />
            {/* Cyber Visor */}
            <path
              d={`M 113 ${headY - 2} Q 120 ${headY + 2} 127 ${headY - 2}`}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              filter="url(#neonPulse)"
            />

            {/* TORSO / CHEST / RIBS */}
            <path
              d={`M 102 ${shoulderY} L 138 ${shoulderY} L 132 ${hipY} L 108 ${hipY} Z`}
              fill="url(#bodyMetallic)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />

            {/* CHEST MUSCLE HEATMAP (PECS) */}
            <path
              d={`M 104 ${shoulderY + 4} Q 120 ${shoulderY + 14} 136 ${shoulderY + 4} L 134 ${shoulderY + 24} Q 120 ${shoulderY + 30} 106 ${shoulderY + 24} Z`}
              fill={isChest || activeView === 'heatmap' ? 'url(#targetRed)' : 'rgba(245, 158, 11, 0.15)'}
              stroke={isChest ? '#ef4444' : '#f59e0b'}
              strokeWidth={isChest ? '2' : '1'}
              filter={isChest ? 'url(#neonPulse)' : undefined}
              opacity={isChest ? 0.6 + sinFactor * 0.4 : 0.4}
            />

            {/* CORE / ABS PACK */}
            <g opacity={isAbs ? 0.95 : 0.4}>
              <rect x="113" y={hipY - 22} width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
              <rect x="121" y={hipY - 22} width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
              <rect x="113" y={hipY - 15} width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
              <rect x="121" y={hipY - 15} width="6" height="5" rx="1" fill={isAbs ? '#ef4444' : '#64748b'} />
            </g>

            {/* SHOULDERS (DELTOIDS) */}
            <circle
              cx="96"
              cy={shoulderY + 5}
              r="8"
              fill={isShoulders ? 'url(#targetRed)' : 'url(#bodyMetallic)'}
              stroke={isShoulders ? '#ef4444' : 'rgba(255,255,255,0.2)'}
              strokeWidth="1.5"
              filter={isShoulders ? 'url(#neonPulse)' : undefined}
            />
            <circle
              cx="144"
              cy={shoulderY + 5}
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
              y1={shoulderY + 8}
              x2={armLeftElbowX}
              y2={armLeftElbowY}
              stroke={isArms ? '#ef4444' : '#475569'}
              strokeWidth={isArms ? '5' : '4'}
              strokeLinecap="round"
            />
            <line
              x1={armLeftElbowX}
              y1={armLeftElbowY}
              x2={armLeftHandX}
              y2={armLeftHandY}
              stroke={isArms ? '#ef4444' : '#334155'}
              strokeWidth={isArms ? '4' : '3.5'}
              strokeLinecap="round"
            />

            {/* Right Arm Upper & Forearm */}
            <line
              x1="146"
              y1={shoulderY + 8}
              x2={armRightElbowX}
              y2={armRightElbowY}
              stroke={isArms ? '#ef4444' : '#475569'}
              strokeWidth={isArms ? '5' : '4'}
              strokeLinecap="round"
            />
            <line
              x1={armRightElbowX}
              y1={armRightElbowY}
              x2={armRightHandX}
              y2={armRightHandY}
              stroke={isArms ? '#ef4444' : '#334155'}
              strokeWidth={isArms ? '4' : '3.5'}
              strokeLinecap="round"
            />

            {/* Dynamic Equipment Rendering */}
            {isBarbell && (
              <g>
                <line
                  x1={armLeftHandX - 25}
                  y1={armLeftHandY}
                  x2={armRightHandX + 25}
                  y2={armRightHandY}
                  stroke="url(#chromeBar)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Weight plates */}
                <rect x={armLeftHandX - 28} y={armLeftHandY - 14} width="5" height="28" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                <rect x={armRightHandX + 23} y={armRightHandY - 14} width="5" height="28" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
              </g>
            )}

            {isDumbbell && (
              <g>
                {/* Left dumbbell */}
                <rect x={armLeftHandX - 6} y={armLeftHandY - 10} width="4" height="20" rx="1.5" fill="#f59e0b" />
                <rect x={armLeftHandX + 2} y={armLeftHandY - 10} width="4" height="20" rx="1.5" fill="#f59e0b" />
                <line x1={armLeftHandX - 4} y1={armLeftHandY} x2={armLeftHandX + 4} y2={armLeftHandY} stroke="#94a3b8" strokeWidth="2.5" />

                {/* Right dumbbell */}
                <rect x={armRightHandX - 6} y={armRightHandY - 10} width="4" height="20" rx="1.5" fill="#f59e0b" />
                <rect x={armRightHandX + 2} y={armRightHandY - 10} width="4" height="20" rx="1.5" fill="#f59e0b" />
                <line x1={armRightHandX - 4} y1={armRightHandY} x2={armRightHandX + 4} y2={armRightHandY} stroke="#94a3b8" strokeWidth="2.5" />
              </g>
            )}

            {isKettlebell && (
              <circle
                cx={(armLeftHandX + armRightHandX) / 2}
                cy={(armLeftHandY + armRightHandY) / 2 + 10}
                r="9"
                fill="#1e293b"
                stroke="#f59e0b"
                strokeWidth="2"
              />
            )}

            {isCable && (
              <g opacity="0.7">
                <line x1="20" y1="40" x2={armLeftHandX} y2={armLeftHandY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="220" y1="40" x2={armRightHandX} y2={armRightHandY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
              </g>
            )}

            {/* LEGS / QUADS with movement */}
            {/* Left Leg */}
            <line
              x1="112"
              y1={hipY + 2}
              x2={104 - (pattern === 'squat' ? sinFactor * 14 : 0)}
              y2={kneeY}
              stroke={isLegs ? '#ef4444' : '#475569'}
              strokeWidth={isLegs ? '6' : '5'}
              strokeLinecap="round"
              filter={isLegs ? 'url(#neonPulse)' : undefined}
            />
            <line
              x1={104 - (pattern === 'squat' ? sinFactor * 14 : 0)}
              y1={kneeY}
              x2="100"
              y2="208"
              stroke={isLegs ? '#ef4444' : '#334155'}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Right Leg */}
            <line
              x1="128"
              y1={hipY + 2}
              x2={136 + (pattern === 'squat' ? sinFactor * 14 : 0)}
              y2={kneeY}
              stroke={isLegs ? '#ef4444' : '#475569'}
              strokeWidth={isLegs ? '6' : '5'}
              strokeLinecap="round"
              filter={isLegs ? 'url(#neonPulse)' : undefined}
            />
            <line
              x1={136 + (pattern === 'squat' ? sinFactor * 14 : 0)}
              y1={kneeY}
              x2="140"
              y2="208"
              stroke={isLegs ? '#ef4444' : '#334155'}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Biomechanical Telemetry Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-tech pointer-events-none">
          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-auto">
            <span className="text-slate-400">Target:</span>
            <span className="text-amber-400 font-bold">{exercise.primaryMuscle}</span>
            <span className="text-slate-600">•</span>
            <span className="text-red-400 font-bold">{Math.round(60 + sinFactor * 40)}% LOAD</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-auto">
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-white font-bold">{Math.round(progress)}% ROM</span>
          </div>
        </div>
      </div>

      {/* Repetition Progression Bar & Controls Footer */}
      <div className="w-full bg-slate-900/90 h-1.5 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-red-500 h-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {showControls && (
        <div className="bg-[#05070d] px-3 py-1.5 flex items-center justify-between border-t border-white/5 text-[11px] font-tech text-slate-400">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setIsPlaying(!isPlaying);
              }}
              className="p-1 hover:text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <span>Reps: <strong className="text-amber-400">{repCount}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500">SPEED</span>
            {[0.5, 1.0, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => {
                  hapticTap();
                  setPlaybackSpeed(spd);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  playbackSpeed === spd ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
