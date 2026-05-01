import type { Workout } from '../../shared/src/types/workout';

/**
 * Returns the number of consecutive calendar days (ending today or yesterday)
 * on which at least one workout was completed.
 *
 * A gap of 1 missed day resets the streak to 0.
 * If the last workout was yesterday the streak is still live.
 */
export function computeWorkoutStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;

  // Collect unique calendar days that have a completed workout (YYYY-MM-DD local)
  const daySet = new Set<string>();
  for (const w of workouts) {
    const raw = w.completedAt ?? w.createdAt;
    if (!raw) continue;
    const d = new Date(raw);
    // Local date string so midnight doesn't bleed into the previous day
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    daySet.add(key);
  }

  const today = new Date();
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Walk backwards from today until a day with no workout is found
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = toKey(cursor);
    if (daySet.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today has no workout yet — still allow streak from yesterday
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Returns the longest streak ever achieved (for a personal best badge).
 */
export function computeLongestStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;

  const daySet = new Set<string>();
  for (const w of workouts) {
    const raw = w.completedAt ?? w.createdAt;
    if (!raw) continue;
    const d = new Date(raw);
    daySet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const days = Array.from(daySet).sort();
  let longest = 0;
  let current = 0;

  for (let i = 0; i < days.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      current = diffDays === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}
