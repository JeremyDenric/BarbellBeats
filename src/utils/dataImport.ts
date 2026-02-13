/**
 * Data Import Utility
 * Import and validate user data from backup files
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decompress } from 'lz-string';
import safeStorage from './safeStorage';
import { ExportDataSchema, type ExportData } from './dataSchema';
import devLog from './devLog';

// ============================================================================
// Constants
// ============================================================================

const SUPPORTED_VERSIONS = [1]; // Add new versions here as schema evolves

// Storage keys to import to
const STORAGE_KEYS = {
  workouts: '@workout_log_entries',
  cardio: '@cardio_history',
  prs: '@personal_records',
  preferences: '@app_preferences',
  cardioPrefs: '@cardio_preferences',
  gymId: '@active_gym_id',
  user: '@user',
};

// ============================================================================
// Import Options
// ============================================================================

export interface ImportOptions {
  /**
   * Whether to merge with existing data (true) or replace (false)
   */
  merge?: boolean;
  /**
   * Whether to create a backup before importing
   */
  createBackup?: boolean;
  /**
   * Which data types to import
   */
  include?: {
    workouts?: boolean;
    cardio?: boolean;
    prs?: boolean;
    preferences?: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  error?: string;
  imported?: {
    workouts?: number;
    cardio?: number;
    prs?: number;
    preferences?: boolean;
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate export data structure
 */
function validateExportData(data: any): { valid: boolean; data?: ExportData; error?: string } {
  const validation = ExportDataSchema.safeParse(data);
  if (!validation.success) {
    return {
      valid: false,
      error: `Invalid export format: ${validation.error.errors
        .map((issue) => issue.message)
        .join(', ')}`,
    };
  }

  // Check version compatibility
  if (!SUPPORTED_VERSIONS.includes(validation.data.version)) {
    return {
      valid: false,
      error: `Unsupported export version: ${validation.data.version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
    };
  }

  return {
    valid: true,
    data: validation.data as ExportData,
  };
}

/**
 * Parse import file content
 */
function parseImportFile(content: string): { success: boolean; data?: any; error?: string } {
  try {
    // Try to parse as regular JSON first
    try {
      const parsed = JSON.parse(content);
      return { success: true, data: parsed };
    } catch {
      // If that fails, try to decompress (might be compressed export)
      try {
        const decompressed = decompress(content);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          return { success: true, data: parsed };
        }
      } catch (decompressError) {
        // Ignore decompression error, will return parse error below
      }

      return {
        success: false,
        error: 'Invalid JSON format. The file may be corrupted.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse file: ${(error as Error).message}`,
    };
  }
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Merge two arrays of data, avoiding duplicates
 */
function mergeArrays(existing: any[], incoming: any[], idField: string = 'id'): any[] {
  const existingIds = new Set(existing.map((item) => item[idField]).filter(Boolean));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item[idField]));
  return [...existing, ...uniqueIncoming];
}

/**
 * Import data from validated export
 */
async function importValidatedData(
  exportData: ExportData,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { merge = false, include = {} } = options;
  const imported: ImportResult['imported'] = {};

  try {
    const {
      workouts = true,
      cardio = true,
      prs = true,
      preferences = true,
    } = include;

    // Import workouts
    if (workouts && exportData.data.workouts) {
      const existingWorkouts = merge
        ? await safeStorage.getJSON(STORAGE_KEYS.workouts, { defaultValue: [] })
        : [];

      const finalWorkouts = merge
        ? mergeArrays(existingWorkouts || [], exportData.data.workouts, 'id')
        : exportData.data.workouts;

      await safeStorage.setJSON(STORAGE_KEYS.workouts, finalWorkouts);
      imported.workouts = finalWorkouts.length;
    }

    // Import cardio
    if (cardio && exportData.data.cardio) {
      const existingCardio = merge
        ? await safeStorage.getJSON(STORAGE_KEYS.cardio, { defaultValue: [] })
        : [];

      const finalCardio = merge
        ? mergeArrays(existingCardio || [], exportData.data.cardio, 'id')
        : exportData.data.cardio;

      await safeStorage.setJSON(STORAGE_KEYS.cardio, finalCardio);
      imported.cardio = finalCardio.length;
    }

    // Import PRs
    if (prs && exportData.data.prs) {
      const existingPRs = merge
        ? await safeStorage.getJSON(STORAGE_KEYS.prs, { defaultValue: [] })
        : [];

      const finalPRs = merge
        ? mergeArrays(existingPRs || [], exportData.data.prs, 'exerciseId')
        : exportData.data.prs;

      await safeStorage.setJSON(STORAGE_KEYS.prs, finalPRs);
      imported.prs = finalPRs.length;
    }

    // Import preferences
    if (preferences && exportData.data.preferences) {
      const existingPrefs = merge
        ? await safeStorage.getJSON(STORAGE_KEYS.preferences, { defaultValue: {} })
        : {};

      const finalPrefs = merge
        ? { ...existingPrefs, ...exportData.data.preferences }
        : exportData.data.preferences;

      await safeStorage.setJSON(STORAGE_KEYS.preferences, finalPrefs);
      imported.preferences = true;

      // Import cardio preferences if included
      if (exportData.data.preferences.cardio) {
        await safeStorage.setJSON(STORAGE_KEYS.cardioPrefs, exportData.data.preferences.cardio);
      }
    }

    // Import gym selection
    if (exportData.data.gymSelections?.activeGymId) {
      await safeStorage.setString(STORAGE_KEYS.gymId, exportData.data.gymSelections.activeGymId);
    }

    if (__DEV__) {
      console.log('[DataImport] Import successful:', imported);
    }

    return {
      success: true,
      imported,
    };
  } catch (error) {
    devLog.error('[DataImport] Import failed:', error);
    return {
      success: false,
      error: `Failed to import data: ${(error as Error).message}`,
    };
  }
}

/**
 * Pick a file and import data
 */
export async function importFromFile(options: ImportOptions = {}): Promise<ImportResult> {
  try {
    // Pick document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return {
        success: false,
        error: 'Import cancelled',
      };
    }

    const file = result.assets[0];

    // Read file content
    const content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Parse content
    const parseResult = parseImportFile(content);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
      };
    }

    // Validate data
    const validation = validateExportData(parseResult.data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Import validated data
    return await importValidatedData(validation.data!, options);
  } catch (error) {
    devLog.error('[DataImport] File import failed:', error);
    return {
      success: false,
      error: `Import failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Import from raw JSON string
 * Useful for testing or direct imports
 */
export async function importFromJSON(
  json: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  try {
    // Parse content
    const parseResult = parseImportFile(json);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
      };
    }

    // Validate data
    const validation = validateExportData(parseResult.data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Import validated data
    return await importValidatedData(validation.data!, options);
  } catch (error) {
    devLog.error('[DataImport] JSON import failed:', error);
    return {
      success: false,
      error: `Import failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Validate an import file without importing
 */
export async function validateImportFile(fileUri: string): Promise<{
  valid: boolean;
  error?: string;
  summary?: {
    version: number;
    exportDate: string;
    workoutCount: number;
    cardioCount: number;
    prCount: number;
  };
}> {
  try {
    // Read file
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Parse
    const parseResult = parseImportFile(content);
    if (!parseResult.success) {
      return {
        valid: false,
        error: parseResult.error,
      };
    }

    // Validate
    const validation = validateExportData(parseResult.data);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    // Create summary
    const data = validation.data!;
    return {
      valid: true,
      summary: {
        version: data.version,
        exportDate: data.exportDate,
        workoutCount: data.data.workouts?.length || 0,
        cardioCount: data.data.cardio?.length || 0,
        prCount: data.data.prs?.length || 0,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation failed: ${(error as Error).message}`,
    };
  }
}

export default {
  importFromFile,
  importFromJSON,
  validateImportFile,
};
