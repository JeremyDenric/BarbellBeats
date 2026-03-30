/**
 * Data Migration System
 * Handles schema versioning and automatic data migrations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import safeStorage from './safeStorage';
import devLog from './devLog';

// ============================================================================
// Constants
// ============================================================================

export const CURRENT_STORAGE_VERSION = 2;
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

/**
 * Migration v2: Normalize all AsyncStorage keys to @bb_ prefix.
 *
 * The app previously used 5 naming conventions:
 *   @barbellbeats/...  @barbellbeats_...  @barbell_beats_...  @cardio_...  @user  etc.
 * All persistent keys are now @bb_ prefixed for consistency.
 *
 * This migration copies data from each old key to its new @bb_ key and
 * removes the old key. The value is NOT transformed — it is copied as-is.
 *
 * Dynamic gym keys (e.g. @gym_queue_cache_<id>) are handled separately via
 * the renameKeysByPattern helper called from runKeyNormalizationMigration().
 */
const KEY_RENAME_MAP: Record<string, string> = {
  // WorkoutContext
  '@barbellbeats/active_workout':     '@bb_active_workout_legacy',
  '@barbellbeats/active_workout_v2':  '@bb_active_workout_v2',
  '@barbellbeats/workout_queue':       '@bb_workout_queue',
  '@barbellbeats/workout_history':     '@bb_workout_history',
  // ExerciseContext
  '@barbellbeats_custom_exercises':             '@bb_custom_exercises',
  '@barbellbeats_favorite_exercises':           '@bb_favorite_exercises',
  '@barbellbeats_exercise_cache':               '@bb_exercise_cache',
  '@barbellbeats_exercise_cache_timestamp':     '@bb_exercise_cache_timestamp',
  // ProgramContext
  '@barbellbeats_user_programs':                '@bb_user_programs',
  '@barbellbeats_active_program':               '@bb_active_program',
  '@barbellbeats_program_progress':             '@bb_program_progress',
  '@barbellbeats_saved_programs':               '@bb_saved_programs',
  '@barbellbeats_official_programs_cache':      '@bb_official_programs_cache',
  // ProgressContext
  '@barbellbeats_body_measurements':  '@bb_body_measurements',
  '@barbellbeats_progress_photos':    '@bb_progress_photos',
  // TemplateContext
  '@barbellbeats_user_templates':     '@bb_user_templates',
  '@barbellbeats_official_templates': '@bb_official_templates',
  '@barbellbeats_favorite_templates': '@bb_favorite_templates',
  // Misc contexts / hooks
  '@active_gym_id':              '@bb_active_gym_id',
  '@active_timer':               '@bb_active_timer',
  '@activity_log_entries':       '@bb_activity_log_entries',
  '@app_preferences':            '@bb_app_preferences',
  '@app_preferences_last_known': '@bb_app_preferences_last_known',
  '@barbell_beats_theme':        '@bb_theme',
  '@biometric_config':           '@bb_biometric_config',
  '@biometric_enabled':          '@bb_biometric_enabled',
  '@biometric_email':            '@bb_biometric_email',
  '@cardio_entries':             '@bb_cardio_entries',
  '@cardio_history':             '@bb_cardio_entries',   // duplicate key → same target
  '@cardio_preferences':         '@bb_cardio_preferences',
  '@cardio_preferences_v2':      '@bb_cardio_preferences',
  '@favorite_gym_ids':           '@bb_favorite_gym_ids',
  '@friend_outgoing_ids':        '@bb_friend_outgoing_ids',
  '@friend_request_ids':         '@bb_friend_request_ids',
  '@friends_ids':                '@bb_friends_ids',
  '@intensity_technique_logs':   '@bb_intensity_technique_logs',
  '@notification_settings':      '@bb_notification_settings',
  '@offline_last_sync':          '@bb_offline_last_sync',
  '@offline_mode_enabled':       '@bb_offline_mode_enabled',
  '@offline_workout_queue':      '@bb_offline_workout_queue',
  '@offline_workout_synced':     '@bb_offline_workout_synced',
  '@personal_records':           '@bb_personal_records',
  '@personalized_notification_log': '@bb_personalized_notification_log',
  '@profile_data':               '@bb_profile_data',
  '@quick_wins_dismissed':       '@bb_quick_wins_dismissed',
  '@quick_wins_v1':              '@bb_quick_wins',
  '@saved_timers':               '@bb_saved_timers',
  '@workout_log_entries':        '@bb_workout_log_entries',
  '@workout_log_settings':       '@bb_workout_log_settings',
  '@workout_offline_queue':      '@bb_workout_offline_queue',
  '@workout_reminder_ids':       '@bb_workout_reminder_ids',
  '@workout_templates':          '@bb_workout_templates',
};

