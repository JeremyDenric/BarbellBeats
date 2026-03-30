/**
 * Offline Queue for Workout Operations
 * Handles queuing workout-related actions when offline
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import devLog from '../utils/devLog';

const QUEUE_KEY = '@bb_workout_offline_queue';

type WorkoutAction =
  | { type: 'createExercise'; data: unknown; payload?: unknown }
  | { type: 'CREATE_EXERCISE'; data: unknown; payload?: unknown }
  | { type: 'updateExercise'; id: string; data: unknown }
  | { type: 'deleteExercise'; id: string }
  | { type: 'createProgram'; data: unknown }
  | { type: 'updateProgram'; id: string; data: unknown }
  | { type: 'deleteProgram'; id: string }
  | { type: 'START_PROGRAM'; programId: string }
  | { type: 'startProgram'; programId: string }
  | { type: 'UPDATE_PROGRESS'; programId: string; progress: unknown };

type QueueItemState = 'pending' | 'syncing' | 'failed';

interface QueuedAction {
  id: string;
  action: WorkoutAction;
  createdAt: string;
  state: QueueItemState;
}

let queue: QueuedAction[] = [];

async function loadQueue(): Promise<QueuedAction[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    if (data) {
      queue = JSON.parse(data);
    }
    return queue;
  } catch (error) {
    devLog.error('Failed to load offline queue:', error);
    return [];
  }
}

async function saveQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    devLog.error('Failed to save offline queue:', error);
  }
}

export const offlineQueueWorkout = {
  async enqueue(action: WorkoutAction): Promise<string> {
    await loadQueue();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    queue.push({
      id,
      action,
      createdAt: new Date().toISOString(),
      state: 'pending',
    });
    await saveQueue();
    return id;
  },

  async getQueue(): Promise<QueuedAction[]> {
    return loadQueue();
  },

  async getQueueSize(): Promise<number> {
    await loadQueue();
    return queue.length;
  },

  async clearQueue(): Promise<void> {
    queue = [];
    await saveQueue();
  },

  async removeAction(id: string): Promise<void> {
    await loadQueue();
    queue = queue.filter((item) => item.id !== id);
    await saveQueue();
  },

  async flush(executor: (action: WorkoutAction) => Promise<void>): Promise<{
    processed: number;
    failed: number;
  }> {
    await loadQueue();
    let processed = 0;
    let failed = 0;

    for (const item of [...queue]) {
      // Mark as syncing and persist before executing — survives crash mid-loop
      const idx = queue.findIndex((q) => q.id === item.id);
      if (idx !== -1) {
        queue[idx] = { ...queue[idx], state: 'syncing' };
        await saveQueue();
      }

      try {
        await executor(item.action);
        queue = queue.filter((q) => q.id !== item.id);
        await saveQueue();
        processed++;
      } catch (error) {
        devLog.error('Failed to execute queued action:', error);
        // Mark as failed so it can be retried or surfaced to the user
        const failIdx = queue.findIndex((q) => q.id === item.id);
        if (failIdx !== -1) {
          queue[failIdx] = { ...queue[failIdx], state: 'failed' };
          await saveQueue();
        }
        failed++;
      }
    }
    return { processed, failed };
  },

  /**
   * Sync queued actions with the server
   */
  async sync(executor: (action: WorkoutAction) => Promise<unknown>): Promise<{
    processed: number;
    failed: number;
  }> {
    return this.flush(async (action) => {
      await executor(action);
    });
  },
};

export type { WorkoutAction };
export default offlineQueueWorkout;
