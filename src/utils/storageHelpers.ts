/**
 * Safe JSON parsing utilities for AsyncStorage reads.
 * Wraps JSON.parse in a try-catch so that corrupted storage never crashes the app.
 */

import devLog from './devLog';

/**
 * Parse a raw AsyncStorage string, returning `fallback` if the value is null,
 * empty, or contains invalid JSON.
 *
 * @example
 * const history = safeParseJSON<Workout[]>(raw, []);
 */
export function safeParseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    devLog.warn('[safeParseJSON] Failed to parse JSON, using fallback:', err);
    return fallback;
  }
}
