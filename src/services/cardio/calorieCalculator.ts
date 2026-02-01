/**
 * Calorie Calculator Service
 * MET-based calorie calculation for different cardio activities
 */

import type { ActivityType } from '../../../shared/src/types/cardio';

// ============================================================================
// MET (Metabolic Equivalent of Task) Values
// ============================================================================

/**
 * MET values for different activities and intensities
 * Source: Compendium of Physical Activities
 */
const MET_VALUES = {
  // Running (based on pace/speed)
  running: {
    slow: 6.0,        // < 5 mph (12 min/mile)
    light: 8.3,       // 5 mph (12 min/mile)
    moderate: 9.8,    // 6 mph (10 min/mile)
    vigorous: 11.0,   // 7 mph (8:34 min/mile)
    fast: 11.8,       // 8 mph (7:30 min/mile)
    veryFast: 12.8,   // 9 mph (6:40 min/mile)
    sprint: 14.5,     // 10+ mph
  },

  // Cycling (based on speed)
  cycling: {
    leisure: 4.0,     // < 10 mph
    light: 6.8,       // 10-11.9 mph
    moderate: 8.0,    // 12-13.9 mph
    vigorous: 10.0,   // 14-15.9 mph
    racing: 12.0,     // 16-19 mph
    fast: 15.8,       // 20+ mph
  },

  // Walking (based on pace)
  walking: {
    slow: 2.0,        // < 2 mph
    casual: 2.5,      // 2 mph
    moderate: 3.5,    // 3-3.5 mph
    brisk: 4.3,       // 3.5-4 mph
    veryBrisk: 5.0,   // 4.5+ mph
  },

  // Other activities
  rowing: {
    light: 3.5,
    moderate: 7.0,
    vigorous: 8.5,
    intense: 12.0,
  },

  elliptical: {
    light: 5.0,
    moderate: 6.0,
    vigorous: 8.0,
  },

  stairs: {
    slow: 4.0,
    moderate: 8.0,
    vigorous: 12.0,
  },
};

// ============================================================================
// Calculator Functions
// ============================================================================

/**
 * Calculate calories burned based on activity type, pace, duration, and user weight
 *
 * Formula: Calories = MET × weight(kg) × duration(hours)
 *
 * @param activityType - Type of cardio activity
 * @param pace - Average pace in seconds per km
 * @param duration - Duration in seconds
 * @param userWeight - User weight in kg (optional, defaults to 70kg)
 * @returns Estimated calories burned
 */
export function calculateCalories(
  activityType: ActivityType,
  pace: number,
  duration: number,
  userWeight: number = 70
): number {
  // Get MET value based on activity and intensity
  const met = getMETValue(activityType, pace);

  // Convert duration to hours
  const hours = duration / 3600;

  // Calculate calories
  const calories = met * userWeight * hours;

  return Math.round(calories);
}

/**
 * Calculate calories from distance and duration
 *
 * @param activityType - Type of cardio activity
 * @param distance - Distance in meters
 * @param duration - Duration in seconds
 * @param userWeight - User weight in kg
 * @returns Estimated calories burned
 */
export function calculateCaloriesFromDistance(
  activityType: ActivityType,
  distance: number,
  duration: number,
  userWeight: number = 70
): number {
  // Calculate average pace (seconds per km)
  const distanceKm = distance / 1000;
  const pace = distanceKm > 0 ? duration / distanceKm : 0;

  return calculateCalories(activityType, pace, duration, userWeight);
}

/**
 * Get MET value based on activity type and pace
 *
 * @param activityType - Type of cardio activity
 * @param pace - Average pace in seconds per km
 * @returns MET value
 */
export function getMETValue(activityType: ActivityType, pace: number): number {
  // Convert pace to speed (km/h)
  const speedKmh = pace > 0 ? 3600 / pace : 0;
  const speedMph = speedKmh * 0.621371;

  switch (activityType) {
    case 'running':
      return getRunningMET(speedMph);

    case 'cycling':
      return getCyclingMET(speedMph);

    case 'walking':
      return getWalkingMET(speedMph);

    case 'rowing':
      return getRowingMET(speedKmh);

    case 'elliptical':
      return MET_VALUES.elliptical.moderate;

    case 'stairs':
      return MET_VALUES.stairs.moderate;

    default:
      return 5.0; // Default moderate activity
  }
}

