import React from 'react';

interface AnatomicalExerciseIllustrationProps {
  exerciseId: string;
  category: string;
  className?: string;
  isAnimated?: boolean;
}

/**
 * Renders the high-contrast 3D anatomical muscular human figure
 * with target muscles highlighted in glowing red/orange,
 * identical to Fitness Online Handbook.
 */
export const AnatomicalExerciseIllustration: React.FC<AnatomicalExerciseIllustrationProps> = ({
  exerciseId,
  category,
  className = "w-20 h-20",
  isAnimated = false
}) => {
  // Determine which muscle to highlight in neon red-orange (#ff4520)
  const isChest = category === 'Chest' || exerciseId.includes('chest') || exerciseId.includes('bench') || exerciseId.includes('press') || exerciseId.includes('fly');
  const isBack = category === 'Back' || exerciseId.includes('lat') || exerciseId.includes('row') || exerciseId.includes('pull');
  const isShoulders = category === 'Shoulders' || exerciseId.includes('shoulder') || exerciseId.includes('press') || exerciseId.includes('raise');
  const isBiceps = category === 'Biceps' || exerciseId.includes('curl');
  const isTriceps = category === 'Triceps' || exerciseId.includes('triceps') || exerciseId.includes('pushdown');
  const isLegs = category === 'Legs' || exerciseId.includes('squat') || exerciseId.includes('press') || exerciseId.includes('leg');
  const isAbs = category === 'Abs' || exerciseId.includes('plank') || exerciseId.includes('raise') || exerciseId.includes('crunch');

  // Bench Incline Press / Fly posture
  const isIncline = exerciseId.includes('incline');

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        className={`w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${isAnimated ? 'animate-pulse' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glowing Red-Orange Muscle Gradient */}
          <linearGradient id="muscleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5722" />
            <stop offset="50%" stopColor="#ff3d00" />
            <stop offset="100%" stopColor="#dd2c00" />
          </linearGradient>

          {/* Secondary Stabilizer Gradient */}
          <linearGradient id="secondaryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8a65" />
            <stop offset="100%" stopColor="#ff5722" />
          </linearGradient>

          {/* Anatomical Silver-Grey Body Shading */}
          <linearGradient id="bodyGrey" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="40%" stopColor="#9e9e9e" />
            <stop offset="80%" stopColor="#616161" />
            <stop offset="100%" stopColor="#303030" />
          </linearGradient>

          {/* Equipment / Dumbbells Metallic Gradient */}
          <linearGradient id="equipmentMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b0bec5" />
            <stop offset="100%" stopColor="#37474f" />
          </linearGradient>

          {/* Filter for neon glow effect */}
          <filter id="neonRed" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {isIncline ? (
          /* 30° / 45° INCLINE BENCH POSTURE (Exact like screenshot) */
          <g id="incline-bench-figure" transform="translate(10, 10)">
            {/* Incline Bench Structure */}
            <path d="M25 125 L105 50 L115 58 L35 133 Z" fill="#263238" stroke="#455a64" strokeWidth="2" />
            <path d="M20 135 L45 135 L35 110 Z" fill="#1c2428" />
            <path d="M85 85 L105 135 L95 135 L80 90 Z" fill="#1c2428" />

            {/* Head & Neck */}
            <ellipse cx="108" cy="46" rx="9" ry="11" fill="url(#bodyGrey)" transform="rotate(-30 108 46)" />
            <path d="M98 52 L90 62 L82 54 Z" fill="url(#bodyGrey)" />

            {/* Torso & Ribcage */}
            <path
              d="M88 56 L55 90 C50 96 46 108 48 116 L65 106 C72 95 80 82 92 68 Z"
              fill="url(#bodyGrey)"
              stroke="#212121"
              strokeWidth="1"
            />

            {/* Abdominals (with realistic striations) */}
            <path d="M62 92 L54 102 M66 88 L58 98 M70 84 L62 94" stroke="#424242" strokeWidth="1.5" />

            {/* HIGHLIGHTED ACTIVE MUSCLE: PECTORALS (Glowing Red/Orange) */}
            {isChest && (
              <g filter="url(#neonRed)">
                {/* Upper Pectoralis Major (Incline Clavicular head) */}
                <path
                  d="M94 58 C96 66 90 76 78 85 C72 82 74 72 80 66 C86 60 90 58 94 58 Z"
                  fill="url(#muscleGlow)"
                  stroke="#ffab91"
                  strokeWidth="1.2"
                />
                <path
                  d="M84 54 C88 60 84 68 76 74 C72 70 74 62 78 56 Z"
                  fill="url(#muscleGlow)"
                  opacity="0.9"
                />
                {/* Muscle striations */}
                <path d="M90 62 L80 72 M92 66 L82 76 M88 58 L78 68" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
              </g>
            )}

            {/* Arms & Dumbbells */}
            {/* Upper Arm Left */}
            <path d="M86 54 L72 38 C70 34 76 30 80 34 L92 48 Z" fill="url(#bodyGrey)" />
            {/* Dumbbell Left */}
            <rect x="66" y="24" width="16" height="8" rx="2" fill="url(#equipmentMetal)" transform="rotate(-30 74 28)" />
            <circle cx="72" cy="23" r="5" fill="#546e7a" />
            <circle cx="80" cy="30" r="5" fill="#546e7a" />

            {/* Upper Arm Right (Raised) */}
            <path d="M96 60 L112 36 C116 32 122 36 120 42 L102 68 Z" fill="url(#bodyGrey)" />
            {/* Dumbbell Right */}
            <rect x="110" y="26" width="16" height="8" rx="2" fill="url(#equipmentMetal)" transform="rotate(-30 118 30)" />
            <circle cx="114" cy="26" r="5" fill="#546e7a" />
            <circle cx="122" cy="32" r="5" fill="#546e7a" />

            {/* Legs (Quads on Incline Bench) */}
            <path
              d="M48 114 L28 128 C24 132 26 138 32 136 L56 120 Z"
              fill="url(#bodyGrey)"
              stroke="#212121"
              strokeWidth="1"
            />
          </g>
        ) : isBack ? (
          /* BACK / PULLDOWN / ROW POSTURE */
          <g id="back-figure" transform="translate(15, 10)">
            {/* Head & Neck (Back view) */}
            <circle cx="65" cy="26" r="13" fill="url(#bodyGrey)" />

            {/* Traps & Upper Back */}
            <path d="M46 38 L84 38 L92 56 L65 72 L38 56 Z" fill="url(#bodyGrey)" />

            {/* ACTIVE MUSCLE: LATS & RHOMBOIDS (Neon Red/Orange) */}
            <g filter="url(#neonRed)">
              <path
                d="M40 54 L65 70 L90 54 C86 86 78 108 65 116 C52 108 44 86 40 54 Z"
                fill="url(#muscleGlow)"
                stroke="#ffab91"
                strokeWidth="1.5"
              />
              {/* V-Taper fiber striations */}
              <path d="M44 64 L62 78 M86 64 L68 78 M48 76 L62 88 M82 76 L68 88" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>

            {/* Waist & Glutes */}
            <path d="M52 114 L78 114 L74 135 L56 135 Z" fill="url(#bodyGrey)" />

            {/* Arms Pulldown */}
            <path d="M40 46 L20 28 L14 34 L32 54 Z" fill="url(#bodyGrey)" />
            <path d="M90 46 L110 28 L116 34 L98 54 Z" fill="url(#bodyGrey)" />

            {/* Lat Pulldown Bar */}
            <rect x="6" y="24" width="118" height="4" rx="2" fill="url(#equipmentMetal)" />
          </g>
        ) : isLegs ? (
          /* SQUAT / LEG PRESS POSTURE */
          <g id="squat-figure" transform="translate(15, 10)">
            {/* Barbell on Traps */}
            <rect x="4" y="38" width="122" height="6" rx="2" fill="url(#equipmentMetal)" />
            <circle cx="12" cy="41" r="14" fill="#37474f" stroke="#78909c" strokeWidth="2" />
            <circle cx="118" cy="41" r="14" fill="#37474f" stroke="#78909c" strokeWidth="2" />

            {/* Head & Torso in Deep Squat */}
            <circle cx="65" cy="32" r="12" fill="url(#bodyGrey)" />
            <path d="M48 46 L82 46 L78 84 L52 84 Z" fill="url(#bodyGrey)" />

            {/* ACTIVE MUSCLE: QUADRICEPS (Neon Red/Orange) */}
            <g filter="url(#neonRed)">
              <path
                d="M48 82 L28 92 C24 96 28 104 36 102 L70 90 Z"
                fill="url(#muscleGlow)"
                stroke="#ffab91"
                strokeWidth="1.5"
              />
              <path
                d="M82 82 L102 92 C106 96 102 104 94 102 L60 90 Z"
                fill="url(#muscleGlow)"
                stroke="#ffab91"
                strokeWidth="1.5"
              />
              {/* Muscle definition cuts */}
              <path d="M44 88 L34 96 M86 88 L96 96" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>

            {/* Calves & Knees */}
            <path d="M28 96 L32 136 L40 136 L38 98 Z" fill="url(#bodyGrey)" />
            <path d="M102 96 L98 136 L90 136 L92 98 Z" fill="url(#bodyGrey)" />
          </g>
        ) : isShoulders ? (
          /* OVERHEAD PRESS / LATERAL RAISE POSTURE */
          <g id="shoulder-figure" transform="translate(15, 10)">
            <circle cx="65" cy="30" r="12" fill="url(#bodyGrey)" />
            <path d="M50 44 L80 44 L76 96 L54 96 Z" fill="url(#bodyGrey)" />

            {/* ACTIVE MUSCLE: DELTOIDS (Neon Red/Orange) */}
            <g filter="url(#neonRed)">
              <ellipse cx="44" cy="48" rx="9" ry="11" fill="url(#muscleGlow)" stroke="#ffab91" strokeWidth="1.2" />
              <ellipse cx="86" cy="48" rx="9" ry="11" fill="url(#muscleGlow)" stroke="#ffab91" strokeWidth="1.2" />
            </g>

            {/* Arms Raised with Dumbbells */}
            <path d="M40 48 L18 36 L22 30 L46 44 Z" fill="url(#bodyGrey)" />
            <path d="M90 48 L112 36 L108 30 L84 44 Z" fill="url(#bodyGrey)" />
            <circle cx="16" cy="32" r="7" fill="url(#equipmentMetal)" />
            <circle cx="114" cy="32" r="7" fill="url(#equipmentMetal)" />

            {/* Legs */}
            <path d="M54 96 L50 138 L58 138 L62 96 Z" fill="url(#bodyGrey)" />
            <path d="M76 96 L80 138 L72 138 L68 96 Z" fill="url(#bodyGrey)" />
          </g>
        ) : (
          /* GENERAL MUSCULAR ANATOMICAL FIGURE WITH ACTIVE CHEST/ARMS */
          <g id="default-figure" transform="translate(15, 10)">
            {/* Head & Neck */}
            <circle cx="65" cy="24" r="12" fill="url(#bodyGrey)" />

            {/* Torso */}
            <path d="M46 38 L84 38 L78 94 L52 94 Z" fill="url(#bodyGrey)" />

            {/* ACTIVE MUSCLE: PECTORALS OR TARGET */}
            <g filter="url(#neonRed)">
              <path
                d="M48 40 L82 40 C80 58 74 68 65 70 C56 68 50 58 48 40 Z"
                fill="url(#muscleGlow)"
                stroke="#ffab91"
                strokeWidth="1.5"
              />
              <path d="M52 46 L62 58 M78 46 L68 58" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            </g>

            {/* Biceps / Arms */}
            <g filter={isBiceps || isTriceps ? 'url(#neonRed)' : undefined}>
              <path
                d="M44 42 L30 64 L36 68 L48 48 Z"
                fill={isBiceps || isTriceps ? 'url(#muscleGlow)' : 'url(#bodyGrey)'}
              />
              <path
                d="M86 42 L100 64 L94 68 L82 48 Z"
                fill={isBiceps || isTriceps ? 'url(#muscleGlow)' : 'url(#bodyGrey)'}
              />
            </g>

            {/* Forearms holding weights */}
            <path d="M32 66 L28 88 L34 90 L40 68 Z" fill="url(#bodyGrey)" />
            <path d="M98 66 L102 88 L96 90 L90 68 Z" fill="url(#bodyGrey)" />

            <circle cx="28" cy="90" r="6" fill="url(#equipmentMetal)" />
            <circle cx="102" cy="90" r="6" fill="url(#equipmentMetal)" />

            {/* Legs */}
            <path d="M52 94 L48 138 L56 138 L62 94 Z" fill="url(#bodyGrey)" />
            <path d="M78 94 L82 138 L74 138 L68 94 Z" fill="url(#bodyGrey)" />
          </g>
        )}
      </svg>
    </div>
  );
};
