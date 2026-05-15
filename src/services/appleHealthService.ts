/**
 * Apple Health integration via HealthKit.
 * iOS-only — all exports are no-ops on Android.
 *
 * Two capabilities:
 *  READ  — Pull recent strength-training workouts to surface history in the app.
 *  WRITE — Push completed BarbellBeats workouts so they appear in Activity rings.
 */

import { Platform } from 'react-native';
import devLog from '../utils/devLog';

// Lazy-load the HealthKit module so the Android bundle never touches it.
// The import() call is resolved at build time by Metro but the module itself
// is never evaluated on Android because of the Platform.OS guard.
type HKModule = typeof import('@kingstinct/react-native-healthkit');
let hk: HKModule | null = null;

async function getHK(): Promise<HKModule | null> {
  if (Platform.OS !== 'ios') return null;
  if (hk) return hk;
  try {
    hk = await import('@kingstinct/react-native-healthkit');
    return hk;
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthWorkoutSummary {
  uuid: string;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  totalEnergyBurnedKcal: number | null;
  source: 'apple-health';
}

// ─── Authorization ───────────────────────────────────────────────────────────

/**
 * Request read + write authorization.
 * Must be called before any read/write operations.
 * Safe to call multiple times — HealthKit caches the result.
 */
export async function requestHealthKitAuthorization(): Promise<boolean> {
  const lib = await getHK();
  if (!lib) return false;
  try {
    const granted = await lib.requestAuthorization({
      toRead: [
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKQuantityTypeIdentifierHeartRate',
        'HKWorkoutTypeIdentifier',
      ] as never,
      toShare: [
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKWorkoutTypeIdentifier',
      ] as never,
    });
    devLog.log('[AppleHealth] Authorization granted:', granted);
    return granted;
  } catch (err) {
    devLog.error('[AppleHealth] Authorization failed:', err);
    return false;
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the most recent strength-training workouts from HealthKit.
 * Returns an empty array on Android or if authorization was not granted.
 */
export async function fetchStrengthWorkouts(limit = 50): Promise<HealthWorkoutSummary[]> {
  const lib = await getHK();
  if (!lib) return [];
  try {
    const { WorkoutActivityType } = lib;
    const samples = await lib.queryWorkoutSamples({
      filter: {
        workoutActivityType: WorkoutActivityType.traditionalStrengthTraining,
      },
      limit,
      ascending: false,
    });

    return samples.map((s) => ({
      uuid: s.uuid,
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
      durationMinutes: Math.round(s.duration.quantity / 60),
      totalEnergyBurnedKcal:
        s.totalEnergyBurned != null ? Math.round(s.totalEnergyBurned.quantity) : null,
      source: 'apple-health' as const,
    }));
  } catch (err) {
    devLog.error('[AppleHealth] Failed to fetch workouts:', err);
    return [];
  }
}

/**
 * Count the number of strength-training workouts recorded by ANY app in HealthKit.
 * Used for the "X workouts in Apple Health" display on PrsScreen.
 */
export async function countHealthKitWorkouts(): Promise<number> {
  const workouts = await fetchStrengthWorkouts(500);
  return workouts.length;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Save a completed BarbellBeats strength session to HealthKit.
 * This makes the workout appear in the Activity app and contributes to Move ring.
 *
 * @param startDate   When the session began
 * @param endDate     When the session ended
 * @param totalVolumeLbs  Total weight moved (lbs) — stored as a workout note via metadata
 */
export async function saveWorkoutToHealthKit(
  startDate: Date,
  endDate: Date,
  totalVolumeLbs: number
): Promise<boolean> {
  const lib = await getHK();
  if (!lib) return false;
  try {
    const { WorkoutActivityType } = lib;

    // Rough calorie estimate: 0.1 kcal per pound of volume moved (conservative)
    const estimatedKcal = Math.round(totalVolumeLbs * 0.1);

    // Pass empty quantities array — calorie total goes via the totals param
    await lib.saveWorkoutSample(
      WorkoutActivityType.traditionalStrengthTraining,
      [],
      startDate,
      endDate,
      estimatedKcal > 0 ? { energyBurned: estimatedKcal } : undefined
    );

    devLog.log('[AppleHealth] Workout saved to HealthKit');
    return true;
  } catch (err) {
    devLog.error('[AppleHealth] Failed to save workout:', err);
    return false;
  }
}
