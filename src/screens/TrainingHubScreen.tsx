import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { GlassCard, EmptyState } from '../components/UI';
import ScreenChrome from '../components/ScreenChrome';
import SectionDivider from '../components/SectionDivider';
import { Icon, IconName } from '../components/Icon';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS, TOUCH_TARGET, SIGNAL } from '../theme/tokens';
import haptics from '../utils/haptics';
import { useForgeMode } from '../hooks/useForgeMode';
import type { TrainingStackParamList } from '../types';

type TrainingNav = NativeStackNavigationProp<TrainingStackParamList>;

type HubItem = {
  title: string;
  subtitle: string;
  icon: IconName;
  route: keyof TrainingStackParamList;
};

const LOG_ITEMS: HubItem[] = [
  { title: 'My Workouts', subtitle: 'Create and manage templates', icon: 'barbell', route: 'WorkoutTemplates' },
  { title: 'Workout Log', subtitle: 'Save sessions and notes', icon: 'clipboard-text', route: 'WorkoutLog' },
  { title: 'Cardio Log', subtitle: 'Log workouts and sessions', icon: 'person-run', route: 'CardioTypeSelection' },
];

const PROGRESS_ITEMS: HubItem[] = [
  { title: 'Progress Tracking', subtitle: 'Charts and insights', icon: 'chart-line-up', route: 'ProgressTracking' },
  { title: 'Personal Records', subtitle: 'PRs and milestones', icon: 'trophy', route: 'PRs' },
];

const TOOL_ITEMS: HubItem[] = [
  { title: 'Workout Tools', subtitle: 'Plate math + mobility flows', icon: 'toolbox', route: 'WorkoutToolsMain' },
  { title: 'Timers', subtitle: 'Intervals and rest', icon: 'timer', route: 'Timers' },
];

