/**
 * Split Generator Service
 * Generates splits (mile/km segments) from route coordinates
 */

import type { RouteCoordinate, CardioSplit, DistanceUnit } from '../../../shared/src/types/cardio';

// ============================================================================
// Constants
// ============================================================================

const METERS_PER_MILE = 1609.34;
const METERS_PER_KM = 1000;

// ============================================================================
// Generator Functions
// ============================================================================

/**
 * Generate splits from route coordinates
 *
 * @param coordinates - Array of route coordinates
 * @param unit - Distance unit for splits (miles or kilometers)
 * @returns Array of CardioSplit objects
 */
export function generateSplits(
  coordinates: RouteCoordinate[],
  unit: DistanceUnit = 'miles'
): CardioSplit[] {
  if (coordinates.length < 2) {
    return [];
  }

  const splitDistance = unit === 'miles' ? METERS_PER_MILE : METERS_PER_KM;
  const splits: CardioSplit[] = [];

  let currentSplitNumber = 1;
  let currentSplitDistance = 0;
  let currentSplitStartTime = new Date(coordinates[0].timestamp).getTime();
  let totalDistance = 0;
  let heartRateSum = 0;
  let heartRateCount = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];

    // Calculate distance between points
    const segmentDistance = calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );

    currentSplitDistance += segmentDistance;
    totalDistance += segmentDistance;

    // Track heart rate for average (if available)
    // Note: Heart rate would need to be added to RouteCoordinate in actual implementation
    // For now, this is a placeholder

    // Check if we've completed a split
    if (currentSplitDistance >= splitDistance) {
      const splitEndTime = new Date(curr.timestamp).getTime();
      const splitDuration = (splitEndTime - currentSplitStartTime) / 1000; // seconds

      // Calculate pace (seconds per km)
      const splitDistanceKm = splitDistance / 1000;
      const pace = splitDuration / splitDistanceKm;

      const split: CardioSplit = {
        splitNumber: currentSplitNumber,
        distance: splitDistance,
        duration: Math.round(splitDuration),
        pace: Math.round(pace),
        averageHeartRate: heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : undefined,
      };

      splits.push(split);

      // Reset for next split
      currentSplitNumber++;
      currentSplitDistance = currentSplitDistance - splitDistance; // Carry over excess distance
      currentSplitStartTime = splitEndTime;
      heartRateSum = 0;
      heartRateCount = 0;
    }
  }

  // Add final partial split if there's remaining distance
  if (currentSplitDistance > 100 && coordinates.length > 0) { // At least 100 meters
    const lastCoord = coordinates[coordinates.length - 1];
    const splitEndTime = new Date(lastCoord.timestamp).getTime();
    const splitDuration = (splitEndTime - currentSplitStartTime) / 1000;

    const splitDistanceKm = currentSplitDistance / 1000;
    const pace = splitDuration / splitDistanceKm;

    const split: CardioSplit = {
      splitNumber: currentSplitNumber,
      distance: currentSplitDistance,
      duration: Math.round(splitDuration),
      pace: Math.round(pace),
      averageHeartRate: heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : undefined,
    };

    splits.push(split);
  }

  return splits;
}

/**
 * Generate splits from distance and time markers
 * Useful when you have distance/time data but not full GPS coordinates
 *
 * @param totalDistance - Total distance in meters
 * @param totalDuration - Total duration in seconds
 * @param unit - Distance unit for splits
 * @returns Array of estimated CardioSplit objects
 */
