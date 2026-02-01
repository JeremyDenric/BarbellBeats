/**
 * Exercise Routes
 * Handles exercise library and exercise history
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import type { AppContext } from '../types';

const app = new Hono<AppContext>();

// Most routes require authentication, but listing exercises is public
const publicApp = new Hono<AppContext>();

// ============================================================================
// Public Routes
// ============================================================================

/**
 * GET /api/exercises
 * List all exercises with optional filtering
 */
publicApp.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const equipment = c.req.query('equipment');
    const muscleGroup = c.req.query('muscleGroup');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (equipment) {
      where.equipment = equipment;
    }

    if (muscleGroup) {
      where.muscleGroups = {
        has: muscleGroup,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.exercise.count({ where }),
    ]);

    return c.json({
      exercises,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return c.json({ error: 'Failed to fetch exercises' }, 500);
  }
});

/**
 * GET /api/exercises/:id
 * Get exercise details
 */
publicApp.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return c.json({ error: 'Exercise not found' }, 404);
    }

    return c.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return c.json({ error: 'Failed to fetch exercise' }, 500);
  }
});

// ============================================================================
// Authenticated Routes
// ============================================================================

app.use('*', requireAuth());

/**
 * GET /api/exercises/:id/history
 * Get user's history for a specific exercise
 */
app.get('/:id/history', async (c) => {
  try {
    const userId = c.get('userId');
    const { id: exerciseId } = c.req.param();
    const weeks = parseInt(c.req.query('weeks') || '12');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Get exercise details
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return c.json({ error: 'Exercise not found' }, 404);
    }

    // Get all sets for this exercise
    const sets = await prisma.workoutSet.findMany({
      where: {
        exerciseId,
        workout: {
          userId,
          completedAt: { not: null, gte: startDate },
        },
      },
      include: {
        workout: {
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Calculate total volume and sets
    const totalSets = sets.length;
    const totalVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

    // Get personal best
    const personalBest = await prisma.personalRecord.findFirst({
      where: {
        userId,
        exerciseId,
      },
      orderBy: {
        oneRepMax: 'desc',
      },
      include: {
        exercise: true,
      },
    });

    // Volume progression by week
    const volumeByWeek = sets.reduce((acc, set) => {
      const week = new Date(set.workout.startedAt).toISOString().split('T')[0];
      const volume = set.weight * set.reps;
      const existing = acc.find((v) => v.week === week);
      if (existing) {
        existing.volume += volume;
        existing.sets += 1;
      } else {
        acc.push({ week, volume, sets: 1 });
      }
      return acc;
    }, [] as any[]);

    return c.json({
      exerciseId,
      exercise,
      totalSets,
      totalVolume,
      personalBest,
      recentSets: sets.slice(0, 20),
      volumeProgression: volumeByWeek,
    });
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    return c.json({ error: 'Failed to fetch exercise history' }, 500);
  }
});

/**
 * POST /api/exercises
 * Create a custom exercise (for users)
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Check if exercise name already exists
    const existing = await prisma.exercise.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      return c.json({ error: 'Exercise with this name already exists' }, 400);
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: body.name,
        category: body.category,
        muscleGroups: body.muscleGroups || [],
        equipment: body.equipment,
        description: body.description,
        videoUrl: body.videoUrl,
      },
    });

    return c.json(exercise, 201);
  } catch (error) {
    console.error('Error creating exercise:', error);
    return c.json({ error: 'Failed to create exercise' }, 500);
  }
});

/**
 * GET /api/exercises/popular
 * Get most popular exercises (by usage)
 */
app.get('/popular', async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '10');

    // Get exercises sorted by usage count
    const sets = await prisma.workoutSet.findMany({
      where: {
        workout: {
          userId,
          completedAt: { not: null },
        },
      },
      select: {
        exerciseId: true,
        exercise: true,
      },
    });

    // Count exercise usage
    const exerciseCountMap = new Map();
    sets.forEach((set) => {
      const count = exerciseCountMap.get(set.exerciseId) || 0;
      exerciseCountMap.set(set.exerciseId, count + 1);
    });

    // Sort by usage and get top exercises
    const popularExercises = Array.from(exerciseCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([exerciseId, count]) => {
        const set = sets.find((s) => s.exerciseId === exerciseId);
        return {
          ...set?.exercise,
          usageCount: count,
        };
      });

    return c.json(popularExercises);
  } catch (error) {
    console.error('Error fetching popular exercises:', error);
    return c.json({ error: 'Failed to fetch popular exercises' }, 500);
  }
});

// Mount both public and authenticated routes
const exerciseRouter = new Hono<AppContext>();
exerciseRouter.route('/', publicApp);
exerciseRouter.route('/', app);

export default exerciseRouter;
