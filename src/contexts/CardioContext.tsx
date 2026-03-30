/**
 * Cardio Context
 * Lightweight context providing cardio preferences persistence.
 * Active GPS tracking has been replaced by the notebook-style useCardioLog hook.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import devLog from '../utils/devLog';

// ============================================================================
// Types
// ============================================================================

export interface CardioPrefs {
  defaultDistanceUnit: 'km' | 'miles';
}

interface CardioContextValue {
  prefs: CardioPrefs;
  updatePrefs: (patch: Partial<CardioPrefs>) => void;
}

// ============================================================================
// Context
// ============================================================================

const CardioContext = createContext<CardioContextValue | undefined>(undefined);

const PREFS_KEY = '@bb_cardio_preferences';

const DEFAULT_PREFS: CardioPrefs = {
  defaultDistanceUnit: 'km',
};

// ============================================================================
// Provider
// ============================================================================

export function CardioProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<CardioPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (raw) setPrefs(JSON.parse(raw));
      })
      .catch((err) => devLog.error('[CardioContext] load prefs:', err));
  }, []);

  const updatePrefs = useCallback((patch: Partial<CardioPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ prefs, updatePrefs }), [prefs, updatePrefs]);

  return <CardioContext.Provider value={value}>{children}</CardioContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useCardio() {
  const ctx = useContext(CardioContext);
  if (!ctx) throw new Error('useCardio must be used within a CardioProvider');
  return ctx;
}
