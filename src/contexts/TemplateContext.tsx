/**
 * TemplateContext
 * Manages workout templates for quick workout creation
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
  WorkoutTemplate,
  TemplateFilters,
  CreateTemplateRequest,
  TemplateExercise,
} from '../../shared/src/types/workout';
import { useAuth } from './AuthContext';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  USER_TEMPLATES: '@barbellbeats_user_templates',
  OFFICIAL_TEMPLATES: '@barbellbeats_official_templates',
  FAVORITE_TEMPLATES: '@barbellbeats_favorite_templates',
};

// ============================================================================
// Context Type
// ============================================================================

interface TemplateContextType {
  // Templates
  templates: WorkoutTemplate[];
  userTemplates: WorkoutTemplate[];
  officialTemplates: WorkoutTemplate[];
  favoriteIds: string[];

  // Filters
  filters: TemplateFilters;
  filteredTemplates: WorkoutTemplate[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: TemplateFilters) => void;
  clearFilters: () => void;

  // Template management
  getTemplateById: (id: string) => WorkoutTemplate | undefined;
  createTemplate: (request: CreateTemplateRequest) => Promise<WorkoutTemplate>;
  updateTemplate: (id: string, updates: Partial<CreateTemplateRequest>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<WorkoutTemplate>;
  incrementUsageCount: (id: string) => Promise<void>;

  // Favorites
  toggleFavorite: (templateId: string) => Promise<void>;
  isFavorite: (templateId: string) => boolean;

  // Refresh
  refreshTemplates: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within TemplateProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface TemplateProviderProps {
  children: ReactNode;
}

export function TemplateProvider({ children }: TemplateProviderProps) {
  const { user } = useAuth();

  // State
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<WorkoutTemplate[]>([]);
  const [officialTemplates, setOfficialTemplates] = useState<WorkoutTemplate[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Load Templates
  // ============================================================================

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load user templates
      const userTemplatesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_TEMPLATES);
      if (userTemplatesData) {
        const parsed = JSON.parse(userTemplatesData) as WorkoutTemplate[];
        setUserTemplates(parsed);
      }

      // Load official templates
      const officialData = await AsyncStorage.getItem(STORAGE_KEYS.OFFICIAL_TEMPLATES);
      if (officialData) {
        const parsed = JSON.parse(officialData) as WorkoutTemplate[];
        setOfficialTemplates(parsed);
      } else {
        // Load seed templates
        const seedTemplates = await loadSeedTemplates();
        setOfficialTemplates(seedTemplates);
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFICIAL_TEMPLATES,
          JSON.stringify(seedTemplates)
        );
      }

      // Load favorites
      const favData = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_TEMPLATES);
      if (favData) {
        const parsed = JSON.parse(favData) as string[];
        setFavoriteIds(parsed);
      }

      console.log('[TemplateContext] Templates loaded successfully');
    } catch (err) {
      console.error('[TemplateContext] Failed to load templates:', err);
      setError('Failed to load templates');
      if (!__DEV__) {
        Sentry.captureException(err, {
          tags: { context: 'template', operation: 'load' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Seed Templates
  // ============================================================================

  const loadSeedTemplates = async (): Promise<WorkoutTemplate[]> => {
    // TODO: Load from JSON file or API
    // For now, return sample templates
    return [
      {
        id: 'tmpl_push',
        userId: 'official',
        name: 'Push Day',
        description: 'Chest, shoulders, and triceps focused workout',
        category: 'Upper Body',
        difficulty: 'intermediate',
        tags: ['push', 'chest', 'shoulders', 'upper'],
        exercises: [
          {
            exerciseId: 'ex_1',
            order: 1,
            sets: 4,
            repsMin: 6,
            repsMax: 8,
            restSeconds: 180,
            setType: 'straight',
          },
          {
            exerciseId: 'ex_4',
            order: 2,
            sets: 3,
            repsMin: 8,
            repsMax: 10,
            restSeconds: 120,
            setType: 'straight',
          },
        ],
        estimatedDuration: 60,
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        equipmentRequired: ['Barbell', 'Bench'],
        timesUsed: 0,
        isPublic: true,
        likes: 523,
        saves: 412,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tmpl_pull',
        userId: 'official',
        name: 'Pull Day',
        description: 'Back and biceps focused workout',
        category: 'Upper Body',
        difficulty: 'intermediate',
        tags: ['pull', 'back', 'biceps', 'upper'],
        exercises: [
          {
            exerciseId: 'ex_3',
            order: 1,
            sets: 3,
            reps: 5,
            restSeconds: 180,
            setType: 'straight',
          },
          {
            exerciseId: 'ex_5',
            order: 2,
            sets: 4,
            repsMin: 8,
            repsMax: 10,
            restSeconds: 120,
            setType: 'straight',
          },
        ],
        estimatedDuration: 60,
        muscleGroups: ['Back', 'Biceps'],
        equipmentRequired: ['Barbell'],
        timesUsed: 0,
        isPublic: true,
        likes: 487,
        saves: 391,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tmpl_legs',
        userId: 'official',
        name: 'Leg Day',
        description: 'Complete lower body workout',
        category: 'Lower Body',
        difficulty: 'intermediate',
        tags: ['legs', 'lower', 'quads', 'glutes'],
        exercises: [
          {
            exerciseId: 'ex_2',
            order: 1,
            sets: 4,
            repsMin: 5,
            repsMax: 8,
            restSeconds: 180,
            setType: 'straight',
          },
          {
            exerciseId: 'ex_3',
            order: 2,
            sets: 3,
            reps: 5,
            restSeconds: 180,
            setType: 'straight',
          },
        ],
        estimatedDuration: 60,
        muscleGroups: ['Quads', 'Glutes', 'Hamstrings'],
        equipmentRequired: ['Barbell', 'Squat Rack'],
        timesUsed: 0,
        isPublic: true,
        likes: 612,
        saves: 498,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  };

  // ============================================================================
  // Combine and Filter Templates
  // ============================================================================

  useEffect(() => {
    setTemplates([...officialTemplates, ...userTemplates]);
  }, [officialTemplates, userTemplates]);

  const filteredTemplates = React.useMemo(() => {
    let result = [...templates];

    if (filters.category) {
      result = result.filter((t) => t.category === filters.category);
    }

    if (filters.difficulty) {
      result = result.filter((t) => t.difficulty === filters.difficulty);
    }

    if (filters.userId) {
      result = result.filter((t) => t.userId === filters.userId);
    }

    if (filters.isPublic !== undefined) {
      result = result.filter((t) => t.isPublic === filters.isPublic);
    }

    return result;
  }, [templates, filters]);

  // ============================================================================
  // Template Management
  // ============================================================================

  const getTemplateById = useCallback(
    (id: string) => {
      return templates.find((t) => t.id === id);
    },
    [templates]
  );

  const createTemplate = useCallback(
    async (request: CreateTemplateRequest): Promise<WorkoutTemplate> => {
      try {
        // Extract muscle groups and equipment from exercises
        const muscleGroups: string[] = [];
        const equipmentRequired: string[] = [];

        request.exercises.forEach((ex) => {
          if (ex.exercise) {
            muscleGroups.push(...ex.exercise.muscleGroups);
            equipmentRequired.push(ex.exercise.equipment);
          }
        });

        const newTemplate: WorkoutTemplate = {
          id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user?.id || 'anonymous',
          name: request.name,
          description: request.description,
          category: request.category,
          difficulty: request.difficulty,
          tags: request.tags || [],
          exercises: request.exercises,
          estimatedDuration: request.exercises.length * 10, // Rough estimate
          muscleGroups: [...new Set(muscleGroups)],
          equipmentRequired: [...new Set(equipmentRequired)],
          timesUsed: 0,
          isPublic: false,
          likes: 0,
          saves: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updated = [...userTemplates, newTemplate];
        setUserTemplates(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(updated));

        console.log('[TemplateContext] Created template:', newTemplate.name);
        return newTemplate;
      } catch (err) {
        console.error('[TemplateContext] Failed to create template:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'template', operation: 'create' },
          });
        }
        throw err;
      }
    },
    [userTemplates, user]
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<CreateTemplateRequest>) => {
      try {
        const updated = userTemplates.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });

        setUserTemplates(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(updated));
        console.log('[TemplateContext] Updated template:', id);
      } catch (err) {
        console.error('[TemplateContext] Failed to update template:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'template', operation: 'update' },
          });
        }
        throw err;
      }
    },
    [userTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      try {
        const updated = userTemplates.filter((t) => t.id !== id);
        setUserTemplates(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(updated));
        console.log('[TemplateContext] Deleted template:', id);
      } catch (err) {
        console.error('[TemplateContext] Failed to delete template:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'template', operation: 'delete' },
          });
        }
        throw err;
      }
    },
    [userTemplates]
  );

  const duplicateTemplate = useCallback(
    async (id: string): Promise<WorkoutTemplate> => {
      try {
        const template = getTemplateById(id);
        if (!template) {
          throw new Error('Template not found');
        }

        const duplicated: WorkoutTemplate = {
          ...template,
          id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user?.id || 'anonymous',
          name: `${template.name} (Copy)`,
          isPublic: false,
          timesUsed: 0,
          likes: 0,
          saves: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updated = [...userTemplates, duplicated];
        setUserTemplates(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(updated));

        console.log('[TemplateContext] Duplicated template:', duplicated.name);
        return duplicated;
      } catch (err) {
        console.error('[TemplateContext] Failed to duplicate template:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'template', operation: 'duplicate' },
          });
        }
        throw err;
      }
    },
    [userTemplates, user, getTemplateById]
  );

  const incrementUsageCount = useCallback(
    async (id: string) => {
      try {
        const updated = userTemplates.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              timesUsed: t.timesUsed + 1,
              lastUsedAt: new Date().toISOString(),
            };
          }
          return t;
        });

        setUserTemplates(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(updated));
        console.log('[TemplateContext] Incremented usage count for:', id);
      } catch (err) {
        console.error('[TemplateContext] Failed to increment usage:', err);
      }
    },
    [userTemplates]
  );

  // ============================================================================
  // Favorites
  // ============================================================================

  const toggleFavorite = useCallback(
    async (templateId: string) => {
      try {
        const updated = favoriteIds.includes(templateId)
          ? favoriteIds.filter((id) => id !== templateId)
          : [...favoriteIds, templateId];

        setFavoriteIds(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_TEMPLATES, JSON.stringify(updated));
        console.log('[TemplateContext] Toggled favorite:', templateId);
      } catch (err) {
        console.error('[TemplateContext] Failed to toggle favorite:', err);
        if (!__DEV__) {
          Sentry.captureException(err, {
            tags: { context: 'template', operation: 'favorite' },
          });
        }
      }
    },
    [favoriteIds]
  );

  const isFavorite = useCallback(
    (templateId: string) => favoriteIds.includes(templateId),
    [favoriteIds]
  );

  // ============================================================================
  // Refresh
  // ============================================================================

  const refreshTemplates = useCallback(async () => {
    setIsRefreshing(true);
    await loadTemplates();
    setIsRefreshing(false);
  }, [loadTemplates]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: TemplateContextType = {
    templates,
    userTemplates,
    officialTemplates,
    favoriteIds,
    filters,
    filteredTemplates,
    isLoading,
    isRefreshing,
    error,
    setFilters,
    clearFilters,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    incrementUsageCount,
    toggleFavorite,
    isFavorite,
    refreshTemplates,
  };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}
