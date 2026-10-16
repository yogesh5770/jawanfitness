import React, { useState, useRef, useEffect } from 'react';
import { Exercise } from '../../types';
import { Play, Pause, Sparkles, Dumbbell, RefreshCw, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface BiomechanicsVisualizerProps {
  exercise: Exercise;
}

export const BiomechanicsVisualizer: React.FC<BiomechanicsVisualizerProps> = ({ exercise }) => {
  // Determine available media formats
  const hasMaleVideo = Boolean(exercise.videoMaleUrl);
  const hasFemaleVideo = Boolean(exercise.videoFemaleUrl);
  const hasAnyVideo = Boolean(
    exercise.videoUrl ||
    exercise.videoMaleUrl ||
    exercise.videoFemaleUrl ||
    (exercise.animationUrl && (exercise.animationUrl.endsWith('.mp4') || exercise.animationUrl.endsWith('.webm')))
  );

  const hasHighResPhotos = Boolean(exercise.highResImages && exercise.highResImages.length >= 2);

  // Preferred gender state for video models (defaults to male or whichever is available)
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(() => {
    return hasMaleVideo ? 'male' : hasFemaleVideo ? 'female' : 'male';
  });

  // State for high-res photo frames (0: start, 1: peak)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isPhotoAutoPlaying, setIsPhotoAutoPlaying] = useState<boolean>(true);

  // Playback controls
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync state when exercise changes
  useEffect(() => {
    setSelectedGender(hasMaleVideo ? 'male' : hasFemaleVideo ? 'female' : 'male');
    setActivePhotoIndex(0);
    setHasError(false);
    setTriedFallback(false);
    setIsPlaying(true);
  }, [exercise.id]);

  // Compute active video source and poster
  const currentVideoSrc = (() => {
    if (selectedGender === 'female' && exercise.videoFemaleUrl) return exercise.videoFemaleUrl;
    if (selectedGender === 'male' && exercise.videoMaleUrl) return exercise.videoMaleUrl;
    return exercise.videoUrl || exercise.animationUrl || '';
  })();

  const currentPoster = (() => {
    if (selectedGender === 'female' && exercise.posterFemaleUrl) return exercise.posterFemaleUrl;
    if (selectedGender === 'male' && exercise.posterMaleUrl) return exercise.posterMaleUrl;
    return exercise.thumbnailUrl;
  })();

  const isVideo = Boolean(
    currentVideoSrc &&
    (currentVideoSrc.endsWith('.mp4') ||
     currentVideoSrc.endsWith('.webm') ||
     currentVideoSrc.includes('/vital-animations/') ||
     currentVideoSrc.includes('.mp4?'))
  );

  // Auto-flip for 2-phase high-res photos when no video exists
  useEffect(() => {
    if (!isVideo && hasHighResPhotos && isPhotoAutoPlaying) {
      const interval = setInterval(() => {
        setActivePhotoIndex((prev) => (prev === 0 ? 1 : 0));
      }, 1400);
      return () => clearInterval(interval);
    }
  }, [isVideo, hasHighResPhotos, isPhotoAutoPlaying]);

  const handleMediaError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      // If female video failed, try male video or thumbnail
      if (selectedGender === 'female' && exercise.videoMaleUrl) {
        setSelectedGender('male');
      } else if (exercise.thumbnailUrl) {
        setHasError(true);
      }
    } else {
      setHasError(true);
    }
  };

  const handleTogglePlay = () => {
    hapticTap();
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else if (hasHighResPhotos) {
      setIsPhotoAutoPlaying(!isPhotoAutoPlaying);
    }
  };

  const handleSpeedChange = (speed: number) => {
    hapticTap();
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleGenderSwitch = (gender: 'male' | 'female') => {
    hapticTap();
    setSelectedGender(gender);
    setHasError(false);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="rounded-2xl bg-slate-100 dark:bg-[#070a12] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 px-3.5 py-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black font-display text-slate-900 dark:text-white uppercase tracking-wider">
            {isVideo ? 'HD Movement Video' : hasHighResPhotos ? 'Studio Breakdown' : 'Movement Demonstration'}
          </span>
          {isVideo ? (
            <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-tech font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>1080P HD</span>
            </span>
          ) : hasHighResPhotos ? (
            <span className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[9px] font-tech font-bold px-1.5 py-0.5 rounded">
              750P STUDIO
            </span>
          ) : (
            <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-tech font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>1080P HD</span>
            </span>
          )}
        </div>

        {/* Video Speed Selector or Photo Frame Selector */}
        {isVideo && !hasError ? (
          <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-lg p-0.5 border border-slate-200 dark:border-white/10">
            {[0.5, 0.75, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 py-0.5 text-[10px] font-tech font-bold rounded cursor-pointer transition-all ${
                  playbackSpeed === s
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        ) : hasHighResPhotos && !isVideo ? (
          <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-lg p-0.5 border border-slate-200 dark:border-white/10">
            <button
              onClick={() => {
                hapticTap();
                setActivePhotoIndex(0);
                setIsPhotoAutoPlaying(false);
              }}
              className={`px-1.5 py-0.5 text-[10px] font-tech font-bold rounded cursor-pointer ${
                activePhotoIndex === 0 && !isPhotoAutoPlaying
                  ? 'bg-cyan-500 text-black font-black'
                  : 'text-slate-400'
              }`}
            >
              Start
            </button>
            <button
              onClick={() => {
                hapticTap();
                setActivePhotoIndex(1);
                setIsPhotoAutoPlaying(false);
              }}
              className={`px-1.5 py-0.5 text-[10px] font-tech font-bold rounded cursor-pointer ${
                activePhotoIndex === 1 && !isPhotoAutoPlaying
                  ? 'bg-cyan-500 text-black font-black'
                  : 'text-slate-400'
              }`}
            >
              Peak
            </button>
            <button
              onClick={() => {
                hapticTap();
                setIsPhotoAutoPlaying(true);
              }}
              className={`px-1.5 py-0.5 text-[10px] font-tech font-bold rounded cursor-pointer ${
                isPhotoAutoPlaying
                  ? 'bg-emerald-500 text-black font-black'
                  : 'text-slate-400'
              }`}
            >
              Auto
            </button>
          </div>
        ) : null}
      </div>

      {/* Media Canvas Container */}
      <div className="relative w-full h-72 sm:h-88 bg-black flex items-center justify-center overflow-hidden select-none">
        {/* Subtle Ambient Radial Lighting for Studio Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#141d33_0%,#03050a_85%)] pointer-events-none" />

        {!hasError ? (
          isVideo ? (
            <video
              ref={videoRef}
              key={currentVideoSrc}
              src={currentVideoSrc}
              poster={currentPoster}
              autoPlay
              loop
              muted
              playsInline
              onError={handleMediaError}
              className="relative z-10 w-full h-full object-contain filter contrast-110"
            />
          ) : hasHighResPhotos && exercise.highResImages ? (
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <img
                src={exercise.highResImages[activePhotoIndex] || exercise.thumbnailUrl}
                alt={`${exercise.name} ${activePhotoIndex === 0 ? 'Starting Position' : 'Peak Contraction'}`}
                className="w-full h-full object-contain filter contrast-110 drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)] transition-opacity duration-300"
                onError={handleMediaError}
              />
              <div className="absolute bottom-12 right-3 z-20 bg-black/85 backdrop-blur px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-tech font-bold text-cyan-300">
                Phase {activePhotoIndex + 1}: {activePhotoIndex === 0 ? 'Starting Position' : 'Peak Contraction'}
              </div>
            </div>
          ) : (
            <img
              src={exercise.animationUrl || exercise.thumbnailUrl}
              alt={exercise.name}
              className="relative z-10 w-full h-full max-w-[280px] max-h-[280px] object-contain filter contrast-110 drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)]"
              onError={handleMediaError}
            />
          )
        ) : (
          /* Clean, elegant fallback card if media fails to load (NO stick figure) */
          <div className="relative z-10 p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white capitalize">{exercise.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {exercise.primaryMuscle} • {exercise.equipment}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setHasError(false);
                setTriedFallback(false);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-tech font-bold border border-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Demonstration</span>
            </button>
          </div>
        )}

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 pointer-events-none">
          <span className="bg-black/85 backdrop-blur border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black font-tech tracking-wider uppercase shadow-md flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Form Guide</span>
          </span>
        </div>

        {/* Top Right: Male / Female Model Switcher (When Both Video Demonstrations are Available) */}
        {hasMaleVideo && hasFemaleVideo && isVideo && !hasError && (
          <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-black/85 backdrop-blur border border-white/20 rounded-xl p-1 shadow-xl">
            <button
              type="button"
              onClick={() => handleGenderSwitch('male')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-tech font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedGender === 'male'
                  ? 'bg-amber-500 text-black font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>♂</span>
              <span>Male</span>
            </button>
            <button
              type="button"
              onClick={() => handleGenderSwitch('female')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-tech font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedGender === 'female'
                  ? 'bg-amber-500 text-black font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>♀</span>
              <span>Female</span>
            </button>
          </div>
        )}

        {/* Bottom Floating Target Muscle Load Indicators */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-2 bg-black/85 backdrop-blur border border-white/15 px-2.5 py-1 rounded-xl shadow-lg pointer-events-none">
          <span className="text-[10px] font-tech text-slate-300 font-bold">TARGET:</span>
          <span className="text-[10px] font-tech font-bold text-amber-300 uppercase">{exercise.primaryMuscle}</span>
          <span className="text-slate-400">•</span>
          <span className="text-[10px] font-tech text-emerald-300 font-bold uppercase">{exercise.equipment}</span>
        </div>

        {/* Bottom Floating Play/Pause Controls for Video */}
        {isVideo && !hasError && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-1.5 bg-black/85 backdrop-blur border border-white/15 px-2 py-1 rounded-xl shadow-lg">
            <button
              onClick={handleTogglePlay}
              className="p-1 text-white hover:text-amber-300 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <span className="text-[10px] font-tech text-slate-300 px-1 border-l border-white/15">
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </span>
          </div>
        )}
      </div>

      {/* Quick Tactical Form Cues Banner (When present in exercise data) */}
      {exercise.formCues && exercise.formCues.length > 0 && (
        <div className="bg-slate-900/90 border-t border-slate-800 px-3.5 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-tech font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1 flex-shrink-0">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            <span>Form Cues:</span>
          </span>
          <div className="flex items-center space-x-1.5 flex-nowrap">
            {exercise.formCues.map((cue, idx) => (
              <span
                key={idx}
                className="inline-flex items-center bg-white/5 border border-white/10 text-slate-300 text-[10px] font-tech px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0"
              >
                {cue}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
