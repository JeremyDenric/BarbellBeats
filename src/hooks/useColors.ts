/**
 * useColors — combined theme + accent color hook
 *
 * Returns the full COLORS token object with `primary` (and related)
 * overridden by the user's chosen Training Identity accent preset.
 *
 * Use this instead of the inline pattern:
 *   const { isDark } = useThemeMode();
 *   const colors = isDark ? COLORS.dark : COLORS.light;
 */

import { useMemo } from 'react';
import { COLORS } from '../theme/tokens';
import { useThemeMode } from '../contexts/ThemeContext';
import { ACCENT_PRESETS } from './useAccentColor';
import { usePreferences } from '../contexts/PreferencesContext';

export function useColors() {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();

  return useMemo(() => {
    const base = isDark ? COLORS.dark : COLORS.light;
    const preset = preferences.accentPreset ?? 'forge';
    const accent = ACCENT_PRESETS[preset] ?? ACCENT_PRESETS.forge;

    // Only override if user has chosen a non-default preset
    if (preset === 'forge') return base;

    return {
      ...base,
      primary: accent.primary,
      primaryLight: accent.primary,
      primaryDark: accent.primary,
    };
  }, [isDark, preferences.accentPreset]);
}