export default function TrainingHubScreen() {
  const navigation = useNavigation<TrainingNav>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { workoutHistory, loadWorkoutHistory } = useWorkout();
  const { isPro } = useForgeMode();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkoutHistory();
    setRefreshing(false);
  }, [loadWorkoutHistory]);

  // Compute dynamic stats from workout history
  const stats = useMemo(() => {
    const totalSessions = workoutHistory.length;

    // Calculate current streak (consecutive days with workouts)
    let streak = 0;
    if (totalSessions > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayMs = 86400000;
      const workoutDays = new Set(
        workoutHistory.map((w) => {
          const d = new Date(w.completedAt || w.startedAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );
      let checkDay = today.getTime();
      // Allow starting from today or yesterday
      if (!workoutDays.has(checkDay)) {
        checkDay -= dayMs;
      }
      while (workoutDays.has(checkDay)) {
        streak++;
        checkDay -= dayMs;
      }
    }

    // Average workout duration in minutes
    const avgDuration =
      totalSessions > 0
        ? Math.round(
            workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0) /
              totalSessions /
              60
          )
        : 0;

    return { streak, totalSessions, avgDuration };
  }, [workoutHistory]);

  const renderItems = (items: HubItem[]) =>
    items.map((item) => (
      <Pressable
        key={item.title}
        onPress={() => { haptics.lightTap(); navigation.navigate(item.route); }}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.subtitle}`}
        style={({ pressed }) => [
          styles.row,
          compact && styles.rowCompact,
          pressed && styles.rowPressed,
        ]}
      >
        <View
          style={[
            styles.iconBadge,
            compact && styles.iconBadgeCompact,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Icon name={item.icon} size={compact ? 'sm' : 'md'} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, compact && styles.rowTitleCompact, { color: colors.textPrimary }]}>
            {item.title}
          </Text>
          <Text style={[styles.rowSubtitle, compact && styles.rowSubtitleCompact, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
        <Icon name="caret-right" size={compact ? 'xs' : 'sm'} color={colors.textTertiary} />
      </Pressable>
    ));

  return (
    <ScreenChrome withPadding={false}>
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
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Training</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Log, track, and build consistency
          </Text>
          <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
            <View
              style={[
                styles.statPill,
                compact && styles.statPillCompact,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, compact && styles.statValueCompact, { color: colors.textPrimary }]}>
                {stats.streak}
              </Text>
              <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: colors.textTertiary }]}>
                Streak
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                compact && styles.statPillCompact,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, compact && styles.statValueCompact, { color: colors.textPrimary }]}>
                {stats.totalSessions}
              </Text>
              <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: colors.textTertiary }]}>
                Sessions
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                compact && styles.statPillCompact,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, compact && styles.statValueCompact, { color: colors.textPrimary }]}>
                {stats.avgDuration > 0 ? `${stats.avgDuration}m` : '--'}
              </Text>
              <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: colors.textTertiary }]}>
                Avg
              </Text>
            </View>
          </View>
        </View>

        {workoutHistory.length === 0 && (
          <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
            <EmptyState
              icon={<Icon name="barbell" size="xl" color={colors.primary} />}
              title="Your training journey starts here"
              message="Create a workout template and log your first session."
              action={{ label: 'Create a Workout', onPress: () => navigation.navigate('WorkoutTemplates') }}
            />
          </GlassCard>
        )}

        <SectionDivider label="Forge" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Pressable
            onPress={() => { haptics.lightTap(); navigation.navigate('ForgeMain'); }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Forge Mode — Adaptive programs + auto playlists"
            style={({ pressed }) => [
              styles.row,
              compact && styles.rowCompact,
              pressed && styles.rowPressed,
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                compact && styles.iconBadgeCompact,
                { backgroundColor: SIGNAL.forge + '20' },
              ]}
            >
              <Icon name="flame" size={compact ? 'sm' : 'md'} color={SIGNAL.forge} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, compact && styles.rowTitleCompact, { color: colors.textPrimary }]}>
                Forge Mode
              </Text>
              <Text style={[styles.rowSubtitle, compact && styles.rowSubtitleCompact, { color: colors.textSecondary }]}>
                Adaptive programs + auto playlists
              </Text>
            </View>
            {!isPro && (
              <View style={styles.forgeBadge}>
                <Text style={[styles.forgeBadgeText, { color: SIGNAL.forge }]}>PRO</Text>
              </View>
            )}
            <Icon name="caret-right" size={compact ? 'xs' : 'sm'} color={colors.textTertiary} />
          </Pressable>
        </GlassCard>

        <SectionDivider label="Logs" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Logs
          </Text>
          {renderItems(LOG_ITEMS)}
        </GlassCard>

        <SectionDivider label="Progress" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Progress
          </Text>
          {renderItems(PROGRESS_ITEMS)}
        </GlassCard>

        <SectionDivider label="Tools" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Tools
          </Text>
          {renderItems(TOOL_ITEMS)}
        </GlassCard>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    paddingHorizontal: LAYOUT.screenPadding * 0.8,
    paddingBottom: SPACING['3xl'],
    gap: SPACING.md,
  },
  hero: {
    paddingTop: SPACING.lg,
    gap: SPACING.xs,
  },
  heroCompact: {
    paddingTop: SPACING.md,
    gap: SPACING.xs / 2,
  },
  heroTitle: {
    ...TYPOGRAPHY.presets.heading1,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.presets.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statsRowCompact: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  statPill: {
    flex: 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statPillCompact: {
    paddingVertical: 8,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  statValueCompact: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statLabelCompact: {
    fontSize: 10,
    letterSpacing: 0.3,
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
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardCompact: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: SPACING.sm,
  },
  cardTitleCompact: {
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    minHeight: TOUCH_TARGET.comfortable,
  },
  rowCompact: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    minHeight: 0,
  },
  rowPressed: {
    opacity: 0.85,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconText: {
    fontSize: 20,
  },
  iconTextCompact: {
    fontSize: 16,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  rowTitleCompact: {
    fontSize: 14,
  },
  rowSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
  rowSubtitleCompact: {
    fontSize: 11,
  },
  chevron: {
    fontSize: 16,
  },
  chevronCompact: {
    fontSize: 14,
  },
  forgeBadge: {
    backgroundColor: SIGNAL.forge + '20',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: SPACING.xs,
  },
  forgeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
