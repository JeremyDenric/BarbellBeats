/**
 * ExerciseBrowserScreen
 * Screen for browsing and selecting exercises by muscle group
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../../contexts/ThemeContext';
import { GlassCard } from '../../components/UI';
import ScreenChrome from '../../components/ScreenChrome';
import { Icon, IconName } from '../../components/Icon';
import ExerciseConfigModal from '../../components/workout/ExerciseConfigModal';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, LAYOUT } from '../../theme/tokens';
import type { TrainingStackParamList } from '../../types';
import { SEED_EXERCISES } from '../../data/exerciseSeedData';
import { WorkoutExerciseConfig } from '../../services/workoutTemplateStorage';
import type { EnhancedExercise } from '../../../shared/src/types/workout';

type NavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'ExerciseBrowser'>;

// Muscle group categories for tabs
const MUSCLE_GROUPS = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'chest', label: 'Chest', icon: 'barbell' },
  { key: 'back', label: 'Back', icon: 'arrows-in' },
  { key: 'shoulders', label: 'Shoulders', icon: 'user' },
  { key: 'legs', label: 'Legs', icon: 'person-simple-walk' },
  { key: 'arms', label: 'Arms', icon: 'hand-fist' },
  { key: 'core', label: 'Core', icon: 'circle-wavy' },
] as const;

// Equipment filter options
const EQUIPMENT_FILTERS = [
  { key: 'all', label: 'All Equipment' },
  { key: 'Barbell', label: 'Barbell' },
  { key: 'Dumbbell', label: 'Dumbbell' },
  { key: 'Machine', label: 'Machine' },
  { key: 'Cable', label: 'Cable' },
  { key: 'Bodyweight', label: 'Bodyweight' },
] as const;

export default function ExerciseBrowserScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<EnhancedExercise | null>(null);

  // Filter exercises based on search, muscle group, and equipment
  const filteredExercises = useMemo(() => {
    return SEED_EXERCISES.filter((exercise) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = exercise.name.toLowerCase().includes(query);
        const aliasMatch = exercise.aliases?.some(a => a.toLowerCase().includes(query));
        if (!nameMatch && !aliasMatch) return false;
      }

      // Muscle group filter
      if (selectedGroup !== 'all') {
        const groupLower = selectedGroup.toLowerCase();
        const muscleMatch = exercise.muscleGroups?.some(
          m => m.toLowerCase().includes(groupLower)
        );
        const primaryMatch = exercise.primaryMuscles?.some(
          m => m.toLowerCase().includes(groupLower)
        );
        if (!muscleMatch && !primaryMatch) return false;
      }

      // Equipment filter
      if (selectedEquipment !== 'all') {
        if (exercise.equipment !== selectedEquipment) return false;
      }

      return true;
    });
  }, [searchQuery, selectedGroup, selectedEquipment]);

  // Group exercises by primary muscle for section list
  const groupedExercises = useMemo(() => {
    const groups: Record<string, EnhancedExercise[]> = {};

    filteredExercises.forEach((exercise) => {
      const primaryMuscle = exercise.primaryMuscles?.[0] || exercise.muscleGroups?.[0] || 'Other';
      if (!groups[primaryMuscle]) {
        groups[primaryMuscle] = [];
      }
      groups[primaryMuscle].push(exercise);
    });

    return Object.entries(groups)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredExercises]);

  const handleSelectExercise = (exercise: EnhancedExercise) => {
    setSelectedExercise(exercise);
    setConfigModalVisible(true);
  };

  const handleSaveExercise = (config: WorkoutExerciseConfig) => {
    // Navigate back to CreateWorkout with the selected exercise config
    // For now, we just go back - the CreateWorkout screen will need to handle this
    setConfigModalVisible(false);
    setSelectedExercise(null);
    navigation.goBack();
  };

  const renderExerciseItem = ({ item }: { item: EnhancedExercise }) => (
    <Pressable
      style={[styles.exerciseItem, { backgroundColor: colors.surfaceAlt }]}
      onPress={() => handleSelectExercise(item)}
    >
      <View style={[styles.exerciseIcon, { backgroundColor: colors.primary + '20' }]}>
        <Icon
          name={item.category === 'compound' ? 'barbell' : 'target'}
          size="md"
          color={colors.primary}
        />
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
          {item.name}
        </Text>
        <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.equipment} • {item.muscleGroups?.join(', ')}
        </Text>
        <View style={styles.difficultyRow}>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  item.difficulty === 'beginner'
                    ? colors.success + '20'
                    : item.difficulty === 'intermediate'
                    ? colors.warning + '20'
                    : colors.error + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                {
                  color:
                    item.difficulty === 'beginner'
                      ? colors.success
                      : item.difficulty === 'intermediate'
                      ? colors.warning
                      : colors.error,
                },
              ]}
            >
              {item.difficulty}
            </Text>
          </View>
          <Text style={[styles.categoryText, { color: colors.textTertiary }]}>
            {item.category}
          </Text>
        </View>
      </View>
      <Icon name="plus-circle" size="md" color={colors.primary} />
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
    </View>
  );

  // Create exercise config for modal
  const exerciseConfig = useMemo(() => {
    if (!selectedExercise) return null;
    return {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      exerciseId: selectedExercise.id,
      exercise: selectedExercise,
      order: 0,
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      rir: 2,
      restSeconds: 90,
      setType: 'straight' as const,
    };
  }, [selectedExercise]);

  return (
    <ScreenChrome withPadding={false}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { paddingHorizontal: LAYOUT.screenPadding }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="magnifying-glass" size="sm" color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Icon name="x-circle" size="sm" color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Muscle Group Tabs */}
        <FlatList
          horizontal
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.tab,
                {
                  backgroundColor:
                    selectedGroup === item.key ? colors.primary : colors.surfaceAlt,
                },
              ]}
              onPress={() => setSelectedGroup(item.key)}
            >
              <Icon
                name={item.icon as IconName}
                size="sm"
                color={selectedGroup === item.key ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: selectedGroup === item.key ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {/* Equipment Filter */}
        <FlatList
          horizontal
          data={EQUIPMENT_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedEquipment === item.key ? colors.primary + '20' : 'transparent',
                  borderColor:
                    selectedEquipment === item.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedEquipment(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedEquipment === item.key ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {/* Results Count */}
        <View style={[styles.resultsRow, { paddingHorizontal: LAYOUT.screenPadding }]}>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {filteredExercises.length} exercises found
          </Text>
        </View>

        {/* Exercise List */}
        <SectionList
          sections={groupedExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="magnifying-glass" size="xl" color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No exercises found
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
                Try adjusting your filters
              </Text>
            </View>
          }
        />
      </View>

      {/* Exercise Config Modal */}
      <ExerciseConfigModal
        visible={configModalVisible}
        exercise={exerciseConfig}
        onSave={handleSaveExercise}
        onClose={() => {
          setConfigModalVisible(false);
          setSelectedExercise(null);
        }}
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.presets.body,
    padding: 0,
  },
  tabsContainer: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterContainer: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsRow: {
    paddingBottom: SPACING.sm,
  },
  resultsText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['4xl'],
  },
  sectionHeader: {
    paddingVertical: SPACING.xs,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 14,
  },
  exerciseMeta: {
    fontSize: 12,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.presets.body,
  },
  emptyHint: {
    ...TYPOGRAPHY.presets.caption,
  },
});
