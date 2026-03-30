/**
 * useQuickWins
 * Tracks completion state for first-time user achievement checklist.
 * Persisted in AsyncStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSpotify } from '../contexts/SpotifyContext';
import { success } from '../utils/haptics';
import devLog from '../utils/devLog';

export type QuickWinKey =
  | 'first_workout'
  | 'voted_song'
  | 'connect_spotify'
  | 'add_friend'
  | 'first_cardio';

export type QuickWin = {
  key: QuickWinKey;
  label: string;
  navTarget: string;   // human-readable destination for card display
};

export const QUICK_WIN_DEFS: QuickWin[] = [
  { key: 'first_workout',    label: 'Log your first workout',      navTarget: 'Training' },
  { key: 'voted_song',       label: 'Vote on a song at a gym',     navTarget: 'Music' },
  { key: 'connect_spotify',  label: 'Connect Spotify',             navTarget: 'Music' },
  { key: 'add_friend',       label: 'Add a friend',                navTarget: 'Profile' },
  { key: 'first_cardio',     label: 'Log a cardio session',        navTarget: 'Training' },
];

const STORAGE_KEY = '@bb_quick_wins';
const DISMISSED_KEY = '@bb_quick_wins_dismissed';

type WinsState = Record<QuickWinKey, boolean>;

const INITIAL_STATE: WinsState = {
  first_workout: false,
  voted_song: false,
  connect_spotify: false,
  add_friend: false,
  first_cardio: false,
};

export function useQuickWins() {
  const { workoutHistory } = useWorkout();
  const { isConnected: spotifyConnected } = useSpotify();
  const [wins, setWins] = useState<WinsState>(INITIAL_STATE);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state
  useEffect(() => {
    const load = async () => {
      try {
        const [raw, dismissedRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(DISMISSED_KEY),
        ]);
        if (raw) {
          setWins({ ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<WinsState>) });
        }
        if (dismissedRaw === 'true') {
          setIsDismissed(true);
        }
      } catch (e) {
        devLog.error('[useQuickWins] load error:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Automatically check workout history for first_workout
  useEffect(() => {
    if (!isLoaded) return;
    if (!wins.first_workout && workoutHistory.length > 0) {
      setWins((prev) => {
        const next = { ...prev, first_workout: true };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }
  }, [workoutHistory, isLoaded, wins.first_workout]);

  // Automatically check Spotify connection
  useEffect(() => {
    if (!isLoaded) return;
    if (!wins.connect_spotify && spotifyConnected) {
      setWins((prev) => {
        const next = { ...prev, connect_spotify: true };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }
  }, [spotifyConnected, isLoaded, wins.connect_spotify]);

  const markComplete = useCallback((key: QuickWinKey) => {
    setWins((prev) => {
      if (prev[key]) return prev; // already done
      const next = { ...prev, [key]: true };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      success();
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, 'true').catch(() => {});
  }, []);

  const completedCount = Object.values(wins).filter(Boolean).length;
  const totalCount = QUICK_WIN_DEFS.length;
  const allComplete = completedCount === totalCount;

  return {
    wins,
    isDismissed,
    isLoaded,
    completedCount,
    totalCount,
    allComplete,
    markComplete,
    dismiss,
  };
}
