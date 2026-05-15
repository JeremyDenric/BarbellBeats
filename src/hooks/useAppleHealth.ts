import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  requestHealthKitAuthorization,
  countHealthKitWorkouts,
  fetchStrengthWorkouts,
  type HealthWorkoutSummary,
} from '../services/appleHealthService';
import devLog from '../utils/devLog';

export interface AppleHealthState {
  isAvailable: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  workoutCount: number;
  recentWorkouts: HealthWorkoutSummary[];
  authorize: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useAppleHealth(): AppleHealthState {
  const isAvailable = Platform.OS === 'ios';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<HealthWorkoutSummary[]>([]);

  const authorize = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;
    setIsLoading(true);
    try {
      const granted = await requestHealthKitAuthorization();
      setIsAuthorized(granted);
      if (granted) {
        const [count, recent] = await Promise.all([
          countHealthKitWorkouts(),
          fetchStrengthWorkouts(10),
        ]);
        setWorkoutCount(count);
        setRecentWorkouts(recent);
      }
      return granted;
    } catch (err) {
      devLog.error('[useAppleHealth] Authorization error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!isAvailable || !isAuthorized) return;
    setIsLoading(true);
    try {
      const [count, recent] = await Promise.all([
        countHealthKitWorkouts(),
        fetchStrengthWorkouts(10),
      ]);
      setWorkoutCount(count);
      setRecentWorkouts(recent);
    } catch (err) {
      devLog.error('[useAppleHealth] Refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, isAuthorized]);

  return { isAvailable, isAuthorized, isLoading, workoutCount, recentWorkouts, authorize, refresh };
}
