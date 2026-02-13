import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { apiClient } from "../api/api-client";
import { isNetworkError } from "../utils/networkErrors";
import devLog from "../utils/devLog";

type GymActionType =
  | "addSong"
  | "voteSong"
  | "addReaction"
  | "addComment"
  | "syncNowPlaying"
  | "checkIn"
  | "checkOut";

type GymAction =
  | {
      id: string;
      type: "addSong";
      createdAt: string;
      gymId: string;
      data: { title: string; artist: string; uri: string };
    }
  | {
      id: string;
      type: "voteSong";
      createdAt: string;
      gymId: string;
      songId: string;
      direction: "up" | "down";
    }
  | {
      id: string;
      type: "addReaction";
      createdAt: string;
      gymId: string;
      data: { songId: string; emoji: string };
    }
  | {
      id: string;
      type: "addComment";
      createdAt: string;
      gymId: string;
      data: { songId: string; message: string };
    }
  | {
      id: string;
      type: "syncNowPlaying";
      createdAt: string;
      gymId: string;
      data: { title: string; artist: string; uri: string; deviceName?: string };
    }
  | {
      id: string;
      type: "checkIn";
      createdAt: string;
      gymId: string;
    }
  | {
      id: string;
      type: "checkOut";
      createdAt: string;
      gymId: string;
    };

const STORAGE_KEY = "@gym_offline_queue";
const MAX_QUEUE_SIZE = 100;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;
type FlushResult = {
  processed: number;
  remaining: number;
  dropped?: number;
  deferred?: boolean;
  backoffMs?: number;
};
let flushPromise: Promise<FlushResult> | null = null;
let backoffAttempt = 0;
let nextFlushAllowedAt = 0;
let queueSizeCache: number | null = null;
const queueSizeListeners = new Set<(size: number) => void>();

const reportQueueError = (
  error: unknown,
  context: Record<string, unknown>
) => {
  if (__DEV__) {
    return;
  }

  const exception = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(exception, {
    tags: { feature: "offline_queue" },
    extra: context,
  });
};

