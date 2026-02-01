/**
 * Cardio Services
 * Barrel exports for cardio tracking services
 */

export { cardioTrackingService, formatPace, formatDistance, formatDuration, convertSpeed } from './cardioTracking';
export { calculateCalories, calculateCaloriesFromDistance, getMETValue, getCaloriesPerDistance, estimatePlannedCalories } from './calorieCalculator';
export {
  generateSplits,
  generateSplitsFromDistanceTime,
  findFastestSplit,
  findSlowestSplit,
  getAverageSplitPace,
  getSplitAtDistance,
  calculatePaceVariation,
  hasNegativeSplits,
  formatSplitPace,
  formatSplitDistance,
} from './splitGenerator';
