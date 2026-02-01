type FlagValue = string | undefined;

function parseFlag(value: FlagValue, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true" || value === "1";
}

export const FEATURE_FLAGS = {
  enableMigrations: parseFlag(process.env.EXPO_PUBLIC_ENABLE_MIGRATIONS, true),
  enableNotifications: parseFlag(process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS, true),
  enableAutoBackup: parseFlag(process.env.EXPO_PUBLIC_ENABLE_AUTO_BACKUP, true),
  enableOfflineQueueSync: parseFlag(
    process.env.EXPO_PUBLIC_ENABLE_OFFLINE_SYNC,
    true
  ),
  enableTelemetry: parseFlag(process.env.EXPO_PUBLIC_ENABLE_TELEMETRY, true),
};

export default FEATURE_FLAGS;
