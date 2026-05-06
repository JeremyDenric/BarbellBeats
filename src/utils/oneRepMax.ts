/**
 * One-rep max estimation formulas.
 * All return 0 for bodyweight exercises (weight === 0) or invalid inputs.
 */

/** Epley: w × (1 + r/30) — most common, good for 1–10 rep range */
export function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Brzycki: w × 36 / (37 - r) — more accurate for low rep ranges (1–10) */
export function brzycki(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0 || reps >= 37) return 0;
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

/** Lombardi: w × r^0.1 — tends to give higher estimates for higher rep sets */
export function lombardi(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * Math.pow(reps, 0.1);
}

/**
 * Returns the average of Epley + Brzycki for a more conservative estimate.
 * Used in PR detection where consistency matters more than precision.
 */
export function estimatedOneRepMax(weight: number, reps: number): number {
  const e = epley(weight, reps);
  const b = brzycki(weight, reps);
  if (e === 0 || b === 0) return 0;
  return (e + b) / 2;
}
