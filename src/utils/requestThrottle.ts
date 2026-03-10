/**
 * Per-key request throttle utility.
 * Prevents duplicate rapid-fire calls to the same logical endpoint.
 *
 * Usage:
 *   const result = await throttle('generate-playlist', 5000, () => generatePlaylist());
 *   if (result === null) { // was throttled – skip }
 */

const lastCalled = new Map<string, number>();

/**
 * Execute `fn` only if at least `minMs` milliseconds have elapsed since
 * the last call with the same `key`. Returns `null` if throttled.
 */
export async function throttle<T>(
  key: string,
  minMs: number,
  fn: () => Promise<T>
): Promise<T | null> {
  const now = Date.now();
  const last = lastCalled.get(key) ?? 0;
  if (now - last < minMs) {
    return null;
  }
  lastCalled.set(key, now);
  return fn();
}

/**
 * Reset the throttle timer for a key (useful for testing or force-refresh).
 */
export function resetThrottle(key: string): void {
  lastCalled.delete(key);
}
