/**
 * useStaggerAnimation
 * Returns Reanimated entering animation for staggered FlatList items
 */

import { FadeInUp } from 'react-native-reanimated';
import { usePreferences } from '../contexts/PreferencesContext';

const MAX_STAGGER_INDEX = 10;
const STAGGER_DELAY_MS = 50;

/**
 * Returns a Reanimated entering animation for a given item index.
 * Items beyond MAX_STAGGER_INDEX all enter at the same max delay.
 * Returns undefined if reduceMotion is enabled.
 */
export function useStaggerEntering(index: number) {
  const { preferences } = usePreferences();

  if (preferences.reduceMotion) {
    return undefined;
  }

  const clampedIndex = Math.min(index, MAX_STAGGER_INDEX);
  return FadeInUp
    .delay(clampedIndex * STAGGER_DELAY_MS)
    .springify()
    .damping(18)
    .stiffness(100);
}

export default useStaggerEntering;
