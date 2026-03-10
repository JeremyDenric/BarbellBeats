/**
 * ActiveWorkoutScreen
 * Full-screen workout execution with set tracking, rest timer, and progress
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Icon } from '../../components/Icon';
import {
  WorkoutHeader,
  ActiveExerciseCard,
  SetGrid,
  SetInputRow,
  RestTimerOverlay,
  WorkoutProgressBar,
} from '../../components/workout';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useElapsedTimer } from '../../hooks/useElapsedTimer';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import haptics from '../../utils/haptics';
import type { TrainingStackParamList } from '../../types';
import type { CreateSetRequest } from '../../../shared/src/types/workout';

type NavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'ActiveWorkout'>;

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const {
    activeWorkoutV2,
    addSetToExercise,
    setCurrentExerciseIndex,
    completeActiveWorkout,
    restTimerSeconds,
    stopRestTimer,
  } = useWorkout();

  const [showRestTimer, setShowRestTimer] = useState(false);
  const { formatted: elapsedTime } = useElapsedTimer(activeWorkoutV2?.startedAt ?? null);

  // Current exercise data
  const currentIndex = activeWorkoutV2?.currentExerciseIndex ?? 0;
  const exercises = activeWorkoutV2?.exercises ?? [];
  const currentExercise = exercises[currentIndex];
  const currentSetIndex = currentExercise?.completedSets.length ?? 0;

  // Progress calculation
  const { completedSets, totalSets } = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const ex of exercises) {
      completed += ex.completedSets.length;
      total += ex.plannedSets;
    }
    return { completedSets: completed, totalSets: total };
  }, [exercises]);

  // Show rest timer when countdown is active
  React.useEffect(() => {
    if (restTimerSeconds > 0) {
      setShowRestTimer(true);
    } else if (showRestTimer) {
      setShowRestTimer(false);
    }
  }, [restTimerSeconds]);

  // Pre-fill weight from previous set of same exercise
  const prefillWeight = useMemo(() => {
    if (!currentExercise) return undefined;
    const lastSet = currentExercise.completedSets[currentExercise.completedSets.length - 1];
    return lastSet?.weight ?? currentExercise.targetWeight;
  }, [currentExercise]);

  const handleCompleteSet = useCallback(
    async (weight: number, reps: number, rir: number | null) => {
      if (!currentExercise || !activeWorkoutV2) return;

      const setRequest: CreateSetRequest = {
        exerciseId: currentExercise.exerciseId,
        reps,
        weight,
        unit: 'lbs',
        rpe: rir != null ? 10 - rir : undefined,
        setType: 'working',
        restSeconds: currentExercise.restSeconds,
      };

      await addSetToExercise(currentExercise.exerciseId, setRequest);

      // Auto-advance to next exercise if all sets done
      const setsAfter = currentExercise.completedSets.length + 1;
      if (setsAfter >= currentExercise.plannedSets && currentIndex < exercises.length - 1) {
        // Don't auto-advance immediately; let rest timer finish first
      }
    },
    [currentExercise, activeWorkoutV2, addSetToExercise, currentIndex, exercises.length]
  );

  const handlePrevExercise = useCallback(async () => {
    if (currentIndex > 0) {
      haptics.selectionChanged();
      await setCurrentExerciseIndex(currentIndex - 1);
    }
  }, [currentIndex, setCurrentExerciseIndex]);

  const handleNextExercise = useCallback(async () => {
    if (currentIndex < exercises.length - 1) {
      haptics.selectionChanged();
      await setCurrentExerciseIndex(currentIndex + 1);
    }
  }, [currentIndex, exercises.length, setCurrentExerciseIndex]);

  const handleMinimize = useCallback(() => {
    Alert.alert(
      'Minimize Workout?',
      'Your workout will stay active. You can resume it from the Training tab.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Minimize',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

  const handleFinish = useCallback(() => {
    const incomplete = exercises.reduce(
      (count, ex) => count + Math.max(0, ex.plannedSets - ex.completedSets.length),
      0
    );

    const message = incomplete > 0
      ? `You have ${incomplete} incomplete set${incomplete > 1 ? 's' : ''}. Finish anyway?`
      : 'Great work! Save this workout?';

    Alert.alert('Finish Workout?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          haptics.success();
          await completeActiveWorkout();
          navigation.replace('WorkoutSummary', {
            workoutId: activeWorkoutV2?.id ?? '',
          });
        },
      },
    ]);
  }, [exercises, completeActiveWorkout, activeWorkoutV2, navigation]);

  const handleSkipRest = useCallback(() => {
    stopRestTimer();
    setShowRestTimer(false);
  }, [stopRestTimer]);

  // Next set preview for rest timer
  const nextSetPreview = useMemo(() => {
    if (!currentExercise) return undefined;
    const nextSetNum = currentSetIndex + 1;
    if (nextSetNum < currentExercise.plannedSets) {
      return `Set ${nextSetNum + 1} of ${currentExercise.plannedSets}`;
    }
    // Moving to next exercise
    const nextEx = exercises[currentIndex + 1];
    if (nextEx) {
      return `${nextEx.exercise.name} - Set 1`;
    }
    return 'Last set complete!';
  }, [currentExercise, currentSetIndex, currentIndex, exercises]);

  if (!activeWorkoutV2 || exercises.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No active workout found.
        </Text>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={[styles.emptyButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.emptyButtonText, { color: colors.textPrimary }]}>Go Back</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0A0A0F', '#0F0F18', '#0A0A0F'] as unknown as [string, string]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <WorkoutHeader
            workoutName={activeWorkoutV2.name}
            elapsedTime={elapsedTime}
            onMinimize={handleMinimize}
          />

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {currentExercise && (
              <>
                <ActiveExerciseCard
                  exercise={currentExercise}
                  exerciseIndex={currentIndex}
                  totalExercises={exercises.length}
                />
                <SetGrid
                  exercise={currentExercise}
                  currentSetIndex={currentSetIndex}
                />
                {currentSetIndex < currentExercise.plannedSets && (
                  <SetInputRow
                    targetWeight={prefillWeight}
                    targetReps={currentExercise.targetReps}
                    targetRir={currentExercise.targetRir}
                    setNumber={currentSetIndex + 1}
                    onComplete={handleCompleteSet}
                  />
                )}
              </>
            )}
          </ScrollView>

          <WorkoutProgressBar completedSets={completedSets} totalSets={totalSets} />

          {/* Bottom Navigation */}
          <View style={[styles.bottomNav, { borderTopColor: colors.border }]}>
            <AnimatedPressable
              onPress={handlePrevExercise}
              disabled={currentIndex === 0}
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Previous exercise"
            >
              <Icon name="caret-left" size="lg" color={currentIndex === 0 ? colors.textDisabled : colors.textPrimary} />
            </AnimatedPressable>

            <Text style={[styles.exerciseIndicator, { color: colors.textSecondary }]}>
              {currentIndex + 1} / {exercises.length}
            </Text>

            <AnimatedPressable
              onPress={handleNextExercise}
              disabled={currentIndex >= exercises.length - 1}
              style={[styles.navButton, currentIndex >= exercises.length - 1 && styles.navButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Next exercise"
            >
              <Icon name="caret-right" size="lg" color={currentIndex >= exercises.length - 1 ? colors.textDisabled : colors.textPrimary} />
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleFinish}
              style={[styles.finishButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Finish workout"
            >
              <Text style={styles.finishText}>Finish</Text>
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>

        <RestTimerOverlay
          visible={showRestTimer}
          seconds={restTimerSeconds}
          nextSetPreview={nextSetPreview}
          onSkip={handleSkipRest}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['2xl'],
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.md,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  exerciseIndicator: {
    ...TYPOGRAPHY.presets.bodyBold,
    flex: 1,
    textAlign: 'center',
  },
  finishButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  finishText: {
    color: '#0A0A0F',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  emptyButtonText: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
});
