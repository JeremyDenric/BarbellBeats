/**
 * Workout Routes
 * Handles workout logging, set tracking, and analytics
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { formatPaginatedResponse } from '../utils/pagination';
import { logError } from '../utils/logger';
import { NotFoundError, BadRequestError } from '../types';
import {
  paginationSchema,
  uuidSchema,
  idParamSchema,
} from '../schemas/common';
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  addSetSchema,
  workoutAnalyticsQuerySchema,
} from '../schemas/workout';
import type { AppContext } from '../types';

const app = new Hono<AppContext>();

// All routes require authentication
app.use('*', requireAuth());

// ============================================================================
// Types
// ============================================================================

interface VolumeByWeek {
  week: string;
  volume: number;
  sets: number;
  workouts: number;
}

interface ExerciseVolume {
  exerciseId: string;
  exerciseName: string;
  volume: number;
  sets: number;
  totalWeight: number;
  avgWeight?: number;
}

// ============================================================================
// Workout CRUD
// ============================================================================

/**
 * POST /api/workouts
 * Start a new workout
 */
app.post(
  '/',
  validate({ json: createWorkoutSchema }),
  async (c) => {
    const userId = c.get('userId') as string;
    const body = c.get('validatedBody') as z.infer<typeof createWorkoutSchema>;

    const workout = await prisma.workout.create({
      data: {
        userId,
        gymId: body.gymId,
        title: body.title,
        notes: body.notes,
        programId: body.programId,
        sessionId: body.sessionId,
        startedAt: new Date(),
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return c.json(workout, 201);
  }
);

/**
 * GET /api/workouts
 * List user's workouts with pagination
 */
const listWorkoutsQuerySchema = paginationSchema.extend({
  programId: uuidSchema.optional(),
});

app.get(
  '/',
  validate({ query: listWorkoutsQuerySchema }),
  async (c) => {
    const userId = c.get('userId') as string;
    const query = c.get('validatedQuery') as z.infer<typeof listWorkoutsQuerySchema>;

    const where = {
      userId,
      ...(query.programId && { programId: query.programId }),
    };

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: {
          sets: {
            include: {
              exercise: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.workout.count({ where }),
    ]);

    return c.json(formatPaginatedResponse(workouts, total, query));
  }
);

/**
 * GET /api/workouts/:id
 * Get workout details
 */
app.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.param();

    const workout = await prisma.workout.findFirst({
      where: { id, userId },
      include: {
        sets: {
          include: {
            exercise: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    return c.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    return c.json({ error: 'Failed to fetch workout' }, 500);
  }
});

/**
 * PATCH /api/workouts/:id
 * Update workout details
 */
app.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.param();
    const body = await c.req.json();

    const workout = await prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    const updated = await prisma.workout.update({
      where: { id },
      data: {
        title: body.title,
        notes: body.notes,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        duration: body.duration,
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return c.json(updated);
  } catch (error) {
    console.error('Error updating workout:', error);
    return c.json({ error: 'Failed to update workout' }, 500);
  }
});

/**
 * POST /api/workouts/:id/complete
 * Complete a workout and calculate metrics
 */
app.post('/:id/complete', async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.param();

    const workout = await prisma.workout.findFirst({
      where: { id, userId },
      include: { sets: true },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    if (workout.completedAt) {
      return c.json({ error: 'Workout already completed' }, 400);
    }

    // Calculate metrics
    const totalSets = workout.sets.length;
    const totalReps = workout.sets.reduce((sum, set) => sum + set.reps, 0);
    const totalVolume = workout.sets.reduce(
      (sum, set) => sum + set.weight * set.reps,
      0
    );

    const completedAt = new Date();
    const duration = Math.floor(
      (completedAt.getTime() - workout.startedAt.getTime()) / 1000
    );

    const updated = await prisma.workout.update({
      where: { id },
      data: {
        completedAt,
        duration,
        totalSets,
        totalReps,
        totalVolume,
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return c.json(updated);
  } catch (error) {
    console.error('Error completing workout:', error);
    return c.json({ error: 'Failed to complete workout' }, 500);
  }
});

/**
 * DELETE /api/workouts/:id
 * Delete a workout
 */
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.param();

    const workout = await prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    await prisma.workout.delete({ where: { id } });

    return c.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return c.json({ error: 'Failed to delete workout' }, 500);
  }
});

// ============================================================================
// Workout Sets
// ============================================================================

/**
 * POST /api/workouts/:id/sets
 * Add a set to a workout
 */
app.post('/:id/sets', async (c) => {
  try {
    const userId = c.get('userId');
    const { id: workoutId } = c.req.param();
    const body = await c.req.json();

    // Verify workout ownership
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
      include: { sets: true },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    if (workout.completedAt) {
      return c.json({ error: 'Cannot add sets to completed workout' }, 400);
    }

    // Get set number
    const setNumber = workout.sets.filter(
      (s) => s.exerciseId === body.exerciseId
    ).length + 1;

    const set = await prisma.workoutSet.create({
      data: {
        workoutId,
        exerciseId: body.exerciseId,
        setNumber,
        reps: body.reps,
        weight: body.weight,
        unit: body.unit || 'lbs',
        rpe: body.rpe,
        repQuality: body.repQuality,
        setType: body.setType || 'working',
        restSeconds: body.restSeconds,
        tempo: body.tempo,
        notes: body.notes,
      },
      include: {
        exercise: true,
      },
    });

    return c.json(set, 201);
  } catch (error) {
    console.error('Error creating set:', error);
    return c.json({ error: 'Failed to create set' }, 500);
  }
});

/**
 * PATCH /api/workouts/:id/sets/:setId
 * Update a set
 */
app.patch('/:id/sets/:setId', async (c) => {
  try {
    const userId = c.get('userId');
    const { id: workoutId, setId } = c.req.param();
    const body = await c.req.json();

    // Verify workout ownership
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    const set = await prisma.workoutSet.update({
      where: { id: setId },
      data: {
        reps: body.reps,
        weight: body.weight,
        unit: body.unit,
        rpe: body.rpe,
        repQuality: body.repQuality,
        setType: body.setType,
        restSeconds: body.restSeconds,
        tempo: body.tempo,
        notes: body.notes,
      },
      include: {
        exercise: true,
      },
    });

    return c.json(set);
  } catch (error) {
    console.error('Error updating set:', error);
    return c.json({ error: 'Failed to update set' }, 500);
  }
});

/**
 * DELETE /api/workouts/:id/sets/:setId
 * Delete a set
 */
app.delete('/:id/sets/:setId', async (c) => {
  try {
    const userId = c.get('userId');
    const { id: workoutId, setId } = c.req.param();

    // Verify workout ownership
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      return c.json({ error: 'Workout not found' }, 404);
    }

    await prisma.workoutSet.delete({ where: { id: setId } });

    return c.json({ message: 'Set deleted successfully' });
  } catch (error) {
    console.error('Error deleting set:', error);
    return c.json({ error: 'Failed to delete set' }, 500);
  }
});

// ============================================================================
// Analytics
// ============================================================================

/**
 * GET /api/workouts/analytics
 * Get workout analytics and charts data
 */
app.get('/analytics', async (c) => {
  try {
    const userId = c.get('userId');
    const weeks = parseInt(c.req.query('weeks') || '12');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        completedAt: { not: null, gte: startDate },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    // Calculate metrics
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const totalSets = workouts.reduce((sum, w) => sum + w.totalSets, 0);
    const totalReps = workouts.reduce((sum, w) => sum + w.totalReps, 0);
    const avgWorkoutDuration =
      workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / totalWorkouts;

    // Volume by week
    const volumeByWeek = workouts.reduce<VolumeByWeek[]>((acc, workout) => {
      const week = new Date(workout.startedAt).toISOString().split('T')[0];
      const existing = acc.find((v) => v.week === week);
      if (existing) {
        existing.volume += workout.totalVolume;
        existing.sets += workout.totalSets;
        existing.workouts += 1;
      } else {
        acc.push({
          week,
          volume: workout.totalVolume,
          sets: workout.totalSets,
          workouts: 1,
        });
      }
      return acc;
    }, []);

    // Volume by exercise
    const exerciseVolumeMap = new Map<string, ExerciseVolume>();
    workouts.forEach((workout) => {
      workout.sets.forEach((set) => {
        const key = set.exerciseId;
        const existing = exerciseVolumeMap.get(key);
        const volume = set.weight * set.reps;
        if (existing) {
          existing.volume += volume;
          existing.sets += 1;
          existing.totalWeight += set.weight;
        } else {
          exerciseVolumeMap.set(key, {
            exerciseId: set.exerciseId,
            exerciseName: set.exercise.name,
            volume,
            sets: 1,
            totalWeight: set.weight,
          });
        }
      });
    });

    const volumeByExercise = Array.from(exerciseVolumeMap.values())
      .map((v) => ({
        ...v,
        avgWeight: v.totalWeight / v.sets,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return c.json({
      totalWorkouts,
      totalVolume,
      totalSets,
      totalReps,
      avgWorkoutDuration,
      volumeByWeek,
      volumeByExercise,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

/**
 * GET /api/workouts/weekly-summary
 * Get current week's summary
 */
app.get('/weekly-summary', async (c) => {
  try {
    const userId = c.get('userId');

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        startedAt: { gte: weekStart, lt: weekEnd },
        completedAt: { not: null },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    const workoutCount = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const totalSets = workouts.reduce((sum, w) => sum + w.totalSets, 0);

    // Count PRs this week
    const prsAchieved = await prisma.personalRecord.count({
      where: {
        userId,
        achievedAt: { gte: weekStart, lt: weekEnd },
      },
    });

    // Top exercises by volume
    const exerciseMap = new Map();
    workouts.forEach((w) => {
      w.sets.forEach((s) => {
        const volume = s.weight * s.reps;
        exerciseMap.set(
          s.exercise.name,
          (exerciseMap.get(s.exercise.name) || 0) + volume
        );
      });
    });

    const topExercises = Array.from(exerciseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return c.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      workoutCount,
      totalVolume,
      totalSets,
      prsAchieved,
      topExercises,
    });
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return c.json({ error: 'Failed to fetch weekly summary' }, 500);
  }
});

export default app;
