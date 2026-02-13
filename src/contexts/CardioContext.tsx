/**
 * Cardio Context
 * Manages cardio workout state and operations
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from 'react';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import devLog from '../utils/devLog';
import safeStorage from '../utils/safeStorage';
import type {
  CardioWorkout,
  CardioPreferences,
  CardioWorkoutConfig,
  CardioMetrics,
  CardioStats,
  WorkoutFilters,
  ActivityType,
  DistanceUnit,
  RouteCoordinate,
} from '../../shared/src/types/cardio';
import { apiClient } from '../api/api-client';
import { cardioTrackingService } from '../services/cardio/cardioTracking';

// ============================================================================
// Types
// ============================================================================

interface CardioContextValue {
  // Active Workout
  activeWorkout: CardioWorkout | null;
  isWorkoutActive: boolean;
  isPaused: boolean;

  // Start/Stop
  startWorkout: (config: CardioWorkoutConfig) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => Promise<CardioWorkout>;

  // Real-time Metrics
  currentMetrics: CardioMetrics;

  // History
  workouts: CardioWorkout[];
  isLoadingWorkouts: boolean;
  fetchWorkouts: (filters?: WorkoutFilters) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;

  // Stats
  stats: CardioStats | null;
  isLoadingStats: boolean;
  fetchStats: (period: 'week' | 'month' | 'year') => Promise<void>;

  // Preferences
  preferences: CardioPreferences;
  updatePreferences: (prefs: Partial<CardioPreferences>) => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const CardioContext = createContext<CardioContextValue | undefined>(undefined);

// Storage keys
const CARDIO_PREFERENCES_KEY = '@cardio_preferences';
const ACTIVE_WORKOUT_KEY = '@active_cardio_workout';

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PREFERENCES: Omit<CardioPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  defaultDistanceUnit: 'miles',
  voiceCoachEnabled: true,
  autoPauseEnabled: true,
  bpmSyncEnabled: true,
};

const DEFAULT_METRICS: CardioMetrics = {
  duration: 0,
  distance: 0,
  currentPace: 0,
  averagePace: 0,
  currentSpeed: 0,
  calories: 0,
  elevationGain: 0,
};

// ============================================================================
// Provider Component
// ============================================================================

interface CardioProviderProps {
  children: ReactNode;
}

export function CardioProvider({ children }: CardioProviderProps) {
  const [activeWorkout, setActiveWorkout] = useState<CardioWorkout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<CardioMetrics>(DEFAULT_METRICS);
  const [workouts, setWorkouts] = useState<CardioWorkout[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [stats, setStats] = useState<CardioStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [preferences, setPreferences] = useState<CardioPreferences>({
    id: '',
    userId: '',
    ...DEFAULT_PREFERENCES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Store route coordinates in a ref to avoid re-renders
  const routeCoordinatesRef = useRef<RouteCoordinate[]>([]);
  const maxPaceRef = useRef<number>(0);
  const maxSpeedRef = useRef<number>(0);

  // Initialize state from storage
  useEffect(() => {
    loadPreferences();
    loadActiveWorkout();
  }, []);

  // Safety cleanup: stop tracking if context unmounts mid-workout
  useEffect(() => {
    return () => {
      const trackingState = cardioTrackingService.getState();
      if (trackingState.isTracking) {
        cardioTrackingService.stopTracking().catch((error) => {
          devLog.error('Failed to cleanup tracking on unmount:', error);
        });
      }
    };
  }, []);

  /**
   * Load preferences from AsyncStorage
   */
  const loadPreferences = async () => {
    try {
      const stored = await safeStorage.getJSON<CardioPreferences>(CARDIO_PREFERENCES_KEY, {
        defaultValue: null,
      });

      if (stored) {
        setPreferences(stored);
      } else {
        // Fetch from API if not in storage
        try {
          const response = await apiClient.getCardioPreferences();
          if (response.success && response.data) {
            setPreferences(response.data);
            await safeStorage.setJSON(CARDIO_PREFERENCES_KEY, response.data);
          }
        } catch (error) {
          devLog.error('[CardioContext] Failed to fetch cardio preferences:', error);
          if (!__DEV__) {
            Sentry.captureException(error, {
              tags: { context: 'cardio', operation: 'fetch_preferences' },
            });
          }
        }
      }
    } catch (error) {
      devLog.error('[CardioContext] Failed to load cardio preferences:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'cardio', operation: 'load_preferences' },
        });
      }
    }
  };

  /**
   * Start GPS tracking
   */
  const startGPSTracking = async () => {
    await cardioTrackingService.startTracking({
      onMetricsUpdate: (metrics) => {
        setCurrentMetrics(metrics);

        // Track max values
        if (metrics.currentPace > maxPaceRef.current) {
          maxPaceRef.current = metrics.currentPace;
        }
        if (metrics.currentSpeed > maxSpeedRef.current) {
          maxSpeedRef.current = metrics.currentSpeed;
        }
      },
      onLocationUpdate: (coordinate) => {
        routeCoordinatesRef.current.push(coordinate);
      },
      onAutoPause: () => {
        setIsPaused(true);
      },
      onAutoResume: () => {
        setIsPaused(false);
      },
    });
  };

  /**
   * Load active workout from AsyncStorage (in case app was closed during workout)
   */
  const loadActiveWorkout = async () => {
    try {
      const workout = await safeStorage.getJSON<CardioWorkout>(ACTIVE_WORKOUT_KEY, {
        defaultValue: null,
      });

      if (workout) {
        setActiveWorkout(workout);

        // Resume tracking if workout was in progress
        if (workout && !workout.completedAt) {
          // Check if this is an outdoor activity that should have GPS tracking
          const needsGPS = workout.location === 'outdoor';
          if (needsGPS) {
            try {
              // Resume tracking from where we left off
              await startGPSTracking();
            } catch (error) {
              devLog.error('Failed to resume GPS tracking:', error);
              // Continue without GPS - workout data is still valid
            }
          }
        }
      }
    } catch (error) {
      devLog.error('Failed to load active workout:', error);
    }
  };

  /**
   * Start a new cardio workout
   */
  const startWorkout = useCallback(async (config: CardioWorkoutConfig) => {
    try {
      const now = new Date().toISOString();

      const newWorkout: Partial<CardioWorkout> = {
        activityType: config.activityType,
        location: config.location,
        startedAt: now,
        duration: 0,
        pausedDuration: 0,
        distance: 0,
        distanceUnit: preferences.defaultDistanceUnit,
        averagePace: 0,
        maxPace: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        calories: 0,
        splits: [],
        bpmSyncEnabled: config.bpmSyncEnabled,
        goalType: config.goalType,
        goalValue: config.goalValue,
        goalAchieved: false,
        musicPlaylistId: config.musicPlaylistId,
        musicPlaylistName: config.musicPlaylistName,
        tracksPlayed: [],
      };

      setActiveWorkout(newWorkout as CardioWorkout);
      setIsPaused(false);
      setCurrentMetrics(DEFAULT_METRICS);

      // Reset tracking refs
      routeCoordinatesRef.current = [];
      maxPaceRef.current = 0;
      maxSpeedRef.current = 0;

      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(newWorkout));

      // Start GPS tracking for outdoor activities
      if (config.location === 'outdoor') {
        try {
          await startGPSTracking();
        } catch (error) {
          devLog.error('Failed to start GPS tracking:', error);
          throw new Error('GPS tracking unavailable. Please enable location services.');
        }
      }

      // TODO: Start heart rate monitoring (requires Apple Health/Google Fit integration)
      // TODO: Start cadence detection (requires motion sensors)
    } catch (error) {
      devLog.error('Failed to start cardio workout:', error);
      throw error;
    }
  }, [preferences.defaultDistanceUnit]);

  /**
   * Pause the active workout
   */
  const pauseWorkout = useCallback(() => {
    if (!activeWorkout || isPaused) return;

    setIsPaused(true);

    // Pause GPS tracking if active
    const trackingState = cardioTrackingService.getState();
    if (trackingState.isTracking && !trackingState.isPaused) {
      cardioTrackingService.pause();
    }
  }, [activeWorkout, isPaused]);

  /**
   * Resume the paused workout
   */
  const resumeWorkout = useCallback(() => {
    if (!activeWorkout || !isPaused) return;

    setIsPaused(false);

    // Resume GPS tracking if it was paused
    const trackingState = cardioTrackingService.getState();
    if (trackingState.isTracking && trackingState.isPaused) {
      cardioTrackingService.resume();
    }
  }, [activeWorkout, isPaused]);

  /**
   * End the active workout and save it
   */
  const endWorkout = useCallback(async (): Promise<CardioWorkout> => {
    if (!activeWorkout) {
      throw new Error('No active workout to end');
    }

    try {
      const now = new Date().toISOString();

      // Stop GPS tracking if active and get final data
      let gpsData: any = null;
      const trackingState = cardioTrackingService.getState();
      if (trackingState.isTracking) {
        gpsData = await cardioTrackingService.stopTracking();
      }

      // Calculate splits (1km or 1mi intervals)
      const splits: Array<{ distance: number; time: number; pace: number }> = [];
      if (gpsData && gpsData.routeCoordinates.length > 0) {
        const splitDistance = activeWorkout.distanceUnit === 'miles' ? 1609.34 : 1000; // meters
        let currentSplitDistance = 0;
        let currentSplitTime = 0;
        const startTime = new Date(activeWorkout.startedAt).getTime();

        for (let i = 1; i < gpsData.routeCoordinates.length; i++) {
          // Haversine distance between consecutive GPS points (meters)
          const prev = gpsData.routeCoordinates[i - 1];
          const curr = gpsData.routeCoordinates[i];
          const R = 6371e3; // Earth radius in meters
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const dLat = toRad(curr.latitude - prev.latitude);
          const dLon = toRad(curr.longitude - prev.longitude);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(prev.latitude)) *
              Math.cos(toRad(curr.latitude)) *
              Math.sin(dLon / 2) ** 2;
          const segmentDist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          currentSplitDistance += segmentDist;
          currentSplitTime = new Date(gpsData.routeCoordinates[i].timestamp).getTime() - startTime;

          if (currentSplitDistance >= splitDistance) {
            const pace = currentSplitTime / 1000 / (currentSplitDistance / 1000); // sec/km
            splits.push({
              splitNumber: splits.length + 1,
              distance: splitDistance,
              duration: currentSplitTime / 1000,
              pace,
            });
            currentSplitDistance = 0;
          }
        }
      }

      const completedWorkout: CardioWorkout = {
        ...activeWorkout,
        completedAt: now,
        duration: gpsData?.duration || currentMetrics.duration,
        pausedDuration: gpsData?.pausedDuration || 0,
        distance: gpsData?.totalDistance || currentMetrics.distance,
        averagePace: currentMetrics.averagePace,
        maxPace: maxPaceRef.current,
        averageSpeed: currentMetrics.currentSpeed,
        maxSpeed: gpsData?.maxSpeed || maxSpeedRef.current,
        calories: currentMetrics.calories,
        elevationGain: gpsData?.elevationGain || currentMetrics.elevationGain,
        splits,
        route: routeCoordinatesRef.current.length > 0 ? routeCoordinatesRef.current : undefined,
      };

      // Save to API
      const response = await apiClient.createCardioWorkout(completedWorkout);
      if (response.success && response.data) {
        // Create workout log entry for this cardio workout
        try {
          const activityName = activeWorkout.activityType.charAt(0).toUpperCase() + activeWorkout.activityType.slice(1);
          const distance = completedWorkout.distance.toFixed(2);
          const distanceUnit = completedWorkout.distanceUnit === 'miles' ? 'mi' : 'km';
          const calories = completedWorkout.calories.toFixed(0);
          const duration = Math.floor(completedWorkout.duration / 60); // minutes

          await apiClient.createWorkout({
            title: `${activityName} - ${distance}${distanceUnit}`,
            notes: `${duration} min | ${calories} cal | ${activeWorkout.location}`,
            startedAt: activeWorkout.startedAt,
            completedAt: now,
            duration: completedWorkout.duration,
            cardioWorkoutId: response.data.id,
          });
        } catch (error) {
          devLog.error('Failed to create workout log entry for cardio workout:', error);
          // Don't fail the entire operation if workout log creation fails
        }

        // Clear active workout and reset refs
        setActiveWorkout(null);
        setIsPaused(false);
        setCurrentMetrics(DEFAULT_METRICS);
        routeCoordinatesRef.current = [];
        maxPaceRef.current = 0;
        maxSpeedRef.current = 0;
        await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);

        // Add to workouts list
        setWorkouts(prev => [response.data!, ...prev]);

        return response.data;
      }

      throw new Error('Failed to save workout');
    } catch (error) {
      devLog.error('Failed to end cardio workout:', error);
      throw error;
    }
  }, [activeWorkout, currentMetrics]);

  /**
   * Fetch cardio workout history
   */
  const fetchWorkouts = useCallback(async (filters?: WorkoutFilters) => {
    try {
      setIsLoadingWorkouts(true);
      const response = await apiClient.getCardioWorkouts(filters);

      if (response.success && response.data) {
        setWorkouts(response.data);
      }
    } catch (error) {
      devLog.error('Failed to fetch cardio workouts:', error);
    } finally {
      setIsLoadingWorkouts(false);
    }
  }, []);

  /**
   * Delete a cardio workout
   */
  const deleteWorkout = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteCardioWorkout(id);

      if (response.success) {
        setWorkouts(prev => prev.filter(w => w.id !== id));
      }
    } catch (error) {
      devLog.error('Failed to delete cardio workout:', error);
      throw error;
    }
  }, []);

  /**
   * Fetch cardio statistics
   */
  const fetchStats = useCallback(async (period: 'week' | 'month' | 'year') => {
    try {
      setIsLoadingStats(true);
      const response = await apiClient.getCardioStats(period);

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      devLog.error('Failed to fetch cardio stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  /**
   * Update cardio preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<CardioPreferences>) => {
    try {
      const updatedPrefs = { ...preferences, ...updates };
      setPreferences(updatedPrefs);

      // Save to AsyncStorage
      await AsyncStorage.setItem(CARDIO_PREFERENCES_KEY, JSON.stringify(updatedPrefs));

      // Save to API
      await apiClient.updateCardioPreferences(updates);
    } catch (error) {
      devLog.error('Failed to update cardio preferences:', error);
      throw error;
    }
  }, [preferences]);

  const value = useMemo<CardioContextValue>(
    () => ({
      activeWorkout,
      isWorkoutActive: !!activeWorkout,
      isPaused,
      startWorkout,
      pauseWorkout,
      resumeWorkout,
      endWorkout,
      currentMetrics,
      workouts,
      isLoadingWorkouts,
      fetchWorkouts,
      deleteWorkout,
      stats,
      isLoadingStats,
      fetchStats,
      preferences,
      updatePreferences,
    }),
    [activeWorkout, isPaused, startWorkout, pauseWorkout, resumeWorkout, endWorkout, currentMetrics, workouts, isLoadingWorkouts, fetchWorkouts, deleteWorkout, stats, isLoadingStats, fetchStats, preferences, updatePreferences]
  );

  return (
    <CardioContext.Provider value={value}>
      {children}
    </CardioContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useCardio() {
  const context = useContext(CardioContext);

  if (context === undefined) {
    throw new Error('useCardio must be used within a CardioProvider');
  }

  return context;
}
