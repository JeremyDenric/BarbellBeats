/**
 * SetInputRow
 * Quick input for weight, reps, and RIR with "Complete Set" button
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from '../AnimatedPressable';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, GRADIENTS } from '../../theme/tokens';
import { useThemeMode } from '../../contexts/ThemeContext';
import haptics from '../../utils/haptics';

interface SetInputRowProps {
  targetWeight?: number;
  targetReps?: number;
  targetRir?: number;
  setNumber: number;
  onComplete: (weight: number, reps: number, rir: number | null) => void;
}

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

export function SetInputRow({ targetWeight, targetReps, targetRir, setNumber, onComplete }: SetInputRowProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [weight, setWeight] = useState(targetWeight?.toString() || '');
  const [reps, setReps] = useState(targetReps?.toString() || '');
  const [rir, setRir] = useState<number | null>(targetRir ?? null);

  // Update pre-fills when targets change (e.g. switching exercises)
  useEffect(() => {
    setWeight(targetWeight?.toString() || '');
    setReps(targetReps?.toString() || '');
    setRir(targetRir ?? null);
  }, [targetWeight, targetReps, targetRir]);

  const handleComplete = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;
    if (r === 0) {
      haptics.error();
      return;
    }
    haptics.success();
    onComplete(w, r, rir);
  };

  const handleRirSelect = (value: number) => {
    haptics.selectionChanged();
    setRir(value === rir ? null : value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.setLabel, { color: colors.textTertiary }]}>SET {setNumber}</Text>
      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>Weight</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }]}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
            selectTextOnFocus
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>Reps</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }]}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
            selectTextOnFocus
          />
        </View>
      </View>
      <View style={styles.rirRow}>
        <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>RIR</Text>
        <View style={styles.rirOptions}>
          {RIR_OPTIONS.map((value) => (
            <Pressable
              key={value}
              onPress={() => handleRirSelect(value)}
              style={[
                styles.rirChip,
                {
                  backgroundColor: rir === value ? colors.primary : colors.surfaceAlt,
                  borderColor: rir === value ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`RIR ${value}`}
              accessibilityState={{ selected: rir === value }}
            >
              <Text
                style={[
                  styles.rirText,
                  { color: rir === value ? '#0A0A0F' : colors.textSecondary },
                ]}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <AnimatedPressable
        onPress={handleComplete}
        accessibilityRole="button"
        accessibilityLabel="Complete set"
        style={styles.completeButton}
      >
        <LinearGradient
          colors={GRADIENTS.primary as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeGradient}
        >
          <Text style={styles.completeText}>Complete Set</Text>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
  },
  setLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
  },
  rirRow: {
    marginBottom: SPACING.md,
  },
  rirOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  rirChip: {
    flex: 1,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  completeButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  completeGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  completeText: {
    color: '#0A0A0F',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

export default SetInputRow;
