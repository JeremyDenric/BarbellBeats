/**
 * Forge Mode — Official Programs
 * Six built-in periodized programs with workout day-type tags for playlist generation.
 * The `description` field on each ProgramWorkout encodes the day-type:
 *   'push' | 'pull' | 'legs' | 'upper' | 'full_body' | 'deload'
 */

import type { WorkoutProgram } from '../../shared/src/types/workout';

// ============================================================================
// Constants
// ============================================================================

export const FREE_PROGRAM_IDS = ['forge_beginner_foundation'];

// ============================================================================
// Programs
// ============================================================================

export const FORGE_PROGRAMS: WorkoutProgram[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Beginner Foundation (FREE tier — 3 days/week, 8 weeks)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'forge_beginner_foundation',
    userId: 'official',
    name: 'Beginner Foundation',
    description: 'Full-body 3-day/week program for those new to lifting. Linear progression on the big 3.',
    difficulty: 'beginner',
    durationWeeks: 8,
    goal: 'general',
    tags: ['forge', 'beginner', 'full-body', 'barbell', 'free'],
    isPublic: true,
    isOfficial: true,
    weeks: [1, 2, 3, 4, 5, 6, 7, 8].map((weekNumber) => ({
      weekNumber,
      description: weekNumber % 4 === 0 ? 'Deload Week — 60% weights' : `Week ${weekNumber} — Full Body`,
      workouts: [
        {
          dayNumber: 1,
          name: 'Full Body A',
          description: 'full_body',
          estimatedDuration: 60,
          exercises: [
            { exerciseId: 'ex_squat', order: 1, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            { exerciseId: 'ex_bench', order: 2, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            { exerciseId: 'ex_row', order: 3, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Full Body B',
          description: 'full_body',
          estimatedDuration: 60,
          exercises: [
            { exerciseId: 'ex_squat', order: 1, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            { exerciseId: 'ex_ohp', order: 2, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            { exerciseId: 'ex_deadlift', order: 3, sets: 1, reps: 5, repsMin: 5, repsMax: 5, restSeconds: 240, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
          ],
        },
        {
          dayNumber: 3,
          name: 'Full Body A',
          description: 'full_body',
          estimatedDuration: 60,
          exercises: [
            { exerciseId: 'ex_squat', order: 1, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            { exerciseId: 'ex_bench', order: 2, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            { exerciseId: 'ex_row', order: 3, sets: 3, reps: 5, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
          ],
        },
      ],
    })),
    createdBy: 'BarbellBeats Team',
    totalWorkouts: 24,
    estimatedTimePerWorkout: 60,
    equipmentRequired: ['Barbell', 'Squat Rack', 'Bench'],
    likes: 0,
    saves: 0,
    completions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. 5/3/1 Strength (PRO — 4 days/week, 12 weeks)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'forge_strength_531',
    userId: 'official',
    name: '5/3/1 Strength',
    description: 'Classic 5/3/1 wave periodization. 4-day/week upper/lower split. Deload every 4th week.',
    difficulty: 'intermediate',
    durationWeeks: 12,
    goal: 'strength',
    tags: ['forge', 'barbell', 'periodized', '531', 'strength'],
    isPublic: true,
    isOfficial: true,
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((weekNumber) => {
      const isDeload = weekNumber % 4 === 0;
      const cycleWeek = ((weekNumber - 1) % 3) + 1; // 1, 2, 3 repeating
      const repsMap: Record<number, number> = { 1: 5, 2: 3, 3: 1 };
      const mainReps = isDeload ? 5 : repsMap[cycleWeek];
      return {
        weekNumber,
        description: isDeload
          ? 'Deload Week — 60% weights, recovery'
          : cycleWeek === 1 ? `Week ${weekNumber} — 5s`
          : cycleWeek === 2 ? `Week ${weekNumber} — 3s`
          : `Week ${weekNumber} — 1s (PR week)`,
        workouts: [
          {
            dayNumber: 1,
            name: 'Squat + Accessories',
            description: 'legs',
            estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_squat', order: 1, sets: isDeload ? 3 : 3, reps: mainReps, repsMin: mainReps, repsMax: mainReps + 3, restSeconds: 240, setType: 'straight', weightProgression: 'percentage', progressionRate: 2.5, rpe: isDeload ? 5 : 8 },
              { exerciseId: 'ex_leg_press', order: 2, sets: 3, reps: 10, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_leg_curl', order: 3, sets: 3, reps: 10, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Bench + Accessories',
            description: 'push',
            estimatedDuration: 70,
            exercises: [
              { exerciseId: 'ex_bench', order: 1, sets: 3, reps: mainReps, repsMin: mainReps, repsMax: mainReps + 3, restSeconds: 240, setType: 'straight', weightProgression: 'percentage', progressionRate: 2.5, rpe: isDeload ? 5 : 8 },
              { exerciseId: 'ex_dip', order: 2, sets: 3, reps: 10, repsMin: 8, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_tricep_pushdown', order: 3, sets: 3, reps: 12, repsMin: 10, repsMax: 15, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Deadlift + Accessories',
            description: 'pull',
            estimatedDuration: 70,
            exercises: [
              { exerciseId: 'ex_deadlift', order: 1, sets: isDeload ? 3 : 1, reps: mainReps, repsMin: mainReps, repsMax: mainReps + 2, restSeconds: 300, setType: 'straight', weightProgression: 'percentage', progressionRate: 5, rpe: isDeload ? 5 : 9 },
              { exerciseId: 'ex_row', order: 2, sets: 5, reps: 10, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_pulldown', order: 3, sets: 3, reps: 10, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 4,
            name: 'OHP + Accessories',
            description: 'push',
            estimatedDuration: 65,
            exercises: [
              { exerciseId: 'ex_ohp', order: 1, sets: 3, reps: mainReps, repsMin: mainReps, repsMax: mainReps + 3, restSeconds: 240, setType: 'straight', weightProgression: 'percentage', progressionRate: 1.25, rpe: isDeload ? 5 : 8 },
              { exerciseId: 'ex_lateral_raise', order: 2, sets: 3, reps: 15, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 1.25 },
              { exerciseId: 'ex_face_pull', order: 3, sets: 3, reps: 15, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
        ],
      };
    }),
    createdBy: 'BarbellBeats Team',
    totalWorkouts: 48,
    estimatedTimePerWorkout: 70,
    equipmentRequired: ['Barbell', 'Squat Rack', 'Bench', 'Cable Machine'],
    likes: 0,
    saves: 0,
    completions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PPL Hypertrophy (PRO — 6 days/week, 10 weeks)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'forge_ppl_hypertrophy',
    userId: 'official',
    name: 'PPL Hypertrophy',
    description: 'Push/Pull/Legs 6-day split for maximum muscle growth. High volume, moderate intensity.',
    difficulty: 'intermediate',
    durationWeeks: 10,
    goal: 'hypertrophy',
    tags: ['forge', 'ppl', 'hypertrophy', 'push-pull-legs', 'volume'],
    isPublic: true,
    isOfficial: true,
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((weekNumber) => {
      const isDeload = weekNumber % 4 === 0;
      return {
        weekNumber,
        description: isDeload ? 'Deload Week' : `Week ${weekNumber}`,
        workouts: [
          {
            dayNumber: 1, name: 'Push 1', description: 'push', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_bench', order: 1, sets: 4, repsMin: 6, repsMax: 10, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_incline_db', order: 2, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_lateral_raise', order: 3, sets: 4, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 1.25 },
              { exerciseId: 'ex_tricep_pushdown', order: 4, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 2, name: 'Pull 1', description: 'pull', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_pullup', order: 1, sets: 4, repsMin: 6, repsMax: 12, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_row', order: 2, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_face_pull', order: 3, sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_curl', order: 4, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 3, name: 'Legs 1', description: 'legs', estimatedDuration: 80,
            exercises: [
              { exerciseId: 'ex_squat', order: 1, sets: 4, repsMin: 6, repsMax: 10, restSeconds: 240, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_leg_press', order: 2, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_leg_curl', order: 3, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_calf_raise', order: 4, sets: 4, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
            ],
          },
          {
            dayNumber: 4, name: 'Push 2', description: 'push', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_ohp', order: 1, sets: 4, repsMin: 6, repsMax: 10, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 1.25 },
              { exerciseId: 'ex_dip', order: 2, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_cable_fly', order: 3, sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_tricep_ext', order: 4, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 5, name: 'Pull 2', description: 'pull', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_deadlift', order: 1, sets: 3, repsMin: 5, repsMax: 8, restSeconds: 240, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_pulldown', order: 2, sets: 4, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_rear_delt', order: 3, sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_hammer_curl', order: 4, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 6, name: 'Legs 2', description: 'legs', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_rdl', order: 1, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_hack_squat', order: 2, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_leg_ext', order: 3, sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_calf_raise', order: 4, sets: 4, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
            ],
          },
        ],
      };
    }),
    createdBy: 'BarbellBeats Team',
    totalWorkouts: 60,
    estimatedTimePerWorkout: 75,
    equipmentRequired: ['Barbell', 'Dumbbells', 'Cable Machine', 'Squat Rack', 'Bench'],
    likes: 0,
    saves: 0,
    completions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Full Body Recomp (PRO — 3 days/week, 12 weeks)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'forge_recomp_fullbody',
    userId: 'official',
    name: 'Full Body Recomp',
    description: 'Lose fat and build muscle simultaneously. 3 days/week full body, moderate calories.',
    difficulty: 'intermediate',
    durationWeeks: 12,
    goal: 'general',
    tags: ['forge', 'recomp', 'full-body', 'fat-loss', 'muscle'],
    isPublic: true,
    isOfficial: true,
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((weekNumber) => {
      const isDeload = weekNumber % 4 === 0;
      return {
        weekNumber,
        description: isDeload ? 'Deload Week' : `Week ${weekNumber}`,
        workouts: [
          {
            dayNumber: 1, name: 'Full Body A', description: 'full_body', estimatedDuration: 65,
            exercises: [
              { exerciseId: 'ex_squat', order: 1, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_bench', order: 2, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_row', order: 3, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 2, name: 'Full Body B', description: 'full_body', estimatedDuration: 65,
            exercises: [
              { exerciseId: 'ex_deadlift', order: 1, sets: 3, repsMin: 6, repsMax: 10, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_ohp', order: 2, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 1.25 },
              { exerciseId: 'ex_pulldown', order: 3, sets: 4, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 3, name: 'Full Body C', description: 'full_body', estimatedDuration: 65,
            exercises: [
              { exerciseId: 'ex_rdl', order: 1, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_incline_db', order: 2, sets: 4, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_pullup', order: 3, sets: 4, repsMin: 6, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
        ],
      };
    }),
    createdBy: 'BarbellBeats Team',
    totalWorkouts: 36,
    estimatedTimePerWorkout: 65,
    equipmentRequired: ['Barbell', 'Dumbbells', 'Cable Machine', 'Pull-up Bar'],
    likes: 0,
    saves: 0,
    completions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Athletic Performance (PRO — 4 days/week, 8 weeks)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'forge_athletic_performance',
    userId: 'official',
    name: 'Athletic Performance',
    description: 'Sport-performance training combining strength, power, and conditioning. 4 days/week.',
    difficulty: 'advanced',
    durationWeeks: 8,
    goal: 'endurance',
    tags: ['forge', 'athletic', 'power', 'conditioning', 'sport'],
    isPublic: true,
    isOfficial: true,
    weeks: [1, 2, 3, 4, 5, 6, 7, 8].map((weekNumber) => {
      const isDeload = weekNumber % 4 === 0;
      return {
        weekNumber,
        description: isDeload ? 'Deload Week' : `Week ${weekNumber}`,
        workouts: [
          {
            dayNumber: 1, name: 'Lower Power', description: 'legs', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_squat', order: 1, sets: 5, repsMin: 3, repsMax: 5, restSeconds: 240, setType: 'straight', weightProgression: 'percentage', progressionRate: 5 },
              { exerciseId: 'ex_power_clean', order: 2, sets: 4, repsMin: 3, repsMax: 5, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_box_jump', order: 3, sets: 4, reps: 5, repsMin: 3, repsMax: 5, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            ],
          },
          {
            dayNumber: 2, name: 'Upper Power', description: 'upper', estimatedDuration: 70,
            exercises: [
              { exerciseId: 'ex_bench', order: 1, sets: 5, repsMin: 3, repsMax: 5, restSeconds: 240, setType: 'straight', weightProgression: 'percentage', progressionRate: 2.5 },
              { exerciseId: 'ex_ohp', order: 2, sets: 4, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 1.25 },
              { exerciseId: 'ex_row', order: 3, sets: 4, repsMin: 5, repsMax: 8, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
            ],
          },
          {
            dayNumber: 3, name: 'Lower Volume', description: 'legs', estimatedDuration: 75,
            exercises: [
              { exerciseId: 'ex_deadlift', order: 1, sets: 4, repsMin: 5, repsMax: 8, restSeconds: 240, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
              { exerciseId: 'ex_rdl', order: 2, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_leg_press', order: 3, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 5 },
            ],
          },
          {
            dayNumber: 4, name: 'Upper Volume', description: 'upper', estimatedDuration: 70,
            exercises: [
              { exerciseId: 'ex_incline_db', order: 1, sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_pulldown', order: 2, sets: 4, repsMin: 10, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 2.5 },
              { exerciseId: 'ex_lateral_raise', order: 3, sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 1.25 },
            ],
          },
        ],
      };
    }),
    createdBy: 'BarbellBeats Team',
    totalWorkouts: 32,
    estimatedTimePerWorkout: 72,
    equipmentRequired: ['Barbell', 'Dumbbells', 'Cable Machine', 'Plyo Box'],
    likes: 0,
    saves: 0,
    completions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Maintenance Cycle (PRO — 3 days/week, 4-week repeating cycle)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'forge_maintenance',
    userId: 'official',
    name: 'Maintenance Cycle',
    description: 'Keep your gains with minimal time investment. 3 days/week, 45 min/session. Perfect for busy seasons.',
    difficulty: 'beginner',
    durationWeeks: 4,
    goal: 'general',
    tags: ['forge', 'maintenance', 'minimal', 'full-body', 'busy'],
    isPublic: true,
    isOfficial: true,
    weeks: [1, 2, 3, 4].map((weekNumber) => ({
      weekNumber,
      description: weekNumber === 4 ? 'Deload Week' : `Week ${weekNumber}`,
      workouts: [
        {
          dayNumber: 1, name: 'Upper Body', description: 'upper', estimatedDuration: 45,
          exercises: [
            { exerciseId: 'ex_bench', order: 1, sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            { exerciseId: 'ex_row', order: 2, sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            { exerciseId: 'ex_ohp', order: 3, sets: 2, repsMin: 8, repsMax: 12, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
          ],
        },
        {
          dayNumber: 2, name: 'Lower Body', description: 'legs', estimatedDuration: 45,
          exercises: [
            { exerciseId: 'ex_squat', order: 1, sets: 3, repsMin: 6, repsMax: 10, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            { exerciseId: 'ex_rdl', order: 2, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            { exerciseId: 'ex_calf_raise', order: 3, sets: 2, repsMin: 12, repsMax: 20, restSeconds: 60, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
          ],
        },
        {
          dayNumber: 3, name: 'Full Body', description: 'full_body', estimatedDuration: 50,
          exercises: [
            { exerciseId: 'ex_deadlift', order: 1, sets: 2, repsMin: 5, repsMax: 8, restSeconds: 180, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            { exerciseId: 'ex_pullup', order: 2, sets: 3, repsMin: 5, repsMax: 10, restSeconds: 120, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
            { exerciseId: 'ex_dip', order: 3, sets: 3, repsMin: 8, repsMax: 15, restSeconds: 90, setType: 'straight', weightProgression: 'linear', progressionRate: 0 },
          ],
        },
      ],
    })),
    createdBy: 'BarbellBeats Team',
    totalWorkouts: 12,
    estimatedTimePerWorkout: 47,
    equipmentRequired: ['Barbell', 'Pull-up Bar', 'Dip Bars'],
    likes: 0,
    saves: 0,
    completions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const FORGE_PROGRAM_IDS = FORGE_PROGRAMS.map((p) => p.id);
