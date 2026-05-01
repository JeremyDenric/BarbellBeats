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
  useMemo,
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
import devLog from '../utils/devLog';
import { useAuth } from './AuthContext';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  USER_TEMPLATES: '@bb_user_templates',
  OFFICIAL_TEMPLATES: '@bb_official_templates',
  FAVORITE_TEMPLATES: '@bb_favorite_templates',
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

      devLog.log('[TemplateContext] Templates loaded successfully');
    } catch (err) {
      devLog.error('[TemplateContext] Failed to load templates:', err);
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
    const ts = new Date().toISOString();
    const t = (
      id: string,
      name: string,
      description: string,
      category: string,
      difficulty: WorkoutTemplate['difficulty'],
      tags: string[],
      muscleGroups: string[],
      equipment: string[],
      duration: number,
      likes: number,
      saves: number,
      exercises: WorkoutTemplate['exercises']
    ): WorkoutTemplate => ({
      id,
      userId: 'official',
      name,
      description,
      category,
      difficulty,
      tags,
      exercises,
      estimatedDuration: duration,
      muscleGroups,
      equipmentRequired: equipment,
      timesUsed: 0,
      isPublic: true,
      likes,
      saves,
      createdAt: ts,
      updatedAt: ts,
    });

    return [
      // ── PPL ────────────────────────────────────────────────────────────────
      t('tmpl_push', 'Push Day', 'Chest, shoulders, and triceps. Volume-focused hypertrophy.', 'Upper Body', 'intermediate',
        ['push', 'chest', 'shoulders', 'triceps', 'ppl'],
        ['Chest', 'Shoulders', 'Triceps'], ['Barbell', 'Bench', 'Cable'], 70, 1240, 987, [
          { exerciseId: 'ex_chest_1', order: 1, sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_chest_2', order: 2, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_shoulders_1', order: 3, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_shoulders_3', order: 4, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, setType: 'straight' },
          { exerciseId: 'ex_arms_6', order: 5, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_chest_4', order: 6, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, setType: 'straight' },
        ]),

      t('tmpl_pull', 'Pull Day', 'Back and biceps. Build a thick, wide back.', 'Upper Body', 'intermediate',
        ['pull', 'back', 'biceps', 'ppl'],
        ['Back', 'Biceps', 'Rear Delts'], ['Barbell', 'Cable', 'Pull-Up Bar'], 65, 1183, 921, [
          { exerciseId: 'ex_back_1', order: 1, sets: 3, repsMin: 4, repsMax: 6, restSeconds: 240, setType: 'straight' },
          { exerciseId: 'ex_back_3', order: 2, sets: 4, repsMin: 6, repsMax: 8, restSeconds: 150, setType: 'straight' },
          { exerciseId: 'ex_back_2', order: 3, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_back_4', order: 4, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_shoulders_4', order: 5, sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60, setType: 'straight' },
          { exerciseId: 'ex_arms_1', order: 6, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90, setType: 'straight' },
        ]),

      t('tmpl_legs', 'Leg Day', 'Quads, hamstrings, glutes. Leave nothing in the tank.', 'Lower Body', 'intermediate',
        ['legs', 'quads', 'hamstrings', 'glutes', 'ppl'],
        ['Quads', 'Hamstrings', 'Glutes', 'Calves'], ['Barbell', 'Squat Rack', 'Leg Press'], 75, 1421, 1103, [
          { exerciseId: 'ex_legs_1', order: 1, sets: 4, repsMin: 5, repsMax: 8, restSeconds: 210, setType: 'straight' },
          { exerciseId: 'ex_legs_3', order: 2, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_legs_6', order: 3, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_legs_4', order: 4, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_legs_7', order: 5, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_legs_8', order: 6, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 90, setType: 'straight' },
        ]),

      // ── Upper / Lower ──────────────────────────────────────────────────────
      t('tmpl_upper_strength', 'Upper Body Strength', 'Strength-focused upper day. Low reps, heavy loads.', 'Upper Body', 'intermediate',
        ['upper', 'strength', 'bench', 'row'],
        ['Chest', 'Back', 'Shoulders', 'Arms'], ['Barbell', 'Bench', 'Cable'], 65, 876, 703, [
          { exerciseId: 'ex_chest_1', order: 1, sets: 5, repsMin: 3, repsMax: 5, restSeconds: 240, setType: 'straight' },
          { exerciseId: 'ex_back_2', order: 2, sets: 5, repsMin: 3, repsMax: 5, restSeconds: 240, setType: 'straight' },
          { exerciseId: 'ex_shoulders_1', order: 3, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_back_3', order: 4, sets: 3, repsMin: 6, repsMax: 8, restSeconds: 150, setType: 'straight' },
          { exerciseId: 'ex_arms_4', order: 5, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_arms_1', order: 6, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90, setType: 'straight' },
        ]),

      t('tmpl_lower_strength', 'Lower Body Strength', 'Squat and deadlift focused. Compound-heavy lower day.', 'Lower Body', 'intermediate',
        ['lower', 'strength', 'squat', 'deadlift'],
        ['Quads', 'Hamstrings', 'Glutes', 'Lower Back'], ['Barbell', 'Squat Rack'], 70, 812, 651, [
          { exerciseId: 'ex_legs_1', order: 1, sets: 5, repsMin: 3, repsMax: 5, restSeconds: 240, setType: 'straight' },
          { exerciseId: 'ex_back_1', order: 2, sets: 3, repsMin: 3, repsMax: 5, restSeconds: 300, setType: 'straight' },
          { exerciseId: 'ex_legs_2', order: 3, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_legs_6', order: 4, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_core_2', order: 5, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight' },
        ]),

      // ── Full Body ──────────────────────────────────────────────────────────
      t('tmpl_full_body_a', 'Full Body A', 'Squat pattern + horizontal push/pull. Pairs with Full Body B.', 'Full Body', 'beginner',
        ['full-body', 'beginner', 'compound'],
        ['Quads', 'Chest', 'Back', 'Core'], ['Barbell', 'Squat Rack', 'Bench'], 55, 1052, 844, [
          { exerciseId: 'ex_legs_1', order: 1, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_chest_1', order: 2, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_back_2', order: 3, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_core_1', order: 4, sets: 3, repsMin: 30, repsMax: 60, restSeconds: 60, setType: 'straight' },
        ]),

      t('tmpl_full_body_b', 'Full Body B', 'Hip hinge + vertical push/pull. Pairs with Full Body A.', 'Full Body', 'beginner',
        ['full-body', 'beginner', 'compound'],
        ['Hamstrings', 'Shoulders', 'Back', 'Core'], ['Barbell', 'Squat Rack'], 55, 988, 791, [
          { exerciseId: 'ex_back_1', order: 1, sets: 1, repsMin: 5, repsMax: 5, restSeconds: 300, setType: 'straight' },
          { exerciseId: 'ex_shoulders_1', order: 2, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight' },
          { exerciseId: 'ex_back_3', order: 3, sets: 3, repsMin: 6, repsMax: 8, restSeconds: 150, setType: 'straight' },
          { exerciseId: 'ex_legs_6', order: 4, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_core_2', order: 5, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight' },
        ]),

      // ── Specialisation ─────────────────────────────────────────────────────
      t('tmpl_chest_shoulders', 'Chest & Shoulders', 'High-volume chest and shoulder hypertrophy block.', 'Upper Body', 'intermediate',
        ['chest', 'shoulders', 'hypertrophy', 'upper'],
        ['Chest', 'Anterior Delts', 'Triceps'], ['Barbell', 'Dumbbells', 'Bench', 'Cable'], 60, 743, 598, [
          { exerciseId: 'ex_chest_1', order: 1, sets: 4, repsMin: 8, repsMax: 10, restSeconds: 150, setType: 'straight' },
          { exerciseId: 'ex_chest_2', order: 2, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_chest_3', order: 3, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_shoulders_2', order: 4, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_shoulders_3', order: 5, sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60, setType: 'straight' },
          { exerciseId: 'ex_chest_4', order: 6, sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60, setType: 'straight' },
        ]),

      t('tmpl_back_biceps', 'Back & Biceps', 'Width and thickness. Pull-up superset with rows.', 'Upper Body', 'intermediate',
        ['back', 'biceps', 'pull', 'hypertrophy'],
        ['Lats', 'Rhomboids', 'Biceps'], ['Cable', 'Pull-Up Bar', 'Barbell'], 60, 819, 657, [
          { exerciseId: 'ex_back_3', order: 1, sets: 4, repsMin: 6, repsMax: 8, restSeconds: 150, setType: 'straight' },
          { exerciseId: 'ex_back_4', order: 2, sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_back_2', order: 3, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_back_5', order: 4, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_arms_1', order: 5, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_arms_3', order: 6, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, setType: 'straight' },
        ]),

      t('tmpl_arms', 'Arms Day', 'Dedicated biceps and triceps volume. Leave them pumped.', 'Upper Body', 'beginner',
        ['arms', 'biceps', 'triceps', 'isolation'],
        ['Biceps', 'Triceps'], ['Barbell', 'Dumbbells', 'Cable'], 50, 634, 512, [
          { exerciseId: 'ex_arms_1', order: 1, sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_arms_4', order: 2, sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_arms_2', order: 3, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75, setType: 'straight' },
          { exerciseId: 'ex_arms_6', order: 4, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75, setType: 'straight' },
          { exerciseId: 'ex_arms_3', order: 5, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, setType: 'straight' },
          { exerciseId: 'ex_arms_7', order: 6, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, setType: 'straight' },
        ]),

      t('tmpl_glute_focus', 'Glute & Hamstring', 'Posterior chain emphasis. Hip thrusts, RDLs, curls.', 'Lower Body', 'intermediate',
        ['glutes', 'hamstrings', 'posterior', 'lower'],
        ['Glutes', 'Hamstrings'], ['Barbell', 'Cable', 'Machine'], 60, 921, 748, [
          { exerciseId: 'ex_legs_8', order: 1, sets: 4, repsMin: 10, repsMax: 12, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_legs_6', order: 2, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 120, setType: 'straight' },
          { exerciseId: 'ex_legs_4', order: 3, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_legs_7', order: 4, sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_core_1', order: 5, sets: 3, repsMin: 45, repsMax: 90, restSeconds: 60, setType: 'straight' },
        ]),

      t('tmpl_core_conditioning', 'Core & Conditioning', 'Anti-rotation, flexion, and carries. Built for the long game.', 'Core', 'beginner',
        ['core', 'abs', 'conditioning', 'bodyweight'],
        ['Core', 'Abs', 'Lower Back'], ['Bodyweight', 'Cable'], 40, 578, 445, [
          { exerciseId: 'ex_core_1', order: 1, sets: 4, repsMin: 30, repsMax: 60, restSeconds: 60, setType: 'straight' },
          { exerciseId: 'ex_core_2', order: 2, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight' },
          { exerciseId: 'ex_core_3', order: 3, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, setType: 'straight' },
          { exerciseId: 'ex_chest_5', order: 4, sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight' },
        ]),
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
          id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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

        devLog.log('[TemplateContext] Created template:', newTemplate.name);
        return newTemplate;
      } catch (err) {
        devLog.error('[TemplateContext] Failed to create template:', err);
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
        devLog.log('[TemplateContext] Updated template:', id);
      } catch (err) {
        devLog.error('[TemplateContext] Failed to update template:', err);
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
        devLog.log('[TemplateContext] Deleted template:', id);
      } catch (err) {
        devLog.error('[TemplateContext] Failed to delete template:', err);
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
          id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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

        devLog.log('[TemplateContext] Duplicated template:', duplicated.name);
        return duplicated;
      } catch (err) {
        devLog.error('[TemplateContext] Failed to duplicate template:', err);
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
        devLog.log('[TemplateContext] Incremented usage count for:', id);
      } catch (err) {
        devLog.error('[TemplateContext] Failed to increment usage:', err);
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
        devLog.log('[TemplateContext] Toggled favorite:', templateId);
      } catch (err) {
        devLog.error('[TemplateContext] Failed to toggle favorite:', err);
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

  const value = useMemo<TemplateContextType>(
    () => ({
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
    }),
    [templates, userTemplates, officialTemplates, favoriteIds, filters, filteredTemplates, isLoading, isRefreshing, error, setFilters, clearFilters, getTemplateById, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, incrementUsageCount, toggleFavorite, isFavorite, refreshTemplates]
  );

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}
