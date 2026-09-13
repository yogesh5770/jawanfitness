// Scientific Biometric MET (Metabolic Equivalent of Task) Calorie Burn Engine
// Standardized by the American College of Sports Medicine (ACSM)

export interface CalorieParameters {
  weightKg: number;
  heightCm: number;
  durationMinutes: number;
  exerciseCategory?: string;
  totalVolumeKg?: number;
  completedSets?: number;
}

export const CalorieCalculator = {
  // Base MET ratings by exercise category
  getMetValue(category: string = 'General'): number {
    const cat = category.toLowerCase();
    if (cat.includes('cardio') || cat.includes('bike') || cat.includes('sprint')) return 8.5;
    if (cat.includes('squat') || cat.includes('deadlift') || cat.includes('legs')) return 7.0;
    if (cat.includes('chest') || cat.includes('back') || cat.includes('compound')) return 6.0;
    if (cat.includes('bicep') || cat.includes('tricep') || cat.includes('arm')) return 4.5;
    if (cat.includes('abs') || cat.includes('core')) return 5.0;
    return 5.5; // Moderate gym resistance training baseline
  },

  calculateSessionCalories({
    weightKg = 103.6,
    heightCm = 178,
    durationMinutes = 0,
    exerciseCategory = 'General',
    totalVolumeKg = 0,
    completedSets: _completedSets = 0
  }: CalorieParameters): number {
    if (durationMinutes <= 0) return 0;

    const met = this.getMetValue(exerciseCategory);

    // Standard ACSM metabolic formula:
    // Calories/min = (MET * 3.5 * weightKg) / 200
    const baseCaloriesPerMin = (met * 3.5 * weightKg) / 200;
    let totalCalories = baseCaloriesPerMin * durationMinutes;

    // Height & Work Density factor (taller lifters perform greater mechanical displacement)
    const heightFactor = Math.max(0.9, heightCm / 175);
    totalCalories *= heightFactor;

    // Additional caloric expenditure from total mechanical volume lifted (approx. 0.015 kcal per kg lifted)
    if (totalVolumeKg > 0) {
      const volumeCalories = (totalVolumeKg * 0.012);
      totalCalories += volumeCalories;
    }

    return Math.round(totalCalories);
  }
};
