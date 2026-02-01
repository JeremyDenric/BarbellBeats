/**
 * ExerciseSelector Component
 *
 * Comprehensive exercise picker with search, filtering, and categorization.
 * iOS-native design with search bar, filter chips, and categorized lists.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { IOSCard, IOSGroupedList, IOSListRow, Badge, LoadingView, EmptyState } from '../UI';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, IOS_COLORS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import type { Exercise } from '../../../shared/src/types/workout';

// ============================================================================
// Types
// ============================================================================

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  selectedExerciseIds?: string[];
  exercises: Exercise[];
  isLoading?: boolean;
  showRecent?: boolean;
  showPopular?: boolean;
}

type ExerciseCategory = 'all' | 'compound' | 'isolation' | 'cardio';
type EquipmentType = 'all' | 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';
type MuscleGroup = 'all' | 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core';

// ============================================================================
// ExerciseSelector Component
// ============================================================================

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelectExercise,
  selectedExerciseIds = [],
  exercises,
  isLoading = false,
  showRecent = true,
  showPopular = true,
}) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup>('all');

  // Filter and search exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = exercise.name.toLowerCase().includes(query);
        const matchesMuscles = exercise.muscleGroups.some((m) =>
          m.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesMuscles) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && exercise.category !== selectedCategory) {
        return false;
      }

      // Equipment filter
      if (selectedEquipment !== 'all' && exercise.equipment !== selectedEquipment) {
        return false;
      }

      // Muscle group filter
      if (selectedMuscleGroup !== 'all') {
        if (!exercise.muscleGroups.includes(selectedMuscleGroup)) {
          return false;
        }
      }

      return true;
    });
  }, [exercises, searchQuery, selectedCategory, selectedEquipment, selectedMuscleGroup]);

  // Group exercises by primary muscle
  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};

    filteredExercises.forEach((exercise) => {
      const primaryMuscle = exercise.muscleGroups[0] || 'Other';
      if (!groups[primaryMuscle]) {
        groups[primaryMuscle] = [];
      }
      groups[primaryMuscle].push(exercise);
    });

    return groups;
  }, [filteredExercises]);

  // Recent exercises (mock - would come from workout history)
  const recentExercises = useMemo(() => {
    return exercises.slice(0, 5);
  }, [exercises]);

  // Popular exercises (mock - would come from usage stats)
  const popularExercises = useMemo(() => {
    return exercises.filter(e => e.category === 'compound').slice(0, 8);
  }, [exercises]);

  // Handle exercise selection
  const handleSelectExercise = useCallback((exercise: Exercise) => {
    onSelectExercise(exercise);
  }, [onSelectExercise]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedEquipment('all');
    setSelectedMuscleGroup('all');
  }, []);

  const hasActiveFilters = selectedCategory !== 'all' ||
                          selectedEquipment !== 'all' ||
                          selectedMuscleGroup !== 'all';

  // Loading state
  if (isLoading) {
    return <LoadingView message="Loading exercises..." />;
  }

  // Empty state
  if (exercises.length === 0) {
    return (
      <EmptyState
        title="No Exercises Found"
        message="Check your connection and try again."
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: iosColors.tertiarySystemGroupedBackground,
              borderColor: iosColors.separator,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[
              styles.searchInput,
              { color: iosColors.label },
            ]}
            placeholder="Search exercises..."
            placeholderTextColor={iosColors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
        style={styles.filterChipsScroll}
      >
        {/* Category Filter */}
        <FilterChip
          label="All Types"
          isSelected={selectedCategory === 'all'}
          onPress={() => setSelectedCategory('all')}
        />
        <FilterChip
          label="Compound"
          isSelected={selectedCategory === 'compound'}
          onPress={() => setSelectedCategory('compound')}
        />
        <FilterChip
          label="Isolation"
          isSelected={selectedCategory === 'isolation'}
          onPress={() => setSelectedCategory('isolation')}
        />
        <FilterChip
          label="Cardio"
          isSelected={selectedCategory === 'cardio'}
          onPress={() => setSelectedCategory('cardio')}
        />

        {/* Equipment Filter */}
        <FilterChip
          label="🏋️ Barbell"
          isSelected={selectedEquipment === 'barbell'}
          onPress={() => setSelectedEquipment('barbell')}
        />
        <FilterChip
          label="🔩 Dumbbell"
          isSelected={selectedEquipment === 'dumbbell'}
          onPress={() => setSelectedEquipment('dumbbell')}
        />
        <FilterChip
          label="🎯 Cable"
          isSelected={selectedEquipment === 'cable'}
          onPress={() => setSelectedEquipment('cable')}
        />
        <FilterChip
          label="🏃 Bodyweight"
          isSelected={selectedEquipment === 'bodyweight'}
          onPress={() => setSelectedEquipment('bodyweight')}
        />

        {hasActiveFilters && (
          <Pressable
            onPress={clearFilters}
            style={[
              styles.clearFiltersButton,
              { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }
            ]}
          >
            <Text style={[styles.clearFiltersText, { color: colors.error }]}>
              Clear Filters
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsText, { color: iosColors.secondaryLabel }]}>
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.exerciseList}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Exercises (only show when no filters/search active) */}
        {showRecent && !searchQuery && !hasActiveFilters && recentExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: iosColors.label }]}>
              Recently Used
            </Text>
            <IOSGroupedList>
              {recentExercises.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExerciseIds.includes(exercise.id)}
                  onPress={() => handleSelectExercise(exercise)}
                  showSeparator={index < recentExercises.length - 1}
                />
              ))}
            </IOSGroupedList>
          </View>
        )}

        {/* Popular Exercises (only show when no filters/search active) */}
        {showPopular && !searchQuery && !hasActiveFilters && popularExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: iosColors.label }]}>
              Popular
            </Text>
            <IOSGroupedList>
              {popularExercises.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExerciseIds.includes(exercise.id)}
                  onPress={() => handleSelectExercise(exercise)}
                  showSeparator={index < popularExercises.length - 1}
                />
              ))}
            </IOSGroupedList>
          </View>
        )}

        {/* Grouped Exercises */}
        {Object.entries(groupedExercises).map(([muscleGroup, groupExercises]) => (
          <View key={muscleGroup} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: iosColors.label }]}>
              {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
            </Text>
            <IOSGroupedList>
              {groupExercises.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExerciseIds.includes(exercise.id)}
                  onPress={() => handleSelectExercise(exercise)}
                  showSeparator={index < groupExercises.length - 1}
                />
              ))}
            </IOSGroupedList>
          </View>
        ))}

        {/* No Results */}
        {filteredExercises.length === 0 && (
          <View style={styles.noResults}>
            <Text style={[styles.noResultsText, { color: iosColors.secondaryLabel }]}>
              No exercises match your filters
            </Text>
            {hasActiveFilters && (
              <Pressable onPress={clearFilters} style={styles.clearFiltersButtonLarge}>
                <Text style={[styles.clearFiltersTextLarge, { color: colors.primary }]}>
                  Clear All Filters
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// ============================================================================
// FilterChip Component
// ============================================================================

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, isSelected, onPress }) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: isSelected
            ? colors.primary
            : iosColors.tertiarySystemGroupedBackground,
          borderColor: isSelected ? colors.primary : iosColors.separator,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color: isSelected ? '#FFFFFF' : iosColors.label,
            fontWeight: isSelected ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ============================================================================
// ExerciseRow Component
// ============================================================================

interface ExerciseRowProps {
  exercise: Exercise;
  isSelected: boolean;
  onPress: () => void;
  showSeparator: boolean;
}

const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  isSelected,
  onPress,
  showSeparator,
}) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  // Equipment icon
  const equipmentIcon = {
    barbell: '🏋️',
    dumbbell: '🔩',
    cable: '🎯',
    machine: '⚙️',
    bodyweight: '🏃',
  }[exercise.equipment] || '💪';

  return (
    <IOSListRow
      onPress={onPress}
      separator={showSeparator}
      separatorInset={60}
    >
      <View style={styles.exerciseRow}>
        {/* Icon */}
        <View
          style={[
            styles.exerciseIcon,
            {
              backgroundColor: isSelected
                ? colors.primary + '20'
                : iosColors.tertiarySystemGroupedBackground,
              borderColor: isSelected ? colors.primary : iosColors.separator,
            },
          ]}
        >
          <Text style={styles.exerciseIconText}>{equipmentIcon}</Text>
        </View>

        {/* Info */}
        <View style={styles.exerciseInfo}>
          <Text
            style={[
              styles.exerciseName,
              { color: iosColors.label },
              isSelected && { fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          <View style={styles.exerciseMeta}>
            <Badge
              label={exercise.category}
              variant="neutral"
              size="small"
            />
            <Text style={[styles.muscleDot, { color: iosColors.tertiaryLabel }]}>
              •
            </Text>
            <Text
              style={[styles.muscleText, { color: iosColors.secondaryLabel }]}
              numberOfLines={1}
            >
              {exercise.muscleGroups.slice(0, 2).join(', ')}
            </Text>
          </View>
        </View>

        {/* Selected indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    </IOSListRow>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Search
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    opacity: 0.5,
  },

  // Filter Chips
  filterChipsScroll: {
    flexGrow: 0,
  },
  filterChipsContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Results
  resultsHeader: {
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.xs,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Exercise List
  exerciseList: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: SPACING.md + 4,
    paddingBottom: SPACING.sm,
    ...TYPOGRAPHY.presets.heading2,
  },

  // Exercise Row
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIconText: {
    fontSize: 20,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
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
    flex: 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.md,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  clearFiltersButtonLarge: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  clearFiltersTextLarge: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Spacing
  bottomSpacer: {
    height: SPACING.xl * 2,
  },
});