const migrationV2: Migration = {
  version: 2,
  description: 'Normalize AsyncStorage keys to @bb_ prefix',
  // This migration does NOT transform values — the key renaming is handled by
  // runKeyNormalizationMigration() which runs before the version-based migrations.
  // The migrate() function here is a no-op so the framework can advance the version.
  migrate: async (data: unknown) => data,
};

// ============================================================================
// Migration Registry
// ============================================================================

const migrations: Migration[] = [
  migrationV1,
  migrationV2,
];

// ============================================================================
// Key Normalization (runs once before version-based migrations)
// ============================================================================

const KEY_NORMALIZATION_DONE_FLAG = '@bb_keys_normalized_v2';

/**
 * One-time migration: rename all legacy keys to @bb_ prefix.
 * Runs before version-based migrations. Safe to call multiple times (idempotent).
 */
export async function runKeyNormalizationMigration(): Promise<void> {
  const alreadyDone = await AsyncStorage.getItem(KEY_NORMALIZATION_DONE_FLAG);
  if (alreadyDone === '1') return;

  const allKeys = await AsyncStorage.getAllKeys();
  const keysSet = new Set(allKeys);

  for (const [oldKey, newKey] of Object.entries(KEY_RENAME_MAP)) {
    if (!keysSet.has(oldKey)) continue;
    // Skip if the new key already has data (don't overwrite newer data)
    if (keysSet.has(newKey)) {
      await AsyncStorage.removeItem(oldKey);
      continue;
    }
    try {
      const value = await AsyncStorage.getItem(oldKey);
      if (value !== null) {
        await AsyncStorage.setItem(newKey, value);
      }
      await AsyncStorage.removeItem(oldKey);
    } catch (err) {
      devLog.warn(`[KeyMigration] Failed to rename "${oldKey}" → "${newKey}":`, err);
    }
  }

  // Rename dynamic gym keys: @gym_queue_cache_*, @music_*
  const dynamicPrefixes: Array<[string, string]> = [
    ['@gym_queue_cache_updated_', '@bb_gym_queue_cache_updated_'],
    ['@gym_queue_cache_', '@bb_gym_queue_cache_'],
    ['@music_vote_history_', '@bb_music_vote_history_'],
    ['@music_liked_', '@bb_music_liked_'],
    ['@music_play_counts_', '@bb_music_play_counts_'],
    ['@music_last_played_', '@bb_music_last_played_'],
    ['@music_badges_', '@bb_music_badges_'],
    ['@music_recommender_credits_', '@bb_music_recommender_credits_'],
  ];
  for (const key of allKeys) {
    for (const [oldPrefix, newPrefix] of dynamicPrefixes) {
      if (!key.startsWith(oldPrefix)) continue;
      const newKey = newPrefix + key.slice(oldPrefix.length);
      if (keysSet.has(newKey)) {
        await AsyncStorage.removeItem(key).catch(() => {});
        break;
      }
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) await AsyncStorage.setItem(newKey, value);
        await AsyncStorage.removeItem(key);
      } catch (err) {
        devLog.warn(`[KeyMigration] Failed to rename dynamic key "${key}":`, err);
      }
      break;
    }
  }

  await AsyncStorage.setItem(KEY_NORMALIZATION_DONE_FLAG, '1');
  devLog.log('[KeyMigration] Key normalization complete.');
}

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
          devLog.error('[Migrations]', errorMsg);
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
      devLog.error('[Migrations]', errorMsg);

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
    // Always run key normalization first — it's idempotent and gated by its own flag
    await runKeyNormalizationMigration();

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
    devLog.error('[Migrations] Failed to initialize:', error);

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
  runKeyNormalizationMigration,
  resetVersion,
  initializeMigrations,
  CURRENT_VERSION: CURRENT_STORAGE_VERSION,
};
