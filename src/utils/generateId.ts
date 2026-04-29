/**
 * generateId
 * Single source of truth for non-cryptographic ID generation across the app.
 * Format: <timestamp_base36>-<random_5chars>
 * e.g. "lf3kzq2p-x7w4a"
 *
 * This is intentionally not a UUID — UUIDs are overkill for local storage keys,
 * workout IDs, and similar non-security contexts. The timestamp prefix makes IDs
 * naturally sortable and debuggable. Collision probability is negligible for
 * single-user offline storage.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
