import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { z } from 'zod';
import safeStorage from '../utils/safeStorage';
import * as Sentry from '@sentry/react-native';

export type Preferences = {
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  hapticsEnabled: true,
  reduceMotion: false,
  compactMode: true,
};

// Zod schema for runtime validation
const PreferencesSchema = z.object({
  hapticsEnabled: z.boolean(),
  reduceMotion: z.boolean(),
  compactMode: z.boolean(),
});

type PreferencesContextValue = {
  preferences: Preferences;
  updatePreferences: (next: Partial<Preferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const STORAGE_KEY = '@app_preferences';
const LAST_KNOWN_KEY = '@app_preferences_last_known';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await safeStorage.getJSON<Preferences>(STORAGE_KEY, {
          schema: PreferencesSchema,
          defaultValue: null,
        });

        if (stored) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...stored });
          return;
        }

        const fallback = await safeStorage.getJSON<Preferences>(LAST_KNOWN_KEY, {
          schema: PreferencesSchema,
          defaultValue: DEFAULT_PREFERENCES,
        });
        if (fallback) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...fallback });
        }
      } catch (error) {
        console.error('[PreferencesContext] Failed to load preferences:', error);
        if (!__DEV__) {
          Sentry.captureException(error, {
            tags: { context: 'preferences', operation: 'load' },
          });
        }
      }
    };
    load();
  }, []);

  const updatePreferences = useCallback((next: Partial<Preferences>) => {
    setPreferences((prev) => {
      const merged = { ...prev, ...next };
      safeStorage
        .setJSON(STORAGE_KEY, merged, { schema: PreferencesSchema })
        .then((success) => {
          if (!success) {
            throw new Error('Failed to save preferences');
          }
          return safeStorage.setJSON(LAST_KNOWN_KEY, merged, {
            schema: PreferencesSchema,
          });
        })
        .catch((error) => {
          console.error('[PreferencesContext] Failed to save preferences:', error);
          if (!__DEV__) {
            Sentry.captureException(error, {
              tags: { context: 'preferences', operation: 'save' },
            });
          }
        });
      return merged;
    });
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
