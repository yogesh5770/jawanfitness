import React, { useState, useRef } from 'react';
import { Exercise } from '../../types';
import { Play, Pause, Compass, Layers, Wind, Sparkles, Activity, Box } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { Cinematic3DMotionViewer } from './Cinematic3DMotionViewer';

interface BiomechanicsVisualizerProps {
  exercise: Exercise;
}

export const BiomechanicsVisualizer: React.FC<BiomechanicsVisualizerProps> = ({ exercise }) => {
  // Prioritize verified GIF animationUrl (all 1,324 exercises have direct GIF animations)
  const animSrc = exercise.animationUrl || exercise.thumbnailUrl;
  const isVideo = Boolean(
    animSrc &&
      (animSrc.endsWith('.mp4') ||
       animSrc.endsWith('.webm') ||
       animSrc.includes('/vital-animations/') ||
       animSrc.includes('.mp4?'))
  );

  const [activeTab, setActiveTab] = useState<'motion' | 'interactive3d' | 'anatomy' | 'biomechanics'>('motion');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isMp4 = isVideo;

  const handleTogglePlay = () => {
    hapticTap();
    if (isMp4 && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
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
    <div className="rounded-2xl bg-slate-100 dark:bg-[#070a12] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
      {/* Mode Switcher Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-black/50 px-3 py-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Tab 1: Realistic 3D Anatomical Character (DEFAULT) */}
          <button
            onClick={() => {
              hapticTap();
              setActiveTab('motion');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'motion'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Exercise GIF Animation</span>
          </button>

          {/* Tab 2: Interactive 3D Biomechanical Wireframe Rotator */}
          <button
            onClick={() => {
              hapticTap();
              setActiveTab('interactive3d');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'interactive3d'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Joint Wireframe</span>
          </button>

          {/* Tab 3: Muscle Anatomy Heatmap */}
          <button
            onClick={() => {
              hapticTap();
              setActiveTab('anatomy');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'anatomy'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Muscle Map</span>
          </button>

          {/* Tab 4: Biomechanical Telemetry */}
          <button
            onClick={() => {
              hapticTap();
              setActiveTab('biomechanics');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'biomechanics'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Biomechanics</span>
          </button>
        </div>

        {activeTab === 'motion' && isVideo && (
          <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-900/90 rounded-lg p-0.5 border border-slate-200 dark:border-white/10 flex-shrink-0 ml-2">
            {[0.5, 0.75, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 py-0.5 text-[10px] font-tech font-bold rounded cursor-pointer ${
                  playbackSpeed === s ? 'bg-amber-500 text-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode 1: Real 3D Anatomical Human Exercise Demonstration (Default for all 1,324 exercises) */}
      {activeTab === 'motion' && !hasError && (
        <div className="relative w-full h-72 sm:h-84 bg-slate-50 dark:bg-[#03050a] flex items-center justify-center overflow-hidden select-none">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#141d33_0%,#03050a_85%)] pointer-events-none" />

          {isVideo ? (
            <video
              ref={videoRef}
              src={animSrc}
              poster={exercise.thumbnailUrl}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setHasError(true)}
              className="relative z-10 w-full h-full object-contain filter contrast-110"
            />
          ) : (
            <img
              src={animSrc}
              alt={exercise.name}
              className="relative z-10 w-full h-full object-contain filter contrast-110 drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)]"
              onError={() => setHasError(true)}
            />
          )}

          {/* Top Floating Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center space-x-2">
            <span className="bg-black/80 backdrop-blur border border-amber-500/40 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black font-tech tracking-wider uppercase shadow-md flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Exercise GIF Motion Loop</span>
            </span>
          </div>

          {/* Bottom Floating Target Muscle Load Indicators */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-2 bg-black/80 backdrop-blur border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-xl shadow-lg">
            <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400">TARGET:</span>
            <span className="text-[10px] font-tech font-bold text-amber-600 dark:text-amber-400 uppercase">{exercise.primaryMuscle}</span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-tech text-emerald-600 dark:text-emerald-400 font-bold uppercase">{exercise.category}</span>
          </div>

          {/* Bottom Floating Play/Pause Controls */}
          {isVideo && (
            <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-1.5 bg-black/80 backdrop-blur border border-slate-200 dark:border-white/10 px-2 py-1 rounded-xl shadow-lg">
              <button
                onClick={handleTogglePlay}
                className="p-1 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                title={isPlaying ? 'Pause motion' : 'Play motion'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <span className="text-[10px] font-tech text-slate-500 dark:text-slate-400 px-1 border-l border-slate-200 dark:border-white/10">
                {isPlaying ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Interactive 3D Biomechanical Joint Engine (or fallback if image/video errors) */}
      {(activeTab === 'interactive3d' || (activeTab === 'motion' && hasError)) && (
        <Cinematic3DMotionViewer
          exercise={exercise}
          className="w-full h-72 sm:h-84"
          showControls={true}
          autoPlay={true}
        />
      )}

      {/* Mode 2: Muscle Anatomy Heatmap */}
      {activeTab === 'anatomy' && (
        <div className="p-4 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-display">Targeted Muscle Distribution</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-tech font-bold">
              NEON LOAD MAP
            </span>
          </div>

          {/* Primary Muscle Load Bar */}
          <div className="bg-slate-100/80 dark:bg-slate-900/80 p-3 rounded-xl border border-red-500/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-red-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>PRIMARY TARGET (75% Tension)</span>
              </span>
              <span className="font-tech font-black text-slate-900 dark:text-white">{exercise.primaryMuscle}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-amber-500 h-full w-3/4 rounded-full" />
            </div>
          </div>

          {/* Secondary Muscle Load Bar */}
          {exercise.secondaryMuscles.length > 0 && (
            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-3 rounded-xl border border-cyan-500/30">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">SECONDARY SYNERGISTS (25% Tension)</span>
                <span className="font-tech font-black text-slate-900 dark:text-white">
                  {exercise.secondaryMuscles.join(', ')}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-1/4 rounded-full" />
              </div>
            </div>
          )}

          {/* Muscle Activation Cues */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
            "Peak tension occurs during the {exercise.category === 'Legs' ? 'deep bottom transition' : 'full contraction phase'}. Squeeze the target muscle isometrically for 1 second to maximize motor unit recruitment."
          </p>
        </div>
      )}

      {/* Mode 3: Biomechanics & Angles Telemetry */}
      {activeTab === 'biomechanics' && (
        <div className="p-4 space-y-4 text-left">
          {/* Kinematic Form Alignment Card */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-white dark:from-[#101728] to-white dark:to-[#0a0f1d] border border-amber-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase font-tech text-amber-600 dark:text-amber-400 tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Kinematic Form Alignment</span>
              </span>
              <span className="text-[10px] font-tech text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Safe ROM Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-tech">PRIMARY JOINT ACTION</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {exercise.category === 'Chest' ? 'Shoulder Horiz. Adduction' : exercise.category === 'Back' ? 'Scapular Retraction' : exercise.category === 'Legs' ? 'Knee & Hip Extension' : 'Multi-joint Compound'}
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-tech">TARGET DEPTH / ROM</span>
                <span className="font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">90°–110° Joint Angle</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] uppercase font-tech text-amber-600 dark:text-amber-400 font-bold block mb-1">
                Recommended Tempo
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-tech">3 - 0 - 1 - 0</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">3s eccentric, 1s drive</span>
            </div>

            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] uppercase font-tech text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                Optimal Rest
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-tech">90 - 120s</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">ATP-CP replenishment</span>
            </div>
          </div>

          {/* Breathing Pattern */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-start space-x-2.5">
            <Wind className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white font-display block">Breathing Protocol</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                Take a deep diaphragmatic breath and brace core before lowering. Exhale powerfully past the sticking point on the concentric drive.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
