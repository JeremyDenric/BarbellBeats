import { useEffect, useRef } from "react";
import { InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { initializeNotifications } from "../services/notifications";
import { initializeMigrations } from "../utils/migrations";
import { exportData } from "../utils/dataExport";
import { FEATURE_FLAGS } from "../utils/featureFlags";

type BootstrapOptions = {
  enableTelemetry?: boolean;
};

export function useAppBootstrap(options: BootstrapOptions = {}) {
  const { enableTelemetry = true } = options;
  const bootStartRef = useRef(Date.now());
  const backupInFlightRef = useRef(false);

  useEffect(() => {
    const runBootstrap = () => {
      const tasks: Array<Promise<void>> = [];

      if (FEATURE_FLAGS.enableMigrations) {
        tasks.push(
          initializeMigrations()
            .then((result) => {
              if (__DEV__) {
                console.log("[App] Migrations initialized:", result);
              }
            })
            .catch((error) => {
              console.error("[App] Migration initialization failed:", error);
              if (!__DEV__) {
                Sentry.captureException(error, {
                  tags: { initialization: "migrations" },
                });
              }
            })
        );
      }

      if (FEATURE_FLAGS.enableNotifications) {
        try {
          initializeNotifications();
        } catch (error) {
          console.error("[App] Notification initialization failed:", error);
          if (!__DEV__) {
            Sentry.captureException(error, {
              tags: { initialization: "notifications" },
            });
          }
        }
      }

      Promise.allSettled(tasks).finally(() => {
        const durationMs = Date.now() - bootStartRef.current;
        if (enableTelemetry && !__DEV__) {
          Sentry.addBreadcrumb({
            category: "bootstrap",
            message: `Bootstrap completed in ${durationMs}ms`,
            level: "info",
          });
          Sentry.setTag("bootstrap_ms", String(durationMs));
        }
      });
    };

    const task = InteractionManager.runAfterInteractions(runBootstrap);
    return () => {
      if (task && typeof task.cancel === "function") {
        task.cancel();
      }
    };
  }, [enableTelemetry]);

  useEffect(() => {
    if (!FEATURE_FLAGS.enableAutoBackup) {
      return;
    }

    const BACKUP_INTERVAL = 1000 * 60 * 60 * 24;
    const BACKUP_KEY = "@last_backup_timestamp";
    const MAX_BACKUPS = 3;

    const performBackup = async () => {
      if (backupInFlightRef.current) {
        return;
      }

      backupInFlightRef.current = true;
      try {
        const lastBackup = await AsyncStorage.getItem(BACKUP_KEY);
        const now = Date.now();

        if (!lastBackup || now - parseInt(lastBackup, 10) > BACKUP_INTERVAL) {
          if (__DEV__) {
            console.log("[App] Running automatic backup...");
          }

          const result = await exportData({ compress: true });

          if (result.success) {
            await AsyncStorage.setItem(BACKUP_KEY, now.toString());

            const backupKeys = (await AsyncStorage.getAllKeys())
              .filter((key) => key.startsWith("@auto_backup_"))
              .sort()
              .reverse();

            if (backupKeys.length > MAX_BACKUPS) {
              const keysToDelete = backupKeys.slice(MAX_BACKUPS);
              await AsyncStorage.multiRemove(keysToDelete);
            }

            if (__DEV__) {
              console.log("[App] Automatic backup completed");
            }
          }
        }
      } catch (error) {
        console.error("[App] Auto-backup failed:", error);
        if (!__DEV__) {
          Sentry.captureException(error, {
            tags: { feature: "auto_backup" },
          });
        }
      } finally {
        backupInFlightRef.current = false;
      }
    };

    const runBackupTask = InteractionManager.runAfterInteractions(performBackup);
    const intervalId = setInterval(performBackup, BACKUP_INTERVAL);

    return () => {
      if (runBackupTask && typeof runBackupTask.cancel === "function") {
        runBackupTask.cancel();
      }
      clearInterval(intervalId);
    };
  }, []);
}

export default useAppBootstrap;
