/**
 * ForgeDashboardCard
 * Compact summary of an active Forge program, shown on the Home screen.
 * Shows progress, current session, streak, and playlist status.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { GlassCard, Badge, Button } from './UI';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAccentColor } from '../hooks/useAccentColor';
import { COLORS, SIGNAL, SPACING, RADIUS } from '../theme/tokens';
import type { ForgePlaylistResult } from '../hooks/useForgeMode';
import type { WorkoutProgram } from '../../shared/src/types/workout';

// Re-export the ProgramProgress type shape we need
interface ForgeProgramProgress {
  currentWeek: number;
  currentDay: number;
  completedWorkouts: string[];
}

interface ForgeDashboardCardProps {
  program: WorkoutProgram;
  progress: ForgeProgramProgress;
  isDeloadWeek: boolean;
  nextWorkoutName: string | null;
  progressPercent: number;
  currentStreak: number;
  isGeneratingPlaylist: boolean;
  lastPlaylist: ForgePlaylistResult | null;
  isPro: boolean;
  onStartSession: () => void;
  onViewDetails?: () => void;
}

function ForgeDashboardCard({
  program,
  progress,
  isDeloadWeek,
  nextWorkoutName,
  progressPercent,
  currentStreak,
  isGeneratingPlaylist,
  lastPlaylist,
  isPro,
  onStartSession,
  onViewDetails,
}: ForgeDashboardCardProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const accent = useAccentColor();

  return (
    <GlassCard
      style={[styles.card, { borderColor: accent.primary + '35' }]}
      intensity={14}
      variant="prominent"
    >
      {/* Left accent bar — follows Training Identity */}
      <View style={[styles.accentBar, { backgroundColor: accent.primary }]} />

      <View style={styles.body}>
        {/* Row 1: Title + badge */}
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={[styles.forgeBadge, { color: SIGNAL.forge }]}>FORGE MODE</Text>
            <Text style={[styles.programName, { color: colors.textPrimary }]} numberOfLines={1}>
              {program.name}
            </Text>
          </View>
          {isDeloadWeek ? (
            <Badge label="DELOAD" variant="neutral" size="small" />
          ) : (
            <Badge label={`W${progress.currentWeek}`} variant="primary" size="small" />
          )}
        </View>

        {/* Row 2: Progress bar */}
        <View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: accent.primary, width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
            {progress.completedWorkouts.length} sessions · {progressPercent}% complete
          </Text>
        </View>

        {/* Row 3: Next session */}
        {nextWorkoutName && (
          <Text style={[styles.nextSession, { color: colors.textSecondary }]} numberOfLines={1}>
            Next: {nextWorkoutName}
          </Text>
        )}

        {/* Row 4: Playlist (Pro only) */}
        {isPro && (
          <Text style={[styles.playlist, { color: colors.textTertiary }]} numberOfLines={1}>
            🎵{' '}
            {isGeneratingPlaylist
              ? 'Generating playlist...'
              : lastPlaylist
                ? `${lastPlaylist.playlistName} · ${lastPlaylist.trackCount} tracks`
                : 'Playlist generates on start'}
          </Text>
        )}

        {/* Row 5: Streak */}
        <Text style={[styles.streak, { color: colors.textSecondary }]}>
          {currentStreak > 0
            ? `🔥 ${currentStreak} day streak`
            : '🔥 Start your streak today'}
        </Text>

        {/* CTA */}
        <View style={styles.actions}>
          <Button
            title="Start Session"
            variant="primary"
            size="small"
            onPress={onStartSession}
            style={styles.startBtn}
          />
          {onViewDetails && (
            <Pressable onPress={onViewDetails}>
              <Text style={[styles.detailsLink, { color: colors.textTertiary }]}>Details</Text>
            </Pressable>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

export default memo(ForgeDashboardCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  forgeBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  programName: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
  },
  nextSession: {
    fontSize: 13,
  },
  playlist: {
    fontSize: 11,
  },
  streak: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  startBtn: {
    flex: 1,
  },
  detailsLink: {
    fontSize: 13,
  },
});
