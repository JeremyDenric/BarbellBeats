/**
 * Data Migration System
 * Handles schema versioning and automatic data migrations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import safeStorage from './safeStorage';

// ============================================================================
// Constants
// ============================================================================

export const CURRENT_STORAGE_VERSION = 1;
const VERSION_KEY = '@storage_schema_version';
const MIGRATION_TEMP_PREFIX = '@migration_tmp:';

// ============================================================================
// Migration Types
// ============================================================================

export interface Migration {
  version: number;
  description: string;
  migrate: (data: any) => Promise<any>;
}

// ============================================================================
// Migration Definitions
// ============================================================================

/**
 * Migration v1: Initial schema
 * - Standardize all date fields to ISO strings
 * - Ensure all arrays are initialized
 */
const migrationV1: Migration = {
  version: 1,
  description: 'Initial schema standardization',
  migrate: async (data: any) => {
    if (!data) return data;

    // Ensure workouts have proper structure
    if (data.workouts && Array.isArray(data.workouts)) {
      data.workouts = data.workouts.map((workout: any) => ({
        ...workout,
        date: workout.date ? new Date(workout.date).toISOString() : new Date().toISOString(),
        exercises: workout.exercises || [],
      }));
    }

    // Ensure preferences have default values
    if (data.preferences) {
      data.preferences = {
        hapticsEnabled: true,
        reduceMotion: false,
        compactMode: false,
        ...data.preferences,
      };
    }

    return data;
  },
};

// Future migrations will be added here
// const migrationV2: Migration = { ... }

// ============================================================================
// Migration Registry
// ============================================================================

const migrations: Migration[] = [
  migrationV1,
  // Add future migrations here in order
];

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Get current storage version
 */
export async function getCurrentVersion(): Promise<number> {
  const version = await safeStorage.getJSON<number>(VERSION_KEY, {
    defaultValue: 0,
  });
  return version || 0;
}

/**
 * Set storage version
 */
export async function setVersion(version: number): Promise<boolean> {
  return await safeStorage.setJSON(VERSION_KEY, version);
}

/**
 * Check if migrations are needed
 */
export async function needsMigration(): Promise<boolean> {
  const currentVersion = await getCurrentVersion();
  return currentVersion < CURRENT_STORAGE_VERSION;
}

/**
 * Run all pending migrations
 * @returns Success status and any errors encountered
 */
