/**
 * OneRepMaxCalculator
 * Calculate estimated 1RM using multiple formulas and show training percentages
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme/tokens';
import { epley, brzycki, lombardi } from '../utils/oneRepMax';

// ============================================================================
// Types
// ============================================================================

interface OneRepMaxCalculatorProps {
  visible: boolean;
  initialWeight?: number;
  initialReps?: number;
  unit?: 'lbs' | 'kg';
  onClose: () => void;
  onSave?: (oneRepMax: number) => void;
}

interface OneRepMaxEstimate {
  formula: string;
  value: number;
  description: string;
}

// ============================================================================
// Formulas (local aliases keep call-site names unchanged)
// ============================================================================

const calculateEpley = epley;
const calculateBrzycki = brzycki;
const calculateLombardi = lombardi;

const calculateMayhew = (weight: number, reps: number): number =>
  (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));

const calculateOConner = (weight: number, reps: number): number =>
  weight * (1 + reps / 40);

const calculateWathan = (weight: number, reps: number): number =>
  (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));

// ============================================================================
// Component
// ============================================================================

export function OneRepMaxCalculator({
  visible,
  initialWeight = 0,
  initialReps = 1,
  unit = 'lbs',
  onClose,
  onSave,
}: OneRepMaxCalculatorProps) {
  const [weight, setWeight] = useState(initialWeight.toString());
  const [reps, setReps] = useState(initialReps.toString());

  // ============================================================================
  // Calculations
  // ============================================================================

  const estimates = useMemo((): OneRepMaxEstimate[] => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 1;

    if (w <= 0 || r < 1 || r > 12) {
      return [];
    }

    if (r === 1) {
      // If reps is 1, the weight IS the 1RM
      return [
        {
          formula: 'Actual',
          value: w,
          description: 'This is your actual 1RM',
        },
      ];
    }

    return [
      {
        formula: 'Epley',
        value: calculateEpley(w, r),
        description: 'Most commonly used formula',
      },
      {
        formula: 'Brzycki',
        value: calculateBrzycki(w, r),
        description: 'Popular alternative formula',
      },
      {
        formula: 'Lombardi',
        value: calculateLombardi(w, r),
        description: 'Conservative estimate',
      },
      {
        formula: 'Mayhew',
        value: calculateMayhew(w, r),
        description: 'Research-based formula',
      },
      {
        formula: "O'Conner",
        value: calculateOConner(w, r),
        description: 'Higher estimate',
      },
      {
        formula: 'Wathan',
        value: calculateWathan(w, r),
        description: 'Alternative research-based',
      },
    ];
  }, [weight, reps]);

  const averageOneRM = useMemo(() => {
    if (estimates.length === 0) return 0;
    const sum = estimates.reduce((acc, est) => acc + est.value, 0);
    return sum / estimates.length;
  }, [estimates]);

  const isValid = estimates.length > 0;

  // ============================================================================
  // Training Percentages
  // ============================================================================

  const trainingPercentages = useMemo(() => {
    if (!isValid || averageOneRM === 0) return [];

    return [
      { percentage: 100, label: '1RM', reps: '1', description: 'Maximum' },
      { percentage: 95, label: '95%', reps: '2', description: 'Near max' },
      { percentage: 90, label: '90%', reps: '3-4', description: 'Strength' },
      { percentage: 85, label: '85%', reps: '5-6', description: 'Strength' },
      { percentage: 80, label: '80%', reps: '6-8', description: 'Strength' },
      { percentage: 75, label: '75%', reps: '8-10', description: 'Hypertrophy' },
      { percentage: 70, label: '70%', reps: '10-12', description: 'Hypertrophy' },
      { percentage: 65, label: '65%', reps: '12-15', description: 'Hypertrophy' },
      { percentage: 60, label: '60%', reps: '15+', description: 'Endurance' },
    ];
  }, [isValid, averageOneRM]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSave = () => {
    if (onSave && isValid) {
      onSave(Math.round(averageOneRM));
    }
    onClose();
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderInputs = () => (
    <View style={styles.inputsContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weight</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={COLORS.light.textTertiary}
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Reps</Text>
        <TextInput
          style={styles.input}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={COLORS.light.textTertiary}
        />
      </View>
    </View>
  );

  const renderEstimates = () => {
    if (!isValid) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {parseInt(reps, 10) > 12
              ? '1RM calculations are less accurate above 12 reps'
              : 'Enter weight and reps (1-12) to calculate 1RM'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.estimatesContainer}>
        <View style={styles.averageCard}>
          <LinearGradient
            colors={[COLORS.light.primary, COLORS.light.accent]}
            style={styles.averageGradient}
            shouldRasterizeIOS
          >
            <Text style={styles.averageLabel}>Estimated 1RM</Text>
            <Text style={styles.averageValue}>
              {Math.round(averageOneRM)} {unit}
            </Text>
            <Text style={styles.averageSubtext}>Average of {estimates.length} formulas</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Individual Estimates</Text>
        {estimates.map((estimate, index) => (
          <View key={index} style={styles.estimateCard}>
            <View style={styles.estimateHeader}>
              <Text style={styles.estimateFormula}>{estimate.formula}</Text>
              <Text style={styles.estimateValue}>
                {Math.round(estimate.value)} {unit}
              </Text>
            </View>
            <Text style={styles.estimateDescription}>{estimate.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTrainingPercentages = () => {
    if (!isValid || trainingPercentages.length === 0) return null;

    return (
      <View style={styles.percentagesContainer}>
        <Text style={styles.sectionTitle}>Training Percentages</Text>
        <Text style={styles.sectionSubtext}>
          Recommended weights for different training goals
        </Text>

        {trainingPercentages.map((item, index) => {
          const weight = Math.round((averageOneRM * item.percentage) / 100);

          return (
            <View key={index} style={styles.percentageCard}>
              <View style={styles.percentageLeft}>
                <Text style={styles.percentageLabel}>{item.label}</Text>
                <Text style={styles.percentageDescription}>
                  {item.reps} reps · {item.description}
                </Text>
              </View>
              <Text style={styles.percentageValue}>
                {weight} {unit}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>1RM Calculator</Text>
          {onSave && isValid ? (
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderInputs()}
          {renderEstimates()}
          {renderTrainingPercentages()}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ About 1RM Calculations</Text>
            <Text style={styles.infoText}>
              One Rep Max (1RM) is the maximum weight you can lift for one repetition.
              These formulas estimate your 1RM based on submaximal lifts. For best
              accuracy, use weights lifted for 3-10 reps with good form.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.glassBorder,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
  },
  saveButton: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.base,
  },
  inputsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.light.glass,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  estimatesContainer: {
    marginBottom: SPACING.lg,
  },
  averageCard: {
    marginBottom: SPACING.base,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  averageGradient: {
    padding: SPACING.base,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  averageLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.weights.black,
    color: '#FFFFFF',
    lineHeight: 56,
  },
  averageSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.sm,
  },
  estimateCard: {
    padding: SPACING.sm,
    backgroundColor: COLORS.light.glass,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  estimateFormula: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
  },
  estimateValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.primary,
  },
  estimateDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
  },
  percentagesContainer: {
    marginBottom: SPACING.lg,
  },
  percentageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.light.glass,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  percentageLeft: {
    flex: 1,
  },
  percentageLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    marginBottom: 2,
  },
  percentageDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
  },
  percentageValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.primary,
  },
  infoCard: {
    padding: SPACING.base,
    backgroundColor: COLORS.light.primaryMuted,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.base,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
  },
});
