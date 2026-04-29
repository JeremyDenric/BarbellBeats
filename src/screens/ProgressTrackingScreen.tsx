import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// @ts-expect-error victory-native v41+ removed legacy Victory* named exports; full chart refactor pending
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button, EmptyState, ErrorView, GlassCard, LoadingView, SectionHeader } from '../components/UI';
import { VolumeChart } from '../components/workout/VolumeChart';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS, SIGNAL } from '../theme/tokens';
import type { TrainingStackParamList } from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';
import devLog from '../utils/devLog';

type WorkoutLogEntry = {
  id: string;
  title: string;
  createdAt: string;
  durationMin?: number;
  rpe?: number;
  focus?: string;
};

type ActivityLogEntry = {
  id: string;
  date: string;
  sleepHours?: number;
  steps?: number;
  waterAmount?: number;
  waterUnit?: 'cups' | 'oz';
  caloriesBurned?: number;
};

type ActivityMetric = 'steps' | 'sleep' | 'water' | 'calories';

const WORKOUT_LOG_KEY = '@bb_workout_log_entries';
const ACTIVITY_LOG_KEY = '@bb_activity_log_entries';

const METRIC_LABELS: Record<ActivityMetric, { label: string; unit: string }> = {
  steps: { label: 'Steps', unit: 'steps' },
  sleep: { label: 'Sleep', unit: 'hrs' },
  water: { label: 'Hydration', unit: 'cups' },
  calories: { label: 'Calories', unit: 'cal' },
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;

  return (
    <View
      style={[
        styles.metricCard,
        compact && styles.metricCardCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.metricLabel, compact && styles.metricLabelCompact, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.metricValue, compact && styles.metricValueCompact, { color: colors.textPrimary }]}>
        {value}
      </Text>
      {helper ? (
        <Text style={[styles.metricHelper, compact && styles.metricHelperCompact, { color: colors.textTertiary }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

export default function ProgressTrackingScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const navigation = useNavigation<NativeStackNavigationProp<TrainingStackParamList>>();
  const { isPro } = useSubscription();

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activityMetric, setActivityMetric] = useState<ActivityMetric>('steps');

  const chartWidth = Dimensions.get('window').width - LAYOUT.screenPadding * 2 - SPACING.lg * 2;
  const chartHeight = compact ? 200 : 240;

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
      const [storedWorkouts, storedActivities] = await Promise.all([
        AsyncStorage.getItem(WORKOUT_LOG_KEY),
        AsyncStorage.getItem(ACTIVITY_LOG_KEY),
      ]);
      if (storedWorkouts) {
        setWorkoutLogs(JSON.parse(storedWorkouts));
      } else {
        setWorkoutLogs([]);
      }
      if (storedActivities) {
        setActivityLogs(JSON.parse(storedActivities));
      } else {
        setActivityLogs([]);
      }
    } catch (error) {
      devLog.error('Failed to load tracking data:', error);
      setLoadError(error instanceof Error ? error : new Error('Failed to load tracking data'));
    } finally {
      setIsReady(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const workoutSummary = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalWorkouts = workoutLogs.length;
    const recentWorkouts = workoutLogs.filter(
      (entry) => new Date(entry.createdAt) >= thirtyDaysAgo
    );
    const recentWorkoutsCount = recentWorkouts.length;
    const durations = workoutLogs.map((entry) => entry.durationMin).filter((value) => value);
    const totalDuration = durations.reduce((sum, value) => sum + (value || 0), 0);
    const avgDuration = durations.length ? Math.round(totalDuration / durations.length) : 0;
    const rpeValues = workoutLogs.map((entry) => entry.rpe).filter((value) => value);
    const avgRpe = rpeValues.length
      ? Math.round((rpeValues.reduce((sum, value) => sum + (value || 0), 0) / rpeValues.length) * 10) / 10
      : 0;
    return {
      totalWorkouts,
      totalDuration,
      avgDuration,
      recentWorkoutsCount,
      avgRpe,
    };
  }, [workoutLogs]);

  const weeklyWorkoutData = useMemo(() => {
    const currentWeekStart = getWeekStart(new Date());
    const weekStarts = Array.from({ length: 8 }, (_, index) => {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - 7 * (7 - index));
      return start;
    });

    const counts = new Map<string, number>();
    workoutLogs.forEach((entry) => {
      const start = getWeekStart(new Date(entry.createdAt));
      const key = formatDateKey(start);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return weekStarts.map((start) => {
      const key = formatDateKey(start);
      const count = counts.get(key) || 0;
      return {
        x: formatShortDate(start),
        y: count,
        label: `${count} workouts`,
      };
    });
  }, [workoutLogs]);

  const activityAggregate = useMemo(() => {
    const aggregate = new Map<
      string,
      { steps: number; sleepTotal: number; sleepCount: number; waterCups: number; calories: number }
    >();

    activityLogs.forEach((entry) => {
      const key = entry.date;
      const existing = aggregate.get(key) || {
        steps: 0,
        sleepTotal: 0,
        sleepCount: 0,
        waterCups: 0,
        calories: 0,
      };
      if (entry.steps) existing.steps += entry.steps;
      if (entry.sleepHours) {
        existing.sleepTotal += entry.sleepHours;
        existing.sleepCount += 1;
      }
      if (entry.waterAmount) {
        const cups = entry.waterUnit === 'oz' ? entry.waterAmount / 8 : entry.waterAmount;
        existing.waterCups += cups;
      }
      if (entry.caloriesBurned) existing.calories += entry.caloriesBurned;
      aggregate.set(key, existing);
    });

    return aggregate;
  }, [activityLogs]);

  const dailyActivityData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    return days.map((date) => {
      const key = formatDateKey(date);
      const dayData = activityAggregate.get(key);
      let value = 0;
      if (dayData) {
        if (activityMetric === 'steps') value = dayData.steps;
        if (activityMetric === 'sleep') {
          value = dayData.sleepCount ? dayData.sleepTotal / dayData.sleepCount : 0;
        }
        if (activityMetric === 'water') value = dayData.waterCups;
        if (activityMetric === 'calories') value = dayData.calories;
      }
      return {
        x: formatWeekday(date),
        y: value,
        label: `${Math.round(value * 10) / 10} ${METRIC_LABELS[activityMetric].unit}`,
      };
    });
  }, [activityAggregate, activityMetric]);

  const milestoneData = useMemo(() => {
    const totalWorkouts = workoutSummary.totalWorkouts;
    const totalMinutes = workoutSummary.totalDuration;
    const totalSteps = Array.from(activityAggregate.values()).reduce(
      (sum, value) => sum + value.steps,
      0
    );

    let bestStreak = 0;
    let currentStreak = 0;
    weeklyWorkoutData.forEach((week) => {
      if (week.y > 0) {
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return [
      {
        id: 'workouts',
        title: '10 Workouts Logged',
        value: totalWorkouts,
        target: 10,
        helper: `${totalWorkouts} sessions`,
      },
      {
        id: 'minutes',
        title: '300 Minutes Trained',
        value: totalMinutes,
        target: 300,
        helper: `${totalMinutes} min`,
      },
      {
        id: 'steps',
        title: '50k Steps Recorded',
        value: totalSteps,
        target: 50000,
        helper: `${Math.round(totalSteps / 1000)}k steps`,
      },
      {
        id: 'streak',
        title: '4-Week Consistency Streak',
        value: bestStreak,
        target: 4,
        helper: `${bestStreak} weeks`,
      },
    ];
  }, [activityAggregate, weeklyWorkoutData, workoutSummary]);

  const insights = useMemo(() => {
    const now = new Date();
    const recentStart = new Date();
    recentStart.setDate(now.getDate() - 28);
    const previousStart = new Date();
    previousStart.setDate(now.getDate() - 56);

    const recentWorkouts = workoutLogs.filter(
      (entry) => new Date(entry.createdAt) >= recentStart
    ).length;
    const previousWorkouts = workoutLogs.filter((entry) => {
      const date = new Date(entry.createdAt);
      return date >= previousStart && date < recentStart;
    }).length;

    const workoutChange =
      previousWorkouts > 0
        ? Math.round(((recentWorkouts - previousWorkouts) / previousWorkouts) * 100)
        : null;

    const sleepValues = Array.from(activityAggregate.values())
      .map((value) => (value.sleepCount ? value.sleepTotal / value.sleepCount : 0))
      .filter((value) => value > 0);
    const avgSleep =
      sleepValues.length > 0
        ? Math.round((sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length) * 10) / 10
        : 0;

    const waterValues = Array.from(activityAggregate.values())
      .map((value) => value.waterCups)
      .filter((value) => value > 0);
    const avgWater =
      waterValues.length > 0
        ? Math.round((waterValues.reduce((sum, value) => sum + value, 0) / waterValues.length) * 10) / 10
        : 0;

    const rpeValues = workoutLogs.map((entry) => entry.rpe).filter((value) => value);
    const avgRpe =
      rpeValues.length > 0
        ? Math.round((rpeValues.reduce((sum, value) => sum + (value || 0), 0) / rpeValues.length) * 10) / 10
        : 0;

    const insightList = [];
    if (recentWorkouts > 0) {
      insightList.push(
        workoutChange === null
          ? `You logged ${recentWorkouts} workouts in the last 4 weeks.`
          : `Workouts are ${workoutChange >= 0 ? 'up' : 'down'} ${Math.abs(
              workoutChange
            )}% versus the previous 4 weeks.`
      );
    }
    if (avgSleep > 0) {
      insightList.push(
        avgSleep < 7
          ? `Average sleep is ${avgSleep} hours. Aim for 7-8 to boost recovery.`
          : `Average sleep is ${avgSleep} hours. Solid recovery foundation.`
      );
    }
    if (avgWater > 0) {
      insightList.push(
        avgWater < 6
          ? `Hydration sits at ${avgWater} cups. Add 1-2 cups on training days.`
          : `Hydration averages ${avgWater} cups. Keep the momentum.`
      );
    }
    if (avgRpe > 0) {
      insightList.push(
        avgRpe >= 8
          ? `Session intensity is high (RPE ${avgRpe}). Schedule extra recovery.`
          : `Average intensity is RPE ${avgRpe}. Plenty of room to progress.`
      );
    }
    if (insightList.length === 0) {
      insightList.push('Log a few workouts to unlock AI insights.');
    }
    return insightList;
  }, [activityAggregate, workoutLogs]);

  const hasData = workoutLogs.length > 0 || activityLogs.length > 0;

  if (!isReady) {
    return <LoadingView message="Building your insights..." />;
  }

  if (loadError) {
    return <ErrorView error={loadError} onRetry={loadData} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <SectionHeader
          title="Progress Tracking"
          subtitle="Interactive charts, milestones, and AI insights"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />

        {!hasData ? (
          <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
            <EmptyState
              title="No tracking data yet"
              message="Start logging workouts to unlock progress tracking."
              action={{
                label: 'Log a workout',
                onPress: () => navigation.navigate('WorkoutLog'),
              }}
            />
          </GlassCard>
        ) : null}

        {hasData ? (
          <>
            <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
              <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
                Progress snapshot
              </Text>
              <View style={[styles.metricsGrid, compact && styles.metricsGridCompact]}>
                <MetricCard
                  label="Total workouts"
                  value={`${workoutSummary.totalWorkouts}`}
                  helper="All time"
                />
                <MetricCard
                  label="30-day workouts"
                  value={`${workoutSummary.recentWorkoutsCount}`}
                  helper="This month"
                />
                <MetricCard
                  label="Avg duration"
                  value={workoutSummary.avgDuration ? `${workoutSummary.avgDuration} min` : '--'}
                  helper="Per session"
                />
                <MetricCard
                  label="Avg RPE"
                  value={workoutSummary.avgRpe ? `${workoutSummary.avgRpe}` : '--'}
                  helper="Intensity"
                />
              </View>
            </GlassCard>

            <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
              <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
                Workout consistency
              </Text>
              <Text style={[styles.cardSubtitle, compact && styles.cardSubtitleCompact, { color: colors.textSecondary }]}>
                Weekly sessions for the last 8 weeks
              </Text>
              <VictoryChart
                height={chartHeight}
                width={chartWidth}
                domainPadding={{ x: 18, y: 12 }}
                padding={{ top: 20, bottom: 48, left: 48, right: 20 }}
                containerComponent={
                  <VictoryVoronoiContainer
                    labels={({ datum }) => datum.label}
                    labelComponent={
                      <VictoryTooltip
                        flyoutStyle={{ stroke: colors.border, fill: colors.surface }}
                        style={{ fill: colors.textPrimary, fontSize: 12 }}
                      />
                    }
                  />
                }
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: colors.border },
                    tickLabels: { fill: colors.textSecondary, fontSize: compact ? 9 : 10 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: colors.border },
                    grid: { stroke: colors.border, opacity: 0.2 },
                    tickLabels: { fill: colors.textSecondary, fontSize: compact ? 9 : 10 },
                  }}
                />
                <VictoryBar
                  data={weeklyWorkoutData}
                  style={{
                    data: { fill: colors.primary },
                  }}
                />
              </VictoryChart>
            </GlassCard>

            {isPro ? (
              <>
                <View style={{ marginHorizontal: compact ? LAYOUT.screenPadding * 0.8 : LAYOUT.screenPadding }}>
                  <VolumeChart
                    data={[]}
                    title="Training Volume"
                    subtitle="Track your total lifting volume over time"
                    timeRange="week"
                    groupBy="total"
                  />
                </View>

                <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
                  <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
                    Daily activity trend
                  </Text>
                  <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                    {(Object.keys(METRIC_LABELS) as ActivityMetric[]).map((metric) => (
                      <Pressable
                        key={metric}
                        onPress={() => setActivityMetric(metric)}
                        style={[
                          styles.chip,
                          compact && styles.chipCompact,
                          {
                            backgroundColor:
                              activityMetric === metric ? colors.primary + '20' : colors.surfaceAlt,
                            borderColor: activityMetric === metric ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            compact && styles.chipTextCompact,
                            {
                              color: activityMetric === metric ? colors.primary : colors.textSecondary,
                            },
                          ]}
                        >
                          {METRIC_LABELS[metric].label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <VictoryChart
                    height={chartHeight}
                    width={chartWidth}
                    padding={{ top: 20, bottom: 48, left: 48, right: 20 }}
                    containerComponent={
                      <VictoryVoronoiContainer
                        labels={({ datum }) => datum.label}
                        labelComponent={
                          <VictoryTooltip
                            flyoutStyle={{ stroke: colors.border, fill: colors.surface }}
                            style={{ fill: colors.textPrimary, fontSize: 12 }}
                          />
                        }
                      />
                    }
                  >
                    <VictoryAxis
                      style={{
                        axis: { stroke: colors.border },
                        tickLabels: { fill: colors.textSecondary, fontSize: compact ? 9 : 10 },
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      style={{
                        axis: { stroke: colors.border },
                        grid: { stroke: colors.border, opacity: 0.2 },
                        tickLabels: { fill: colors.textSecondary, fontSize: compact ? 9 : 10 },
                      }}
                    />
                    <VictoryLine
                      data={dailyActivityData}
                      style={{
                        data: { stroke: colors.accentGreen, strokeWidth: 2 },
                      }}
                    />
                  </VictoryChart>
                </GlassCard>

                <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
                  <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
                    Milestone report
                  </Text>
                  <View style={[styles.milestoneList, compact && styles.milestoneListCompact]}>
                    {milestoneData.map((milestone) => {
                      const progress = Math.min(milestone.value / milestone.target, 1);
                      return (
                        <View key={milestone.id} style={[styles.milestoneRow, compact && styles.milestoneRowCompact]}>
                          <View style={[styles.milestoneHeader, compact && styles.milestoneHeaderCompact]}>
                            <Text style={[styles.milestoneTitle, compact && styles.milestoneTitleCompact, { color: colors.textPrimary }]}>
                              {milestone.title}
                            </Text>
                            <Text style={[styles.milestoneHelper, compact && styles.milestoneHelperCompact, { color: colors.textSecondary }]}>
                              {milestone.helper}
                            </Text>
                          </View>
                          <View style={[styles.progressBar, compact && styles.progressBarCompact, { backgroundColor: colors.surfaceAlt }]}>
                            <View
                              style={[
                                styles.progressFill,
                                compact && styles.progressFillCompact,
                                { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>

                <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
                  <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
                    AI-generated insights
                  </Text>
                  <View style={[styles.insightList, compact && styles.insightListCompact]}>
                    {insights.map((insight, index) => (
                      <View key={`insight-${index}`} style={[styles.insightRow, compact && styles.insightRowCompact]}>
                        <View style={[styles.insightDot, compact && styles.insightDotCompact, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.insightText, compact && styles.insightTextCompact, { color: colors.textSecondary }]}>
                          {insight}
                        </Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </>
            ) : (
              <GlassCard style={[styles.card, styles.proGateCard, compact && styles.cardCompact]} intensity={16}>
                <Text style={[styles.proGateBadge, { color: SIGNAL.forge }]}>FORGE PRO</Text>
                <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
                  Pro Analytics
                </Text>
                <Text style={[styles.proGateDesc, { color: colors.textSecondary }]}>
                  Volume charts, daily activity trends, milestone tracking, and AI-generated insights are included with Forge Pro.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('ForgePaywall' as never)}
                  style={[styles.proGateButton, { backgroundColor: SIGNAL.forge }]}
                >
                  <Text style={styles.proGateButtonText}>Upgrade to Forge Pro</Text>
                </Pressable>
              </GlassCard>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    paddingBottom: SPACING['3xl'],
    gap: SPACING.md,
  },
  sectionTitle: {
    color: '#F0F0F5',
    textShadowColor: 'rgba(203, 255, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: '#9B9BAD',
  },
  card: {
    marginHorizontal: LAYOUT.screenPadding,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardCompact: {
    marginHorizontal: LAYOUT.screenPadding * 0.8,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
  },
  cardTitleCompact: {
    fontSize: 16,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
  cardSubtitleCompact: {
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metricsGridCompact: {
    gap: SPACING.sm,
  },
  metricCard: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  metricCardCompact: {
    padding: SPACING.sm,
    gap: 6,
  },
  metricLabel: {
    ...TYPOGRAPHY.presets.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricLabelCompact: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  metricValue: {
    ...TYPOGRAPHY.presets.heading3,
  },
  metricValueCompact: {
    fontSize: 16,
  },
  metricHelper: {
    ...TYPOGRAPHY.presets.caption,
  },
  metricHelperCompact: {
    fontSize: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chipRowCompact: {
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipCompact: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: 11,
  },
  milestoneList: {
    gap: SPACING.md,
  },
  milestoneListCompact: {
    gap: SPACING.sm,
  },
  milestoneRow: {
    gap: SPACING.xs,
  },
  milestoneRowCompact: {
    gap: 6,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  milestoneHeaderCompact: {
    gap: SPACING.xs,
  },
  milestoneTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
    flex: 1,
  },
  milestoneTitleCompact: {
    fontSize: 13,
  },
  milestoneHelper: {
    ...TYPOGRAPHY.presets.caption,
  },
  milestoneHelperCompact: {
    fontSize: 11,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
  },
  progressBarCompact: {
    height: 6,
  },
  progressFillCompact: {
    height: 6,
  },
  insightList: {
    gap: SPACING.sm,
  },
  insightListCompact: {
    gap: SPACING.xs,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  insightRowCompact: {
    gap: SPACING.xs,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightDotCompact: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 5,
  },
  insightText: {
    ...TYPOGRAPHY.presets.body,
    flex: 1,
  },
  insightTextCompact: {
    fontSize: 13,
  },
  emptyActions: {
    marginTop: SPACING.sm,
  },
  emptyActionsCompact: {
    marginTop: SPACING.xs,
  },
  proGateCard: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  proGateBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  proGateDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  proGateButton: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  proGateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
