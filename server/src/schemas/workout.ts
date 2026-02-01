/**
 * Workout Validation Schemas
 */

import { z } from 'zod';
import { uuidSchema, paginationSchema, nonNegativeInt, positiveInt } from './common';

// ============================================================================
// Query Schemas
// ============================================================================

export const listWorkoutsQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'completed', 'all']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const workoutAnalyticsQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).default(12),
});

// ============================================================================
// Body Schemas
// ============================================================================

export const createWorkoutSchema = z.object({
  gymId: uuidSchema.optional(),
  title: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
  programId: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
});

export const updateWorkoutSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const completeWorkoutSchema = z.object({
  notes: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const addSetSchema = z.object({
  exerciseId: uuidSchema,
  weight: nonNegativeInt,
  reps: positiveInt,
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  isWarmup: z.boolean().default(false),
  restSeconds: nonNegativeInt.optional(),
});

export const updateSetSchema = z.object({
  weight: nonNegativeInt.optional(),
  reps: positiveInt.optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  isWarmup: z.boolean().optional(),
});

// ============================================================================
// Type exports
// ============================================================================

export type ListWorkoutsQuery = z.infer<typeof listWorkoutsQuerySchema>;
export type WorkoutAnalyticsQuery = z.infer<typeof workoutAnalyticsQuerySchema>;
export type CreateWorkout = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkout = z.infer<typeof updateWorkoutSchema>;
export type CompleteWorkout = z.infer<typeof completeWorkoutSchema>;
export type AddSet = z.infer<typeof addSetSchema>;
export type UpdateSet = z.infer<typeof updateSetSchema>;
