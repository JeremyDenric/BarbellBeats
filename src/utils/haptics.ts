/**
 * Haptic Feedback Utility
 * Provides haptic feedback throughout the app while respecting user preferences.
 * All methods are no-ops when haptics are disabled or unavailable.
 */

import * as Haptics from 'expo-haptics';

let hapticsEnabled = true;

/** Call from PreferencesProvider whenever the preference changes. */
export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

/** Light tap – use for button presses, toggles, selections. */
export function lightTap() {
  if (!hapticsEnabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap – use for confirming actions, tab switches. */
export function mediumTap() {
  if (!hapticsEnabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Heavy tap – use for significant actions like completing a workout. */
export function heavyTap() {
  if (!hapticsEnabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/** Success notification – use after completing a positive action. */
export function success() {
  if (!hapticsEnabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Warning notification – use for warnings or caution states. */
export function warning() {
  if (!hapticsEnabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

/** Error notification – use for errors or failed actions. */
export function error() {
  if (!hapticsEnabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Selection changed – use for scroll pickers, segment controls. */
export function selectionChanged() {
  if (!hapticsEnabled) return;
  Haptics.selectionAsync().catch(() => {});
}

const haptics = {
  lightTap,
  mediumTap,
  heavyTap,
  success,
  warning,
  error,
  selectionChanged,
};

export default haptics;
