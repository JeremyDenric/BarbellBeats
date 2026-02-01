/**
 * Common Validation Schemas
 * Reusable Zod schemas for request validation
 */

import { z } from 'zod';

// ============================================================================
// Common Primitives
// ============================================================================

/** UUID validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** Positive integer */
export const positiveInt = z.coerce.number().int().positive();

/** Non-negative integer */
export const nonNegativeInt = z.coerce.number().int().min(0);

/** Email validation */
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

/** URL validation */
export const urlSchema = z.string().url('Invalid URL format');

// ============================================================================
// Pagination
// ============================================================================

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const paginationWithPageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================================
// ID Parameters
// ============================================================================

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const userIdParamSchema = z.object({
  userId: uuidSchema,
});

// ============================================================================
// Enums
// ============================================================================

export const userRoleEnum = z.enum(['user', 'admin', 'moderator']);

export const primaryGoalEnum = z.enum([
  'strength',
  'muscle',
  'endurance',
  'weight_loss',
  'general_fitness',
]);

export const experienceLevelEnum = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);

export const difficultyEnum = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);

export const programStatusEnum = z.enum([
  'active',
  'paused',
  'completed',
  'abandoned',
]);

export const exerciseCategoryEnum = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
  'full_body',
  'other',
]);

export const equipmentEnum = z.enum([
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'bodyweight',
  'bands',
  'other',
  'none',
]);

// ============================================================================
// Type exports
// ============================================================================

export type Pagination = z.infer<typeof paginationSchema>;
export type PaginationWithPage = z.infer<typeof paginationWithPageSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type UserRole = z.infer<typeof userRoleEnum>;
export type PrimaryGoal = z.infer<typeof primaryGoalEnum>;
export type ExperienceLevel = z.infer<typeof experienceLevelEnum>;
export type Difficulty = z.infer<typeof difficultyEnum>;
export type ProgramStatus = z.infer<typeof programStatusEnum>;
export type ExerciseCategory = z.infer<typeof exerciseCategoryEnum>;
export type Equipment = z.infer<typeof equipmentEnum>;
