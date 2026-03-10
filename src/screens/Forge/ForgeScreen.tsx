import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenChrome from '../../components/ScreenChrome';
import { Button, Badge, GlassCard } from '../../components/UI';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, SIGNAL, SPACING, RADIUS } from '../../theme/tokens';
import { usePrograms } from '../../contexts/ProgramContext';
import { useForgeMode } from '../../hooks/useForgeMode';
import { FORGE_PROGRAMS, FORGE_PROGRAM_IDS } from '../../data/forgePrograms';
import haptics from '../../utils/haptics';
import type { TrainingStackParamList } from '../../types';
import type { WorkoutProgram } from '../../../shared/src/types/workout';

type NavProp = NativeStackNavigationProp<TrainingStackParamList>;

const GOAL_LABELS: Record<string, string> = {
  strength: 'STRENGTH',
  hypertrophy: 'HYPERTROPHY',
  endurance: 'ATHLETIC',
  powerlifting: 'POWERLIFTING',
  general: 'GENERAL',
};

// ============================================================================
// Program Library Card
// ============================================================================

interface ProgramCardProps {
  program: WorkoutProgram;
  isLocked: boolean;
  onPress: () => void;
  colors: typeof COLORS.dark;
}

function ProgramCard({ program, isLocked, onPress, colors }: ProgramCardProps) {
  const daysPerWeek = program.weeks[0]?.workouts.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.programCard,
        { backgroundColor: colors.surface, borderColor: isLocked ? colors.border : SIGNAL.forge + '40' },
      ]}
    >
      {isLocked && (
        <View style={styles.lockOverlay}>
          <View style={[styles.lockBadge, { backgroundColor: colors.backgroundAlt }]}>
            <Text style={styles.lockText}>PRO</Text>
          </View>
        </View>
      )}

      <View style={[styles.goalBadge, { backgroundColor: SIGNAL.forge + '20', borderColor: SIGNAL.forge + '40' }]}>
        <Text style={[styles.goalBadgeText, { color: SIGNAL.forge }]}>
          {GOAL_LABELS[program.goal] ?? program.goal.toUpperCase()}
        </Text>
      </View>

      <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={2}>
        {program.name}
      </Text>

      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
        {program.durationWeeks}w · {daysPerWeek}d/wk · {program.estimatedTimePerWorkout}min
      </Text>

      <View style={styles.difficultyRow}>
        {['beginner', 'intermediate', 'advanced'].map((level) => (
          <View
            key={level}
            style={[
              styles.difficultyDot,
              {
                backgroundColor:
                  (['beginner', 'intermediate', 'advanced'].indexOf(level) <=
                   ['beginner', 'intermediate', 'advanced'].indexOf(program.difficulty))
                    ? SIGNAL.forge
                    : colors.border,
              },
            ]}
          />
        ))}
        <Text style={[styles.difficultyLabel, { color: colors.textTertiary }]}>
          {program.difficulty}
        </Text>
      </View>
    </Pressable>
  );
}

// ============================================================================
// ForgeScreen
// ============================================================================

