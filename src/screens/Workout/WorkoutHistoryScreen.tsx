import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '../../contexts/ThemeContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useWorkout } from '../../contexts/WorkoutContext';
import { GlassCard, EmptyState, SectionHeader } from '../../components/UI';
import { Icon } from '../../components/Icon';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS, SIGNAL } from '../../theme/tokens';
import { epley } from '../../utils/oneRepMax';
import type { Workout, WorkoutSet } from '../../../shared/src/types/workout';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatVolume(lbs: number): string {
  return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${Math.round(lbs)} lbs`;
}

// Group sets by exercise, compute best set (highest Epley 1RM) per group
function groupByExercise(sets: WorkoutSet[]): { name: string; sets: WorkoutSet[]; best: WorkoutSet | null }[] {
  const map = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    const name = s.exercise?.name ?? s.exerciseId;
    const arr = map.get(name) ?? [];
    arr.push(s);
    map.set(name, arr);
  }
  return Array.from(map.entries()).map(([name, exerciseSets]) => ({
    name,
    sets: exerciseSets,
    best: exerciseSets.reduce<WorkoutSet | null>((top, s) => {
      if (!s.weight || !s.reps) return top;
      if (!top || epley(s.weight, s.reps) > epley(top.weight ?? 0, top.reps ?? 0)) return s;
      return top;
    }, null),
  }));
}

// ─── WorkoutCard ─────────────────────────────────────────────────────────────

interface CardProps {
  workout: Workout;
  colors: typeof COLORS.dark;
  compact: boolean;
}

function WorkoutCard({ workout, colors, compact }: CardProps) {
  const [expanded, setExpanded] = useState(false);

  const exerciseGroups = useMemo(() => groupByExercise(workout.sets ?? []), [workout.sets]);
  const exerciseNames = exerciseGroups.map((g) => g.name).join(' · ');
  const dateStr = formatDate(workout.completedAt ?? workout.createdAt);
  const title = workout.title ?? 'Workout';

  return (
    <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.cardHeader}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${dateStr}. Tap to ${expanded ? 'collapse' : 'expand'}`}
      >
        {/* Title + date */}
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.cardDate, { color: colors.textTertiary }]}>{dateStr}</Text>
        </View>

        {/* Metrics row */}
        <View style={styles.metricsRow}>
          {workout.duration != null && workout.duration > 0 && (
            <View style={styles.metric}>
              <Icon name="timer" size="xs" color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                {formatDuration(workout.duration)}
              </Text>
            </View>
          )}
          {workout.totalVolume > 0 && (
            <View style={styles.metric}>
              <Icon name="barbell" size="xs" color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                {formatVolume(workout.totalVolume)}
              </Text>
            </View>
          )}
          {workout.totalSets > 0 && (
            <View style={styles.metric}>
              <Icon name="list-bullets" size="xs" color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                {workout.totalSets} sets
              </Text>
            </View>
          )}
          <Icon
            name={expanded ? 'caret-up' : 'caret-down'}
            size="xs"
            color={colors.textTertiary}
          />
        </View>

        {/* Exercise summary (collapsed) */}
        {!expanded && exerciseNames.length > 0 && (
          <Text style={[styles.exerciseSummary, { color: colors.textTertiary }]} numberOfLines={1}>
            {exerciseNames}
          </Text>
        )}
      </Pressable>

      {/* Expanded set detail */}
      {expanded && (
        <View style={styles.setDetail}>
          {exerciseGroups.map((group) => (
            <View key={group.name} style={styles.exerciseGroup}>
              <View style={styles.exerciseGroupHeader}>
                <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                  {group.name}
                </Text>
                {group.best && (
                  <Text style={[styles.bestSet, { color: SIGNAL.forge }]}>
                    Best {group.best.weight} lbs × {group.best.reps}
                  </Text>
                )}
              </View>
              {group.sets.map((s, i) => (
                <View key={s.id ?? i} style={styles.setRow}>
                  <Text style={[styles.setNumber, { color: colors.textTertiary }]}>
                    {s.setType === 'warmup' ? 'W' : i + 1}
                  </Text>
                  <Text style={[styles.setDetail2, { color: colors.textSecondary }]}>
                    {s.weight > 0 ? `${s.weight} lbs` : 'BW'} × {s.reps}
                    {s.rpe != null ? ` @ RPE ${s.rpe}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WorkoutHistoryScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { workoutHistory, loadWorkoutHistory } = useWorkout();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkoutHistory();
    setRefreshing(false);
  }, [loadWorkoutHistory]);

  // Summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let weekVolume = 0;
    let weekSessions = 0;
    let totalVolume = 0;

    for (const w of workoutHistory) {
      totalVolume += w.totalVolume ?? 0;
      const d = new Date(w.completedAt ?? w.createdAt);
      if (d >= weekStart) {
        weekVolume += w.totalVolume ?? 0;
        weekSessions++;
      }
    }
    return { weekVolume, weekSessions, totalVolume, total: workoutHistory.length };
  }, [workoutHistory]);

  const renderItem = useCallback(
    ({ item }: { item: Workout }) => (
      <WorkoutCard workout={item} colors={colors} compact={compact} />
    ),
    [colors, compact]
  );

  const keyExtractor = useCallback((item: Workout) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <FlatList
        data={workoutHistory}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            <SectionHeader
              title="Past Workouts"
              subtitle={`${stats.total} session${stats.total !== 1 ? 's' : ''} logged`}
            />
            {stats.total > 0 && (
              <GlassCard style={styles.statsCard} intensity={16}>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {stats.weekSessions}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      this week
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {formatVolume(stats.weekVolume)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      week volume
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {formatVolume(stats.totalVolume)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      all time
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="No workouts yet"
            message="Complete a workout from the Templates screen and it'll appear here."
          />
        }
      />
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    paddingBottom: SPACING['4xl'],
    gap: SPACING.md,
  },
  listCompact: {
    gap: SPACING.sm,
  },
  statsCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    opacity: 0.4,
  },
  card: {
    marginHorizontal: LAYOUT.screenPadding,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: RADIUS.md,
  },
  cardHeader: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
    flex: 1,
  },
  cardDate: {
    ...TYPOGRAPHY.presets.caption,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseSummary: {
    fontSize: 11,
    marginTop: 2,
  },
  setDetail: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  exerciseGroup: {
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  exerciseGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  exerciseName: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 13,
  },
  bestSet: {
    fontSize: 11,
    fontWeight: '700',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  setNumber: {
    fontSize: 11,
    fontWeight: '600',
    width: 16,
    textAlign: 'center',
  },
  setDetail2: {
    fontSize: 13,
  },
});
