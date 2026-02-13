/**
 * ExerciseConfigModal
 * Modal for configuring exercise parameters (sets, reps, RIR, rest)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Icon } from '../Icon';
import RIRPicker from './RIRPicker';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme/tokens';
import { WorkoutExerciseConfig, SetType } from '../../services/workoutTemplateStorage';

interface ExerciseConfigModalProps {
  visible: boolean;
  exercise: WorkoutExerciseConfig | null;
  onSave: (config: WorkoutExerciseConfig) => void;
  onClose: () => void;
}

const SETS_OPTIONS = [1, 2, 3, 4, 5, 6];
const REPS_OPTIONS = [3, 5, 6, 8, 10, 12, 15, 20];
const REST_OPTIONS = [30, 60, 90, 120, 180, 240];

const SET_TYPE_OPTIONS: { value: SetType; label: string }[] = [
  { value: 'straight', label: 'Straight Sets' },
  { value: 'superset', label: 'Superset' },
  { value: 'dropset', label: 'Drop Set' },
];

export default function ExerciseConfigModal({
  visible,
  exercise,
  onSave,
  onClose,
}: ExerciseConfigModalProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  // Form state
  const [sets, setSets] = useState(3);
  const [repsMin, setRepsMin] = useState(8);
  const [repsMax, setRepsMax] = useState<number | undefined>(12);
  const [rir, setRir] = useState(2);
  const [restSeconds, setRestSeconds] = useState(90);
  const [setType, setSetType] = useState<SetType>('straight');
  const [useRepRange, setUseRepRange] = useState(true);

  // Initialize form when exercise changes
  useEffect(() => {
    if (exercise) {
      setSets(exercise.sets);
      setRepsMin(exercise.repsMin);
      setRepsMax(exercise.repsMax);
      setRir(exercise.rir);
      setRestSeconds(exercise.restSeconds);
      setSetType(exercise.setType);
      setUseRepRange(!!exercise.repsMax && exercise.repsMax !== exercise.repsMin);
    }
  }, [exercise]);

  const handleSave = () => {
    if (!exercise) return;

    const config: WorkoutExerciseConfig = {
      ...exercise,
      sets,
      repsMin,
      repsMax: useRepRange ? repsMax : undefined,
      rir,
      restSeconds,
      setType,
    };

    onSave(config);
  };

  const formatRest = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  if (!exercise) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {exercise.exercise.name}
          </Text>
          <Pressable onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.saveText, { color: colors.primary }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Sets */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sets</Text>
            <View style={styles.optionsRow}>
              {SETS_OPTIONS.map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.option,
                    {
                      backgroundColor: sets === num ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setSets(num)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: sets === num ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reps */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Reps</Text>
              <Pressable
                style={[styles.rangeToggle, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setUseRepRange(!useRepRange)}
              >
                <Text style={[styles.rangeToggleText, { color: colors.textSecondary }]}>
                  {useRepRange ? 'Range' : 'Fixed'}
                </Text>
                <Icon name="arrows-left-right" size="xs" color={colors.textTertiary} />
              </Pressable>
            </View>

            {useRepRange ? (
              <View style={styles.repRangeContainer}>
                <View style={styles.repColumn}>
                  <Text style={[styles.repLabel, { color: colors.textSecondary }]}>Min</Text>
                  <View style={styles.optionsRow}>
                    {REPS_OPTIONS.filter(r => r <= 12).map((num) => (
                      <Pressable
                        key={num}
                        style={[
                          styles.smallOption,
                          {
                            backgroundColor: repsMin === num ? colors.primary : colors.surfaceAlt,
                          },
                        ]}
                        onPress={() => {
                          setRepsMin(num);
                          if (repsMax && num > repsMax) setRepsMax(num + 4);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: repsMin === num ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {num}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.repColumn}>
                  <Text style={[styles.repLabel, { color: colors.textSecondary }]}>Max</Text>
                  <View style={styles.optionsRow}>
                    {REPS_OPTIONS.filter(r => r >= repsMin).map((num) => (
                      <Pressable
                        key={num}
                        style={[
                          styles.smallOption,
                          {
                            backgroundColor: repsMax === num ? colors.primary : colors.surfaceAlt,
                          },
                        ]}
                        onPress={() => setRepsMax(num)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: repsMax === num ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {num}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.optionsRow}>
                {REPS_OPTIONS.map((num) => (
                  <Pressable
                    key={num}
                    style={[
                      styles.option,
                      {
                        backgroundColor: repsMin === num ? colors.primary : colors.surfaceAlt,
                      },
                    ]}
                    onPress={() => {
                      setRepsMin(num);
                      setRepsMax(undefined);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: repsMin === num ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* RIR */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Reps In Reserve (RIR)
            </Text>
            <RIRPicker selected={rir} onSelect={setRir} />
          </View>

          {/* Rest Time */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Rest Time</Text>
            <View style={styles.optionsRow}>
              {REST_OPTIONS.map((seconds) => (
                <Pressable
                  key={seconds}
                  style={[
                    styles.restOption,
                    {
                      backgroundColor: restSeconds === seconds ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setRestSeconds(seconds)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: restSeconds === seconds ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {formatRest(seconds)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Set Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Set Type</Text>
            <View style={styles.setTypeRow}>
              {SET_TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.setTypeOption,
                    {
                      backgroundColor: setType === option.value ? colors.primary + '20' : colors.surfaceAlt,
                      borderColor: setType === option.value ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSetType(option.value)}
                >
                  <Text
                    style={[
                      styles.setTypeText,
                      { color: setType === option.value ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Exercise Info */}
          <View style={[styles.infoSection, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
              About This Exercise
            </Text>
            {exercise.exercise.description && (
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {exercise.exercise.description}
              </Text>
            )}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                Muscles:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
                {exercise.exercise.muscleGroups?.join(', ')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                Equipment:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
                {exercise.exercise.equipment}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    ...TYPOGRAPHY.presets.bodyBold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  cancelText: {
    ...TYPOGRAPHY.presets.body,
  },
  saveText: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  section: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  rangeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  rangeToggleText: {
    fontSize: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  option: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: 48,
    alignItems: 'center',
  },
  smallOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    minWidth: 40,
    alignItems: 'center',
  },
  restOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  optionText: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 14,
  },
  repRangeContainer: {
    gap: SPACING.md,
  },
  repColumn: {
    gap: SPACING.xs,
  },
  repLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  setTypeRow: {
    gap: SPACING.xs,
  },
  setTypeOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  setTypeText: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
  },
  infoSection: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
    marginBottom: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.presets.body,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
  },
});
