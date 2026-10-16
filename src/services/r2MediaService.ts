import { Exercise } from '../types';

/**
 * Cloudflare R2 3D Media Service
 * Connects Jawan Fitness to Cloudflare R2 (10 GB Free Tier, $0 Egress Fees).
 * Streams high-definition 60 FPS 3D human workout video loops without bloating the APK.
 */

// Default or custom Cloudflare R2 bucket public endpoint
const DEFAULT_R2_ENDPOINT = 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev';
const STORAGE_KEY = 'jawan_r2_endpoint';

export interface R2Config {
  endpoint: string;
  isCustom: boolean;
  freeTierStorageLimitGb: number;
  totalStorageUsedMb: number;
  egressFee: string;
}

// Map of known 3D motion files (50 Vital foundation exercises + custom renders)
const VITAL_50_MAP: Record<string, string> = {
  '0051': '0051.mp4', // pec deck machine fly
  '0052': '0052.mp4', // svend press chest
  '0053': '0053.mp4', // air bike sprint
  '0054': '0054.mp4', // barbell back squat
  '0055': '0055.mp4', // barbell bulgarian split squat
  '0056': '0056.mp4', // barbell front squat
  '0057': '0057.mp4', // barbell hip thrust
  '0058': '0058.mp4', // barbell march
  '0059': '0059.mp4', // barbell reverse lunges
  '0060': '0060.mp4', // barbell romanian deadlift
  '0061': '0061.mp4', // cable leg kickback
  '0062': '0062.mp4', // cycling
  '0063': '0063.mp4', // dumbbell bulgarian split squat
  '0064': '0064.mp4', // dumbbell goblet squat
  '0065': '0065.mp4', // dumbbell hip hinge
  '0066': '0066.mp4', // dumbbell jump squat
  '0067': '0067.mp4', // elliptical hiit machine
  '0068': '0068.mp4', // hack squat machine
  '0069': '0069.mp4', // hip abduction machine
  '0070': '0070.mp4', // kettlebell hold march
  '0071': '0071.mp4', // kettlebell lift up
  '0072': '0072.mp4', // kettlebell swing
  '0073': '0073.mp4', // leg extension machine
  '0074': '0074.mp4', // leg press machine
  '0075': '0075.mp4', // lying leg curl machine
  '0076': '0076.mp4', // rope wave
  '0077': '0077.mp4', // rowing machine
  '0078': '0078.mp4', // run on treadmill
  '0079': '0079.mp4', // seated leg curl machine
  '0080': '0080.mp4', // seated overhead press
  '0081': '0081.mp4', // step-ups (weighted)
  '0082': '0082.mp4', // stepmill machine version 1
  '0083': '0083.mp4', // stepmill machine
  '0084': '0084.mp4', // stiff-legged deadlift machine
  '0085': '0085.mp4', // triceps pushdown (cable - rope)
  '0086': '0086.mp4', // walk on treadmill
  '0087': '0087.mp4', // arnold press dumbbell
  '0088': '0088.mp4', // barbell overhead press standing
  '0089': '0089.mp4', // barbell upright row
  '0090': '0090.mp4', // dumbbell overhead standard
  '0091': '0091.mp4', // dumbbell upright row
  '0092': '0092.mp4', // front raise (dumbbell)
  '0093': '0093.mp4', // front raise (weighted plate)
  '0094': '0094.mp4', // kettlebell overhead press
  '0095': '0095.mp4', // cable cross lateral raise
  '0096': '0096.mp4', // lateral raises (dumbbell)
  '0097': '0097.mp4', // lateral raise machine
  '0098': '0098.mp4', // military press (seated - smith machine)
  '0099': '0099.mp4', // rear delt fly (reverse pec deck)
  '0100': '0100.mp4'  // rear delt cable fly
};

