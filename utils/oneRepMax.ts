/**
 * 1RM (One Repetition Maximum) Calculation Utilities
 * Based on recognized exercise physiology formulas: Epley and Brzycki.
 */

export interface OneRepMaxResult {
  oneRepMax: number;
  epley: number;
  brzycki: number;
  percentages: Record<number, number>; // e.g. { 95: weight, 90: weight, ... }
}

/**
 * Calculates estimated One Repetition Maximum (1RM).
 *
 * @param weight The weight lifted (kg or lbs).
 * @param reps The number of repetitions completed (recommended 1-12).
 */
export function calculateOneRepMax(weight: number, reps: number): OneRepMaxResult {
  if (weight <= 0 || reps <= 0) {
    return {
      oneRepMax: 0,
      epley: 0,
      brzycki: 0,
      percentages: {},
    };
  }

  if (reps === 1) {
    const percentages: Record<number, number> = {};
    [95, 90, 85, 80, 75, 70, 65, 60, 50].forEach(p => {
      percentages[p] = Math.round((weight * p) / 100 * 10) / 10;
    });
    return {
      oneRepMax: weight,
      epley: weight,
      brzycki: weight,
      percentages,
    };
  }

  // Epley formula: weight * (1 + reps / 30)
  const epley = weight * (1 + reps / 30);

  // Brzycki formula: weight * (36 / (37 - reps))
  const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley;

  // Average of standard formulas for high precision
  const avg = Math.round(((epley + brzycki) / 2) * 10) / 10;

  const percentages: Record<number, number> = {};
  [95, 90, 85, 80, 75, 70, 65, 60, 50].forEach(p => {
    percentages[p] = Math.round((avg * p) / 100 * 10) / 10;
  });

  return {
    oneRepMax: avg,
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    percentages,
  };
}
