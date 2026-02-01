/**
 * Safe AsyncStorage Wrapper
 * Provides type-safe storage operations with automatic error handling,
 * validation, and migration support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export interface StorageOptions {
  /**
   * Optional schema for runtime validation
   */
  schema?: z.ZodSchema;
  /**
   * Default value if key doesn't exist or parsing fails
   */
  defaultValue?: any;
  /**
   * Whether to log errors (default: __DEV__)
   */
  logErrors?: boolean;
  /**
   * Whether to reset the key when JSON parsing fails (default: true)
   */
  resetOnParseError?: boolean;
}

export interface MigrationOptions {
  version: number;
  migrate: (data: any) => any;
}

// ============================================================================
// Error Handling
// ============================================================================

class StorageError extends Error {
  constructor(
    message: string,
    public key: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

function logError(error: StorageError, logErrors: boolean = __DEV__) {
  if (logErrors) {
    console.error(`[SafeStorage] ${error.operation} failed for key "${error.key}":`, error.message);
    if (error.originalError && __DEV__) {
      console.error('Original error:', error.originalError);
    }
  }

  // In production, send to error tracking service
  if (!__DEV__ && typeof (global as any).Sentry !== 'undefined') {
    (global as any).Sentry.captureException(error, {
      tags: {
        storage_key: error.key,
        storage_operation: error.operation,
      },
    });
  }
}

// ============================================================================
// Core Storage Operations
// ============================================================================

/**
 * Safely get a JSON value from AsyncStorage
 * @param key Storage key
 * @param options Configuration options
 * @returns Parsed value or default value
 */
export async function getJSON<T = any>(
  key: string,
  options: StorageOptions = {}
): Promise<T | null> {
  const {
    schema,
    defaultValue = null,
    logErrors = __DEV__,
    resetOnParseError = true,
  } = options;

  try {
    const stored = await AsyncStorage.getItem(key);

    if (stored === null) {
      return defaultValue;
    }

    // Parse JSON with error handling
    let parsed: any;
    try {
      parsed = JSON.parse(stored);
    } catch (parseError) {
      const storageError = new StorageError(
        'Failed to parse JSON',
        key,
        'getJSON',
        parseError as Error
      );
      logError(storageError, logErrors);
      if (resetOnParseError) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (removeError) {
          const removeStorageError = new StorageError(
            'Failed to reset corrupted key',
            key,
            'getJSON',
            removeError as Error
          );
          logError(removeStorageError, logErrors);
        }
      }
      return defaultValue;
    }

    // Validate with schema if provided
    if (schema) {
      try {
        const validated = schema.parse(parsed);
        return validated as T;
      } catch (validationError) {
        throw new StorageError(
          'Schema validation failed',
          key,
          'getJSON',
          validationError as Error
        );
      }
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof StorageError) {
      logError(error, logErrors);
    } else {
      const storageError = new StorageError(
        'Failed to read from storage',
        key,
        'getJSON',
        error as Error
      );
      logError(storageError, logErrors);
    }
    return defaultValue;
  }
}

/**
 * Safely set a JSON value to AsyncStorage
 * @param key Storage key
 * @param value Value to store
 * @param options Configuration options
 * @returns Success status
 */
export async function setJSON<T = any>(
  key: string,
  value: T,
  options: StorageOptions = {}
): Promise<boolean> {
  const { schema, logErrors = __DEV__ } = options;

  try {
    // Validate with schema if provided
    if (schema) {
      try {
        schema.parse(value);
      } catch (validationError) {
        throw new StorageError(
          'Schema validation failed',
          key,
          'setJSON',
          validationError as Error
        );
      }
    }

    // Stringify with error handling
    let stringified: string;
    try {
      stringified = JSON.stringify(value);
    } catch (stringifyError) {
      throw new StorageError(
        'Failed to stringify value',
        key,
        'setJSON',
        stringifyError as Error
      );
    }

    await AsyncStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    if (error instanceof StorageError) {
      logError(error, logErrors);
    } else {
      const storageError = new StorageError(
        'Failed to write to storage',
        key,
        'setJSON',
        error as Error
      );
      logError(storageError, logErrors);
    }
    return false;
  }
}

/**
 * Safely get a string value from AsyncStorage
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns String value or default
 */
export async function getString(
  key: string,
  defaultValue: string | null = null
): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ?? defaultValue;
  } catch (error) {
    const storageError = new StorageError(
      'Failed to read string from storage',
      key,
      'getString',
      error as Error
    );
    logError(storageError);
    return defaultValue;
  }
}

