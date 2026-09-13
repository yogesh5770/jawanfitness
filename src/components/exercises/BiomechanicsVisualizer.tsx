import React, { useState, useRef } from 'react';
import { Exercise } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Compass,
  Layers,
  Zap,
  CheckCircle2,
  Wind
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface BiomechanicsVisualizerProps {
  exercise: Exercise;
}

export const BiomechanicsVisualizer: React.FC<BiomechanicsVisualizerProps> = ({ exercise }) => {
  const [activeTab, setActiveTab] = useState<'motion' | 'anatomy' | 'biomechanics'>('motion');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoHasError, setVideoHasError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTogglePlay = () => {
    hapticTap();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    hapticTap();
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return (
    <div className="rounded-2xl bg-[#090d16] border border-white/10 overflow-hidden shadow-lg">
      {/* 3-Way Mode Switcher Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-3 py-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              hapticTap();
              setActiveTab('motion');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'motion'
                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>3D Motion</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setActiveTab('anatomy');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'anatomy'
                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Muscle Map</span>
          </button>

          <button
            onClick={() => {
              hapticTap();
              setActiveTab('biomechanics');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'biomechanics'
                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Biomechanics</span>
          </button>
        </div>

        {activeTab === 'motion' && !videoHasError && (
          <div className="flex items-center space-x-1 bg-slate-900 rounded-lg p-0.5 border border-white/10">
            {[0.5, 0.75, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 py-0.5 text-[10px] font-tech font-bold rounded ${
                  playbackSpeed === s ? 'bg-amber-500 text-black' : 'text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode 1: 3D Motion Video/GIF Frame */}
      {activeTab === 'motion' && (
        <div className="relative w-full h-64 bg-black flex items-center justify-center overflow-hidden">
          {!videoHasError ? (
            exercise.animationUrl?.endsWith('.gif') ? (
              <img
                src={exercise.animationUrl}
                alt={exercise.name}
                onError={() => setVideoHasError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                src={exercise.animationUrl}
                poster={exercise.thumbnailUrl}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoHasError(true)}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            // High-def animated fallback frame with trajectory overlay
            <div className="relative w-full h-full">
              <img
                src={exercise.thumbnailUrl || '/vital-animations/0051.mp4'}
                alt={exercise.name}
                className="w-full h-full object-contain filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2 animate-pulse">
                  <Play className="w-6 h-6 fill-amber-400 ml-0.5" />
                </div>
                <span className="text-xs font-bold text-white font-display">
                  Biomechanical Vector Preview Active
                </span>
                <span className="text-[10px] text-amber-400/90 font-tech mt-0.5">
                  Full Range of Motion Loop
                </span>
              </div>
            </div>
          )}

          {/* Top Format Badge */}
          <div className="absolute top-3 left-3 z-20">
            {exercise.animationUrl?.endsWith('.mp4') ? (
              <span className="bg-amber-500/90 text-black px-2.5 py-1 rounded-full text-[10px] font-black font-tech tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                ⭐ 60 FPS 3D Video
              </span>
            ) : (
              <span className="bg-black/70 backdrop-blur border border-white/20 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-tech">
                3D Loop Animation
              </span>
            )}
          </div>

          {/* Bottom Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16]/80 via-transparent to-transparent pointer-events-none" />

          {/* Floating Play/Pause Controls for MP4 videos */}
          {!videoHasError && !exercise.animationUrl?.endsWith('.gif') && (
            <button
              onClick={handleTogglePlay}
              className="absolute bottom-3 left-3 z-20 w-8 h-8 rounded-full bg-black/70 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-black transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
          )}

          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-tech text-slate-300">
            {exercise.equipment} • {exercise.difficulty}
          </div>
        </div>
      )}

      {/* Mode 2: Muscle Anatomy Heatmap */}
      {activeTab === 'anatomy' && (
        <div className="p-4 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-display">Targeted Muscle Distribution</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-tech font-bold">
              NEON LOAD MAP
            </span>
          </div>

          {/* Primary Muscle Load Bar */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-red-500/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-red-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>PRIMARY TARGET (75% Tension)</span>
              </span>
              <span className="font-tech font-black text-white">{exercise.primaryMuscle}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-amber-500 h-full w-3/4 rounded-full" />
            </div>
          </div>

          {/* Secondary Muscle Load Bar */}
          {exercise.secondaryMuscles.length > 0 && (
            <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/30">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-cyan-400 font-bold">SECONDARY SYNERGISTS (25% Tension)</span>
                <span className="font-tech font-black text-white">
                  {exercise.secondaryMuscles.join(', ')}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-1/4 rounded-full" />
              </div>
            </div>
          )}

          {/* Muscle Activation Cues */}
          <p className="text-xs text-slate-400 leading-relaxed italic">
            "Peak tension occurs during the {exercise.category === 'Legs' ? 'deep bottom transition' : 'full contraction phase'}. Squeeze the target muscle isometrically for 1 second to maximize motor unit recruitment."
          </p>
        </div>
      )}

      {/* Mode 3: Biomechanics & Angles */}
      {activeTab === 'biomechanics' && (
        <div className="p-4 space-y-3 text-left">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-tech text-amber-400 font-bold block mb-1">
                Recommended Tempo
              </span>
              <span className="text-sm font-black text-white font-tech">3 - 0 - 1 - 0</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">3s eccentric, 1s drive</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-tech text-emerald-400 font-bold block mb-1">
                Optimal Rest
              </span>
              <span className="text-sm font-black text-white font-tech">90 - 120s</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">ATP-CP replenishment</span>
            </div>
          </div>

          {/* Breathing Pattern */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex items-start space-x-2.5">
            <Wind className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-white font-display block">Breathing Protocol</span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Take a deep diaphragmatic breath and brace core before lowering. Exhale powerfully past the sticking point on the concentric drive.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
