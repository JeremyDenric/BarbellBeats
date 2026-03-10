/**
 * useFavoriteGyms
 * Persists a set of favorite gym IDs to AsyncStorage.
 * Optimistic updates — UI state changes immediately, storage write happens async.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gym } from '../types';
import { lightTap } from '../utils/haptics';

const FAVORITES_KEY = '@favorite_gym_ids';

export function useFavoriteGyms(allGyms: Gym[] = []) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted favorites on mount
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((raw) => {
        if (raw) {
          const ids: string[] = JSON.parse(raw);
          setFavoriteIds(new Set(ids));
        }
      })
      .catch(() => {
        // Storage read failed — start with empty set
      })
      .finally(() => setIsLoading(false));
  }, []);

  const isFavorite = useCallback(
    (gymId: string) => favoriteIds.has(gymId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    (gym: Gym) => {
      lightTap();

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(gym.id)) {
          next.delete(gym.id);
        } else {
          next.add(gym.id);
        }

        // Persist async — don't block the UI
        AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])).catch(() => {});

        return next;
      });
    },
    []
  );

  const favoriteGyms = allGyms.filter((g) => favoriteIds.has(g.id));

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    favoriteGyms,
    isLoading,
  };
}
