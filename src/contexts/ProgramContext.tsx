/**
 * ProgramContext
 * Manages workout programs, active program tracking, and progression
 * Now with API integration and offline-first hybrid pattern
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
  WorkoutProgram,
  ProgramFilters,
  CreateProgramRequest,
  ProgramWeek,
} from '../../shared/src/types/workout';
import devLog from '../utils/devLog';
import { useAuth } from './AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { withApiErrorHandling } from '../utils/apiErrorHandler';
import { offlineQueueWorkout } from '../services/offlineQueueWorkout';
import * as programApi from '../services/programApi';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  USER_PROGRAMS: '@barbellbeats_user_programs',
  ACTIVE_PROGRAM: '@barbellbeats_active_program',
  PROGRAM_PROGRESS: '@barbellbeats_program_progress',
  SAVED_PROGRAMS: '@barbellbeats_saved_programs',
  OFFICIAL_PROGRAMS_CACHE: '@barbellbeats_official_programs_cache',
};

// ============================================================================
// Types
// ============================================================================

interface ProgramProgress {
  programId: string;
  currentWeek: number;
  currentDay: number;
  completedWorkouts: string[]; // workout IDs
  startedAt: string;
  lastWorkoutAt?: string;
}

interface ActiveProgramState {
  program: WorkoutProgram;
  progress: ProgramProgress;
}

interface ProgramContextType {
  // Programs
  programs: WorkoutProgram[];
  userPrograms: WorkoutProgram[];
  officialPrograms: WorkoutProgram[];
  savedProgramIds: string[];

  // Active program
  activeProgram: ActiveProgramState | null;

  // Filters
  filters: ProgramFilters;
  filteredPrograms: WorkoutProgram[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: ProgramFilters) => void;
  clearFilters: () => void;

  // Program management
  getProgramById: (id: string) => WorkoutProgram | undefined;
  createProgram: (request: CreateProgramRequest) => Promise<WorkoutProgram>;
  updateProgram: (id: string, updates: Partial<CreateProgramRequest>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  duplicateProgram: (id: string) => Promise<WorkoutProgram>;

  // Active program
  startProgram: (programId: string) => Promise<void>;
  stopProgram: () => Promise<void>;
  completeWorkout: (weekNumber: number, dayNumber: number) => Promise<void>;
  advanceToNextWorkout: () => Promise<void>;

  // Saved programs
  toggleSaveProgram: (programId: string) => Promise<void>;
  isSaved: (programId: string) => boolean;

  // Refresh
  refreshPrograms: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const usePrograms = () => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('usePrograms must be used within ProgramProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface ProgramProviderProps {
  children: ReactNode;
}

export function ProgramProvider({ children }: ProgramProviderProps) {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // State
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [userPrograms, setUserPrograms] = useState<WorkoutProgram[]>([]);
  const [officialPrograms, setOfficialPrograms] = useState<WorkoutProgram[]>([]);
  const [savedProgramIds, setSavedProgramIds] = useState<string[]>([]);
  const [activeProgram, setActiveProgram] = useState<ActiveProgramState | null>(null);
  const [filters, setFilters] = useState<ProgramFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Load Programs
  // ============================================================================

  const loadPrograms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try API first when online
      if (isConnected && isInternetReachable) {
        devLog.log('[ProgramContext] Attempting to load from API...');

        const { data, error: apiError } = await withApiErrorHandling(
          () => programApi.listPrograms(),
          'load_programs'
        );

        if (data && data.length > 0) {
          setOfficialPrograms(data as unknown as WorkoutProgram[]);
          // Cache for offline use
          await AsyncStorage.setItem(STORAGE_KEYS.OFFICIAL_PROGRAMS_CACHE, JSON.stringify(data));
          devLog.log(`[ProgramContext] Loaded ${data.length} programs from API`);
        } else if (apiError) {
          devLog.warn('[ProgramContext] API failed, falling back to cache:', apiError.message);
          setError(apiError.message);
        }
      } else {
        devLog.log('[ProgramContext] Offline - loading from cache');
      }

      // Load user programs from local storage
      const userProgramsData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRAMS);
      if (userProgramsData) {
        const parsed = JSON.parse(userProgramsData) as WorkoutProgram[];
        setUserPrograms(parsed);
      }

      // Load official programs from cache if not loaded from API
      if (officialPrograms.length === 0) {
        const officialData = await AsyncStorage.getItem(STORAGE_KEYS.OFFICIAL_PROGRAMS_CACHE);
        if (officialData) {
          const parsed = JSON.parse(officialData) as WorkoutProgram[];
          setOfficialPrograms(parsed);
          devLog.log(`[ProgramContext] Loaded ${parsed.length} programs from cache`);
        } else {
          // Load seed programs as last resort
          const seedPrograms = await loadSeedPrograms();
          setOfficialPrograms(seedPrograms);
          await AsyncStorage.setItem(
            STORAGE_KEYS.OFFICIAL_PROGRAMS_CACHE,
            JSON.stringify(seedPrograms)
          );
          devLog.log(`[ProgramContext] Loaded ${seedPrograms.length} seed programs`);
        }
      }

      // Load saved program IDs
      const savedData = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PROGRAMS);
      if (savedData) {
        const parsed = JSON.parse(savedData) as string[];
        setSavedProgramIds(parsed);
      }

      // Load active program
      const activeProgramData = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM);
      if (activeProgramData) {
        const parsed = JSON.parse(activeProgramData) as ActiveProgramState;
        setActiveProgram(parsed);
      }

      devLog.log('[ProgramContext] Programs loaded successfully');
    } catch (err) {
      devLog.error('[ProgramContext] Failed to load programs:', err);
      setError('Failed to load programs');
      if (!__DEV__) {
        Sentry.captureException(err, {
          tags: { context: 'program', operation: 'load' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isInternetReachable]);

  // ============================================================================
  // Seed Programs
  // ============================================================================

  const loadSeedPrograms = async (): Promise<WorkoutProgram[]> => {
    // TODO: Load from JSON file or API
    // For now, return sample starter program
    return [
      {
        id: 'prog_starter_strength',
        userId: 'official',
        name: 'Starting Strength',
        description: 'A beginner linear progression program focused on compound lifts',
        difficulty: 'beginner',
        durationWeeks: 12,
        goal: 'strength',
        tags: ['beginner', 'barbell', 'full-body'],
        isPublic: true,
        isOfficial: true,
        weeks: [
          {
            weekNumber: 1,
            description: 'Intro Week - Learn the movements',
            workouts: [
              {
                dayNumber: 1,
                name: 'Workout A',
                description: 'Squat, Bench, Deadlift',
                estimatedDuration: 60,
                exercises: [
                  {
                    exerciseId: 'ex_2',
                    order: 1,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 5,
                  },
                  {
                    exerciseId: 'ex_1',
                    order: 2,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 5,
                  },
                  {
                    exerciseId: 'ex_3',
                    order: 3,
                    sets: 1,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 10,
                  },
                ],
              },
              {
                dayNumber: 2,
                name: 'Workout B',
                description: 'Squat, Press, Row',
                estimatedDuration: 60,
                exercises: [
                  {
                    exerciseId: 'ex_2',
                    order: 1,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 5,
                  },
                  {
                    exerciseId: 'ex_4',
                    order: 2,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 2.5,
                  },
                  {
                    exerciseId: 'ex_5',
                    order: 3,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 5,
                  },
                ],
              },
              {
                dayNumber: 3,
                name: 'Workout A',
                description: 'Squat, Bench, Deadlift',
                estimatedDuration: 60,
                exercises: [
                  {
                    exerciseId: 'ex_2',
                    order: 1,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 5,
                  },
                  {
                    exerciseId: 'ex_1',
                    order: 2,
                    sets: 3,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 5,
                  },
                  {
                    exerciseId: 'ex_3',
                    order: 3,
                    sets: 1,
                    reps: 5,
                    restSeconds: 180,
                    setType: 'straight',
                    weightProgression: 'linear',
                    progressionRate: 10,
                  },
                ],
              },
            ],
          },
        ],
        createdBy: 'BarbellBeats Team',
        totalWorkouts: 36,
        estimatedTimePerWorkout: 60,
        equipmentRequired: ['Barbell', 'Squat Rack', 'Bench'],
        likes: 1247,
        saves: 892,
        completions: 453,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  };

  // ============================================================================
  // Combine and Filter Programs
  // ============================================================================

  useEffect(() => {
    setPrograms([...officialPrograms, ...userPrograms]);
  }, [officialPrograms, userPrograms]);

  const filteredPrograms = React.useMemo(() => {
    let result = [...programs];

    if (filters.difficulty) {
      result = result.filter((p) => p.difficulty === filters.difficulty);
    }

    if (filters.goal) {
      result = result.filter((p) => p.goal === filters.goal);
    }

    if (filters.durationWeeks) {
      result = result.filter((p) => p.durationWeeks === filters.durationWeeks);
    }

    if (filters.isOfficial !== undefined) {
      result = result.filter((p) => p.isOfficial === filters.isOfficial);
    }

    return result;
  }, [programs, filters]);

  // ============================================================================
  // Program Management
  // ============================================================================

  const getProgramById = useCallback(
    (id: string) => {
      return programs.find((p) => p.id === id);
    },
    [programs]
  );

  const createProgram = useCallback(
    async (request: CreateProgramRequest): Promise<WorkoutProgram> => {
      try {
        const newProgram: WorkoutProgram = {
          id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId: user?.id || 'anonymous',
          name: request.name,
          description: request.description,
          difficulty: request.difficulty,
          durationWeeks: request.durationWeeks,
          goal: request.goal,
          tags: request.tags || [],
          isPublic: false,
          isOfficial: false,
          weeks: request.weeks,
          createdBy: user?.name,
          totalWorkouts: request.weeks.reduce(
            (acc, week) => acc + week.workouts.length,
            0
          ),
          estimatedTimePerWorkout: 60, // Default estimate
          equipmentRequired: [],
          likes: 0,
          saves: 0,
          completions: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updated = [...userPrograms, newProgram];
        setUserPrograms(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRAMS, JSON.stringify(updated));

        devLog.log('[ProgramContext] Created program:', newProgram.name);
        return newProgram;
      } catch (err) {
        devLog.error('[ProgramContext] Failed to create program:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'create' },
          });
        }
        throw err;
      }
    },
    [userPrograms, user]
  );

  const updateProgram = useCallback(
    async (id: string, updates: Partial<CreateProgramRequest>) => {
      try {
        const updated = userPrograms.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });

        setUserPrograms(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRAMS, JSON.stringify(updated));
        devLog.log('[ProgramContext] Updated program:', id);
      } catch (err) {
        devLog.error('[ProgramContext] Failed to update program:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'update' },
          });
        }
        throw err;
      }
    },
    [userPrograms]
  );

  const deleteProgram = useCallback(
    async (id: string) => {
      try {
        const updated = userPrograms.filter((p) => p.id !== id);
        setUserPrograms(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRAMS, JSON.stringify(updated));

        // Stop active program if it's the one being deleted
        if (activeProgram?.program.id === id) {
          await stopProgram();
        }

        devLog.log('[ProgramContext] Deleted program:', id);
      } catch (err) {
        devLog.error('[ProgramContext] Failed to delete program:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'delete' },
          });
        }
        throw err;
      }
    },
    [userPrograms, activeProgram]
  );

  const duplicateProgram = useCallback(
    async (id: string): Promise<WorkoutProgram> => {
      try {
        const program = getProgramById(id);
        if (!program) {
          throw new Error('Program not found');
        }

        const duplicated: WorkoutProgram = {
          ...program,
          id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId: user?.id || 'anonymous',
          name: `${program.name} (Copy)`,
          isPublic: false,
          isOfficial: false,
          likes: 0,
          saves: 0,
          completions: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updated = [...userPrograms, duplicated];
        setUserPrograms(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRAMS, JSON.stringify(updated));

        devLog.log('[ProgramContext] Duplicated program:', duplicated.name);
        return duplicated;
      } catch (err) {
        devLog.error('[ProgramContext] Failed to duplicate program:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'duplicate' },
          });
        }
        throw err;
      }
    },
    [userPrograms, user, getProgramById]
  );

  // ============================================================================
  // Active Program Management
  // ============================================================================

  const startProgram = useCallback(
    async (programId: string) => {
      try {
        const program = getProgramById(programId);
        if (!program) {
          throw new Error('Program not found');
        }

        const progress: ProgramProgress = {
          programId,
          currentWeek: 1,
          currentDay: 1,
          completedWorkouts: [],
          startedAt: new Date().toISOString(),
        };

        const activeProgramState: ActiveProgramState = {
          program,
          progress,
        };

        // Try API when online
        if (isConnected && isInternetReachable) {
          const { data, error: apiError } = await withApiErrorHandling(
            () => programApi.startProgram(programId),
            'start_program'
          );

          if (data) {
            // Use API response if available
            setActiveProgram(activeProgramState);
            await AsyncStorage.setItem(
              STORAGE_KEYS.ACTIVE_PROGRAM,
              JSON.stringify(activeProgramState)
            );
            devLog.log('[ProgramContext] Started program via API:', program.name);
            return;
          }

          if (apiError) {
            devLog.warn('[ProgramContext] API failed, starting locally:', apiError.message);
          }
        }

        // Offline or API failed - queue for sync
        await offlineQueueWorkout.enqueue({
          type: 'START_PROGRAM',
          programId,
        });

        // Start locally
        setActiveProgram(activeProgramState);
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACTIVE_PROGRAM,
          JSON.stringify(activeProgramState)
        );

        devLog.log('[ProgramContext] Queued program start for sync:', program.name);
      } catch (err) {
        devLog.error('[ProgramContext] Failed to start program:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'start' },
          });
        }
        throw err;
      }
    },
    [getProgramById, isConnected, isInternetReachable]
  );

  const stopProgram = useCallback(async () => {
    try {
      setActiveProgram(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROGRAM);
      devLog.log('[ProgramContext] Stopped active program');
    } catch (err) {
      devLog.error('[ProgramContext] Failed to stop program:', err);
      if (!__DEV__) {
        Sentry.captureException(err, {
          tags: { context: 'program', operation: 'stop' },
        });
      }
    }
  }, []);

  const completeWorkout = useCallback(
    async (weekNumber: number, dayNumber: number) => {
      if (!activeProgram) return;

      try {
        const workoutId = `${activeProgram.program.id}_w${weekNumber}_d${dayNumber}`;
        const updatedProgress: ProgramProgress = {
          ...activeProgram.progress,
          completedWorkouts: [...activeProgram.progress.completedWorkouts, workoutId],
          lastWorkoutAt: new Date().toISOString(),
        };

        const updated: ActiveProgramState = {
          ...activeProgram,
          progress: updatedProgress,
        };

        setActiveProgram(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM, JSON.stringify(updated));

        devLog.log('[ProgramContext] Completed workout:', workoutId);
      } catch (err) {
        devLog.error('[ProgramContext] Failed to complete workout:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'complete_workout' },
          });
        }
      }
    },
    [activeProgram]
  );

  const advanceToNextWorkout = useCallback(async () => {
    if (!activeProgram) return;

    try {
      const { program, progress } = activeProgram;
      const currentWeek = program.weeks.find((w) => w.weekNumber === progress.currentWeek);

      if (!currentWeek) return;

      let nextWeek = progress.currentWeek;
      let nextDay = progress.currentDay + 1;

      // Move to next week if current week is complete
      if (nextDay > currentWeek.workouts.length) {
        nextWeek += 1;
        nextDay = 1;
      }

      // Program complete
      if (nextWeek > program.durationWeeks) {
        await stopProgram();
        return;
      }

      const updatedProgress: ProgramProgress = {
        ...progress,
        currentWeek: nextWeek,
        currentDay: nextDay,
      };

      const updated: ActiveProgramState = {
        ...activeProgram,
        progress: updatedProgress,
      };

      setActiveProgram(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM, JSON.stringify(updated));

      devLog.log('[ProgramContext] Advanced to week', nextWeek, 'day', nextDay);
    } catch (err) {
      devLog.error('[ProgramContext] Failed to advance workout:', err);
      if (!__DEV__) {
        Sentry.captureException(err, {
          tags: { context: 'program', operation: 'advance' },
        });
      }
    }
  }, [activeProgram, stopProgram]);

  // ============================================================================
  // Saved Programs
  // ============================================================================

  const toggleSaveProgram = useCallback(
    async (programId: string) => {
      try {
        const updated = savedProgramIds.includes(programId)
          ? savedProgramIds.filter((id) => id !== programId)
          : [...savedProgramIds, programId];

        setSavedProgramIds(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PROGRAMS, JSON.stringify(updated));
        devLog.log('[ProgramContext] Toggled save:', programId);
      } catch (err) {
        devLog.error('[ProgramContext] Failed to toggle save:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'program', operation: 'save' },
          });
        }
      }
    },
    [savedProgramIds]
  );

  const isSaved = useCallback(
    (programId: string) => savedProgramIds.includes(programId),
    [savedProgramIds]
  );

  // ============================================================================
  // Refresh
  // ============================================================================

  const refreshPrograms = useCallback(async () => {
    setIsRefreshing(true);
    await loadPrograms();
    setIsRefreshing(false);
  }, [loadPrograms]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // ============================================================================
  // Sync Effect
  // ============================================================================

  // Sync offline queue when coming online
  useEffect(() => {
    if (isConnected && isInternetReachable && !isSyncing) {
      const syncQueue = async () => {
        setIsSyncing(true);
        devLog.log('[ProgramContext] Syncing offline queue...');

        try {
          await offlineQueueWorkout.sync(async (action) => {
            if (action.type === 'START_PROGRAM') {
              await programApi.startProgram(action.programId);
              devLog.log('[ProgramContext] Synced program start');
            } else if (action.type === 'UPDATE_PROGRESS') {
              await programApi.updateProgramProgress(action.programId, action.progress as any);
              devLog.log('[ProgramContext] Synced program progress');
            }
          });

          // Reload programs after sync
          await loadPrograms();
        } catch (error) {
          devLog.error('[ProgramContext] Sync failed:', error);
        } finally {
          setIsSyncing(false);
        }
      };

      syncQueue();
    }
  }, [isConnected, isInternetReachable, isSyncing, loadPrograms]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<ProgramContextType>(
    () => ({
      programs,
      userPrograms,
      officialPrograms,
      savedProgramIds,
      activeProgram,
      filters,
      filteredPrograms,
      isLoading,
      isRefreshing,
      isSyncing,
      error,
      setFilters,
      clearFilters,
      getProgramById,
      createProgram,
      updateProgram,
      deleteProgram,
      duplicateProgram,
      startProgram,
      stopProgram,
      completeWorkout,
      advanceToNextWorkout,
      toggleSaveProgram,
      isSaved,
      refreshPrograms,
    }),
    [programs, userPrograms, officialPrograms, savedProgramIds, activeProgram, filters, filteredPrograms, isLoading, isRefreshing, isSyncing, error, setFilters, clearFilters, getProgramById, createProgram, updateProgram, deleteProgram, duplicateProgram, startProgram, stopProgram, completeWorkout, advanceToNextWorkout, toggleSaveProgram, isSaved, refreshPrograms]
  );

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}
