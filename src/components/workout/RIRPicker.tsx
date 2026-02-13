/**
 * RIRPicker
 * Visual selector for Reps In Reserve (RIR) with descriptions
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme/tokens';
import { RIR_DESCRIPTIONS } from '../../services/workoutTemplateStorage';

interface RIRPickerProps {
  selected: number;
  onSelect: (rir: number) => void;
}

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

export default function RIRPicker({ selected, onSelect }: RIRPickerProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const getColor = (rir: number) => {
    if (rir <= 1) return colors.error;
    if (rir <= 2) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      {RIR_OPTIONS.map((rir) => {
        const isSelected = selected === rir;
        const rirColor = getColor(rir);
        const info = RIR_DESCRIPTIONS[rir];

        return (
          <Pressable
            key={rir}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? rirColor + '20' : colors.surfaceAlt,
                borderColor: isSelected ? rirColor : 'transparent',
              },
            ]}
            onPress={() => onSelect(rir)}
          >
            <View style={styles.optionHeader}>
              <View
                style={[
                  styles.rirBadge,
                  { backgroundColor: isSelected ? rirColor : colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.rirValue,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {rir}
                </Text>
              </View>
              <Text
                style={[
                  styles.rirLabel,
                  { color: isSelected ? rirColor : colors.textSecondary },
                ]}
              >
                {info.label}
              </Text>
            </View>
            <Text
              style={[
                styles.description,
                { color: isSelected ? colors.textPrimary : colors.textTertiary },
              ]}
              numberOfLines={1}
            >
              {info.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  option: {
    flexDirection: 'column',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rirBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  rirLabel: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    marginLeft: 28 + SPACING.sm,
  },
});
