import { usePreferences } from '../contexts/PreferencesContext';
import type { AccentPreset } from '../contexts/PreferencesContext';

export interface AccentPresetConfig {
  id: AccentPreset;
  name: string;
  primary: string;
  glow: string;
}

export const ACCENT_PRESETS: Record<AccentPreset, AccentPresetConfig> = {
  forge:   { id: 'forge',   name: 'Forge Iron',    primary: '#FF4D00', glow: 'rgba(255,77,0,0.3)' },
  arctic:  { id: 'arctic',  name: 'Arctic Ice',    primary: '#00E5C8', glow: 'rgba(0,229,200,0.3)' },
  solar:   { id: 'solar',   name: 'Solar Gold',    primary: '#FFB800', glow: 'rgba(255,184,0,0.3)' },
  violet:  { id: 'violet',  name: 'Violet Storm',  primary: '#8B5CF6', glow: 'rgba(139,92,246,0.3)' },
  neon:    { id: 'neon',    name: 'Neon Cyber',    primary: '#CBFF00', glow: 'rgba(203,255,0,0.3)' },
  stealth: { id: 'stealth', name: 'Midnight',      primary: '#6B7280', glow: 'rgba(107,114,128,0.3)' },
};

export const ACCENT_PRESET_LIST = Object.values(ACCENT_PRESETS);

export function useAccentColor(): AccentPresetConfig {
  const { preferences } = usePreferences();
  const preset = preferences.accentPreset ?? 'forge';
  return ACCENT_PRESETS[preset] ?? ACCENT_PRESETS.forge;
}
