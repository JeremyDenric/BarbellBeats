/**
 * WorkoutLogger Component
 *
 * Active workout session logging interface with set entry, rest timer,
 * plate calculator, and real-time metrics tracking.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import {
  Button,
  IOSCard,
  IOSGroupedList,
  IOSListRow,
  Badge,
  GlassCard,
  SectionHeader,
} from '../UI';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useWorkout } from '../../contexts/WorkoutContext';
import { COLORS, IOS_COLORS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import type { Exercise, CreateSetRequest } from '../../../shared/src/types/workout';

// ============================================================================
// Types
// ============================================================================

interface WorkoutLoggerProps {
  exercise: Exercise;
  onFinishExercise?: () => void;
  onChangeExercise?: () => void;
}

type SetType = 'warmup' | 'working' | 'drop' | 'rest-pause' | 'amrap';
type WeightUnit = 'lbs' | 'kg';

const REP_QUALITY_GUIDE = [
  { score: 1, label: 'Breakdown', guidance: 'Form breaks early. Cut load 10-15%.' },
  { score: 2, label: 'Shaky', guidance: 'Noticeable form drift. Hold load and clean up.' },
  { score: 3, label: 'Solid', guidance: 'Acceptable reps. Repeat load and add reps.' },
  { score: 4, label: 'Strong', guidance: 'Clean reps. Add 2.5-5 next time.' },
  { score: 5, label: 'Crisp', guidance: 'Fast and stable. Progress weight or difficulty.' },
];

const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

const SET_TYPE_OPTIONS: Array<{ value: SetType; label: string; icon: string }> = [
  { value: 'warmup', label: 'Warmup', icon: '🔥' },
  { value: 'working', label: 'Working', icon: '💪' },
  { value: 'drop', label: 'Drop', icon: '⬇️' },
  { value: 'rest-pause', label: 'Rest-Pause', icon: '⏸️' },
  { value: 'amrap', label: 'AMRAP', icon: '🔄' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function calculatePlates(totalWeight: number, barWeight: number, plates: number[]) {
  const load = totalWeight - barWeight;
  if (load < 0) {
    return { error: 'Target is below the bar weight.', perSide: 0, remaining: 0, list: [] };
  }
  const perSide = load / 2;
  let remaining = perSide;
  const list: Array<{ plate: number; count: number }> = [];

  plates.forEach((plate) => {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      list.push({ plate, count });
      remaining = Number((remaining - plate * count).toFixed(2));
    }
  });

  return { error: '', perSide, remaining, list };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// WorkoutLogger Component
// ============================================================================

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  exercise,
  onFinishExercise,
  onChangeExercise,
}) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  const {
    activeWorkout,
    addSet,
    updateSet,
    deleteSet,
    restTimerSeconds,
    startRestTimer,
    stopRestTimer,
  } = useWorkout();

  // Set input state
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('lbs');
  const [setType, setSetType] = useState<SetType>('working');
  const [repQuality, setRepQuality] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Workout time elapsed
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000
      );
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Filter sets for current exercise
  const exerciseSets = useMemo(() => {
    if (!activeWorkout) return [];
    return activeWorkout.sets.filter(s => s.exerciseId === exercise.id);
  }, [activeWorkout, exercise.id]);

  // Calculate workout metrics
  const workoutMetrics = useMemo(() => {
    if (!activeWorkout) {
      return { totalVolume: 0, totalSets: 0, totalReps: 0 };
    }

    const totalVolume = activeWorkout.sets.reduce(
      (sum, set) => sum + set.weight * set.reps,
      0
    );
    const totalSets = activeWorkout.sets.length;
    const totalReps = activeWorkout.sets.reduce((sum, set) => sum + set.reps, 0);

    return { totalVolume, totalSets, totalReps };
  }, [activeWorkout]);

  // Plate calculator
  const barWeight = unit === 'lbs' ? 45 : 20;
  const plateResult = useMemo(() => {
    const weightValue = Number(weight);
    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      return null;
    }
    const plates = unit === 'lbs' ? PLATES_LB : PLATES_KG;
    return calculatePlates(weightValue, barWeight, plates);
  }, [weight, barWeight, unit]);

  // Handle add set
  const handleAddSet = useCallback(async () => {
    const repsValue = Number(reps);
    const weightValue = Number(weight);

    if (!Number.isFinite(repsValue) || !Number.isFinite(weightValue) || repsValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid reps and weight.');
      return;
    }

    const setData: CreateSetRequest = {
      exerciseId: exercise.id,
      reps: repsValue,
      weight: weightValue,
      unit,
      setType,
      repQuality: repQuality ?? undefined,
      rpe: rpe ?? undefined,
      notes: notes.trim() || undefined,
      restSeconds: setType === 'working' ? 90 : undefined, // Auto rest for working sets
    };

    try {
      await addSet(setData);

      // Clear form (keep weight and unit for next set)
      setReps('');
      setNotes('');
      setRepQuality(null);
      setRpe(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add set. Please try again.');
    }
  }, [reps, weight, unit, setType, repQuality, rpe, notes, exercise.id, addSet]);

  // Handle delete set
  const handleDeleteSet = useCallback(async (setId: string) => {
    Alert.alert(
      'Delete Set',
      'Are you sure you want to delete this set?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSet(setId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete set.');
            }
          },
        },
      ]
    );
  }, [deleteSet]);

  // Prefill from last set
  const prefillFromLastSet = useCallback(() => {
    if (exerciseSets.length === 0) return;

    const lastSet = exerciseSets[exerciseSets.length - 1];
    setWeight(lastSet.weight.toString());
    setReps(lastSet.reps.toString());
    setUnit(lastSet.unit);
    setSetType(lastSet.setType);
  }, [exerciseSets]);

  if (!activeWorkout) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: iosColors.secondaryLabel }]}>
          No active workout
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Workout Header - Metrics */}
      <GlassCard style={styles.metricsCard} variant="prominent">
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>
              {formatTime(elapsedTime)}
            </Text>
            <Text style={[styles.metricLabel, { color: iosColors.secondaryLabel }]}>
              Time
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>
              {workoutMetrics.totalVolume.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: iosColors.secondaryLabel }]}>
              Volume ({unit})
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>
              {workoutMetrics.totalSets}
            </Text>
            <Text style={[styles.metricLabel, { color: iosColors.secondaryLabel }]}>
              Sets
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Rest Timer */}
      {restTimerSeconds > 0 && (
        <GlassCard style={styles.restTimerCard}>
          <View style={styles.restTimerContent}>
            <Text style={[styles.restTimerLabel, { color: iosColors.label }]}>
              Rest Timer
            </Text>
            <Text style={[styles.restTimerValue, { color: colors.primary }]}>
              {formatTime(restTimerSeconds)}
            </Text>
            <Button
              title="Skip Rest"
              variant="outline"
              size="small"
              onPress={stopRestTimer}
            />
          </View>
        </GlassCard>
      )}

      {/* Current Exercise */}
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: iosColors.label }]}>
            {exercise.name}
          </Text>
          <View style={styles.exerciseMeta}>
            <Badge label={exercise.category} variant="neutral" size="small" />
            <Text style={[styles.muscleDot, { color: iosColors.tertiaryLabel }]}>•</Text>
            <Text style={[styles.muscleText, { color: iosColors.secondaryLabel }]}>
              {exercise.muscleGroups.slice(0, 2).join(', ')}
            </Text>
          </View>
        </View>
        {onChangeExercise && (
          <Button
            title="Change"
            variant="outline"
            size="small"
            onPress={onChangeExercise}
          />
        )}
      </View>

      {/* Set Entry Form */}
      <IOSCard style={styles.formCard}>
        <SectionHeader title="Log Set" style={styles.formHeader} />

        {/* Reps & Weight */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: iosColors.secondaryLabel }]}>
              Reps
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: iosColors.tertiarySystemGroupedBackground,
                  color: iosColors.label,
                },
              ]}
              placeholder="0"
              placeholderTextColor={iosColors.placeholderText}
              keyboardType="numeric"
              value={reps}
              onChangeText={setReps}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: iosColors.secondaryLabel }]}>
              Weight
            </Text>
            <View style={styles.weightInputRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.weightInput,
                  {
                    backgroundColor: iosColors.tertiarySystemGroupedBackground,
                    color: iosColors.label,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={iosColors.placeholderText}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
              <View style={styles.unitToggle}>
                <Pressable
                  onPress={() => setUnit('lbs')}
                  style={[
                    styles.unitButton,
                    {
                      backgroundColor: unit === 'lbs'
                        ? colors.primary
                        : iosColors.tertiarySystemGroupedBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      { color: unit === 'lbs' ? '#FFFFFF' : iosColors.label },
                    ]}
                  >
                    lbs
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setUnit('kg')}
                  style={[
                    styles.unitButton,
                    {
                      backgroundColor: unit === 'kg'
                        ? colors.primary
                        : iosColors.tertiarySystemGroupedBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      { color: unit === 'kg' ? '#FFFFFF' : iosColors.label },
                    ]}
                  >
                    kg
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Set Type */}
        <View style={styles.setTypeSection}>
          <Text style={[styles.inputLabel, { color: iosColors.secondaryLabel }]}>
            Set Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.setTypeRow}>
              {SET_TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSetType(option.value)}
                  style={[
                    styles.setTypeChip,
                    {
                      backgroundColor: setType === option.value
                        ? colors.primary + '20'
                        : iosColors.tertiarySystemGroupedBackground,
                      borderColor: setType === option.value
                        ? colors.primary
                        : iosColors.separator,
                    },
                  ]}
                >
                  <Text style={styles.setTypeIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.setTypeLabel,
                      {
                        color: setType === option.value
                          ? colors.primary
                          : iosColors.label,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Rep Quality */}
        <View style={styles.qualitySection}>
          <Text style={[styles.inputLabel, { color: iosColors.secondaryLabel }]}>
            Rep Quality (1-5)
          </Text>
          <View style={styles.qualityRow}>
            {REP_QUALITY_GUIDE.map((item) => (
              <Pressable
                key={item.score}
                onPress={() => setRepQuality(item.score)}
                style={[
                  styles.qualityButton,
                  {
                    borderColor: repQuality === item.score
                      ? colors.primary
                      : iosColors.separator,
                    backgroundColor: repQuality === item.score
                      ? colors.primary + '20'
                      : iosColors.tertiarySystemGroupedBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.qualityButtonText,
                    { color: iosColors.label },
                  ]}
                >
                  {item.score}
                </Text>
              </Pressable>
            ))}
          </View>
          {repQuality && (
            <Text style={[styles.qualityHint, { color: iosColors.secondaryLabel }]}>
              {REP_QUALITY_GUIDE.find(g => g.score === repQuality)?.guidance}
            </Text>
          )}
        </View>

        {/* Advanced Options Toggle */}
        <Pressable
          onPress={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggle}
        >
          <Text style={[styles.advancedToggleText, { color: colors.primary }]}>
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </Text>
        </Pressable>

        {showAdvanced && (
          <>
            {/* RPE */}
            <View style={styles.rpeSection}>
              <Text style={[styles.inputLabel, { color: iosColors.secondaryLabel }]}>
                RPE (1-10)
              </Text>
              <View style={styles.rpeRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setRpe(value)}
                    style={[
                      styles.rpeButton,
                      {
                        borderColor: rpe === value
                          ? colors.primary
                          : iosColors.separator,
                        backgroundColor: rpe === value
                          ? colors.primary + '20'
                          : iosColors.tertiarySystemGroupedBackground,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rpeButtonText,
                        { color: iosColors.label },
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={[styles.inputLabel, { color: iosColors.secondaryLabel }]}>
                Notes
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: iosColors.tertiarySystemGroupedBackground,
                    color: iosColors.label,
                  },
                ]}
                placeholder="Optional notes..."
                placeholderTextColor={iosColors.placeholderText}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {exerciseSets.length > 0 && (
            <Button
              title="Repeat Last"
              variant="outline"
              onPress={prefillFromLastSet}
            />
          )}
          <Button
            title="Add Set"
            onPress={handleAddSet}
            disabled={!reps || !weight}
          />
        </View>

        {/* Plate Calculator Toggle */}
        <Pressable
          onPress={() => setShowPlateCalculator(!showPlateCalculator)}
          style={styles.plateToggle}
        >
          <Text style={[styles.plateToggleText, { color: colors.primary }]}>
            {showPlateCalculator ? '▼' : '▶'} Plate Calculator
          </Text>
        </Pressable>

        {showPlateCalculator && plateResult && (
          <View style={[styles.plateResult, { backgroundColor: iosColors.tertiarySystemGroupedBackground }]}>
            {plateResult.error ? (
              <Text style={[styles.plateError, { color: colors.error }]}>
                {plateResult.error}
              </Text>
            ) : (
              <>
                <Text style={[styles.plateText, { color: iosColors.label }]}>
                  Per side: {plateResult.perSide.toFixed(2)} {unit}
                </Text>
                <Text style={[styles.plateDetail, { color: iosColors.secondaryLabel }]}>
                  {plateResult.list.length > 0
                    ? plateResult.list.map(p => `${p.plate} x${p.count}`).join(', ')
                    : 'No plates needed'}
                </Text>
                {plateResult.remaining > 0 && (
                  <Text style={[styles.plateRemainder, { color: iosColors.tertiaryLabel }]}>
                    Remainder: {plateResult.remaining.toFixed(2)} {unit}
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      </IOSCard>

      {/* Set History */}
      {exerciseSets.length > 0 && (
        <View style={styles.historySection}>
          <SectionHeader
            title={`Sets (${exerciseSets.length})`}
            style={styles.historyHeader}
          />
          <IOSGroupedList>
            {exerciseSets.map((set, index) => (
              <IOSListRow
                key={set.id}
                separator={index < exerciseSets.length - 1}
                separatorInset={16}
              >
                <View style={styles.setRow}>
                  <View style={styles.setNumber}>
                    <Text style={[styles.setNumberText, { color: iosColors.label }]}>
                      {set.setNumber}
                    </Text>
                  </View>
                  <View style={styles.setInfo}>
                    <Text style={[styles.setText, { color: iosColors.label }]}>
                      {set.reps} reps × {set.weight} {set.unit}
                    </Text>
                    <View style={styles.setMeta}>
                      <Badge label={set.setType} variant="neutral" size="small" />
                      {set.repQuality && (
                        <>
                          <Text style={[styles.setMetaDot, { color: iosColors.tertiaryLabel }]}>
                            •
                          </Text>
                          <Text style={[styles.setMetaText, { color: iosColors.secondaryLabel }]}>
                            Quality: {set.repQuality}/5
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteSet(set.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </Pressable>
                </View>
              </IOSListRow>
            ))}
          </IOSGroupedList>
        </View>
      )}

      {/* Finish Exercise Button */}
      {onFinishExercise && exerciseSets.length > 0 && (
        <View style={styles.finishSection}>
          <Button
            title="Finish Exercise"
            variant="prominent"
            fullWidth
            onPress={onFinishExercise}
          />
        </View>
      )}

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Metrics
  metricsCard: {
    padding: SPACING.md,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    ...TYPOGRAPHY.presets.heading2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },

  // Rest Timer
  restTimerCard: {
    padding: SPACING.md,
  },
  restTimerContent: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  restTimerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  restTimerValue: {
    fontSize: 48,
    fontWeight: '700',
    ...TYPOGRAPHY.presets.heading1,
  },

  // Exercise Header
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700',
    ...TYPOGRAPHY.presets.heading3,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muscleDot: {
    fontSize: 12,
  },
  muscleText: {
    fontSize: 13,
    fontWeight: '400',
  },

  // Form
  formCard: {
    padding: SPACING.md,
  },
  formHeader: {
    marginBottom: SPACING.sm,
    paddingHorizontal: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  weightInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Set Type
  setTypeSection: {
    gap: 6,
    marginTop: SPACING.sm,
  },
  setTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  setTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  setTypeIcon: {
    fontSize: 16,
  },
  setTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Rep Quality
  qualitySection: {
    gap: 6,
    marginTop: SPACING.sm,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  qualityHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Advanced Options
  advancedToggle: {
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rpeSection: {
    gap: 6,
    marginTop: SPACING.sm,
  },
  rpeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rpeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesSection: {
    gap: 6,
    marginTop: SPACING.sm,
  },
  textArea: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },

  // Plate Calculator
  plateToggle: {
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  plateToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  plateResult: {
    borderRadius: 10,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    gap: 4,
  },
  plateError: {
    fontSize: 14,
    fontWeight: '500',
  },
  plateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  plateDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  plateRemainder: {
    fontSize: 12,
  },

  // Set History
  historySection: {
    marginTop: SPACING.md,
  },
  historyHeader: {
    paddingHorizontal: 0,
    marginBottom: SPACING.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  setInfo: {
    flex: 1,
    gap: 4,
  },
  setText: {
    fontSize: 15,
    fontWeight: '600',
  },
  setMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setMetaDot: {
    fontSize: 12,
  },
  setMetaText: {
    fontSize: 12,
    fontWeight: '400',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },

  // Finish Exercise
  finishSection: {
    marginTop: SPACING.md,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: SPACING.xl * 2,
  },
});
