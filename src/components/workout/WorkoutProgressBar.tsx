/**
 * WorkoutProgressBar
 * Animated progress bar showing completed sets out of total
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { useThemeMode } from '../../contexts/ThemeContext';

interface WorkoutProgressBarProps {
  completedSets: number;
  totalSets: number;
}

export function WorkoutProgressBar({ completedSets, totalSets }: WorkoutProgressBarProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  const animatedWidth = useAnimatedStyle(() => ({
    width: withSpring(`${Math.round(progress * 100)}%` as any, {
      damping: 20,
      stiffness: 100,
    }),
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: colors.primary }, animatedWidth]}
        />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {completedSets} / {totalSets} sets
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  track: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  label: {
    ...TYPOGRAPHY.presets.caption,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

export default WorkoutProgressBar;
