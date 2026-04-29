/**
 * WorkoutSummaryScreen
 * Post-workout summary with stats, PR detection, and celebration trigger
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { Gradient } from '../../components/Gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Icon } from '../../components/Icon';
import { CelebrationOverlay } from '../../components/CelebrationOverlay';
import { PRVictoryOverlay } from '../../components/PRVictoryOverlay';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useForgeMode } from '../../hooks/useForgeMode';
import { useGym } from '../../contexts/GymContext';
import { getGymQueue } from '../../services/gymApi';
import { savePrMoment } from '../../utils/prSongsStorage';
import { generateId } from '../../utils/generateId';
import { sharePrMoment } from '../../utils/musicShare';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, FONTS, SIGNAL } from '../../theme/tokens';
import haptics from '../../utils/haptics';
import { scheduleForgeCoachNotification } from '../../utils/forgeCoachNotification';
import type { TrainingStackParamList, PRMoment } from '../../types';
import type { Workout, WorkoutSet } from '../../../shared/src/types/workout';

type NavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'WorkoutSummary'>;
type SummaryRouteProp = RouteProp<TrainingStackParamList, 'WorkoutSummary'>;

/** Epley formula for estimated 1RM */
function estimatedOneRM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatVolume(volume: number): string {
  if (volume >= 10000) return `${(volume / 1000).toFixed(1)}k`;
  return volume.toLocaleString();
}

/** Group sets by exercise and find best e1RM per exercise */
function detectPRs(
  currentSets: WorkoutSet[],
  history: Workout[]
): { exerciseName: string; newE1RM: number; previousE1RM: number }[] {
  // Build map of best historical e1RM per exerciseId
  const historicalBest: Record<string, number> = {};
  for (const workout of history) {
    for (const set of workout.sets) {
      const e1rm = estimatedOneRM(set.weight, set.reps);
      if (!historicalBest[set.exerciseId] || e1rm > historicalBest[set.exerciseId]) {
        historicalBest[set.exerciseId] = e1rm;
      }
    }
  }

  // Check current workout sets for PRs
  const currentBest: Record<string, { name: string; e1rm: number }> = {};
  for (const set of currentSets) {
    const e1rm = estimatedOneRM(set.weight, set.reps);
    if (!currentBest[set.exerciseId] || e1rm > currentBest[set.exerciseId].e1rm) {
      currentBest[set.exerciseId] = { name: set.exercise.name, e1rm };
    }
  }

  const prs: { exerciseName: string; newE1RM: number; previousE1RM: number }[] = [];
  for (const [exerciseId, { name, e1rm }] of Object.entries(currentBest)) {
    const prev = historicalBest[exerciseId] ?? 0;
    if (e1rm > prev && e1rm > 0) {
      prs.push({ exerciseName: name, newE1RM: Math.round(e1rm), previousE1RM: Math.round(prev) });
    }
  }
  return prs;
}

function getRpeColor(rpe: number): string {
  if (rpe <= 4) return '#34D399';   // green — easy
  if (rpe <= 7) return SIGNAL.forge; // forge orange — moderate
  if (rpe <= 9) return '#FFD54F';   // gold — hard
  return '#F87171';                  // red — max effort
}

