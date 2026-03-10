/**
 * ProgressContext
 * Manages body measurements, progress photos, and analytics
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import type {
  BodyMeasurement,
  ProgressPhoto,
  WorkoutAnalytics,
} from '../../shared/src/types/workout';
import devLog from '../utils/devLog';
import { useAuth } from './AuthContext';
import { useWorkout } from './WorkoutContext';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  MEASUREMENTS: '@barbellbeats_body_measurements',
  PHOTOS: '@barbellbeats_progress_photos',
};

// ============================================================================
// Context Type
// ============================================================================

interface ProgressContextType {
  // Measurements
  measurements: BodyMeasurement[];
  latestMeasurement: BodyMeasurement | null;

  // Photos
  photos: ProgressPhoto[];

  // Analytics
  analytics: WorkoutAnalytics | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Measurement actions
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  getMeasurementsByDateRange: (startDate: string, endDate: string) => BodyMeasurement[];

  // Photo actions
  addPhoto: (photo: Omit<ProgressPhoto, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  getPhotosByAngle: (angle: ProgressPhoto['angle']) => ProgressPhoto[];

  // Analytics
  calculateAnalytics: () => void;

  // Refresh
  refresh: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const { user } = useAuth();
  const { workoutHistory } = useWorkout();

  // State
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Load Data
  // ============================================================================

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load measurements
      const measurementsData = await AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      if (measurementsData) {
        const parsed = JSON.parse(measurementsData) as BodyMeasurement[];
        // Sort by date descending
        const sorted = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMeasurements(sorted);
      }

      // Load photos
      const photosData = await AsyncStorage.getItem(STORAGE_KEYS.PHOTOS);
      if (photosData) {
        const parsed = JSON.parse(photosData) as ProgressPhoto[];
        // Sort by date descending
        const sorted = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPhotos(sorted);
      }

      devLog.log('[ProgressContext] Data loaded successfully');
    } catch (err) {
      devLog.error('[ProgressContext] Failed to load data:', err);
      setError('Failed to load progress data');
      if (!__DEV__) {
        Sentry.captureException(err, {
          tags: { context: 'progress', operation: 'load' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate analytics when workout history changes
  useEffect(() => {
    if (workoutHistory.length > 0) {
      calculateAnalytics();
    }
  }, [workoutHistory]);

  // ============================================================================
  // Measurement Management
  // ============================================================================

  const addMeasurement = useCallback(
    async (measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt'>) => {
      try {
        const newMeasurement: BodyMeasurement = {
          ...measurement,
          id: `meas_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId: user?.id || '',
          createdAt: new Date().toISOString(),
        };

        const updated = [newMeasurement, ...measurements];
        setMeasurements(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));

        devLog.log('[ProgressContext] Added measurement');
      } catch (err) {
        devLog.error('[ProgressContext] Failed to add measurement:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'progress', operation: 'add_measurement' },
          });
        }
        throw err;
      }
    },
    [measurements, user]
  );

  const updateMeasurement = useCallback(
    async (id: string, updates: Partial<BodyMeasurement>) => {
      try {
        const updated = measurements.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        );
        setMeasurements(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));

        devLog.log('[ProgressContext] Updated measurement:', id);
      } catch (err) {
        devLog.error('[ProgressContext] Failed to update measurement:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'progress', operation: 'update_measurement' },
          });
        }
        throw err;
      }
    },
    [measurements]
  );

  const deleteMeasurement = useCallback(
    async (id: string) => {
      try {
        const updated = measurements.filter((m) => m.id !== id);
        setMeasurements(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));

        devLog.log('[ProgressContext] Deleted measurement:', id);
      } catch (err) {
        devLog.error('[ProgressContext] Failed to delete measurement:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'progress', operation: 'delete_measurement' },
          });
        }
        throw err;
      }
    },
    [measurements]
  );

  const getMeasurementsByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return measurements.filter((m) => {
        const date = new Date(m.date).getTime();
        return date >= start && date <= end;
      });
    },
    [measurements]
  );

  // ============================================================================
  // Photo Management
  // ============================================================================

  const addPhoto = useCallback(
    async (photo: Omit<ProgressPhoto, 'id' | 'userId' | 'createdAt'>) => {
      try {
        const newPhoto: ProgressPhoto = {
          ...photo,
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId: user?.id || '',
          createdAt: new Date().toISOString(),
        };

        const updated = [newPhoto, ...photos];
        setPhotos(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));

        devLog.log('[ProgressContext] Added photo');
      } catch (err) {
        devLog.error('[ProgressContext] Failed to add photo:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'progress', operation: 'add_photo' },
          });
        }
        throw err;
      }
    },
    [photos, user]
  );

  const deletePhoto = useCallback(
    async (id: string) => {
      try {
        const updated = photos.filter((p) => p.id !== id);
        setPhotos(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));

        devLog.log('[ProgressContext] Deleted photo:', id);
      } catch (err) {
        devLog.error('[ProgressContext] Failed to delete photo:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'progress', operation: 'delete_photo' },
          });
        }
        throw err;
      }
    },
    [photos]
  );

  const getPhotosByAngle = useCallback(
    (angle: ProgressPhoto['angle']) => {
      return photos.filter((p) => p.angle === angle);
    },
    [photos]
  );

  // ============================================================================
  // Analytics
  // ============================================================================

  const calculateAnalytics = useCallback(() => {
    if (workoutHistory.length === 0) {
      setAnalytics(null);
      return;
    }

    try {
      const totalWorkouts = workoutHistory.length;
      const totalVolume = workoutHistory.reduce((sum, w) => sum + w.totalVolume, 0);
      const totalSets = workoutHistory.reduce((sum, w) => sum + w.totalSets, 0);
      const totalReps = workoutHistory.reduce((sum, w) => sum + w.totalReps, 0);
      const avgWorkoutDuration = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0) / totalWorkouts;

      // Volume by week
      const volumeByWeek = calculateVolumeByWeek(workoutHistory);

      // Volume by exercise
      const volumeByExercise = calculateVolumeByExercise(workoutHistory);

      const analyticsData: WorkoutAnalytics = {
        totalWorkouts,
        totalVolume,
        totalSets,
        totalReps,
        avgWorkoutDuration,
        volumeByWeek,
        volumeByExercise,
        oneRMProgression: calculateOneRMProgression(workoutHistory),
      };

      setAnalytics(analyticsData);
      devLog.log('[ProgressContext] Analytics calculated');
    } catch (err) {
      devLog.error('[ProgressContext] Failed to calculate analytics:', err);
    }
  }, [workoutHistory]);

  const calculateVolumeByWeek = (workouts: typeof workoutHistory) => {
    const weekMap = new Map<string, { volume: number; sets: number; workouts: number }>();

    workouts.forEach((workout) => {
      const date = new Date(workout.completedAt || workout.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekMap.get(weekKey) || { volume: 0, sets: 0, workouts: 0 };
      weekMap.set(weekKey, {
        volume: existing.volume + workout.totalVolume,
        sets: existing.sets + workout.totalSets,
        workouts: existing.workouts + 1,
      });
    });

    return Array.from(weekMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));
  };

  const calculateVolumeByExercise = (workouts: typeof workoutHistory) => {
    const exerciseMap = new Map<string, { name: string; volume: number; sets: number; totalWeight: number; count: number }>();

    workouts.forEach((workout) => {
      workout.sets.forEach((set) => {
        const existing = exerciseMap.get(set.exerciseId) || {
          name: set.exercise?.name ?? set.exerciseId,
          volume: 0,
          sets: 0,
          totalWeight: 0,
          count: 0,
        };

        exerciseMap.set(set.exerciseId, {
          name: existing.name,
          volume: existing.volume + (set.weight * set.reps),
          sets: existing.sets + 1,
          totalWeight: existing.totalWeight + set.weight,
          count: existing.count + 1,
        });
      });
    });

    return Array.from(exerciseMap.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.name,
        volume: data.volume,
        sets: data.sets,
        avgWeight: data.totalWeight / data.count,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10); // Top 10 exercises
  };

  /** Epley formula: weight * (1 + reps / 30). Returns 0 for bodyweight (weight === 0). */
  const calculateOneRMProgression = (workouts: typeof workoutHistory) => {
    // Per exercise, per date: keep only the best estimated 1RM
    const map = new Map<string, Map<string, { exerciseName: string; oneRepMax: number }>>();

    workouts.forEach((workout) => {
      const date = (workout.completedAt || workout.createdAt).split('T')[0];
      workout.sets.forEach((set) => {
        if (set.weight <= 0 || set.reps <= 0) return;
        const e1rm = set.weight * (1 + set.reps / 30);
        const exerciseId = set.exerciseId;
        const exerciseName = set.exercise?.name ?? exerciseId;

        if (!map.has(exerciseId)) {
          map.set(exerciseId, new Map());
        }
        const dateMap = map.get(exerciseId)!;
        const existing = dateMap.get(date);
        if (!existing || e1rm > existing.oneRepMax) {
          dateMap.set(date, { exerciseName, oneRepMax: Math.round(e1rm) });
        }
      });
    });

    const result: { date: string; exerciseId: string; exerciseName: string; oneRepMax: number; isActual: boolean }[] = [];
    map.forEach((dateMap, exerciseId) => {
      dateMap.forEach((data, date) => {
        result.push({ date, exerciseId, exerciseName: data.exerciseName, oneRepMax: data.oneRepMax, isActual: false });
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;

  // ============================================================================
  // Refresh
  // ============================================================================

  const refresh = useCallback(async () => {
    await loadData();
    calculateAnalytics();
  }, [loadData, calculateAnalytics]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<ProgressContextType>(
    () => ({
      measurements,
      latestMeasurement,
      photos,
      analytics,
      isLoading,
      error,
      addMeasurement,
      updateMeasurement,
      deleteMeasurement,
      getMeasurementsByDateRange,
      addPhoto,
      deletePhoto,
      getPhotosByAngle,
      calculateAnalytics,
      refresh,
    }),
    [measurements, latestMeasurement, photos, analytics, isLoading, error, addMeasurement, updateMeasurement, deleteMeasurement, getMeasurementsByDateRange, addPhoto, deletePhoto, getPhotosByAngle, calculateAnalytics, refresh]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