function generateQueueId() {
  return `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function notifyQueueSize(size: number) {
  queueSizeCache = size;
  queueSizeListeners.forEach((listener) => listener(size));
}

export function subscribeToQueueSize(listener: (size: number) => void) {
  queueSizeListeners.add(listener);

  if (queueSizeCache !== null) {
    listener(queueSizeCache);
  }

  return () => {
    queueSizeListeners.delete(listener);
  };
}

async function loadQueue(): Promise<GymAction[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      notifyQueueSize(0);
      return [];
    }
    const parsed = JSON.parse(raw);
    const queue = Array.isArray(parsed) ? (parsed as GymAction[]) : [];
    notifyQueueSize(queue.length);
    return queue;
  } catch (error) {
    devLog.warn("Failed to load offline queue:", error);
    if (!__DEV__) {
      reportQueueError(error, { operation: "load_queue" });
    }
    notifyQueueSize(0);
    return [];
  }
}

async function saveQueue(queue: GymAction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyQueueSize(queue.length);
  } catch (error) {
    devLog.warn("Failed to save offline queue:", error);
    if (!__DEV__) {
      reportQueueError(error, { operation: "save_queue", count: queue.length });
    }
  }
}

export async function getOfflineQueueSize(): Promise<number> {
  if (queueSizeCache !== null) {
    return queueSizeCache;
  }

  const queue = await loadQueue();
  return queue.length;
}

export async function enqueueGymAction(
  action: Omit<GymAction, "id" | "createdAt">
) {
  const queue = await loadQueue();
  const next = {
    ...action,
    id: generateQueueId(),
    createdAt: new Date().toISOString(),
  } as GymAction;

  queue.push(next);
  let dropped = 0;
  if (queue.length > MAX_QUEUE_SIZE) {
    dropped = queue.length - MAX_QUEUE_SIZE;
    queue.splice(0, dropped);
  }

  await saveQueue(queue);
  return { id: next.id, dropped };
}

async function executeGymAction(action: GymAction) {
  switch (action.type) {
    case "addSong": {
      const response = await apiClient.addSongToGymQueue(action.gymId, action.data);
      if (!response.success) {
        throw new Error(response.message || "Failed to add song");
      }
      return response.data;
    }
    case "voteSong": {
      const response = await apiClient.voteOnSong(
        action.gymId,
        action.songId,
        action.direction
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to vote");
      }
      return response.data;
    }
    case "addReaction": {
      const response = await apiClient.addReaction(action.gymId, action.data);
      if (!response.success) {
        throw new Error(response.message || "Failed to add reaction");
      }
      return response.data;
    }
    case "addComment": {
      const response = await apiClient.addComment(action.gymId, action.data);
      if (!response.success) {
        throw new Error(response.message || "Failed to add comment");
      }
      return response.data;
    }
    case "syncNowPlaying": {
      const response = await apiClient.syncSpotifyNowPlaying(action.gymId, action.data);
      if (!response.success) {
        throw new Error(response.message || "Failed to sync now playing");
      }
      return response.data;
    }
    case "checkIn": {
      const response = await apiClient.checkInToGym(action.gymId);
      if (!response.success) {
        throw new Error(response.message || "Failed to check in");
      }
      return response.data;
    }
    case "checkOut": {
      const response = await apiClient.checkOutFromGym(action.gymId);
      if (!response.success) {
        throw new Error(response.message || "Failed to check out");
      }
      return response.data;
    }
    default:
      return null;
  }
}

export async function flushGymQueue() {
  if (flushPromise) {
    return flushPromise;
  }

  const now = Date.now();
  if (nextFlushAllowedAt && now < nextFlushAllowedAt) {
    const queue = await loadQueue();
    return {
      processed: 0,
      remaining: queue.length,
      deferred: true,
      backoffMs: nextFlushAllowedAt - now,
      dropped: 0,
    };
  }

  flushPromise = (async () => {
    const queue = await loadQueue();
    if (queue.length === 0) {
      backoffAttempt = 0;
      nextFlushAllowedAt = 0;
      return { processed: 0, remaining: 0, dropped: 0 };
    }

    let processed = 0;
    let dropped = 0;
    let remaining: GymAction[] = [];
    let encounteredNetworkError = false;

    for (let i = 0; i < queue.length; i += 1) {
      const action = queue[i];
      try {
        await executeGymAction(action);
        processed += 1;
      } catch (error) {
        if (isNetworkError(error)) {
          remaining = queue.slice(i);
          encounteredNetworkError = true;
          break;
        }
        devLog.warn("Dropping failed offline action:", action, error);
        if (!__DEV__) {
          reportQueueError(error, {
            operation: "flush_action",
            actionId: action.id,
            actionType: action.type,
            gymId: action.gymId,
          });
        }
        dropped += 1;
      }
    }

    if (!remaining.length) {
      await saveQueue([]);
    } else {
      await saveQueue(remaining);
    }

    if (encounteredNetworkError) {
      backoffAttempt = Math.min(backoffAttempt + 1, 6);
      const backoffMs = Math.min(
        BACKOFF_BASE_MS * 2 ** (backoffAttempt - 1),
        BACKOFF_MAX_MS
      );
      nextFlushAllowedAt = Date.now() + backoffMs;
    } else {
      backoffAttempt = 0;
      nextFlushAllowedAt = 0;
    }

    if (!__DEV__ && processed > 0) {
      Sentry.addBreadcrumb({
        category: "offline_queue",
        message: `Flushed ${processed} action(s); ${remaining.length} remaining`,
        level: "info",
      });
    }

    return {
      processed,
      remaining: remaining.length,
      dropped,
    };
  })();

  try {
    return await flushPromise;
  } finally {
    flushPromise = null;
  }
}