export function generateSplitsFromDistanceTime(
  totalDistance: number,
  totalDuration: number,
  unit: DistanceUnit = 'miles'
): CardioSplit[] {
  const splitDistance = unit === 'miles' ? METERS_PER_MILE : METERS_PER_KM;
  const totalSplits = Math.floor(totalDistance / splitDistance);

  if (totalSplits === 0) {
    return [];
  }

  const splits: CardioSplit[] = [];

  // Calculate average pace for estimation
  const avgPaceSecondsPerKm = (totalDuration / (totalDistance / 1000));

  for (let i = 1; i <= totalSplits; i++) {
    // Estimate duration for this split
    const splitDuration = (splitDistance / 1000) * avgPaceSecondsPerKm;

    const split: CardioSplit = {
      splitNumber: i,
      distance: splitDistance,
      duration: Math.round(splitDuration),
      pace: Math.round(avgPaceSecondsPerKm),
    };

    splits.push(split);
  }

  // Add partial split for remaining distance
  const remainingDistance = totalDistance - (totalSplits * splitDistance);
  if (remainingDistance > 100) { // At least 100 meters
    const splitDuration = (remainingDistance / 1000) * avgPaceSecondsPerKm;

    const split: CardioSplit = {
      splitNumber: totalSplits + 1,
      distance: remainingDistance,
      duration: Math.round(splitDuration),
      pace: Math.round(avgPaceSecondsPerKm),
    };

    splits.push(split);
  }

  return splits;
}

/**
 * Find fastest split
 */
export function findFastestSplit(splits: CardioSplit[]): CardioSplit | null {
  if (splits.length === 0) {
    return null;
  }

  return splits.reduce((fastest, current) => {
    return current.pace < fastest.pace ? current : fastest;
  });
}

/**
 * Find slowest split
 */
export function findSlowestSplit(splits: CardioSplit[]): CardioSplit | null {
  if (splits.length === 0) {
    return null;
  }

  return splits.reduce((slowest, current) => {
    return current.pace > slowest.pace ? current : slowest;
  });
}

/**
 * Calculate average split pace
 */
export function getAverageSplitPace(splits: CardioSplit[]): number {
  if (splits.length === 0) {
    return 0;
  }

  const totalPace = splits.reduce((sum, split) => sum + split.pace, 0);
  return totalPace / splits.length;
}

/**
 * Get split at specific distance
 *
 * @param splits - Array of splits
 * @param distance - Target distance in meters
 * @returns Split containing that distance, or null
 */
export function getSplitAtDistance(splits: CardioSplit[], distance: number): CardioSplit | null {
  let accumulatedDistance = 0;

  for (const split of splits) {
    accumulatedDistance += split.distance;
    if (accumulatedDistance >= distance) {
      return split;
    }
  }

  return null;
}

/**
 * Calculate pace variation (standard deviation)
 * Useful for understanding consistency
 */
export function calculatePaceVariation(splits: CardioSplit[]): number {
  if (splits.length < 2) {
    return 0;
  }

  const avgPace = getAverageSplitPace(splits);

  const squaredDiffs = splits.map(split => {
    const diff = split.pace - avgPace;
    return diff * diff;
  });

  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / splits.length;
  return Math.sqrt(variance);
}

/**
 * Detect negative splits (getting faster over time)
 * Returns true if the second half is faster than the first half
 */
export function hasNegativeSplits(splits: CardioSplit[]): boolean {
  if (splits.length < 2) {
    return false;
  }

  const midpoint = Math.floor(splits.length / 2);
  const firstHalf = splits.slice(0, midpoint);
  const secondHalf = splits.slice(midpoint);

  const firstHalfAvg = getAverageSplitPace(firstHalf);
  const secondHalfAvg = getAverageSplitPace(secondHalf);

  return secondHalfAvg < firstHalfAvg; // Lower pace = faster
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format split pace as string
 */
export function formatSplitPace(secondsPerKm: number, unit: DistanceUnit = 'miles'): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) {
    return '--:--';
  }

  const multiplier = unit === 'miles' ? 1.60934 : 1;
  const secondsPerUnit = secondsPerKm * multiplier;

  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.floor(secondsPerUnit % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format split distance as string
 */
export function formatSplitDistance(meters: number, unit: DistanceUnit = 'miles'): string {
  if (unit === 'miles') {
    const miles = meters / METERS_PER_MILE;
    return `${miles.toFixed(2)} mi`;
  } else {
    const km = meters / METERS_PER_KM;
    return `${km.toFixed(2)} km`;
  }
}
