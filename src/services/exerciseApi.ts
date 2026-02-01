/**
 * Exercise API Service
 * Handles exercise-related API calls
 */

import { apiClient } from '../api/api-client';
import type {
  Exercise,
  EnhancedExercise,
  CreateExerciseRequest,
  ExerciseHistoryResponse,
} from '../../shared/src/types/workout';

/**
 * Fetch all exercises from the API
 */
export async function fetchExercises(): Promise<EnhancedExercise[]> {
  const response = await apiClient.listExamples({ limit: 1000 });
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch exercises');
  }
  return (response.data || []) as EnhancedExercise[];
}

/**
 * Create a new custom exercise
 */
export async function createExercise(
  data: CreateExerciseRequest
): Promise<EnhancedExercise> {
  const response = await apiClient.createExample({
    name: data.name,
    description: data.description,
    tags: data.tags,
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to create exercise');
  }
  return response.data as EnhancedExercise;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(
  id: string,
  data: Partial<CreateExerciseRequest>
): Promise<EnhancedExercise> {
  const response = await apiClient.updateExample(id, {
    name: data.name,
    description: data.description,
    tags: data.tags,
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to update exercise');
  }
  return response.data as EnhancedExercise;
}

/**
 * Delete an exercise
 */
export async function deleteExercise(id: string): Promise<void> {
  const response = await apiClient.deleteExample(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete exercise');
  }
}

/**
 * Get exercise history for a specific exercise
 */
export async function getExerciseHistory(
  exerciseId: string
): Promise<ExerciseHistoryResponse> {
  const response = await apiClient.getExampleById(exerciseId);
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch exercise history');
  }
  return response.data as ExerciseHistoryResponse;
}

/**
 * Search exercises
 */
export async function searchExercises(
  query: string,
  filters?: { category?: string; muscleGroup?: string }
): Promise<EnhancedExercise[]> {
  const response = await apiClient.searchExamples({
    q: query,
    category: filters?.category,
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to search exercises');
  }
  return (response.data || []) as EnhancedExercise[];
}

// Aliases for backward compatibility
export const listExercises = fetchExercises;
export const createCustomExercise = createExercise;
