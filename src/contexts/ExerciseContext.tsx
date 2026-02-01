/**
 * ExerciseContext
 * Manages exercise library, custom exercises, favorites, and filtering
 * Now with API integration and offline-first hybrid pattern
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import type {
  Exercise,
  EnhancedExercise,
  ExerciseFilters,
  CreateExerciseRequest,
  ExerciseHistoryResponse,
} from '../../shared/src/types/workout';
import { useAuth } from './AuthContext';
import { SEED_EXERCISES } from '../data/exerciseSeedData';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { withApiErrorHandling } from '../utils/apiErrorHandler';
import { offlineQueueWorkout } from '../services/offlineQueueWorkout';
import * as exerciseApi from '../services/exerciseApi';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  CUSTOM_EXERCISES: '@barbellbeats_custom_exercises',
  FAVORITE_EXERCISES: '@barbellbeats_favorite_exercises',
  EXERCISE_CACHE: '@barbellbeats_exercise_cache',
  CACHE_TIMESTAMP: '@barbellbeats_exercise_cache_timestamp',
};

// ============================================================================
// Context Type
// ============================================================================

interface ExerciseContextType {
  // Library
  exercises: EnhancedExercise[];
  customExercises: EnhancedExercise[];
  favoriteIds: string[];

  // Filters
  filters: ExerciseFilters;
  searchQuery: string;
  filteredExercises: EnhancedExercise[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: ExerciseFilters) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Exercise management
  getExerciseById: (id: string) => EnhancedExercise | undefined;
  createCustomExercise: (exercise: CreateExerciseRequest) => Promise<EnhancedExercise>;
  updateCustomExercise: (id: string, updates: Partial<CreateExerciseRequest>) => Promise<void>;
  deleteCustomExercise: (id: string) => Promise<void>;

  // Favorites
  toggleFavorite: (exerciseId: string) => Promise<void>;
  isFavorite: (exerciseId: string) => boolean;

  // History
  getExerciseHistory: (exerciseId: string) => Promise<ExerciseHistoryResponse | null>;

  // Refresh
  refreshExercises: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const useExercises = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercises must be used within ExerciseProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface ExerciseProviderProps {
  children: ReactNode;
}

export function ExerciseProvider({ children }: ExerciseProviderProps) {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // State
  const [exercises, setExercises] = useState<EnhancedExercise[]>([]);
  const [customExercises, setCustomExercises] = useState<EnhancedExercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ExerciseFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ============================================================================
  // Load Exercises
  // ============================================================================

  const loadExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try API first when online
      if (isConnected && isInternetReachable) {
        console.log('[ExerciseContext] Attempting to load from API...');

        const { data, error: apiError } = await withApiErrorHandling(
          () => exerciseApi.listExercises(),
          'load_exercises'
        );

        if (data && data.length > 0) {
          setExercises(data);
          // Cache for offline use
          await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_CACHE, JSON.stringify(data));
          await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
          console.log(`[ExerciseContext] ✅ Loaded ${data.length} exercises from API`);

          // Continue to load custom exercises and favorites
        } else if (apiError) {
          console.warn('[ExerciseContext] API failed, falling back to cache:', apiError.message);
          setError(apiError.message);
        }
      } else {
        console.log('[ExerciseContext] Offline - loading from cache');
      }

      // Load from cache (either offline or as fallback)
      if (exercises.length === 0) {
        const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_CACHE);

        if (cachedData) {
          const parsed = JSON.parse(cachedData) as EnhancedExercise[];
          setExercises(parsed);
          console.log(`[ExerciseContext] 📦 Loaded ${parsed.length} exercises from cache`);
        } else {
          // No cache and no API - use seed data as last resort
          const seedData = await loadSeedExercises();
          setExercises(seedData);
          await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_CACHE, JSON.stringify(seedData));
          await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
          console.log(`[ExerciseContext] 🌱 Loaded ${seedData.length} seed exercises`);
        }
      }

      // Load custom exercises
      const customData = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
      if (customData) {
        const parsed = JSON.parse(customData) as EnhancedExercise[];
        setCustomExercises(parsed);
        console.log(`[ExerciseContext] Loaded ${parsed.length} custom exercises`);
      }

      // Load favorites
      const favData = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_EXERCISES);
      if (favData) {
        const parsed = JSON.parse(favData) as string[];
        setFavoriteIds(parsed);
        console.log(`[ExerciseContext] Loaded ${parsed.length} favorites`);
      }
    } catch (err) {
      console.error('[ExerciseContext] Failed to load exercises:', err);
      setError('Failed to load exercises');
      if (!__DEV__) {
        Sentry.captureException(err, {
          tags: { context: 'exercise', operation: 'load' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isInternetReachable]);

  // ============================================================================
  // Seed Data Loader (Temporary)
  // ============================================================================

  const loadSeedExercises = async (): Promise<EnhancedExercise[]> => {
    // Return exercises from seed data file (50+ exercises)
    return SEED_EXERCISES;
  };

  // OLD SEED DATA (5 exercises) - Replaced with expanded seed data
  /* return [
      {
        id: 'ex_1',
        name: 'Barbell Bench Press',
        category: 'compound',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: 'Barbell',
        description: 'The king of upper body pressing movements',
        aliases: ['Bench Press', 'Flat Bench'],
        difficulty: 'intermediate',
        instructions: [
          'Lie flat on bench with feet planted',
          'Grip bar slightly wider than shoulder width',
          'Unrack and lower to mid-chest',
          'Press up explosively',
        ],
        tips: [
          'Keep shoulder blades retracted',
          'Touch chest lightly, don\'t bounce',
          'Drive through your legs',
        ],
        videoUrls: [],
        imageUrls: [],
        variations: ['Incline Bench Press', 'Decline Bench Press', 'Close-Grip Bench Press'],
        alternatives: ['Dumbbell Bench Press', 'Push-Ups'],
        primaryMuscles: ['Chest'],
        secondaryMuscles: ['Triceps', 'Shoulders'],
        equipmentRequired: ['Barbell', 'Bench'],
        forceType: 'push',
        mechanicsType: 'compound',
        isCustom: false,
      },
      {
        id: 'ex_2',
        name: 'Barbell Back Squat',
        category: 'compound',
        muscleGroups: ['Quads', 'Glutes', 'Hamstrings'],
        equipment: 'Barbell',
        description: 'The fundamental lower body strength builder',
        aliases: ['Back Squat', 'Squat'],
        difficulty: 'intermediate',
        instructions: [
          'Bar rests on upper back/traps',
          'Feet shoulder-width, toes slightly out',
          'Descend by breaking at hips and knees',
          'Go to parallel or below',
          'Drive up through heels',
        ],
        tips: [
          'Keep chest up throughout',
          'Knees track over toes',
          'Maintain neutral spine',
        ],
        videoUrls: [],
        imageUrls: [],
        variations: ['Front Squat', 'High Bar Squat', 'Low Bar Squat'],
        alternatives: ['Leg Press', 'Bulgarian Split Squat'],
        primaryMuscles: ['Quads', 'Glutes'],
        secondaryMuscles: ['Hamstrings', 'Core'],
        equipmentRequired: ['Barbell', 'Squat Rack'],
        forceType: 'push',
        mechanicsType: 'compound',
        isCustom: false,
      },
      {
        id: 'ex_3',
        name: 'Conventional Deadlift',
        category: 'compound',
        muscleGroups: ['Back', 'Hamstrings', 'Glutes'],
        equipment: 'Barbell',
        description: 'Full-body pulling powerhouse',
        aliases: ['Deadlift'],
        difficulty: 'advanced',
        instructions: [
          'Stand with bar over mid-foot',
          'Grip bar outside knees',
          'Lower hips, chest up, back flat',
          'Drive through floor to stand',
          'Lock out at top',
        ],
        tips: [
          'Keep bar close to body',
          'Engage lats before pulling',
          'Don\'t round lower back',
        ],
        videoUrls: [],
        imageUrls: [],
        variations: ['Sumo Deadlift', 'Romanian Deadlift', 'Trap Bar Deadlift'],
        alternatives: ['Romanian Deadlift', 'Rack Pulls'],
        primaryMuscles: ['Back', 'Hamstrings', 'Glutes'],
        secondaryMuscles: ['Forearms', 'Core', 'Traps'],
        equipmentRequired: ['Barbell'],
        forceType: 'pull',
        mechanicsType: 'compound',
        isCustom: false,
      },
      {
        id: 'ex_4',
        name: 'Barbell Overhead Press',
        category: 'compound',
        muscleGroups: ['Shoulders', 'Triceps'],
        equipment: 'Barbell',
        description: 'Standing shoulder press for overall strength',
        aliases: ['Overhead Press', 'Military Press', 'OHP'],
        difficulty: 'intermediate',
        instructions: [
          'Stand with bar at shoulder height',
          'Grip slightly wider than shoulders',
          'Press bar overhead',
          'Lock out at top',
          'Lower with control',
        ],
        tips: [
          'Squeeze glutes for stability',
          'Press in a straight line',
          'Don\'t lean back excessively',
        ],
        videoUrls: [],
        imageUrls: [],
        variations: ['Seated Overhead Press', 'Push Press', 'Dumbbell Overhead Press'],
        alternatives: ['Dumbbell Shoulder Press', 'Arnold Press'],
        primaryMuscles: ['Shoulders'],
        secondaryMuscles: ['Triceps', 'Core'],
        equipmentRequired: ['Barbell'],
        forceType: 'push',
        mechanicsType: 'compound',
        isCustom: false,
      },
      {
        id: 'ex_5',
        name: 'Barbell Row',
        category: 'compound',
        muscleGroups: ['Back', 'Biceps'],
        equipment: 'Barbell',
        description: 'Horizontal pulling for back thickness',
        aliases: ['Bent-Over Row', 'Pendlay Row'],
        difficulty: 'intermediate',
        instructions: [
          'Hip hinge to ~45 degrees',
          'Grip bar shoulder-width',
          'Pull to lower chest/upper abdomen',
          'Squeeze shoulder blades together',
          'Lower with control',
        ],
        tips: [
          'Keep core braced',
          'Don\'t use momentum',
          'Lead with elbows',
        ],
        videoUrls: [],
        imageUrls: [],
        variations: ['Pendlay Row', 'Yates Row', 'T-Bar Row'],
        alternatives: ['Dumbbell Row', 'Seated Cable Row'],
        primaryMuscles: ['Back'],
        secondaryMuscles: ['Biceps', 'Rear Delts'],
        equipmentRequired: ['Barbell'],
        forceType: 'pull',
        mechanicsType: 'compound',
        isCustom: false,
      },
    ]; */

  // ============================================================================
  // Filtering Logic
  // ============================================================================

  const filteredExercises = React.useMemo(() => {
    let result = [...exercises, ...customExercises];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.aliases?.some((alias) => alias.toLowerCase().includes(query)) ||
          ex.muscleGroups.some((mg) => mg.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter((ex) => ex.category === filters.category);
    }

    // Muscle group filter
    if (filters.muscleGroup) {
      result = result.filter((ex) =>
        ex.muscleGroups.some((mg) => mg.toLowerCase() === filters.muscleGroup?.toLowerCase())
      );
    }

    // Equipment filter
    if (filters.equipment) {
      result = result.filter((ex) => ex.equipment === filters.equipment);
    }

    // Difficulty filter
    if (filters.difficulty) {
      result = result.filter((ex) => ex.difficulty === filters.difficulty);
    }

    // Custom filter
    if (filters.isCustom !== undefined) {
      result = result.filter((ex) => ex.isCustom === filters.isCustom);
    }

    return result;
  }, [exercises, customExercises, searchQuery, filters]);

  // ============================================================================
  // Exercise Management
  // ============================================================================

  const getExerciseById = useCallback(
    (id: string) => {
      return [...exercises, ...customExercises].find((ex) => ex.id === id);
    },
    [exercises, customExercises]
  );

  const createCustomExercise = useCallback(
    async (request: CreateExerciseRequest): Promise<EnhancedExercise> => {
      try {
        // Try API when online
        if (isConnected && isInternetReachable) {
          const { data, error: apiError } = await withApiErrorHandling(
            () => exerciseApi.createCustomExercise({
              name: request.name,
              category: request.category,
              muscleGroups: request.muscleGroups,
              equipment: request.equipment,
              description: request.description,
            }),
            'create_custom_exercise'
          );

          if (data) {
            const updated = [...customExercises, data];
            setCustomExercises(updated);
            await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(updated));
            console.log('[ExerciseContext] ✅ Created custom exercise via API:', data.name);
            return data;
          }

          if (apiError) {
            console.warn('[ExerciseContext] API failed, queueing offline:', apiError.message);
            // Fall through to offline handling
          }
        }

        // Offline or API failed - queue for sync
        const tempExercise: EnhancedExercise = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: request.name,
          category: request.category,
          muscleGroups: request.muscleGroups,
          equipment: request.equipment,
          description: request.description,
          aliases: [],
          difficulty: request.difficulty || 'intermediate',
          instructions: request.instructions || [],
          tips: request.tips || [],
          videoUrls: [],
          imageUrls: [],
          variations: [],
          alternatives: [],
          primaryMuscles: request.muscleGroups,
          secondaryMuscles: [],
          equipmentRequired: [request.equipment],
          forceType: 'push',
          mechanicsType: request.category === 'compound' ? 'compound' : 'isolation',
          isCustom: true,
          createdByUserId: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Queue for later sync
        await offlineQueueWorkout.enqueue({
          type: 'CREATE_EXERCISE',
          payload: request,
          maxRetries: 3,
        });

        // Add optimistically
        const updated = [...customExercises, tempExercise];
        setCustomExercises(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(updated));

        console.log('[ExerciseContext] 📱 Queued custom exercise for sync:', tempExercise.name);
        return tempExercise;
      } catch (err) {
        console.error('[ExerciseContext] Failed to create custom exercise:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'exercise', operation: 'create' },
          });
        }
        throw err;
      }
    },
    [customExercises, user, isConnected, isInternetReachable]
  );

  const updateCustomExercise = useCallback(
    async (id: string, updates: Partial<CreateExerciseRequest>) => {
      try {
        const updated = customExercises.map((ex) => {
          if (ex.id === id) {
            return {
              ...ex,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return ex;
        });

        setCustomExercises(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(updated));
        console.log('[ExerciseContext] Updated custom exercise:', id);
      } catch (err) {
        console.error('[ExerciseContext] Failed to update custom exercise:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'exercise', operation: 'update' },
          });
        }
        throw err;
      }
    },
    [customExercises]
  );

  const deleteCustomExercise = useCallback(
    async (id: string) => {
      try {
        const updated = customExercises.filter((ex) => ex.id !== id);
        setCustomExercises(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(updated));
        console.log('[ExerciseContext] Deleted custom exercise:', id);
      } catch (err) {
        console.error('[ExerciseContext] Failed to delete custom exercise:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'exercise', operation: 'delete' },
          });
        }
        throw err;
      }
    },
    [customExercises]
  );

  // ============================================================================
  // Favorites
  // ============================================================================

  const toggleFavorite = useCallback(
    async (exerciseId: string) => {
      try {
        const updated = favoriteIds.includes(exerciseId)
          ? favoriteIds.filter((id) => id !== exerciseId)
          : [...favoriteIds, exerciseId];

        setFavoriteIds(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_EXERCISES, JSON.stringify(updated));
        console.log('[ExerciseContext] Toggled favorite:', exerciseId);
      } catch (err) {
        console.error('[ExerciseContext] Failed to toggle favorite:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'exercise', operation: 'favorite' },
          });
        }
      }
    },
    [favoriteIds]
  );

  const isFavorite = useCallback(
    (exerciseId: string) => favoriteIds.includes(exerciseId),
    [favoriteIds]
  );

  // ============================================================================
  // History
  // ============================================================================

  const getExerciseHistory = useCallback(
    async (exerciseId: string): Promise<ExerciseHistoryResponse | null> => {
      try {
        // TODO: Implement API call
        // const response = await apiClient.getExerciseHistory(exerciseId);
        // return response.data;
        console.log('[ExerciseContext] Getting history for:', exerciseId);
        return null;
      } catch (err) {
        console.error('[ExerciseContext] Failed to get exercise history:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'exercise', operation: 'history' },
          });
        }
        return null;
      }
    },
    []
  );

  // ============================================================================
  // Refresh
  // ============================================================================

  const refreshExercises = useCallback(async () => {
    setIsRefreshing(true);
    await loadExercises();
    setIsRefreshing(false);
  }, [loadExercises]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Sync offline queue when coming online
  useEffect(() => {
    if (isConnected && isInternetReachable && !isSyncing) {
      const syncQueue = async () => {
        setIsSyncing(true);
        console.log('[ExerciseContext] 🔄 Syncing offline queue...');

        try {
          await offlineQueueWorkout.sync({
            CREATE_EXERCISE: async (payload) => {
              await exerciseApi.createCustomExercise(payload);
              console.log('[ExerciseContext] ✅ Synced custom exercise');
            },
          });

          // Reload exercises after sync
          await loadExercises();
        } catch (error) {
          console.error('[ExerciseContext] Sync failed:', error);
        } finally {
          setIsSyncing(false);
        }
      };

      syncQueue();
    }
  }, [isConnected, isInternetReachable, isSyncing, loadExercises]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ExerciseContextType = {
    exercises,
    customExercises,
    favoriteIds,
    filters,
    searchQuery,
    filteredExercises,
    isLoading,
    isRefreshing,
    isSyncing,
    error,
    setFilters,
    setSearchQuery,
    clearFilters,
    getExerciseById,
    createCustomExercise,
    updateCustomExercise,
    deleteCustomExercise,
    toggleFavorite,
    isFavorite,
    getExerciseHistory,
    refreshExercises,
  };

  return (
    <ExerciseContext.Provider value={value}>{children}</ExerciseContext.Provider>
  );
}
