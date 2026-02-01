/**
 * Program Routes
 * Handles workout programs, onboarding, and progress tracking
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import type { AppContext } from '../types';

const app = new Hono<AppContext>();

// All routes require authentication
app.use('*', requireAuth());

// ============================================================================
// Onboarding
// ============================================================================

/**
 * POST /api/programs/onboarding
 * Save user onboarding preferences
 */
app.post('/onboarding', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        primaryGoal: body.primaryGoal,
        experience: body.experience,
        daysPerWeek: body.daysPerWeek,
        minutesPerSession: body.minutesPerSession,
        equipment: body.equipment || [],
        preferredSplit: body.preferredSplit,
      },
      update: {
        primaryGoal: body.primaryGoal,
        experience: body.experience,
        daysPerWeek: body.daysPerWeek,
        minutesPerSession: body.minutesPerSession,
        equipment: body.equipment || [],
        preferredSplit: body.preferredSplit,
      },
    });

    return c.json(onboarding, 201);
  } catch (error) {
    console.error('Error saving onboarding:', error);
    return c.json({ error: 'Failed to save onboarding' }, 500);
  }
});

/**
 * GET /api/programs/onboarding
 * Get user onboarding preferences
 */
app.get('/onboarding', async (c) => {
  try {
    const userId = c.get('userId');

    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId },
    });

    return c.json(onboarding || null);
  } catch (error) {
    console.error('Error fetching onboarding:', error);
    return c.json({ error: 'Failed to fetch onboarding' }, 500);
  }
});

/**
 * GET /api/programs/onboarding/recommendations
 * Get program recommendations based on onboarding
 */
app.get('/onboarding/recommendations', async (c) => {
  try {
    const userId = c.get('userId');

    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      return c.json({ error: 'Complete onboarding first' }, 400);
    }

    // Build filter based on onboarding
    const where: any = {
      isPublic: true,
      sessionsPerWeek: { lte: onboarding.daysPerWeek },
      timePerSession: { lte: onboarding.minutesPerSession },
    };

    // Filter by category if goal is specific
    if (onboarding.primaryGoal === 'strength') {
      where.category = 'strength';
    } else if (onboarding.primaryGoal === 'hypertrophy') {
      where.category = 'hypertrophy';
    } else if (onboarding.primaryGoal === 'endurance') {
      where.category = 'endurance';
    }

    // Filter by difficulty
    if (onboarding.experience) {
      where.difficulty = onboarding.experience;
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        sessions: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    // Calculate match scores
    const recommendations = programs.map((program) => {
      let matchScore = 50; // Base score
      const reasons: string[] = [];

      // Goal match
      if (program.category === onboarding.primaryGoal) {
        matchScore += 20;
        reasons.push(`Matches your ${onboarding.primaryGoal} goal`);
      }

      // Experience match
      if (program.difficulty === onboarding.experience) {
        matchScore += 15;
        reasons.push(`Designed for ${onboarding.experience}s`);
      }

      // Schedule fit
      if (program.sessionsPerWeek === onboarding.daysPerWeek) {
        matchScore += 10;
        reasons.push(`Fits your ${onboarding.daysPerWeek} days/week schedule`);
      }

      // Equipment compatibility
      const hasAllEquipment = program.equipmentNeeded.every((eq) =>
        onboarding.equipment.includes(eq)
      );
      if (hasAllEquipment) {
        matchScore += 5;
        reasons.push('You have all required equipment');
      }

      return {
        program,
        matchScore: Math.min(100, matchScore),
        reasons,
      };
    });

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return c.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return c.json({ error: 'Failed to fetch recommendations' }, 500);
  }
});

// ============================================================================
// Program Library
// ============================================================================

/**
 * GET /api/programs
 * List all programs with filtering
 */