export default function WorkoutSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SummaryRouteProp>();
  const { getWorkoutById, workoutHistory } = useWorkout();
  const forge = useForgeMode();
  const { activeGymId } = useGym();
  const [celebrationVisible, setCelebrationVisible] = useState(true);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  // Song playing at the gym when this workout ended (if any)
  const [prSong, setPrSong] = useState<PRMoment['song'] | null>(null);
  const hasSavedPrMoments = useRef(false);

  const isForgeSession = forge.pendingRpeSession !== null;

  const workout = getWorkoutById(route.params.workoutId);

  // Detect PRs: compare this workout against all OTHER workouts in history
  const prs = useMemo(() => {
    if (!workout) return [];
    const otherWorkouts = workoutHistory.filter((w) => w.id !== workout.id);
    return detectPRs(workout.sets, otherWorkouts);
  }, [workout, workoutHistory]);

  // Capture the now-playing song from the gym queue and persist PR moments
  useEffect(() => {
    if (prs.length === 0 || !activeGymId || hasSavedPrMoments.current) return;
    hasSavedPrMoments.current = true;

    getGymQueue(activeGymId)
      .then(({ nowPlaying, queue }) => {
        const playing = nowPlaying ?? queue.find((s) => s.isPlaying);
        if (!playing) return;
        const song: PRMoment['song'] = {
          title: playing.title,
          artist: playing.artist,
          uri: playing.uri,
          albumArt: playing.albumArt,
        };
        setPrSong(song);
        // Persist each PR moment with the song
        const now = new Date().toISOString();
        prs.forEach((pr) => {
          savePrMoment({
            id: generateId(),
            exerciseName: pr.exerciseName,
            newE1RM: pr.newE1RM,
            previousE1RM: pr.previousE1RM,
            achievedAt: now,
            song,
            gymId: activeGymId,
          }).catch(() => {});
        });
      })
      .catch(() => {
        // No gym queue available — save PR moments without a song
        const now = new Date().toISOString();
        prs.forEach((pr) => {
          savePrMoment({
            id: generateId(),
            exerciseName: pr.exerciseName,
            newE1RM: pr.newE1RM,
            previousE1RM: pr.previousE1RM,
            achievedAt: now,
            gymId: activeGymId,
          }).catch(() => {});
        });
      });
  // Depend on prs.length rather than the prs array reference. The effect must
  // only fire once per workout completion (guarded by hasSavedPrMoments.current),
  // so we don't need to re-run when individual PR objects are updated — only
  // when new PRs appear. Using the full array would cause stale-closure issues
  // without solving any real problem.
  }, [prs.length, activeGymId]);

  // Per-exercise breakdown
  const exerciseBreakdown = useMemo(() => {
    if (!workout) return [];
    const grouped: Record<string, { name: string; sets: number; volume: number; bestSet: string }> = {};
    for (const set of workout.sets) {
      if (!grouped[set.exerciseId]) {
        grouped[set.exerciseId] = { name: set.exercise.name, sets: 0, volume: 0, bestSet: '' };
      }
      const g = grouped[set.exerciseId];
      g.sets++;
      g.volume += set.weight * set.reps;
      const setStr = `${set.weight} x ${set.reps}`;
      if (!g.bestSet || set.weight * set.reps > parseSetVolume(g.bestSet)) {
        g.bestSet = setStr;
      }
    }
    return Object.values(grouped);
  }, [workout]);

  const handleDone = async () => {
    haptics.success();
    if (isForgeSession && selectedRpe !== null) {
      await forge.submitRpe(selectedRpe);
      // Schedule Forge AI Coach notification for Pro users if there's a next workout
      if (forge.isPro && forge.nextWorkoutName && forge.currentDayType) {
        scheduleForgeCoachNotification({
          nextWorkoutName: forge.nextWorkoutName,
          dayType: forge.currentDayType,
          recentRpe: selectedRpe,
        });
      }
    }
    // Reset to the Training tab root
    navigation.getParent()?.navigate('Training', { screen: 'TrainingMain' });
  };

  if (!workout) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const duration = workout.duration ?? 0;
  const uniqueExercises = new Set(workout.sets.map((s) => s.exerciseId)).size;

  return (
    <Gradient
      colors={['#0A0A0F', '#0F0F18', '#0A0A0F']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Gradient
                colors={['#CBFF00', '#9ECC00', '#DBFF4D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Icon name="barbell" size="xl" color="#0A0A0F" />
              </Gradient>

              <Text style={styles.title}>WORKOUT COMPLETE</Text>
              <Text style={styles.subtitle}>
                {workout.title || 'Workout'} {'\u00B7'} {formatDuration(duration)}
              </Text>

              <Gradient
                colors={['#CBFF00', '#DBFF4D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentBar}
              />
            </View>

            {/* Main Stats Card */}
            <View style={styles.glassCard}>
              <View style={styles.mainStats}>
                <View style={styles.mainStat}>
                  <Text style={styles.mainStatValue}>{formatDuration(duration)}</Text>
                  <Text style={styles.mainStatLabel}>Duration</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.mainStat}>
                  <Text style={styles.mainStatValue}>{formatVolume(workout.totalVolume)}</Text>
                  <Text style={styles.mainStatLabel}>Volume (lbs)</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.mainStat}>
                  <Text style={styles.mainStatValue}>{workout.totalSets}</Text>
                  <Text style={styles.mainStatLabel}>Sets</Text>
                </View>
              </View>

              {/* Secondary stats */}
              <View style={styles.secondaryStats}>
                <View style={styles.secondaryStat}>
                  <Text style={styles.secondaryValue}>{workout.totalReps}</Text>
                  <Text style={styles.secondaryLabel}>Total Reps</Text>
                </View>
                <View style={styles.secondaryStat}>
                  <Text style={styles.secondaryValue}>{uniqueExercises}</Text>
                  <Text style={styles.secondaryLabel}>Exercises</Text>
                </View>
                <View style={styles.secondaryStat}>
                  <Text style={styles.secondaryValue}>
                    {workout.totalReps > 0
                      ? Math.round(workout.totalVolume / workout.totalReps)
                      : 0}
                  </Text>
                  <Text style={styles.secondaryLabel}>Avg Weight</Text>
                </View>
              </View>
            </View>

            {/* PR Section */}
            {prs.length > 0 && (
              <View style={styles.prSection}>
                <View style={styles.prHeader}>
                  <Icon name="trophy" size="md" color="#CBFF00" />
                  <Text style={styles.prTitle}>Personal Records</Text>
                </View>
                {prs.map((pr, i) => (
                  <View key={i} style={styles.prRow}>
                    <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                    <View style={styles.prValues}>
                      <Text style={styles.prNew}>{pr.newE1RM} lbs</Text>
                      {pr.previousE1RM > 0 && (
                        <Text style={styles.prOld}>
                          +{pr.newE1RM - pr.previousE1RM} lbs
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
                {prSong && (
                  <View style={styles.prSoundtrackRow}>
                    <Icon name="music-note" size="sm" color="#CBFF00" />
                    <View style={styles.prSoundtrackText}>
                      <Text style={styles.prSoundtrackTitle} numberOfLines={1}>
                        {prSong.title}
                      </Text>
                      <Text style={styles.prSoundtrackArtist} numberOfLines={1}>
                        {prSong.artist} · playing at your gym
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        haptics.lightTap();
                        // Share the first PR moment with its song
                        const firstPr = prs[0];
                        if (!firstPr) return;
                        sharePrMoment({
                          id: '',
                          exerciseName: firstPr.exerciseName,
                          newE1RM: firstPr.newE1RM,
                          previousE1RM: firstPr.previousE1RM,
                          achievedAt: new Date().toISOString(),
                          song: prSong,
                          gymId: activeGymId ?? undefined,
                        }).catch(() => {});
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Share this PR moment"
                      accessibilityRole="button"
                    >
                      <Icon name="share" size="sm" color="#CBFF00" />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Exercise Breakdown */}
            {exerciseBreakdown.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.sectionTitle}>Exercise Breakdown</Text>
                {exerciseBreakdown.map((ex, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      <Text style={styles.breakdownName} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <Text style={styles.breakdownDetail}>
                        {ex.sets} sets {'\u00B7'} Best: {ex.bestSet}
                      </Text>
                    </View>
                    <Text style={styles.breakdownVolume}>
                      {formatVolume(ex.volume)} lbs
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* RPE Check-In (Forge sessions only) */}
            {isForgeSession && (
              <View style={styles.rpeSection}>
                <View style={styles.rpeHeader}>
                  <Icon name="flame" size="md" color={SIGNAL.forge} />
                  <Text style={styles.rpeTitle}>How hard was that?</Text>
                </View>
                <Text style={styles.rpeSubtitle}>
                  Rate your effort (RPE) — we'll adjust your next session's weights.
                </Text>
                <View style={styles.rpeDots}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                    const isSelected = selectedRpe === val;
                    const color = getRpeColor(val);
                    return (
                      <Pressable
                        key={val}
                        onPress={() => { haptics.lightTap(); setSelectedRpe(val); }}
                        style={[
                          styles.rpeDot,
                          { borderColor: color },
                          isSelected && { backgroundColor: color },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`RPE ${val}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text style={[styles.rpeDotText, { color: isSelected ? '#0A0A0F' : color }]}>
                          {val}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.rpeScale}>
                  <Text style={[styles.rpeScaleLabel, { color: '#34D399' }]}>Easy</Text>
                  <Text style={[styles.rpeScaleLabel, { color: '#F87171' }]}>Max</Text>
                </View>
              </View>
            )}

            {/* Done Button */}
            <View style={styles.actionsSection}>
              <AnimatedPressable onPress={handleDone} style={styles.doneButtonWrapper}>
                <Gradient
                  colors={['#CBFF00', '#4A7A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>SAVE & CLOSE</Text>
                </Gradient>
              </AnimatedPressable>
            </View>

            {/* Bottom bar */}
            <View style={styles.bottomSection}>
              <Text style={styles.bottomText}>WORKOUT SAVED</Text>
              <Gradient
                colors={['#DBFF4D', '#CBFF00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomBar}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <CelebrationOverlay
        visible={celebrationVisible}
        onDismiss={() => {
          setCelebrationVisible(false);
          if (prs.length > 0) setVictoryVisible(true);
        }}
      />
      {prs.length > 0 && (
        <PRVictoryOverlay
          moments={prs.map((pr, i) => ({
            id: `pr-victory-${i}`,
            exerciseName: pr.exerciseName,
            newE1RM: pr.newE1RM,
            previousE1RM: pr.previousE1RM,
            achievedAt: new Date().toISOString(),
            song: prSong ?? undefined,
            gymId: activeGymId ?? undefined,
          }))}
          visible={victoryVisible}
          onDismiss={() => setVictoryVisible(false)}
        />
      )}
    </Gradient>
  );
}

/** Helper to parse "135 x 8" => volume */
function parseSetVolume(setStr: string): number {
  const parts = setStr.split(' x ');
  if (parts.length !== 2) return 0;
  return (parseFloat(parts[0]) || 0) * (parseInt(parts[1], 10) || 0);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  errorText: {
    color: COLORS.dark.error,
    fontSize: TYPOGRAPHY.sizes.lg,
    marginBottom: SPACING.lg,
  },
  errorButton: {
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  errorButtonText: {
    color: COLORS.dark.textPrimary,
    ...TYPOGRAPHY.presets.bodyBold,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#CBFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: '#CBFF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  accentBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  glassCard: {
    backgroundColor: COLORS.dark.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.dark.glassBorder,
    marginBottom: SPACING.xl,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.base,
  },
  mainStat: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.xs,
  },
  mainStatLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.dark.borderStrong,
    marginHorizontal: SPACING.sm,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  secondaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  secondaryValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.dark.textPrimary,
    fontFamily: FONTS.mono,
    marginBottom: 2,
  },
  secondaryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prSection: {
    backgroundColor: 'rgba(203, 255, 0, 0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(203, 255, 0, 0.25)',
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  prTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#CBFF00',
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(203, 255, 0, 0.12)',
  },
  prExercise: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.dark.textPrimary,
    flex: 1,
  },
  prValues: {
    alignItems: 'flex-end',
  },
  prNew: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#CBFF00',
  },
  prOld: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.dark.success,
    marginTop: 2,
  },
  prSoundtrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(203, 255, 0, 0.15)',
    gap: SPACING.sm,
  },
  prSoundtrackText: {
    flex: 1,
  },
  prSoundtrackTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#CBFF00',
  },
  prSoundtrackArtist: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  breakdownSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.dark.textPrimary,
    marginBottom: 2,
  },
  breakdownDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.dark.textTertiary,
  },
  breakdownVolume: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.dark.textSecondary,
    fontFamily: FONTS.mono,
    marginLeft: SPACING.md,
  },
  actionsSection: {
    marginBottom: SPACING.xl,
  },
  doneButtonWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  doneButton: {
    borderRadius: RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#CBFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  doneText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomSection: {
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.dark.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  bottomBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
  },
  rpeSection: {
    backgroundColor: SIGNAL.forge + '12',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: SIGNAL.forge + '30',
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  rpeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rpeTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: SIGNAL.forge,
  },
  rpeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.dark.textSecondary,
    lineHeight: 18,
  },
  rpeDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: SPACING.xs,
  },
  rpeDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeDotText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rpeScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rpeScaleLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
