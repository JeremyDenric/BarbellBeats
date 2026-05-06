/**
 * @jest-environment node
 */
import { computeWorkoutStreak, computeLongestStreak } from '../utils/workoutStreak';
import type { Workout } from '../../shared/src/types/workout';

// Build a minimal Workout with a completedAt date string (YYYY-MM-DD)
function workout(dateStr: string): Partial<Workout> {
  return { completedAt: `${dateStr}T10:00:00.000Z`, createdAt: `${dateStr}T10:00:00.000Z` };
}

// Return a date string N days before today (local time)
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const cast = (w: Partial<Workout>[]) => w as Workout[];

describe('computeWorkoutStreak', () => {
  it('returns 0 for an empty history', () => {
    expect(computeWorkoutStreak([])).toBe(0);
  });

  it('returns 1 when only today has a workout', () => {
    expect(computeWorkoutStreak(cast([workout(daysAgo(0))]))).toBe(1);
  });

  it('returns 1 when only yesterday has a workout (streak still alive)', () => {
    expect(computeWorkoutStreak(cast([workout(daysAgo(1))]))).toBe(1);
  });

  it('returns 0 when the most recent workout was 2+ days ago', () => {
    expect(computeWorkoutStreak(cast([workout(daysAgo(2))]))).toBe(0);
  });

  it('counts consecutive days correctly', () => {
    const workouts = cast([
      workout(daysAgo(0)),
      workout(daysAgo(1)),
      workout(daysAgo(2)),
    ]);
    expect(computeWorkoutStreak(workouts)).toBe(3);
  });

  it('stops counting at a gap', () => {
    const workouts = cast([
      workout(daysAgo(0)),
      workout(daysAgo(1)),
      // gap on daysAgo(2)
      workout(daysAgo(3)),
      workout(daysAgo(4)),
    ]);
    // Only today + yesterday count before the gap
    expect(computeWorkoutStreak(workouts)).toBe(2);
  });

  it('counts multiple workouts on the same day as a single day', () => {
    const today = daysAgo(0);
    const workouts = cast([
      workout(today),
      workout(today), // duplicate same day
      workout(daysAgo(1)),
    ]);
    expect(computeWorkoutStreak(workouts)).toBe(2);
  });

  it('returns 0 for workouts with no completedAt or createdAt', () => {
    const bad = [{ id: 'x' }] as unknown as Workout[];
    expect(computeWorkoutStreak(bad)).toBe(0);
  });
});

describe('computeLongestStreak', () => {
  it('returns 0 for empty history', () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it('returns 1 for a single workout', () => {
    expect(computeLongestStreak(cast([workout(daysAgo(10))]))).toBe(1);
  });

  it('finds the longest streak across a gap', () => {
    const workouts = cast([
      // 3-day streak far in the past
      workout(daysAgo(20)),
      workout(daysAgo(19)),
      workout(daysAgo(18)),
      // gap
      // 2-day streak
      workout(daysAgo(10)),
      workout(daysAgo(9)),
    ]);
    expect(computeLongestStreak(workouts)).toBe(3);
  });

  it('is always >= computeWorkoutStreak for the same input', () => {
    const workouts = cast([
      workout(daysAgo(0)),
      workout(daysAgo(1)),
      workout(daysAgo(5)),
      workout(daysAgo(6)),
      workout(daysAgo(7)),
    ]);
    expect(computeLongestStreak(workouts)).toBeGreaterThanOrEqual(
      computeWorkoutStreak(workouts)
    );
  });
});