app.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const difficulty = c.req.query('difficulty');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const where: any = { isPublic: true };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          sessions: {
            select: {
              id: true,
              name: true,
              weekNumber: true,
              dayNumber: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.program.count({ where }),
    ]);

    return c.json({
      programs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return c.json({ error: 'Failed to fetch programs' }, 500);
  }
});

/**
 * GET /api/programs/:id
 * Get program details with all sessions
 */
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
      },
    });

    if (!program) {
      return c.json({ error: 'Program not found' }, 404);
    }

    return c.json(program);
  } catch (error) {
    console.error('Error fetching program:', error);
    return c.json({ error: 'Failed to fetch program' }, 500);
  }
});

// ============================================================================
// User Program Progress
// ============================================================================

/**
 * POST /api/programs/:id/start
 * Start a program
 */
app.post('/:id/start', async (c) => {
  try {
    const userId = c.get('userId');
    const { id: programId } = c.req.param();

    // Get program details
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { sessions: true },
    });

    if (!program) {
      return c.json({ error: 'Program not found' }, 404);
    }

    // Check if user already has an active program
    const existing = await prisma.userProgramProgress.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    if (existing) {
      return c.json(
        { error: 'You already have an active program. Pause or complete it first.' },
        400
      );
    }

    const totalSessions = program.sessions.length;

    const progress = await prisma.userProgramProgress.create({
      data: {
        userId,
        programId,
        totalSessions,
        status: 'active',
      },
      include: {
        program: {
          include: {
            sessions: true,
          },
        },
      },
    });

    return c.json(progress, 201);
  } catch (error) {
    console.error('Error starting program:', error);
    return c.json({ error: 'Failed to start program' }, 500);
  }
});

/**
 * GET /api/programs/active
 * Get user's active program
 */
app.get('/active', async (c) => {
  try {
    const userId = c.get('userId');

    const progress = await prisma.userProgramProgress.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        program: {
          include: {
            sessions: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
        session: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    return c.json(progress || null);
  } catch (error) {
    console.error('Error fetching active program:', error);
    return c.json({ error: 'Failed to fetch active program' }, 500);
  }
});

/**
 * PATCH /api/programs/progress
 * Update program progress
 */
app.patch('/progress', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const progress = await prisma.userProgramProgress.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    if (!progress) {
      return c.json({ error: 'No active program found' }, 404);
    }

    const updated = await prisma.userProgramProgress.update({
      where: { id: progress.id },
      data: {
        currentWeek: body.currentWeek,
        currentDay: body.currentDay,
        status: body.status,
        completedAt: body.status === 'completed' ? new Date() : undefined,
      },
      include: {
        program: {
          include: {
            sessions: true,
          },
        },
      },
    });

    return c.json(updated);
  } catch (error) {
    console.error('Error updating progress:', error);
    return c.json({ error: 'Failed to update progress' }, 500);
  }
});

/**
 * POST /api/programs/:id/complete-session
 * Mark a session as completed
 */
app.post('/:id/complete-session', async (c) => {
  try {
    const userId = c.get('userId');
    const { id: programId } = c.req.param();
    const body = await c.req.json();
    const { sessionId, workoutId } = body;

    const progress = await prisma.userProgramProgress.findFirst({
      where: {
        userId,
        programId,
        status: 'active',
      },
    });

    if (!progress) {
      return c.json({ error: 'Active program not found' }, 404);
    }

    // Link workout to program if provided
    if (workoutId) {
      await prisma.workout.update({
        where: { id: workoutId },
        data: {
          programId,
          sessionId,
          sessionCompleted: true,
        },
      });
    }

    // Update progress
    const updated = await prisma.userProgramProgress.update({
      where: { id: progress.id },
      data: {
        completedSessions: { increment: 1 },
        lastSessionAt: new Date(),
        sessionId,
      },
      include: {
        program: {
          include: {
            sessions: true,
          },
        },
      },
    });

    return c.json(updated);
  } catch (error) {
    console.error('Error completing session:', error);
    return c.json({ error: 'Failed to complete session' }, 500);
  }
});

export default app;
