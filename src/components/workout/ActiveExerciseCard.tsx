/**
 * ActiveExerciseCard
 * Displays the current exercise info during an active workout
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../Icon';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { useThemeMode } from '../../contexts/ThemeContext';
import type { ActiveExercise } from '../../../shared/src/types/workout';

interface ActiveExerciseCardProps {
  exercise: ActiveExercise;
  exerciseIndex: number;
  totalExercises: number;
}

export function ActiveExerciseCard({ exercise, exerciseIndex, totalExercises }: ActiveExerciseCardProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const repsDisplay = exercise.targetRepsMax && exercise.targetRepsMax !== exercise.targetReps
    ? `${exercise.targetReps}-${exercise.targetRepsMax}`
    : `${exercise.targetReps || '?'}`;

  const targetLine = [
    `${exercise.plannedSets} sets`,
    `${repsDisplay} reps`,
    exercise.targetWeight ? `@ ${exercise.targetWeight} lbs` : null,
    exercise.targetRir != null ? `RIR ${exercise.targetRir}` : null,
  ].filter(Boolean).join(' \u00B7 ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>#{exerciseIndex + 1}</Text>
        </View>
        <Text style={[styles.exerciseName, { color: colors.textPrimary }]} numberOfLines={2}>
          {exercise.exercise.name}
        </Text>
        <Text style={[styles.exerciseCount, { color: colors.textTertiary }]}>
          {exerciseIndex + 1}/{totalExercises}
        </Text>
      </View>
      <Text style={[styles.target, { color: colors.textSecondary }]}>{targetLine}</Text>
      {exercise.setType && exercise.setType !== 'straight' && (
        <View style={[styles.setTypeBadge, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.setTypeText, { color: colors.primary }]}>
            {exercise.setType.toUpperCase()}
          </Text>
        </View>
      )}
      {exercise.notes && (
        <View style={styles.notesRow}>
          <Icon name="file-text" size="sm" color={colors.textTertiary} />
          <Text style={[styles.notes, { color: colors.textTertiary }]} numberOfLines={2}>
            {exercise.notes}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badgeText: {
    color: '#0A0A0F',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  exerciseName: {
    ...TYPOGRAPHY.presets.heading3,
    flex: 1,
  },
  exerciseCount: {
    ...TYPOGRAPHY.presets.caption,
    marginLeft: SPACING.sm,
  },
  target: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.xs,
  },
  setTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginBottom: SPACING.xs,
  },
  setTypeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.5,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  notes: {
    ...TYPOGRAPHY.presets.caption,
    flex: 1,
  },
});

export default ActiveExerciseCard;
