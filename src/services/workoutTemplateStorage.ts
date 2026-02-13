/**
 * Workout Template Storage Service
 * Handles CRUD operations for user-created workout templates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EnhancedExercise } from '../../shared/src/types/workout';
import devLog from '../utils/devLog';

// Storage key
const STORAGE_KEY = '@workout_templates';

// Types
export type WorkoutCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full-body'
  | 'arms'
  | 'core'
  | 'custom';

export type SetType = 'straight' | 'superset' | 'dropset';

export interface WorkoutExerciseConfig {
  id: string;
  exerciseId: string;
  exercise: EnhancedExercise;
  order: number;
  sets: number;
  repsMin: number;
  repsMax?: number;
  rir: number; // 0-5 (Reps In Reserve)
  restSeconds: number;
  setType: SetType;
  supersetWith?: string;
  notes?: string;
}

export interface UserWorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: WorkoutCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: WorkoutExerciseConfig[];
  muscleGroups: string[];
  estimatedDuration: number;
  timesUsed: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Category metadata
export const WORKOUT_CATEGORIES: Record<WorkoutCategory, { label: string; icon: string; muscles: string[] }> = {
  push: { label: 'Push', icon: 'hand-fist', muscles: ['Chest', 'Shoulders', 'Triceps'] },
  pull: { label: 'Pull', icon: 'arrows-in', muscles: ['Back', 'Biceps'] },
  legs: { label: 'Legs', icon: 'person-simple-walk', muscles: ['Quads', 'Hamstrings', 'Glutes'] },
  upper: { label: 'Upper Body', icon: 'user', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'] },
  lower: { label: 'Lower Body', icon: 'sneaker', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  'full-body': { label: 'Full Body', icon: 'person-arms-spread', muscles: ['All'] },
  arms: { label: 'Arms', icon: 'hand-grabbing', muscles: ['Biceps', 'Triceps', 'Forearms'] },
  core: { label: 'Core', icon: 'circle-wavy', muscles: ['Abs', 'Obliques', 'Lower Back'] },
  custom: { label: 'Custom', icon: 'pencil-simple', muscles: [] },
};

// RIR descriptions
export const RIR_DESCRIPTIONS: Record<number, { label: string; description: string }> = {
  0: { label: 'RIR 0', description: 'Failure - no more reps possible' },
  1: { label: 'RIR 1', description: 'Could do 1 more rep' },
  2: { label: 'RIR 2', description: 'Could do 2 more reps' },
  3: { label: 'RIR 3', description: 'Comfortable - 3 reps in tank' },
  4: { label: 'RIR 4', description: 'Moderate effort' },
  5: { label: 'RIR 5', description: 'Warm-up intensity' },
};

/**
 * Generate a unique ID for templates
 */
function generateId(): string {
  return `wt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate estimated duration based on exercises
 */
export function calculateEstimatedDuration(exercises: WorkoutExerciseConfig[]): number {
  let totalSeconds = 0;

  for (const exercise of exercises) {
    // Time per set (approx 45 seconds for working set)
    const setTime = exercise.sets * 45;
    // Rest time between sets
    const restTime = (exercise.sets - 1) * exercise.restSeconds;
    totalSeconds += setTime + restTime;
  }

  // Add transition time between exercises (30 seconds each)
  totalSeconds += (exercises.length - 1) * 30;

  return Math.round(totalSeconds / 60); // Return in minutes
}

/**
 * Extract unique muscle groups from exercises
 */
export function extractMuscleGroups(exercises: WorkoutExerciseConfig[]): string[] {
  const muscles = new Set<string>();

  for (const exercise of exercises) {
    if (exercise.exercise.muscleGroups) {
      exercise.exercise.muscleGroups.forEach(m => muscles.add(m));
    }
    if (exercise.exercise.primaryMuscles) {
      exercise.exercise.primaryMuscles.forEach(m => muscles.add(m));
    }
  }

  return Array.from(muscles);
}

/**
 * Get all workout templates for a user
 */
export async function getTemplates(userId: string): Promise<UserWorkoutTemplate[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const allTemplates: UserWorkoutTemplate[] = JSON.parse(data);
    return allTemplates.filter(t => t.userId === userId);
  } catch (error) {
    devLog.warn('Failed to get workout templates:', error);
    return [];
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<UserWorkoutTemplate | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const allTemplates: UserWorkoutTemplate[] = JSON.parse(data);
    return allTemplates.find(t => t.id === templateId) || null;
  } catch (error) {
    devLog.warn('Failed to get workout template:', error);
    return null;
  }
}

/**
 * Create a new workout template
 */
export async function createTemplate(
  userId: string,
  template: Omit<UserWorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'timesUsed' | 'estimatedDuration' | 'muscleGroups'>
): Promise<UserWorkoutTemplate> {
  const now = new Date().toISOString();

  const newTemplate: UserWorkoutTemplate = {
    ...template,
    id: generateId(),
    userId,
    estimatedDuration: calculateEstimatedDuration(template.exercises),
    muscleGroups: extractMuscleGroups(template.exercises),
    timesUsed: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const allTemplates: UserWorkoutTemplate[] = data ? JSON.parse(data) : [];
    allTemplates.push(newTemplate);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
    return newTemplate;
  } catch (error) {
    devLog.warn('Failed to create workout template:', error);
    throw error;
  }
}

/**
 * Update an existing workout template
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<UserWorkoutTemplate, 'id' | 'userId' | 'createdAt'>>
): Promise<UserWorkoutTemplate | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const allTemplates: UserWorkoutTemplate[] = JSON.parse(data);
    const index = allTemplates.findIndex(t => t.id === templateId);

    if (index === -1) return null;

    const updatedTemplate = {
      ...allTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate if exercises changed
    if (updates.exercises) {
      updatedTemplate.estimatedDuration = calculateEstimatedDuration(updates.exercises);
      updatedTemplate.muscleGroups = extractMuscleGroups(updates.exercises);
    }

    allTemplates[index] = updatedTemplate;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
    return updatedTemplate;
  } catch (error) {
    devLog.warn('Failed to update workout template:', error);
    return null;
  }
}

/**
 * Delete a workout template
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return false;

    const allTemplates: UserWorkoutTemplate[] = JSON.parse(data);
    const filtered = allTemplates.filter(t => t.id !== templateId);

    if (filtered.length === allTemplates.length) return false;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    devLog.warn('Failed to delete workout template:', error);
    return false;
  }
}

/**
 * Duplicate a workout template
 */
export async function duplicateTemplate(templateId: string, newName?: string): Promise<UserWorkoutTemplate | null> {
  try {
    const template = await getTemplate(templateId);
    if (!template) return null;

    const now = new Date().toISOString();
    const duplicated: UserWorkoutTemplate = {
      ...template,
      id: generateId(),
      name: newName || `${template.name} (Copy)`,
      timesUsed: 0,
      lastUsedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const allTemplates: UserWorkoutTemplate[] = data ? JSON.parse(data) : [];
    allTemplates.push(duplicated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));

    return duplicated;
  } catch (error) {
    devLog.warn('Failed to duplicate workout template:', error);
    return null;
  }
}

/**
 * Increment times used counter for a template
 */
export async function incrementTimesUsed(templateId: string): Promise<void> {
  try {
    await updateTemplate(templateId, {
      timesUsed: ((await getTemplate(templateId))?.timesUsed || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    });
  } catch (error) {
    devLog.warn('Failed to increment times used:', error);
  }
}