/**
 * Safely set a string value to AsyncStorage
 * @param key Storage key
 * @param value String value to store
 * @returns Success status
 */
export async function setString(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    const storageError = new StorageError(
      'Failed to write string to storage',
      key,
      'setString',
      error as Error
    );
    logError(storageError);
    return false;
  }
}

/**
 * Safely remove a key from AsyncStorage
 * @param key Storage key to remove
 * @returns Success status
 */
export async function remove(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    const storageError = new StorageError(
      'Failed to remove key from storage',
      key,
      'remove',
      error as Error
    );
    logError(storageError);
    return false;
  }
}

/**
 * Clear all storage (use with caution!)
 * @returns Success status
 */
export async function clear(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    const storageError = new StorageError(
      'Failed to clear storage',
      'ALL',
      'clear',
      error as Error
    );
    logError(storageError);
    return false;
  }
}

// ============================================================================
// Migration Support
// ============================================================================

const MIGRATION_VERSION_KEY = '@storage_version';

/**
 * Run migrations on stored data
 * @param key Storage key
 * @param migrations Array of migration functions
 * @returns Migrated data
 */
export async function migrateData<T = any>(
  key: string,
  migrations: MigrationOptions[]
): Promise<T | null> {
  try {
    // Get current version
    const currentVersion = await getJSON<number>(MIGRATION_VERSION_KEY, {
      defaultValue: 0,
    });

    // Get stored data
    const data = await getJSON<T>(key);

    if (data === null) {
      return null;
    }

    // Find migrations to run
    const migrationsToRun = migrations
      .filter((m) => m.version > (currentVersion || 0))
      .sort((a, b) => a.version - b.version);

    if (migrationsToRun.length === 0) {
      return data;
    }

    // Run migrations
    let migratedData = data;
    for (const migration of migrationsToRun) {
      try {
        migratedData = migration.migrate(migratedData);
      } catch (migrationError) {
        throw new StorageError(
          `Migration v${migration.version} failed`,
          key,
          'migrateData',
          migrationError as Error
        );
      }
    }

    // Save migrated data
    await setJSON(key, migratedData);

    // Update version
    const latestVersion = Math.max(...migrations.map((m) => m.version));
    await setJSON(MIGRATION_VERSION_KEY, latestVersion);

    if (__DEV__) {
      console.log(
        `[SafeStorage] Migrated "${key}" from v${currentVersion} to v${latestVersion}`
      );
    }

    return migratedData;
  } catch (error) {
    if (error instanceof StorageError) {
      logError(error);
    } else {
      const storageError = new StorageError(
        'Migration failed',
        key,
        'migrateData',
        error as Error
      );
      logError(storageError);
    }
    return null;
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Get multiple keys at once
 * @param keys Array of storage keys
 * @returns Object mapping keys to values
 */
export async function multiGet(
  keys: string[]
): Promise<Record<string, string | null>> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(pairs);
  } catch (error) {
    const storageError = new StorageError(
      'Failed to read multiple keys',
      keys.join(', '),
      'multiGet',
      error as Error
    );
    logError(storageError);
    return {};
  }
}

/**
 * Set multiple key-value pairs at once
 * @param entries Object mapping keys to values
 * @returns Success status
 */
export async function multiSet(
  entries: Record<string, string>
): Promise<boolean> {
  try {
    const pairs = Object.entries(entries);
    await AsyncStorage.multiSet(pairs);
    return true;
  } catch (error) {
    const storageError = new StorageError(
      'Failed to write multiple keys',
      Object.keys(entries).join(', '),
      'multiSet',
      error as Error
    );
    logError(storageError);
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a key exists in storage
 * @param key Storage key
 * @returns Whether the key exists
 */
export async function hasKey(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get all keys in storage
 * @returns Array of all storage keys
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    return [...await AsyncStorage.getAllKeys()];
  } catch (error) {
    const storageError = new StorageError(
      'Failed to get all keys',
      'ALL',
      'getAllKeys',
      error as Error
    );
    logError(storageError);
    return [];
  }
}

// ============================================================================
// Export default object with all functions
// ============================================================================

export default {
  getJSON,
  setJSON,
  getString,
  setString,
  remove,
  clear,
  migrateData,
  multiGet,
  multiSet,
  hasKey,
  getAllKeys,
};
