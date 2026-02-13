import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import * as Sentry from "@sentry/react-native";
import { useToast } from "./ToastContext";
import {
  flushGymQueue,
  getOfflineQueueSize,
  subscribeToQueueSize,
} from "../services/offlineQueue";
import { FEATURE_FLAGS } from "../utils/featureFlags";
import devLog from "../utils/devLog";

type NetworkContextValue = {
  isOffline: boolean;
  isOnline: boolean;
  queuedActions: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  flushQueueNow: () => Promise<void>;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [isOffline, setIsOffline] = useState(false);
  const [queuedActions, setQueuedActions] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const offlineStateRef = useRef<boolean | null>(null);
  const netInfoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telemetryEnabled = FEATURE_FLAGS.enableTelemetry && !__DEV__;

  useEffect(() => {
    NetInfo.fetch()
      .then((state) => {
        const isOnline = !!state.isConnected && state.isInternetReachable !== false;
        setIsOffline(!isOnline);
      })
      .catch((error) => {
        devLog.warn("Failed to fetch initial network state:", error);
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false;
      if (netInfoTimerRef.current) {
        clearTimeout(netInfoTimerRef.current);
      }
      netInfoTimerRef.current = setTimeout(() => {
        setIsOffline(!isOnline);
      }, 250);
    });

    return () => {
      if (netInfoTimerRef.current) {
        clearTimeout(netInfoTimerRef.current);
      }
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getOfflineQueueSize()
      .then((count) => {
        if (isMounted) {
          setQueuedActions(count);
        }
      })
      .catch((error) => {
        devLog.warn("Failed to read offline queue size:", error);
      });

    const unsubscribe = subscribeToQueueSize((size) => {
      setQueuedActions(size);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const flushQueueNow = useCallback(async () => {
    if (!FEATURE_FLAGS.enableOfflineQueueSync) {
      return;
    }

    if (isOffline || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await flushGymQueue();
      if (result?.dropped) {
        showToast("Some queued actions could not sync.", { type: "error" });
      }
      if (!result?.deferred) {
        setLastSyncAt(new Date().toISOString());
      }

      if (telemetryEnabled) {
        Sentry.addBreadcrumb({
          category: "offline_queue",
          message: `Sync complete: ${result.processed} processed, ${result.remaining} remaining`,
          level: "info",
        });
      }
    } catch (error) {
      devLog.warn("Failed to flush offline gym actions:", error);
      showToast("Sync failed. We'll retry soon.", { type: "error" });
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, isSyncing, showToast, telemetryEnabled]);

  useEffect(() => {
    const previous = offlineStateRef.current;
    offlineStateRef.current = isOffline;

    if (telemetryEnabled) {
      Sentry.setTag("network_status", isOffline ? "offline" : "online");
    }

    if (previous === null && isOffline) {
      return;
    }

    if (previous !== null && previous === isOffline) {
      return;
    }

    if (telemetryEnabled) {
      Sentry.addBreadcrumb({
        category: "network",
        message: isOffline ? "App offline" : "App online",
        level: "info",
      });
    }

    if (!isOffline) {
      void flushQueueNow();
    }
  }, [flushQueueNow, isOffline, telemetryEnabled]);

  return (
    <NetworkContext.Provider
      value={{
        isOffline,
        isOnline: !isOffline,
        queuedActions,
        isSyncing,
        lastSyncAt,
        flushQueueNow,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

export default NetworkProvider;
