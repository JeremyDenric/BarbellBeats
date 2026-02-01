/**
 * WorkoutContext
 * Manages active workout session state with offline queue support
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import * as Sentry from '@sentry/react-native';
import safeStorage from '../utils/safeStorage';
import { apiClient } from '../api/api-client';
import { isNetworkError } from '../utils/networkErrors';
import type {
  Workout,
  WorkoutSet,
  CreateSetRequest,
  ActiveWorkout,
  ActiveExercise,
} from '../../shared/src/types/workout';

const WORKOUT_STORAGE_KEY = '@barbellbeats/active_workout';
const ACTIVE_WORKOUT_KEY = '@barbellbeats/active_workout_v2';
const OFFLINE_QUEUE_KEY = '@barbellbeats/workout_queue';
const WORKOUT_HISTORY_KEY = '@barbellbeats/workout_history';

interface WorkoutContextState {
  // Active workout
  activeWorkout: Workout | null;
  activeWorkoutV2: ActiveWorkout | null; // Enhanced version
  isLoading: boolean;

  // Actions - Legacy
  startWorkout: (title?: string, gymId?: string, programId?: string, sessionId?: string) => Promise<void>;
  endWorkout: () => Promise<void>;
  addSet: (set: CreateSetRequest) => Promise<void>;
  updateSet: (setId: string, updates: Partial<CreateSetRequest>) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;

  // Actions - Enhanced
  startWorkoutFromTemplate: (templateId: string, gymId?: string) => Promise<void>;
  startWorkoutFromProgram: (programId: string, weekNumber: number, dayNumber: number, gymId?: string) => Promise<void>;
  startQuickWorkout: (name?: string, gymId?: string) => Promise<void>;
  addExerciseToWorkout: (exerciseId: string) => Promise<void>;
  completeActiveWorkout: () => Promise<void>;
  addSetToExercise: (exerciseId: string, set: CreateSetRequest) => Promise<void>;

  // Workout history
  workoutHistory: Workout[];
  lastCompletedWorkout: Workout | null;
  loadWorkoutHistory: () => Promise<void>;
  getWorkoutById: (id: string) => Workout | undefined;

  // Rest timer
  restTimerSeconds: number;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;

  // Offline queue
  offlineQueue: Workout[];
  syncOfflineWorkouts: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextState | undefined>(undefined);

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeWorkoutV2, setActiveWorkoutV2] = useState<ActiveWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Workout[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<Workout | null>(null);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restTimerInterval, setRestTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Load active workout from storage on mount
  useEffect(() => {
    loadActiveWorkout();
    loadActiveWorkoutV2();
    loadOfflineQueue();
    loadWorkoutHistory();
  }, []);

  // Save active workout to storage whenever it changes
  useEffect(() => {
    const saveWorkout = async () => {
      try {
        if (activeWorkout) {
          await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(activeWorkout));
        } else {
          await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to save active workout to storage:', error);
        // Workout is still in memory, just not persisted
      }
    };
    saveWorkout();
  }, [activeWorkout]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimerSeconds > 0 && !restTimerInterval) {
      const interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            // Clear this specific interval when timer reaches 0
            clearInterval(interval);
            setRestTimerInterval(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setRestTimerInterval(interval);

      // Cleanup: clear this specific interval
      return () => {
        clearInterval(interval);
      };
    }
  }, [restTimerSeconds, restTimerInterval]);

  const loadActiveWorkout = async () => {
    try {
      const workout = await safeStorage.getJSON<Workout>(WORKOUT_STORAGE_KEY, {
        defaultValue: null,
      });

      if (workout) {
        setActiveWorkout(workout);
      }
    } catch (error) {
      console.error('[WorkoutContext] Error loading active workout:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'workout', operation: 'load_active' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfflineQueue = async () => {
    try {
      const queue = await safeStorage.getJSON<Workout[]>(OFFLINE_QUEUE_KEY, {
        schema: z.array(z.any()),
        defaultValue: [],
      });

      if (queue) {
        setOfflineQueue(queue);
      }
    } catch (error) {
      console.error('[WorkoutContext] Error loading offline queue:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'workout', operation: 'load_queue' },
        });
      }
    }
  };

  const saveOfflineQueue = async (queue: Workout[]) => {
    try {
      await safeStorage.setJSON(OFFLINE_QUEUE_KEY, queue);
      setOfflineQueue(queue);
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  };

  const startWorkout = useCallback(
    async (title?: string, gymId?: string, programId?: string, sessionId?: string) => {
      try {
        // Create new workout
        const newWorkout: Workout = {
          id: `temp_${Date.now()}`, // Temporary ID until synced
          userId: '', // Will be set by backend
          gymId,
          title: title || 'Quick Workout',
          notes: '',
          startedAt: new Date().toISOString(),
          programId,
          sessionId,
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
          sets: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setActiveWorkout(newWorkout);
      } catch (error) {
        console.error('Error starting workout:', error);
        throw error;
      }
    },
    []
  );

  const endWorkout = useCallback(async () => {
    if (!activeWorkout) return;

    try {
      // Calculate final metrics
      const completedAt = new Date().toISOString();
      const duration = Math.floor(
        (new Date(completedAt).getTime() - new Date(activeWorkout.startedAt).getTime()) / 1000
      );

      const completedWorkout: Workout = {
        ...activeWorkout,
        completedAt,
        duration,
        totalSets: activeWorkout.sets.length,
        totalReps: activeWorkout.sets.reduce((sum, set) => sum + set.reps, 0),
        totalVolume: activeWorkout.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
      };

      // Add to offline queue for syncing
      const newQueue = [...offlineQueue, completedWorkout];
      await saveOfflineQueue(newQueue);

      // Clear active workout
      setActiveWorkout(null);

      // Try to sync immediately
      await syncOfflineWorkouts();
    } catch (error) {
      console.error('Error ending workout:', error);
      throw error;
    }
  }, [activeWorkout, offlineQueue]);

  const addSet = useCallback(
    async (set: CreateSetRequest) => {
      if (!activeWorkout) {
        throw new Error('No active workout');
      }

      try {
        // Get set number for this exercise
        const exerciseSets = activeWorkout.sets.filter(
          (s) => s.exerciseId === set.exerciseId
        );
        const setNumber = exerciseSets.length + 1;

        const newSet: WorkoutSet = {
          id: `temp_set_${Date.now()}`, // Temporary ID
          workoutId: activeWorkout.id,
          exerciseId: set.exerciseId,
          exercise: { id: set.exerciseId, name: 'Exercise' } as any, // Will be populated by API
          setNumber,
          reps: set.reps,
          weight: set.weight,
          unit: set.unit || 'lbs',
          rpe: set.rpe,
          repQuality: set.repQuality,
          setType: set.setType || 'working',
          restSeconds: set.restSeconds,
          tempo: set.tempo,
          notes: set.notes,
          createdAt: new Date().toISOString(),
        };

        setActiveWorkout({
          ...activeWorkout,
          sets: [...activeWorkout.sets, newSet],
        });

        // Auto-start rest timer if specified
        if (set.restSeconds) {
          startRestTimer(set.restSeconds);
        }
      } catch (error) {
        console.error('Error adding set:', error);
        throw error;
      }
    },
    [activeWorkout]
  );

  const updateSet = useCallback(
    async (setId: string, updates: Partial<CreateSetRequest>) => {
      if (!activeWorkout) {
        throw new Error('No active workout');
      }

      try {
        const updatedSets = activeWorkout.sets.map((set) =>
          set.id === setId
            ? {
                ...set,
                ...updates,
              }
            : set
        );

        setActiveWorkout({
          ...activeWorkout,
          sets: updatedSets,
        });
      } catch (error) {
        console.error('Error updating set:', error);
        throw error;
      }
    },
    [activeWorkout]
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      if (!activeWorkout) {
        throw new Error('No active workout');
      }

      try {
        const updatedSets = activeWorkout.sets.filter((set) => set.id !== setId);

        setActiveWorkout({
          ...activeWorkout,
          sets: updatedSets,
        });
      } catch (error) {
        console.error('Error deleting set:', error);
        throw error;
      }
    },
    [activeWorkout]
  );

  const startRestTimer = useCallback((seconds: number) => {
    setRestTimerSeconds(seconds);
  }, []);

  const stopRestTimer = useCallback(() => {
    setRestTimerSeconds(0);
    if (restTimerInterval) {
      clearInterval(restTimerInterval);
      setRestTimerInterval(null);
    }
  }, [restTimerInterval]);

  // ============================================================================
  // Enhanced Active Workout Methods
  // ============================================================================

  const loadActiveWorkoutV2 = async () => {
    try {
      const workout = await safeStorage.getJSON<ActiveWorkout>(ACTIVE_WORKOUT_KEY, {
        defaultValue: null,
      });

      if (workout) {
        setActiveWorkoutV2(workout);
      }
    } catch (error) {
      console.error('[WorkoutContext] Error loading enhanced active workout:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'workout', operation: 'load_active_v2' },
        });
      }
    }
  };

  const saveActiveWorkoutV2 = async (workout: ActiveWorkout | null) => {
    try {
      if (workout) {
        await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(workout));
      } else {
        await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
      }
      setActiveWorkoutV2(workout);
    } catch (error) {
      console.error('[WorkoutContext] Error saving enhanced active workout:', error);
    }
  };

  const startWorkoutFromTemplate = useCallback(
    async (templateId: string, gymId?: string) => {
      try {
        // Import contexts at runtime to avoid circular dependencies
        const { useTemplates } = await import('./TemplateContext');
        const { useExercises } = await import('./ExerciseContext');

        // This is a workaround - in real implementation, pass these as parameters or use refs
        // For now, we'll create a minimal structure

        const newWorkout: ActiveWorkout = {
          id: `active_${Date.now()}`,
          userId: '',
          templateId,
          name: 'Template Workout',
          startedAt: new Date().toISOString(),
          exercises: [],
          currentExerciseIndex: 0,
          restTimerActive: false,
          restTimerSeconds: 0,
        };

        await saveActiveWorkoutV2(newWorkout);
        console.log('[WorkoutContext] Started workout from template:', templateId);
      } catch (error) {
        console.error('[WorkoutContext] Error starting workout from template:', error);
        throw error;
      }
    },
    []
  );

  const startWorkoutFromProgram = useCallback(
    async (programId: string, weekNumber: number, dayNumber: number, gymId?: string) => {
      try {
        const newWorkout: ActiveWorkout = {
          id: `active_${Date.now()}`,
          userId: '',
          programId,
          weekNumber,
          dayNumber,
          name: `Week ${weekNumber} Day ${dayNumber}`,
          startedAt: new Date().toISOString(),
          exercises: [],
          currentExerciseIndex: 0,
          restTimerActive: false,
          restTimerSeconds: 0,
        };

        await saveActiveWorkoutV2(newWorkout);
        console.log('[WorkoutContext] Started workout from program:', programId);
      } catch (error) {
        console.error('[WorkoutContext] Error starting workout from program:', error);
        throw error;
      }
    },
    []
  );

  const startQuickWorkout = useCallback(
    async (name?: string, gymId?: string) => {
      try {
        const newWorkout: ActiveWorkout = {
          id: `active_${Date.now()}`,
          userId: '',
          name: name || 'Quick Workout',
          startedAt: new Date().toISOString(),
          exercises: [],
          currentExerciseIndex: 0,
          restTimerActive: false,
          restTimerSeconds: 0,
        };

        await saveActiveWorkoutV2(newWorkout);
        console.log('[WorkoutContext] Started quick workout');
      } catch (error) {
        console.error('[WorkoutContext] Error starting quick workout:', error);
        throw error;
      }
    },
    []
  );

  const addExerciseToWorkout = useCallback(
    async (exerciseId: string) => {
      if (!activeWorkoutV2) {
        throw new Error('No active workout');
      }

      try {
        // Import to get exercise data
        const { useExercises } = await import('./ExerciseContext');

        const newExercise: ActiveExercise = {
          exerciseId,
          exercise: { id: exerciseId, name: 'Exercise' } as any, // Will be populated
          order: activeWorkoutV2.exercises.length + 1,
          plannedSets: 3, // Default
          completedSets: [],
        };

        const updated: ActiveWorkout = {
          ...activeWorkoutV2,
          exercises: [...activeWorkoutV2.exercises, newExercise],
        };

        await saveActiveWorkoutV2(updated);
        console.log('[WorkoutContext] Added exercise to workout:', exerciseId);
      } catch (error) {
        console.error('[WorkoutContext] Error adding exercise:', error);
        throw error;
      }
    },
    [activeWorkoutV2]
  );

  const addSetToExercise = useCallback(
    async (exerciseId: string, set: CreateSetRequest) => {
      if (!activeWorkoutV2) {
        throw new Error('No active workout');
      }

      try {
        const updatedExercises = activeWorkoutV2.exercises.map((ex) => {
          if (ex.exerciseId === exerciseId) {
            const setNumber = ex.completedSets.length + 1;

            const newSet: WorkoutSet = {
              id: `temp_set_${Date.now()}`,
              workoutId: activeWorkoutV2.id,
              exerciseId: set.exerciseId,
              exercise: ex.exercise,
              setNumber,
              reps: set.reps,
              weight: set.weight,
              unit: set.unit || 'lbs',
              rpe: set.rpe,
              repQuality: set.repQuality,
              setType: set.setType || 'working',
              restSeconds: set.restSeconds,
              tempo: set.tempo,
              notes: set.notes,
              createdAt: new Date().toISOString(),
            };

            return {
              ...ex,
              completedSets: [...ex.completedSets, newSet],
            };
          }
          return ex;
        });

        const updated: ActiveWorkout = {
          ...activeWorkoutV2,
          exercises: updatedExercises,
        };

        await saveActiveWorkoutV2(updated);

        // Auto-start rest timer
        if (set.restSeconds) {
          startRestTimer(set.restSeconds);
        }

        console.log('[WorkoutContext] Added set to exercise:', exerciseId);
      } catch (error) {
        console.error('[WorkoutContext] Error adding set to exercise:', error);
        throw error;
      }
    },
    [activeWorkoutV2, startRestTimer]
  );

  const completeActiveWorkout = useCallback(async () => {
    if (!activeWorkoutV2) return;

    try {
      // Convert ActiveWorkout to completed Workout
      const completedAt = new Date().toISOString();
      const duration = Math.floor(
        (new Date(completedAt).getTime() - new Date(activeWorkoutV2.startedAt).getTime()) / 1000
      );

      // Flatten all sets from all exercises
      const allSets = activeWorkoutV2.exercises.flatMap((ex) => ex.completedSets);

      const completedWorkout: Workout = {
        id: `temp_${Date.now()}`,
        userId: '',
        gymId: undefined,
        title: activeWorkoutV2.name,
        notes: '',
        startedAt: activeWorkoutV2.startedAt,
        completedAt,
        duration,
        programId: activeWorkoutV2.programId,
        sessionId: activeWorkoutV2.sessionId,
        totalVolume: allSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
        totalSets: allSets.length,
        totalReps: allSets.reduce((sum, set) => sum + set.reps, 0),
        sets: allSets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to offline queue
      const newQueue = [...offlineQueue, completedWorkout];
      await saveOfflineQueue(newQueue);

      // Add to workout history
      const updatedHistory = [completedWorkout, ...workoutHistory];
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
      setWorkoutHistory(updatedHistory);
      setLastCompletedWorkout(completedWorkout);

      // Clear active workout
      await saveActiveWorkoutV2(null);

      // Try to sync
      await syncOfflineWorkouts();

      console.log('[WorkoutContext] Completed active workout');
    } catch (error) {
      console.error('[WorkoutContext] Error completing active workout:', error);
      throw error;
    }
  }, [activeWorkoutV2, offlineQueue, workoutHistory]);

  const syncOfflineWorkouts = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    console.log(`[WorkoutContext] Syncing ${offlineQueue.length} offline workouts...`);

    const remaining: Workout[] = [];
    let synced = 0;
    let failed = 0;

    for (const workout of offlineQueue) {
      try {
        // Prepare workout data for API
        const workoutData = {
          title: workout.title,
          notes: workout.notes,
          startedAt: workout.startedAt,
          completedAt: workout.completedAt,
          duration: workout.duration,
          gymId: workout.gymId,
          programId: workout.programId,
          sessionId: workout.sessionId,
        };

        const response = await apiClient.createWorkout(workoutData);

        if (response.success && response.data) {
          synced++;
          console.log(`[WorkoutContext] Synced workout: ${workout.id} -> ${response.data.id}`);
        } else {
          // Non-network error, drop the workout but log it
          failed++;
          console.warn(`[WorkoutContext] Failed to sync workout ${workout.id}:`, response.message);
          if (!__DEV__) {
            Sentry.captureMessage('Workout sync failed', {
              level: 'warning',
              extra: { workoutId: workout.id, error: response.message },
              tags: { context: 'workout', operation: 'sync' },
            });
          }
        }
      } catch (error) {
        // Network error - keep in queue for retry
        if (isNetworkError(error)) {
          console.log(`[WorkoutContext] Network error, keeping workout ${workout.id} in queue`);
          remaining.push(workout);
        } else {
          // Other errors - drop workout but log
          failed++;
          console.error(`[WorkoutContext] Failed to sync workout ${workout.id}:`, error);
          if (!__DEV__) {
            Sentry.captureException(error, {
              extra: { workoutId: workout.id },
              tags: { context: 'workout', operation: 'sync' },
            });
          }
        }
      }
    }

    // Update queue with remaining workouts
    await saveOfflineQueue(remaining);

    if (synced > 0) {
      console.log(`[WorkoutContext] Successfully synced ${synced} workout(s)`);
      if (!__DEV__) {
        Sentry.addBreadcrumb({
          category: 'workout_sync',
          message: `Synced ${synced} workout(s), ${remaining.length} remaining`,
          level: 'info',
        });
      }
    }

    if (failed > 0) {
      console.warn(`[WorkoutContext] ${failed} workout(s) failed to sync and were dropped`);
    }
  }, [offlineQueue]);

  // ============================================================================
  // Workout History Methods
  // ============================================================================

  const loadWorkoutHistory = useCallback(async () => {
    try {
      const history = await safeStorage.getJSON<Workout[]>(WORKOUT_HISTORY_KEY, {
        schema: z.array(z.any()),
        defaultValue: [],
      });

      if (history) {
        // Sort by completedAt descending (most recent first)
        const sorted = history.sort((a, b) => {
          const dateA = new Date(b.completedAt || b.createdAt).getTime();
          const dateB = new Date(a.completedAt || a.createdAt).getTime();
          return dateA - dateB;
        });
        setWorkoutHistory(sorted);
        console.log(`[WorkoutContext] Loaded ${sorted.length} workouts from history`);
      }
    } catch (error) {
      console.error('[WorkoutContext] Error loading workout history:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'workout', operation: 'load_history' },
        });
      }
    }
  }, []);

  const getWorkoutById = useCallback(
    (id: string) => {
      return workoutHistory.find((w) => w.id === id) || offlineQueue.find((w) => w.id === id);
    },
    [workoutHistory, offlineQueue]
  );

  const value: WorkoutContextState = {
    activeWorkout,
    activeWorkoutV2,
    isLoading,
    startWorkout,
    endWorkout,
    addSet,
    updateSet,
    deleteSet,
    startWorkoutFromTemplate,
    startWorkoutFromProgram,
    startQuickWorkout,
    addExerciseToWorkout,
    completeActiveWorkout,
    addSetToExercise,
    workoutHistory,
    lastCompletedWorkout,
    loadWorkoutHistory,
    getWorkoutById,
    restTimerSeconds,
    startRestTimer,
    stopRestTimer,
    offlineQueue,
    syncOfflineWorkouts,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};