/**
 * Get MET value for running based on speed
 */
function getRunningMET(speedMph: number): number {
  if (speedMph < 5) return MET_VALUES.running.slow;
  if (speedMph < 6) return MET_VALUES.running.light;
  if (speedMph < 7) return MET_VALUES.running.moderate;
  if (speedMph < 8) return MET_VALUES.running.vigorous;
  if (speedMph < 9) return MET_VALUES.running.fast;
  if (speedMph < 10) return MET_VALUES.running.veryFast;
  return MET_VALUES.running.sprint;
}

/**
 * Get MET value for cycling based on speed
 */
function getCyclingMET(speedMph: number): number {
  if (speedMph < 10) return MET_VALUES.cycling.leisure;
  if (speedMph < 12) return MET_VALUES.cycling.light;
  if (speedMph < 14) return MET_VALUES.cycling.moderate;
  if (speedMph < 16) return MET_VALUES.cycling.vigorous;
  if (speedMph < 20) return MET_VALUES.cycling.racing;
  return MET_VALUES.cycling.fast;
}

/**
 * Get MET value for walking based on speed
 */
function getWalkingMET(speedMph: number): number {
  if (speedMph < 2) return MET_VALUES.walking.slow;
  if (speedMph < 3) return MET_VALUES.walking.casual;
  if (speedMph < 3.5) return MET_VALUES.walking.moderate;
  if (speedMph < 4) return MET_VALUES.walking.brisk;
  return MET_VALUES.walking.veryBrisk;
}

/**
 * Get MET value for rowing based on intensity (estimated from speed)
 */
function getRowingMET(speedKmh: number): number {
  if (speedKmh < 5) return MET_VALUES.rowing.light;
  if (speedKmh < 8) return MET_VALUES.rowing.moderate;
  if (speedKmh < 11) return MET_VALUES.rowing.vigorous;
  return MET_VALUES.rowing.intense;
}

/**
 * Calculate calories per mile/kilometer
 *
 * @param activityType - Type of cardio activity
 * @param userWeight - User weight in kg
 * @param unit - Distance unit (miles or kilometers)
 * @returns Estimated calories per distance unit
 */
export function getCaloriesPerDistance(
  activityType: ActivityType,
  userWeight: number = 70,
  unit: 'miles' | 'kilometers' = 'miles'
): number {
  // Use moderate MET values for estimation
  let met: number;

  switch (activityType) {
    case 'running':
      met = MET_VALUES.running.moderate;
      break;
    case 'cycling':
      met = MET_VALUES.cycling.moderate;
      break;
    case 'walking':
      met = MET_VALUES.walking.moderate;
      break;
    case 'rowing':
      met = MET_VALUES.rowing.moderate;
      break;
    case 'elliptical':
      met = MET_VALUES.elliptical.moderate;
      break;
    case 'stairs':
      met = MET_VALUES.stairs.moderate;
      break;
    default:
      met = 5.0;
  }

  // Assume moderate pace: 10 min/mile for running, 15 mph for cycling, 3.5 mph for walking
  const timePerMile = activityType === 'running' ? 10 / 60 : // 10 minutes
                      activityType === 'cycling' ? 4 / 60 :   // 4 minutes
                      17 / 60;                                // 17 minutes

  const timePerKm = timePerMile / 1.60934;

  const time = unit === 'miles' ? timePerMile : timePerKm;

  return Math.round(met * userWeight * time);
}

/**
 * Estimate total calories for a planned workout
 *
 * @param activityType - Type of cardio activity
 * @param goalType - Type of goal (distance or time)
 * @param goalValue - Goal value (meters for distance, seconds for time)
 * @param targetPace - Target pace in seconds per km
 * @param userWeight - User weight in kg
 * @returns Estimated calories for planned workout
 */
export function estimatePlannedCalories(
  activityType: ActivityType,
  goalType: 'distance' | 'time',
  goalValue: number,
  targetPace: number,
  userWeight: number = 70
): number {
  if (goalType === 'distance') {
    // Calculate estimated duration from distance and target pace
    const distanceKm = goalValue / 1000;
    const estimatedDuration = distanceKm * targetPace;

    return calculateCalories(activityType, targetPace, estimatedDuration, userWeight);
  } else {
    // goalType === 'time'
    return calculateCalories(activityType, targetPace, goalValue, userWeight);
  }
}
