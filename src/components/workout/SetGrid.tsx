/**
 * SetGrid
 * Visual set tracker showing completed, current, and pending sets
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../Icon';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { useThemeMode } from '../../contexts/ThemeContext';
import type { ActiveExercise } from '../../../shared/src/types/workout';

interface SetGridProps {
  exercise: ActiveExercise;
  currentSetIndex: number;
}

export function SetGrid({ exercise, currentSetIndex }: SetGridProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const rows = [];
  for (let i = 0; i < exercise.plannedSets; i++) {
    const isCompleted = i < exercise.completedSets.length;
    const isCurrent = i === currentSetIndex;
    const completedSet = exercise.completedSets[i];

    rows.push(
      <View
        key={i}
        style={[
          styles.row,
          { borderColor: isCurrent ? colors.primary : colors.border },
          isCurrent && styles.currentRow,
          isCompleted && { backgroundColor: colors.surfaceAlt },
        ]}
      >
        <View style={styles.setNum}>
          {isCompleted ? (
            <Icon name="check-circle" size="sm" color={colors.success} />
          ) : isCurrent ? (
            <Icon name="target" size="sm" color={colors.primary} />
          ) : (
            <Text style={[styles.setNumText, { color: colors.textDisabled }]}>{i + 1}</Text>
          )}
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>Weight</Text>
          <Text style={[styles.value, { color: isCompleted ? colors.textPrimary : colors.textDisabled }]}>
            {isCompleted ? `${completedSet.weight}` : exercise.targetWeight ? `${exercise.targetWeight}` : '—'}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>Reps</Text>
          <Text style={[styles.value, { color: isCompleted ? colors.textPrimary : colors.textDisabled }]}>
            {isCompleted ? `${completedSet.reps}` : exercise.targetReps ? `${exercise.targetReps}` : '—'}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>RIR</Text>
          <Text style={[styles.value, { color: isCompleted ? colors.textPrimary : colors.textDisabled }]}>
            {isCompleted && completedSet.rpe != null ? `${10 - completedSet.rpe}` : exercise.targetRir != null ? `${exercise.targetRir}` : '—'}
          </Text>
        </View>
      </View>
    );
  }

  return <View style={styles.container}>{rows}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  currentRow: {
    borderWidth: 2,
  },
  setNum: {
    width: 32,
    alignItems: 'center',
  },
  setNumText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 2,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default SetGrid;
