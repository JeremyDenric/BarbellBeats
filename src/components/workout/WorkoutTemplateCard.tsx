/**
 * WorkoutTemplateCard
 * Card component to display a workout template with actions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { GlassCard } from '../UI';
import { Icon, IconName } from '../Icon';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme/tokens';
import {
  UserWorkoutTemplate,
  WORKOUT_CATEGORIES,
} from '../../services/workoutTemplateStorage';

interface WorkoutTemplateCardProps {
  template: UserWorkoutTemplate;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default function WorkoutTemplateCard({
  template,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
}: WorkoutTemplateCardProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [showActions, setShowActions] = useState(false);

  const categoryData = WORKOUT_CATEGORIES[template.category];
  const exerciseCount = template.exercises.length;
  const totalSets = template.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const getDifficultyColor = () => {
    switch (template.difficulty) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatLastUsed = () => {
    if (!template.lastUsedAt) return 'Never used';
    const lastUsed = new Date(template.lastUsedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Used today';
    if (diffDays === 1) return 'Used yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <GlassCard style={styles.card} intensity={16}>
      <Pressable
        style={styles.cardContent}
        onPress={onPress}
        onLongPress={() => setShowActions(!showActions)}
      >
        {/* Category Icon */}
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
          <Icon
            name={categoryData.icon as IconName}
            size="lg"
            color={colors.primary}
          />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {template.name}
            </Text>
            <Pressable
              style={styles.moreButton}
              onPress={() => setShowActions(!showActions)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="dots-three" size="md" color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Category and Difficulty */}
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: colors.textSecondary }]}>
              {categoryData.label}
            </Text>
            <View style={styles.dot} />
            <Text style={[styles.difficulty, { color: getDifficultyColor() }]}>
              {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="list" size="xs" color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {exerciseCount} exercises
              </Text>
            </View>
            <View style={styles.stat}>
              <Icon name="stack" size="xs" color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {totalSets} sets
              </Text>
            </View>
            <View style={styles.stat}>
              <Icon name="clock" size="xs" color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                ~{formatDuration(template.estimatedDuration)}
              </Text>
            </View>
          </View>

          {/* Last Used / Times Used */}
          <View style={styles.usageRow}>
            <Text style={[styles.usageText, { color: colors.textTertiary }]}>
              {formatLastUsed()}
            </Text>
            {template.timesUsed > 0 && (
              <>
                <View style={styles.dot} />
                <Text style={[styles.usageText, { color: colors.textTertiary }]}>
                  Used {template.timesUsed}x
                </Text>
              </>
            )}
          </View>

          {/* Muscle Groups Tags */}
          {template.muscleGroups.length > 0 && (
            <View style={styles.tagsRow}>
              {template.muscleGroups.slice(0, 4).map((muscle, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    {muscle}
                  </Text>
                </View>
              ))}
              {template.muscleGroups.length > 4 && (
                <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    +{template.muscleGroups.length - 4}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>

      {/* Action Buttons (shown on long press) */}
      {showActions && (
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              setShowActions(false);
              onEdit?.();
            }}
          >
            <Icon name="pencil" size="sm" color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              setShowActions(false);
              onDuplicate?.();
            }}
          >
            <Icon name="copy" size="sm" color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Duplicate</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              setShowActions(false);
              onDelete?.();
            }}
          >
            <Icon name="trash" size="sm" color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
          </Pressable>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...TYPOGRAPHY.presets.bodyBold,
    flex: 1,
  },
  moreButton: {
    padding: SPACING.xs,
    marginRight: -SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  category: {
    ...TYPOGRAPHY.presets.caption,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#888',
  },
  difficulty: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  usageText: {
    fontSize: 11,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
