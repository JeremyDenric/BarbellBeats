/**
 * CategoryPicker
 * Visual selector for workout categories
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Icon, IconName } from '../Icon';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme/tokens';
import { WorkoutCategory, WORKOUT_CATEGORIES } from '../../services/workoutTemplateStorage';

interface CategoryPickerProps {
  selected: WorkoutCategory;
  onSelect: (category: WorkoutCategory) => void;
}

const CATEGORY_ORDER: WorkoutCategory[] = [
  'push',
  'pull',
  'legs',
  'upper',
  'lower',
  'full-body',
  'arms',
  'core',
  'custom',
];

export default function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORY_ORDER.map((categoryKey) => {
        const category = WORKOUT_CATEGORIES[categoryKey];
        const isSelected = selected === categoryKey;

        return (
          <Pressable
            key={categoryKey}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceAlt,
                borderColor: isSelected ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => onSelect(categoryKey)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? colors.primary + '30' : colors.surface },
              ]}
            >
              <Icon
                name={category.icon as IconName}
                size="md"
                color={isSelected ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.primary : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  option: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minWidth: 80,
    gap: SPACING.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
