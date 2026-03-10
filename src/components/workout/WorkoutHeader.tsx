/**
 * WorkoutHeader
 * Displays workout name, elapsed timer, and minimize button
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Icon } from '../Icon';
import { TYPOGRAPHY, SPACING, FONTS, COLORS } from '../../theme/tokens';
import { useThemeMode } from '../../contexts/ThemeContext';
import haptics from '../../utils/haptics';

interface WorkoutHeaderProps {
  workoutName: string;
  elapsedTime: string;
  onMinimize: () => void;
}

export function WorkoutHeader({ workoutName, elapsedTime, onMinimize }: WorkoutHeaderProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const handleMinimize = () => {
    haptics.lightTap();
    onMinimize();
  };

  return (
    <View style={styles.container}>
      <Text
        style={[styles.workoutName, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {workoutName}
      </Text>
      <Text style={[styles.timer, { color: colors.primary }]}>{elapsedTime}</Text>
      <Pressable
        onPress={handleMinimize}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Minimize workout"
      >
        <Icon name="x" size="lg" color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  workoutName: {
    ...TYPOGRAPHY.presets.bodyBold,
    flex: 1,
    marginRight: SPACING.md,
  },
  timer: {
    fontFamily: FONTS.mono,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontVariant: ['tabular-nums'],
    marginRight: SPACING.md,
  },
});

export default WorkoutHeader;
