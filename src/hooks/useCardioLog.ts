import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardioEntry } from '../types';
import { deleteEntryPhotos } from '../utils/imageStorage';

const CARDIO_KEY = '@bb_cardio_entries';

function generateId(): string {
  return `cardio_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): Promise<CardioEntry[]> {
  return AsyncStorage.getItem(CARDIO_KEY).then((raw) => {
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CardioEntry[];
    } catch {
      return [];
    }
  });
}

function saveEntries(entries: CardioEntry[]): Promise<void> {
  return AsyncStorage.setItem(CARDIO_KEY, JSON.stringify(entries));
}

export function useCardioLog() {
  const [entries, setEntries] = useState<CardioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries()
      .then((loaded) => {
        // Sort newest first
        setEntries(loaded.sort((a, b) => b.createdAt - a.createdAt));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<CardioEntry, 'id' | 'createdAt'>): Promise<void> => {
      const newEntry: CardioEntry = {
        ...entry,
        id: generateId(),
        createdAt: Date.now(),
      };
      setEntries((prev) => {
        const next = [newEntry, ...prev];
        saveEntries(next).catch(() => {});
        return next;
      });
    },
    []
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<CardioEntry>): Promise<void> => {
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        saveEntries(next).catch(() => {});
        return next;
      });
    },
    []
  );

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    const all = await loadEntries();
    const target = all.find((e) => e.id === id);
    if (target?.photos.length) {
      await deleteEntryPhotos(target.photos);
    }
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveEntries(next).catch(() => {});
      return next;
    });
  }, []);

  return { entries, isLoading, addEntry, updateEntry, deleteEntry };
}