export default function ForgeScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { activeProgram, startProgram, stopProgram } = usePrograms();
  const forge = useForgeMode();

  const isForgeActive = activeProgram && FORGE_PROGRAM_IDS.includes(activeProgram.program.id);

  const handleSelectProgram = useCallback(
    (program: WorkoutProgram) => {
      haptics.lightTap();
      if (forge.isProgramLocked(program.id)) {
        navigation.navigate('ForgePaywall');
        return;
      }
      navigation.navigate('ForgeProgramDetail', { programId: program.id });
    },
    [forge, navigation]
  );

  const handleStartSession = useCallback(async () => {
    if (!isForgeActive) return;
    haptics.mediumTap();
    // Fire playlist generation in background (non-blocking)
    if (forge.isPro) {
      forge.generateSessionPlaylist().catch(() => {});
    }
    // Set RPE session as pending for post-workout
    if (activeProgram) {
      forge.setPendingRpeSession({
        weekNumber: activeProgram.progress.currentWeek,
        dayNumber: activeProgram.progress.currentDay,
      });
    }
    navigation.navigate('WorkoutTemplates');
  }, [isForgeActive, forge, activeProgram, navigation]);

  const handleChangeProgram = useCallback(() => {
    Alert.alert(
      'Change Program',
      'Stop the current Forge program? Your progress will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Program',
          style: 'destructive',
          onPress: async () => {
            haptics.mediumTap();
            await stopProgram();
          },
        },
      ]
    );
  }, [stopProgram]);

  const renderProgramCard = useCallback(
    ({ item }: { item: WorkoutProgram }) => (
      <ProgramCard
        program={item}
        isLocked={forge.isProgramLocked(item.id)}
        onPress={() => handleSelectProgram(item)}
        colors={colors}
      />
    ),
    [forge, handleSelectProgram, colors]
  );

  return (
    <ScreenChrome withPadding={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.badge, { color: SIGNAL.forge }]}>FORGE MODE</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isForgeActive ? activeProgram!.program.name : 'Choose Your Program'}
          </Text>
          {!forge.isPro && (
            <Pressable
              onPress={() => navigation.navigate('ForgePaywall')}
              style={[styles.proBanner, { backgroundColor: SIGNAL.forge + '15', borderColor: SIGNAL.forge + '40' }]}
            >
              <Text style={[styles.proBannerText, { color: SIGNAL.forge }]}>
                Upgrade to Pro — unlock all 6 programs + playlists
              </Text>
            </Pressable>
          )}
        </View>

        {/* Active Program Dashboard */}
        {isForgeActive && activeProgram ? (
          <View style={styles.dashboardSection}>
            {/* Progress Card */}
            <GlassCard style={[styles.progressCard, { borderColor: SIGNAL.forge + '30' }]} intensity={12}>
              <View style={styles.progressRow}>
                <View>
                  <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>PROGRESS</Text>
                  <Text style={[styles.progressValue, { color: colors.textPrimary }]}>
                    Week {activeProgram.progress.currentWeek} / {activeProgram.program.durationWeeks}
                  </Text>
                </View>
                {forge.isDeloadWeek ? (
                  <Badge label="DELOAD" variant="neutral" />
                ) : (
                  <Badge label={`${forge.progressPercent}% Done`} variant="info" />
                )}
              </View>

              {/* Progress bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: SIGNAL.forge, width: `${forge.progressPercent}%` },
                  ]}
                />
              </View>

              {/* Next session */}
              {forge.nextWorkoutName && (
                <View style={styles.nextSessionRow}>
                  <Text style={[styles.nextSessionLabel, { color: colors.textSecondary }]}>
                    Today's Session:
                  </Text>
                  <Text style={[styles.nextSessionName, { color: colors.textPrimary }]}>
                    {forge.nextWorkoutName}
                  </Text>
                </View>
              )}

              {/* Streak */}
              <View style={styles.streakRow}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={[styles.streakText, { color: colors.textSecondary }]}>
                  {forge.currentStreak} sessions completed
                </Text>
              </View>

              {/* Playlist status (Pro only) */}
              {forge.isPro && (
                <View style={styles.playlistRow}>
                  <Text style={styles.spotifyIcon}>🎵</Text>
                  <Text style={[styles.playlistText, { color: colors.textTertiary }]} numberOfLines={1}>
                    {forge.isGeneratingPlaylist
                      ? 'Generating playlist...'
                      : forge.lastPlaylist
                        ? `${forge.lastPlaylist.playlistName} (${forge.lastPlaylist.trackCount} tracks)`
                        : 'Playlist generates on session start'}
                  </Text>
                </View>
              )}

              <Button
                title="Start Session"
                variant="primary"
                fullWidth
                onPress={handleStartSession}
                style={styles.startButton}
              />
            </GlassCard>

            <Pressable onPress={handleChangeProgram} style={styles.changeProgram}>
              <Text style={[styles.changeProgramText, { color: colors.textTertiary }]}>
                Change Program
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Program Library */
          <View style={styles.librarySection}>
            <Text style={[styles.librarySectionTitle, { color: colors.textSecondary }]}>
              SELECT A PROGRAM
            </Text>
            <FlatList
              data={FORGE_PROGRAMS}
              keyExtractor={(item) => item.id}
              renderItem={renderProgramCard}
              numColumns={2}
              columnWrapperStyle={styles.cardRow}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['2xl'],
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  proBanner: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    marginTop: SPACING.xs,
  },
  proBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dashboardSection: {
    gap: SPACING.md,
  },
  progressCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  nextSessionRow: {
    gap: 2,
  },
  nextSessionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextSessionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  spotifyIcon: {
    fontSize: 14,
  },
  playlistText: {
    fontSize: 12,
    flex: 1,
  },
  startButton: {
    marginTop: SPACING.xs,
  },
  changeProgram: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  changeProgramText: {
    fontSize: 13,
  },
  librarySection: {
    gap: SPACING.md,
  },
  librarySectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardRow: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  programCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: SPACING.xs,
    overflow: 'hidden',
  },
  lockOverlay: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 1,
  },
  lockBadge: {
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lockText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#888',
  },
  goalBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  goalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: 11,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyLabel: {
    fontSize: 10,
    marginLeft: 3,
    textTransform: 'capitalize',
  },
});