export async function runMigrations(): Promise<{
  success: boolean;
  version: number;
  errors: string[];
  startedAt?: string;
  durationMs?: number;
  fromVersion?: number;
}> {
  const errors: string[] = [];
  let currentVersion = await getCurrentVersion();
  const initialVersion = currentVersion;
  const startTimestamp = Date.now();

  if (__DEV__) {
    console.log(`[Migrations] Current version: ${currentVersion}`);
    console.log(`[Migrations] Target version: ${CURRENT_STORAGE_VERSION}`);
  }

  // If we're already at the latest version, nothing to do
  if (currentVersion >= CURRENT_STORAGE_VERSION) {
    if (__DEV__) {
      console.log('[Migrations] Already at latest version');
    }
    return { success: true, version: currentVersion, errors: [] };
  }

  // Get all migrations that need to run
  const pendingMigrations = migrations
    .filter((m) => m.version > currentVersion && m.version <= CURRENT_STORAGE_VERSION)
    .sort((a, b) => a.version - b.version);

  if (__DEV__) {
    console.log(
      `[Migrations] Running ${pendingMigrations.length} migration(s)`,
      pendingMigrations.map((m) => `v${m.version}: ${m.description}`)
    );
  }

  // Run migrations sequentially
  for (const migration of pendingMigrations) {
    try {
      if (__DEV__) {
        console.log(`[Migrations] Running v${migration.version}: ${migration.description}`);
      }

      // Load all current data
      const allKeys = await safeStorage.getAllKeys();
      const staleTempKeys = allKeys.filter((key) => key.startsWith(MIGRATION_TEMP_PREFIX));
      if (staleTempKeys.length > 0) {
        await AsyncStorage.multiRemove(staleTempKeys);
      }

      const dataKeys = allKeys.filter(
        (key) => !key.startsWith('@storage_') && !key.startsWith(MIGRATION_TEMP_PREFIX)
      );

      // Run migration on each data key
      for (const key of dataKeys) {
        try {
          const data = await safeStorage.getJSON(key);
          if (data !== null) {
            const migratedData = await migration.migrate(data);
            const tempKey = `${MIGRATION_TEMP_PREFIX}${key}`;
            const payload = JSON.stringify(migratedData);
            await AsyncStorage.setItem(tempKey, payload);
            await AsyncStorage.setItem(key, payload);
            await AsyncStorage.removeItem(tempKey);
          }
        } catch (keyError) {
          const errorMsg = `Failed to migrate key "${key}" for v${migration.version}: ${
            (keyError as Error).message
          }`;
          errors.push(errorMsg);
          console.error('[Migrations]', errorMsg);
        }
      }

      // Update version after successful migration
      currentVersion = migration.version;
      await setVersion(currentVersion);

      if (__DEV__) {
        console.log(`[Migrations] Successfully migrated to v${migration.version}`);
      }
    } catch (error) {
      const errorMsg = `Migration v${migration.version} failed: ${(error as Error).message}`;
      errors.push(errorMsg);
      console.error('[Migrations]', errorMsg);

      // Stop running migrations if one fails
      break;
    }
  }

  const success = currentVersion === CURRENT_STORAGE_VERSION && errors.length === 0;
  const durationMs = Date.now() - startTimestamp;

  if (__DEV__) {
    if (success) {
      console.log(
        `[Migrations] All migrations completed successfully in ${durationMs}ms`
      );
    } else {
      console.error('[Migrations] Migrations completed with errors:', errors);
    }
  }

  return {
    success,
    version: currentVersion,
    errors,
    startedAt: new Date(startTimestamp).toISOString(),
    durationMs,
    fromVersion: initialVersion,
  };
}

/**
 * Reset storage version (use with caution!)
 * This will cause all migrations to run again
 */
export async function resetVersion(): Promise<boolean> {
  if (__DEV__) {
    console.warn('[Migrations] Resetting storage version to 0');
  }
  return await safeStorage.remove(VERSION_KEY);
}

/**
 * Initialize migrations on app start
 * Should be called during app bootstrap
 */
export async function initializeMigrations(): Promise<{
  success: boolean;
  version: number;
}> {
  try {
    const needs = await needsMigration();

    if (!needs) {
      const version = await getCurrentVersion();
      return { success: true, version };
    }

    const result = await runMigrations();

    // Track migration success/failure with analytics
    if (!__DEV__ && typeof (global as any).analytics !== 'undefined') {
      (global as any).analytics.track('migrations_completed', {
        from_version: result.fromVersion ?? 0,
        to_version: result.version,
        duration_ms: result.durationMs,
        success: result.success,
        error_count: result.errors.length,
      });
    }

    if (!result.success && !__DEV__ && typeof (global as any).Sentry !== 'undefined') {
      (global as any).Sentry.captureMessage('Data migrations failed', {
        level: 'error',
        extra: {
          errors: result.errors,
          version: result.version,
          durationMs: result.durationMs,
        },
      });
    }

    return {
      success: result.success,
      version: result.version,
    };
  } catch (error) {
    console.error('[Migrations] Failed to initialize:', error);

    if (!__DEV__ && typeof (global as any).Sentry !== 'undefined') {
      (global as any).Sentry.captureException(error, {
        tags: {
          migration_init: 'failed',
        },
      });
    }

    return {
      success: false,
      version: 0,
    };
  }
}

export default {
  getCurrentVersion,
  setVersion,
  needsMigration,
  runMigrations,
  resetVersion,
  initializeMigrations,
  CURRENT_VERSION: CURRENT_STORAGE_VERSION,
};
