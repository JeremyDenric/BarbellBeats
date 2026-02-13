/**
 * ExerciseRow
 * Row component for displaying an exercise in the workout builder
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Icon } from '../Icon';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme/tokens';
import { WorkoutExerciseConfig, RIR_DESCRIPTIONS } from '../../services/workoutTemplateStorage';

interface ExerciseRowProps {
  exercise: WorkoutExerciseConfig;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ExerciseRow({
  exercise,
  index,
  totalCount,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ExerciseRowProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const formatReps = () => {
    if (exercise.repsMax && exercise.repsMax !== exercise.repsMin) {
      return `${exercise.repsMin}-${exercise.repsMax}`;
    }
    return `${exercise.repsMin}`;
  };

  const formatRest = () => {
    if (exercise.restSeconds < 60) {
      return `${exercise.restSeconds}s`;
    }
    const mins = Math.floor(exercise.restSeconds / 60);
    const secs = exercise.restSeconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getRIRColor = () => {
    if (exercise.rir <= 1) return colors.error;
    if (exercise.rir <= 2) return colors.warning;
    return colors.success;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      {/* Order Number */}
      <View style={[styles.orderBadge, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.orderText, { color: colors.primary }]}>{index + 1}</Text>
      </View>

      {/* Main Content */}
      <Pressable style={styles.mainContent} onPress={onEdit}>
        <Text style={[styles.exerciseName, { color: colors.textPrimary }]} numberOfLines={1}>
          {exercise.exercise.name}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {exercise.sets}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>sets</Text>
          </View>
          <Text style={[styles.statDivider, { color: colors.textTertiary }]}>×</Text>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {formatReps()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>reps</Text>
          </View>
          <View style={[styles.rirBadge, { backgroundColor: getRIRColor() + '20' }]}>
            <Text style={[styles.rirText, { color: getRIRColor() }]}>
              RIR {exercise.rir}
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="clock" size="xs" color={colors.textTertiary} />
            <Text style={[styles.restText, { color: colors.textSecondary }]}>
              {formatRest()}
            </Text>
          </View>
        </View>

        {/* Muscle groups */}
        <View style={styles.musclesRow}>
          {exercise.exercise.muscleGroups?.slice(0, 3).map((muscle, i) => (
            <Text
              key={i}
              style={[styles.muscleTag, { color: colors.textTertiary }]}
            >
              {muscle}{i < Math.min(exercise.exercise.muscleGroups.length, 3) - 1 ? ' • ' : ''}
            </Text>
          ))}
        </View>
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, index === 0 && styles.actionDisabled]}
          onPress={onMoveUp}
          disabled={index === 0}
        >
          <Icon
            name="caret-up"
            size="sm"
            color={index === 0 ? colors.textTertiary : colors.textSecondary}
          />
        </Pressable>
        <Pressable
          style={[styles.actionButton, index === totalCount - 1 && styles.actionDisabled]}
          onPress={onMoveDown}
          disabled={index === totalCount - 1}
        >
          <Icon
            name="caret-down"
            size="sm"
            color={index === totalCount - 1 ? colors.textTertiary : colors.textSecondary}
          />
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onRemove}>
          <Icon name="x" size="sm" color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  rirBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.xs,
  },
  rirText: {
    fontSize: 10,
    fontWeight: '600',
  },
  restText: {
    fontSize: 11,
    marginLeft: 2,
  },
  musclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'column',
    gap: 2,
  },
  actionButton: {
    padding: 4,
  },
  actionDisabled: {
    opacity: 0.4,
  },
});
