/**
 * Jawan Fitness - Universal Weight Transformation Progress Engine
 * Accurately handles:
 * 1. Weight Gain / Hypertrophy / Bulking (Goal > Start, e.g. 60kg -> 70kg)
 * 2. Weight Loss / Cutting / Fat Loss (Goal < Start, e.g. 108kg -> 80kg)
 * 3. Weight Maintenance (Goal == Start)
 */

export interface WeightProgressMetrics {
  isWeightGain: boolean;
  isMaintenance: boolean;
  totalTargetDeltaKg: number; // Always positive magnitude from start to goal
  actualDeltaKg: number; // Signed: positive if gained, negative if lost
  progressPercent: number; // Strictly clamped 0 to 100%
  displayChangeLabel: string; // e.g. "+2.0 kg gained" or "-6.0 kg dropped"
  remainingKg: number; // Positive kg remaining to hit target
}

export function calculateWeightProgress(
  startingWeightKg: number,
  currentWeightKg: number,
  goalWeightKg: number
): WeightProgressMetrics {
  // Guard against zeroes or NaN
  const start = startingWeightKg > 0 ? startingWeightKg : 70;
  const current = currentWeightKg > 0 ? currentWeightKg : start;
  const goal = goalWeightKg > 0 ? goalWeightKg : start;

  const isWeightGain = goal > start;
  const isMaintenance = Math.abs(goal - start) < 0.2;
  const totalTargetDeltaKg = Math.max(0.1, Math.abs(goal - start));

  let actualProgressKg = 0;
  let remainingKg = 0;

  if (isWeightGain) {
    // Member wants to gain weight (e.g., 60kg -> 70kg, current 62kg)
    actualProgressKg = current - start;
    remainingKg = Math.max(0, goal - current);
  } else {
    // Member wants to lose weight (e.g., 108kg -> 80kg, current 102kg)
    actualProgressKg = start - current;
    remainingKg = Math.max(0, current - goal);
  }

  // Progress percentage strictly 0 to 100%
  const rawPercent = isMaintenance ? 100 : (actualProgressKg / totalTargetDeltaKg) * 100;
  const progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));

  const signedDiff = current - start;
  let displayChangeLabel = '';

  if (Math.abs(signedDiff) < 0.05) {
    displayChangeLabel = '0.0 kg (on track)';
  } else if (signedDiff > 0) {
    displayChangeLabel = `+${signedDiff.toFixed(1)} kg gained`;
  } else {
    displayChangeLabel = `-${Math.abs(signedDiff).toFixed(1)} kg dropped`;
  }

  return {
    isWeightGain,
    isMaintenance,
    totalTargetDeltaKg,
    actualDeltaKg: signedDiff,
    progressPercent,
    displayChangeLabel,
    remainingKg
  };
}
