/**
 * PlateCalculator
 * Calculate and display which plates to load on a barbell
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

interface PlateCalculatorProps {
  visible: boolean;
  weight: number;
  unit?: 'lbs' | 'kg';
  onClose: () => void;
}

interface PlateLoading {
  plates: Array<{ weight: number; count: number; color: string }>;
  totalPerSide: number;
  remainder: number;
}

// ============================================================================
// Constants
// ============================================================================

const BARBELL_WEIGHTS = {
  lbs: 45,
  kg: 20,
};

const AVAILABLE_PLATES = {
  lbs: [
    { weight: 45, color: '#FF4444' }, // Red
    { weight: 35, color: '#FFD700' }, // Yellow
    { weight: 25, color: '#4CAF50' }, // Green
    { weight: 10, color: '#FFFFFF' }, // White
    { weight: 5, color: '#2196F3' },  // Blue
    { weight: 2.5, color: '#9E9E9E' }, // Gray
  ],
  kg: [
    { weight: 25, color: '#FF4444' }, // Red
    { weight: 20, color: '#2196F3' }, // Blue
    { weight: 15, color: '#FFD700' }, // Yellow
    { weight: 10, color: '#4CAF50' }, // Green
    { weight: 5, color: '#FFFFFF' },  // White
    { weight: 2.5, color: '#FF69B4' }, // Pink
    { weight: 1.25, color: '#9E9E9E' }, // Gray
  ],
};

// ============================================================================
// Component
// ============================================================================

export function PlateCalculator({ visible, weight, unit = 'lbs', onClose }: PlateCalculatorProps) {
  // ============================================================================
  // Calculations
  // ============================================================================

  const plateLoading = useMemo((): PlateLoading => {
    const barWeight = BARBELL_WEIGHTS[unit];
    const weightPerSide = (weight - barWeight) / 2;

    if (weightPerSide <= 0) {
      return { plates: [], totalPerSide: 0, remainder: 0 };
    }

    const availablePlates = AVAILABLE_PLATES[unit];
    const plates: Array<{ weight: number; count: number; color: string }> = [];
    let remaining = weightPerSide;

    // Greedy algorithm: use largest plates first
    for (const plate of availablePlates) {
      const count = Math.floor(remaining / plate.weight);
      if (count > 0) {
        plates.push({
          weight: plate.weight,
          count,
          color: plate.color,
        });
        remaining -= count * plate.weight;
      }
    }

    // Round remainder to 2 decimal places
    remaining = Math.round(remaining * 100) / 100;

    return {
      plates,
      totalPerSide: weightPerSide,
      remainder: remaining,
    };
  }, [weight, unit]);

  const isValidWeight = weight >= BARBELL_WEIGHTS[unit];

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderBarbellVisualization = () => {
    if (!isValidWeight || plateLoading.plates.length === 0) {
      return (
        <View style={styles.emptyBarbell}>
          <View style={styles.barbellBar} />
          <View style={styles.barbellCollar} />
          <View style={styles.barbellCollar} />
        </View>
      );
    }

    return (
      <View style={styles.barbellContainer}>
        {/* Left side plates */}
        <View style={styles.plateSide}>
          {plateLoading.plates.map((plate, index) =>
            Array.from({ length: plate.count }).map((_, plateIndex) => (
              <View
                key={`left-${index}-${plateIndex}`}
                style={[
                  styles.plate,
                  {
                    backgroundColor: plate.color,
                    width: 12 + plate.weight / (unit === 'lbs' ? 5 : 2.5),
                    borderColor: plate.color === '#FFFFFF' ? COLORS.light.glassBorder : plate.color,
                  },
                ]}
              />
            ))
          )}
          <View style={styles.barbellCollar} />
        </View>

        {/* Barbell */}
        <View style={styles.barbellBar} />

        {/* Right side plates */}
        <View style={styles.plateSide}>
          <View style={styles.barbellCollar} />
          {plateLoading.plates.map((plate, index) =>
            Array.from({ length: plate.count }).map((_, plateIndex) => (
              <View
                key={`right-${index}-${plateIndex}`}
                style={[
                  styles.plate,
                  {
                    backgroundColor: plate.color,
                    width: 12 + plate.weight / (unit === 'lbs' ? 5 : 2.5),
                    borderColor: plate.color === '#FFFFFF' ? COLORS.light.glassBorder : plate.color,
                  },
                ]}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  const renderPlateList = () => {
    if (!isValidWeight) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Weight must be at least {BARBELL_WEIGHTS[unit]} {unit} (barbell weight)
          </Text>
        </View>
      );
    }

    if (plateLoading.plates.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Empty barbell ({BARBELL_WEIGHTS[unit]} {unit})</Text>
        </View>
      );
    }

    return (
      <View style={styles.plateListContainer}>
        <Text style={styles.plateListTitle}>Per Side</Text>
        {plateLoading.plates.map((plate, index) => (
          <View key={index} style={styles.plateListItem}>
            <View style={styles.plateListLeft}>
              <View
                style={[
                  styles.plateColorIndicator,
                  {
                    backgroundColor: plate.color,
                    borderColor:
                      plate.color === '#FFFFFF' ? COLORS.light.glassBorder : plate.color,
                  },
                ]}
              />
              <Text style={styles.plateWeight}>
                {plate.weight} {unit}
              </Text>
            </View>
            <Text style={styles.plateCount}>× {plate.count}</Text>
          </View>
        ))}

        {plateLoading.remainder > 0 && (
          <View style={styles.remainderContainer}>
            <Text style={styles.remainderLabel}>Cannot load:</Text>
            <Text style={styles.remainderValue}>
              {plateLoading.remainder} {unit} per side
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSummary = () => {
    const barWeight = BARBELL_WEIGHTS[unit];
    const totalPlateWeight = plateLoading.totalPerSide * 2;
    const loadedWeight = barWeight + totalPlateWeight;

    return (
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={[COLORS.light.primaryMuted, COLORS.light.glass]}
          style={styles.summaryGradient}
          shouldRasterizeIOS
        >
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Barbell</Text>
            <Text style={styles.summaryValue}>
              {barWeight} {unit}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plates (both sides)</Text>
            <Text style={styles.summaryValue}>
              {totalPlateWeight} {unit}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total Loaded</Text>
            <Text style={styles.summaryTotalValue}>
              {loadedWeight} {unit}
            </Text>
          </View>
          {plateLoading.remainder > 0 && (
            <Text style={styles.summaryWarning}>
              ⚠️ Missing {plateLoading.remainder * 2} {unit} total
            </Text>
          )}
        </LinearGradient>
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
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Plate Calculator</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.targetWeight}>
            <Text style={styles.targetWeightLabel}>Target Weight</Text>
            <Text style={styles.targetWeightValue}>
              {weight} {unit}
            </Text>
          </View>

          {renderBarbellVisualization()}
          {renderSummary()}
          {renderPlateList()}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.base,
  },
  targetWeight: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  targetWeightLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    marginBottom: 4,
  },
  targetWeightValue: {
    fontSize: 42,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.primary,
  },
  barbellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  emptyBarbell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  barbellBar: {
    height: 8,
    flex: 1,
    maxWidth: 120,
    backgroundColor: '#757575',
    borderRadius: RADIUS.sm,
  },
  plateSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  barbellCollar: {
    width: 8,
    height: 24,
    backgroundColor: '#424242',
    borderRadius: RADIUS.xs,
  },
  plate: {
    height: 48,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
  },
  summaryContainer: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  summaryGradient: {
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.textPrimary,
  },
  summaryTotal: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.glassBorder,
  },
  summaryTotalLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
  },
  summaryTotalValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.primary,
  },
  summaryWarning: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FF9800',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  plateListContainer: {
    backgroundColor: COLORS.light.glass,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  plateListTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  plateListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  plateListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  plateColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
  },
  plateWeight: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textPrimary,
  },
  plateCount: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.primary,
  },
  remainderContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainderLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FF9800',
  },
  remainderValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FF9800',
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
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
  },
});