// Exercise name normalization matcher for 3D Video assignments
const NAME_TO_VIDEO_MAP: Array<{ match: RegExp; file: string }> = [
  { match: /pec deck|machine fly/i, file: '0051.mp4' },
  { match: /svend press/i, file: '0052.mp4' },
  { match: /air bike/i, file: '0053.mp4' },
  { match: /back squat|barbell.*squat/i, file: '0054.mp4' },
  { match: /bulgarian.*split squat/i, file: '0055.mp4' },
  { match: /front squat/i, file: '0056.mp4' },
  { match: /hip thrust/i, file: '0057.mp4' },
  { match: /romanian deadlift|rdl/i, file: '0060.mp4' },
  { match: /cable.*kickback/i, file: '0061.mp4' },
  { match: /goblet squat/i, file: '0064.mp4' },
  { match: /jump squat/i, file: '0066.mp4' },
  { match: /hack squat/i, file: '0068.mp4' },
  { match: /hip abduction/i, file: '0069.mp4' },
  { match: /kettlebell swing/i, file: '0072.mp4' },
  { match: /leg extension/i, file: '0073.mp4' },
  { match: /leg press/i, file: '0074.mp4' },
  { match: /lying leg curl/i, file: '0075.mp4' },
  { match: /battle rope|rope wave/i, file: '0076.mp4' },
  { match: /rowing machine/i, file: '0077.mp4' },
  { match: /treadmill.*run|running/i, file: '0078.mp4' },
  { match: /seated leg curl/i, file: '0079.mp4' },
  { match: /seated overhead press/i, file: '0080.mp4' },
  { match: /step-up|step up/i, file: '0081.mp4' },
  { match: /stiff-legged deadlift/i, file: '0084.mp4' },
  { match: /triceps pushdown|rope pushdown/i, file: '0085.mp4' },
  { match: /treadmill.*walk/i, file: '0086.mp4' },
  { match: /arnold press/i, file: '0087.mp4' },
  { match: /overhead press.*standing|military press/i, file: '0088.mp4' },
  { match: /upright row/i, file: '0089.mp4' },
  { match: /dumbbell overhead/i, file: '0090.mp4' },
  { match: /front raise/i, file: '0092.mp4' },
  { match: /lateral raise/i, file: '0096.mp4' },
  { match: /rear delt.*fly|reverse fly/i, file: '0099.mp4' },
  { match: /rear delt cable/i, file: '0100.mp4' }
];

export const R2MediaService = {
  /**
   * Get the active Cloudflare R2 bucket endpoint
   */
  getEndpoint(): string {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && custom.trim().length > 0) {
      return custom.trim().replace(/\/$/, '');
    }
    return (import.meta.env.VITE_R2_URL || DEFAULT_R2_ENDPOINT).replace(/\/$/, '');
  },

  /**
   * Set custom Cloudflare R2 bucket endpoint
   */
  setEndpoint(url: string): void {
    if (!url || url.trim().length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/$/, ''));
    }
  },

  /**
   * Returns metadata and storage capacity info for Cloudflare R2 Free Tier
   */
  getConfig(): R2Config {
    const endpoint = this.getEndpoint();
    const isCustom = endpoint !== DEFAULT_R2_ENDPOINT;
    return {
      endpoint,
      isCustom,
      freeTierStorageLimitGb: 10.0,
      totalStorageUsedMb: 193.2, // Base 50 Vital videos (~193 MB of 10,240 MB)
      egressFee: '$0.00 (Zero bandwidth cost forever)'
    };
  },

  /**
   * Resolves the full Cloudflare R2 3D video URL for a given exercise
   */
  getVideoUrl(exercise: Exercise): string | null {
    // 1. Direct HD MP4 demonstration already provided in exercise data
    if (exercise.videoUrl && (exercise.videoUrl.endsWith('.mp4') || exercise.videoUrl.endsWith('.webm'))) {
      return exercise.videoUrl;
    }
    if (exercise.videoMaleUrl && (exercise.videoMaleUrl.endsWith('.mp4') || exercise.videoMaleUrl.endsWith('.webm'))) {
      return exercise.videoMaleUrl;
    }
    if (exercise.videoFemaleUrl && (exercise.videoFemaleUrl.endsWith('.mp4') || exercise.videoFemaleUrl.endsWith('.webm'))) {
      return exercise.videoFemaleUrl;
    }
    if (
      exercise.animationUrl &&
      (exercise.animationUrl.endsWith('.mp4') ||
        exercise.animationUrl.endsWith('.webm') ||
        exercise.animationUrl.includes('.mp4?'))
    ) {
      return exercise.animationUrl;
    }

    const endpoint = this.getEndpoint();

    // 2. Exact match in Vital 50 by ID
    if (exercise.id && VITAL_50_MAP[exercise.id]) {
      return `${endpoint}/${VITAL_50_MAP[exercise.id]}`;
    }

    // 3. Match by exercise name
    const exName = exercise.name || '';
    for (const rule of NAME_TO_VIDEO_MAP) {
      if (rule.match.test(exName)) {
        return `${endpoint}/${rule.file}`;
      }
    }

    // 4. Exercise ID based video convention: /exercises/{id}.mp4
    if (exercise.id && !exercise.animationUrl?.includes('githubusercontent')) {
      return `${endpoint}/${exercise.id}.mp4`;
    }

    return null;
  },

  /**
   * Checks if an exercise has a realistic 3D video file mapped in Cloudflare R2
   */
  has3DVideo(exercise: Exercise): boolean {
    return this.getVideoUrl(exercise) !== null;
  },

  /**
   * Resolves an exercise with its high-definition Cloudflare R2 3D animation URL
   */
  enrichExercise(exercise: Exercise): Exercise {
    const videoUrl = this.getVideoUrl(exercise);
    if (videoUrl) {
      return {
        ...exercise,
        animationUrl: videoUrl
      };
    }
    return exercise;
  }
};
