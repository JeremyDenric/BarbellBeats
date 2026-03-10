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
  useMemo,
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
import devLog from '../utils/devLog';
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
        devLog.log('[ExerciseContext] Attempting to load from API...');

        const { data, error: apiError } = await withApiErrorHandling(
          () => exerciseApi.listExercises(),
          'load_exercises'
        );

        if (data && data.length > 0) {
          setExercises(data);
          // Cache for offline use
          await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_CACHE, JSON.stringify(data));
          await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
          devLog.log(`[ExerciseContext] Loaded ${data.length} exercises from API`);

          // Continue to load custom exercises and favorites
        } else if (apiError) {
          devLog.warn('[ExerciseContext] API failed, falling back to cache:', apiError.message);
          setError(apiError.message);
        }
      } else {
        devLog.log('[ExerciseContext] Offline - loading from cache');
      }

      // Load from cache (either offline or as fallback)
      if (exercises.length === 0) {
        const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_CACHE);

        if (cachedData) {
          const parsed = JSON.parse(cachedData) as EnhancedExercise[];
          setExercises(parsed);
          devLog.log(`[ExerciseContext] Loaded ${parsed.length} exercises from cache`);
        } else {
          // No cache and no API - use seed data as last resort
          const seedData = await loadSeedExercises();
          setExercises(seedData);
          await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_CACHE, JSON.stringify(seedData));
          await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
          devLog.log(`[ExerciseContext] Loaded ${seedData.length} seed exercises`);
        }
      }

      // Load custom exercises
      const customData = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
      if (customData) {
        const parsed = JSON.parse(customData) as EnhancedExercise[];
        setCustomExercises(parsed);
        devLog.log(`[ExerciseContext] Loaded ${parsed.length} custom exercises`);
      }

      // Load favorites
      const favData = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_EXERCISES);
      if (favData) {
        const parsed = JSON.parse(favData) as string[];
        setFavoriteIds(parsed);
        devLog.log(`[ExerciseContext] Loaded ${parsed.length} favorites`);
      }
    } catch (err) {
      devLog.error('[ExerciseContext] Failed to load exercises:', err);
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
            devLog.log('[ExerciseContext] Created custom exercise via API:', data.name);
            return data;
          }

          if (apiError) {
            devLog.warn('[ExerciseContext] API failed, queueing offline:', apiError.message);
            // Fall through to offline handling
          }
        }

        // Offline or API failed - queue for sync
        const tempExercise: EnhancedExercise = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
          data: request,
        });

        // Add optimistically
        const updated = [...customExercises, tempExercise];
        setCustomExercises(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(updated));

        devLog.log('[ExerciseContext] Queued custom exercise for sync:', tempExercise.name);
        return tempExercise;
      } catch (err) {
        devLog.error('[ExerciseContext] Failed to create custom exercise:', err);
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
        devLog.log('[ExerciseContext] Updated custom exercise:', id);
      } catch (err) {
        devLog.error('[ExerciseContext] Failed to update custom exercise:', err);
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
        devLog.log('[ExerciseContext] Deleted custom exercise:', id);
      } catch (err) {
        devLog.error('[ExerciseContext] Failed to delete custom exercise:', err);
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
        devLog.log('[ExerciseContext] Toggled favorite:', exerciseId);
      } catch (err) {
        devLog.error('[ExerciseContext] Failed to toggle favorite:', err);
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
        devLog.log('[ExerciseContext] Getting history for:', exerciseId);
        return null;
      } catch (err) {
        devLog.error('[ExerciseContext] Failed to get exercise history:', err);
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
        devLog.log('[ExerciseContext] Syncing offline queue...');

        try {
          await offlineQueueWorkout.sync(async (action) => {
            if (action.type === 'CREATE_EXERCISE') {
              await exerciseApi.createCustomExercise(action.data as any);
              devLog.log('[ExerciseContext] Synced custom exercise');
            }
          });

          // Reload exercises after sync
          await loadExercises();
        } catch (error) {
          devLog.error('[ExerciseContext] Sync failed:', error);
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

  const value = useMemo<ExerciseContextType>(
    () => ({
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
    }),
    [exercises, customExercises, favoriteIds, filters, searchQuery, filteredExercises, isLoading, isRefreshing, isSyncing, error, setFilters, setSearchQuery, clearFilters, getExerciseById, createCustomExercise, updateCustomExercise, deleteCustomExercise, toggleFavorite, isFavorite, getExerciseHistory, refreshExercises]
  );

  return (
    <ExerciseContext.Provider value={value}>{children}</ExerciseContext.Provider>
  );
}
