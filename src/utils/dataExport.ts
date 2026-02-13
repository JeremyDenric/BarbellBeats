/**
 * Data Export Utility
 * Export user data to JSON file for backup
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { compress } from 'lz-string';
import safeStorage from './safeStorage';
import { ExportDataSchema, type ExportData } from './dataSchema';
import devLog from './devLog';

// ============================================================================
// Types
// ============================================================================

export type { ExportData };

export interface ExportOptions {
  compress?: boolean;
  includeWorkouts?: boolean;
  includeCardio?: boolean;
  includePreferences?: boolean;
  includePRs?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const EXPORT_VERSION = 1;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// Storage keys to export
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
// Export Functions
// ============================================================================

/**
 * Collect all user data from storage
 */
async function collectData(options: ExportOptions): Promise<ExportData['data']> {
  const data: ExportData['data'] = {};

  try {
    // Workouts
    if (options.includeWorkouts !== false) {
      const workouts = await safeStorage.getJSON(STORAGE_KEYS.workouts, {
        defaultValue: [],
      });
      if (workouts && workouts.length > 0) {
        data.workouts = workouts;
      }
    }

    // Cardio
    if (options.includeCardio !== false) {
      const cardio = await safeStorage.getJSON(STORAGE_KEYS.cardio, {
        defaultValue: [],
      });
      if (cardio && cardio.length > 0) {
        data.cardio = cardio;
      }
    }

    // Personal Records
    if (options.includePRs !== false) {
      const prs = await safeStorage.getJSON(STORAGE_KEYS.prs, {
        defaultValue: [],
      });
      if (prs && prs.length > 0) {
        data.prs = prs;
      }
    }

    // Preferences
    if (options.includePreferences !== false) {
      const preferences = await safeStorage.getJSON(STORAGE_KEYS.preferences);
      if (preferences) {
        data.preferences = preferences;
      }

      const cardioPrefs = await safeStorage.getJSON(STORAGE_KEYS.cardioPrefs);
      if (cardioPrefs) {
        if (!data.preferences) data.preferences = {};
        data.preferences.cardio = cardioPrefs;
      }
    }

    // Gym selection
    const gymId = await safeStorage.getString(STORAGE_KEYS.gymId);
    if (gymId) {
      data.gymSelections = { activeGymId: gymId };
    }

    // User profile (without sensitive data)
    const user = await safeStorage.getJSON(STORAGE_KEYS.user);
    if (user) {
      // Remove sensitive fields
      const { password, tokens, ...safeUserData } = user as any;
      data.userProfile = safeUserData;
    }

    return data;
  } catch (error) {
    devLog.error('[DataExport] Failed to collect data:', error);
    throw new Error('Failed to collect data for export');
  }
}

/**
 * Create export JSON
 */
function createExportJSON(data: ExportData['data']): ExportData {
  return {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    appVersion: APP_VERSION,
    data,
  };
}

/**
 * Export user data to a file
 * @param options Export configuration
 * @returns File URI of the exported data
 */
export async function exportData(
  options: ExportOptions = {}
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    // Collect data
    const data = await collectData(options);

    // Create export object
    const exportJSON = createExportJSON(data);
    const validation = ExportDataSchema.safeParse(exportJSON);
    if (!validation.success) {
      throw new Error(
        `Export validation failed: ${validation.error.errors
          .map((issue) => issue.message)
          .join(", ")}`
      );
    }

    // Convert to JSON string
    let jsonString = JSON.stringify(validation.data, null, 2);

    // Compress if requested
    if (options.compress) {
      jsonString = compress(jsonString);
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `barbellbeats_backup_${timestamp}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (__DEV__) {
      console.log('[DataExport] Export created:', fileUri);
      console.log('[DataExport] Data summary:', {
        workouts: data.workouts?.length || 0,
        cardio: data.cardio?.length || 0,
        prs: data.prs?.length || 0,
        hasPreferences: !!data.preferences,
      });
    }

    return {
      success: true,
      uri: fileUri,
    };
  } catch (error) {
    devLog.error('[DataExport] Export failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Export and share data file
 * Opens the system share dialog
 */
export async function exportAndShare(
  options: ExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Sharing is not available on this device',
      };
    }

    // Export data
    const result = await exportData(options);

    if (!result.success || !result.uri) {
      return {
        success: false,
        error: result.error || 'Export failed',
      };
    }

    // Share file
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export BarbellBeats Data',
      UTI: 'public.json',
    });

    return {
      success: true,
    };
  } catch (error) {
    devLog.error('[DataExport] Share failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get export summary statistics
 */
export async function getExportSummary(): Promise<{
  workoutCount: number;
  cardioCount: number;
  prCount: number;
  hasPreferences: boolean;
  estimatedSize: string;
}> {
  try {
    const data = await collectData({});

    const summary = {
      workoutCount: data.workouts?.length || 0,
      cardioCount: data.cardio?.length || 0,
      prCount: data.prs?.length || 0,
      hasPreferences: !!data.preferences,
      estimatedSize: '0 KB',
    };

    // Estimate file size
    const jsonString = JSON.stringify(createExportJSON(data));
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    summary.estimatedSize = `${sizeInKB} KB`;

    return summary;
  } catch (error) {
    devLog.error('[DataExport] Failed to get summary:', error);
    return {
      workoutCount: 0,
      cardioCount: 0,
      prCount: 0,
      hasPreferences: false,
      estimatedSize: '0 KB',
    };
  }
}

export default {
  exportData,
  exportAndShare,
  getExportSummary,
};
