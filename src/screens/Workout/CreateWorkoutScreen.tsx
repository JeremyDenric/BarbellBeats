/**
 * CreateWorkoutScreen
 * Screen for creating or editing a workout template
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { GlassCard } from '../../components/UI';
import ScreenChrome from '../../components/ScreenChrome';
import { Icon, IconName } from '../../components/Icon';
import CategoryPicker from '../../components/workout/CategoryPicker';
import ExerciseRow from '../../components/workout/ExerciseRow';
import ExerciseConfigModal from '../../components/workout/ExerciseConfigModal';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, LAYOUT } from '../../theme/tokens';
import type { TrainingStackParamList } from '../../types';
import {
  WorkoutCategory,
  WorkoutExerciseConfig,
  WORKOUT_CATEGORIES,
} from '../../services/workoutTemplateStorage';
import { SEED_EXERCISES } from '../../data/exerciseSeedData';

type NavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'CreateWorkout'>;
type RouteType = RouteProp<TrainingStackParamList, 'CreateWorkout'>;

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', color: '#22c55e' },
  { value: 'intermediate', label: 'Intermediate', color: '#eab308' },
  { value: 'advanced', label: 'Advanced', color: '#ef4444' },
] as const;

export default function CreateWorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { getTemplateById, createNewTemplate, updateExistingTemplate } = useWorkoutTemplates();

  const templateId = route.params?.templateId;
  const isEditing = !!templateId;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WorkoutCategory>('custom');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [exercises, setExercises] = useState<WorkoutExerciseConfig[]>([]);
  const [saving, setSaving] = useState(false);

  // Modal state for exercise config
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExerciseConfig | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    const template = await getTemplateById(templateId);
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setDifficulty(template.difficulty);
      setExercises(template.exercises);
    }
  };

  const handleAddExercise = () => {
    navigation.navigate('ExerciseBrowser');
  };

  // Listen for selected exercise from ExerciseBrowser
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if there's a selected exercise in the route params
      // This will be set by ExerciseBrowserScreen
    });
    return unsubscribe;
  }, [navigation]);

  const handleEditExercise = (exercise: WorkoutExerciseConfig, index: number) => {
    setEditingExercise(exercise);
    setEditingIndex(index);
    setConfigModalVisible(true);
  };

  const handleSaveExerciseConfig = (config: WorkoutExerciseConfig) => {
    if (editingIndex !== null) {
      // Update existing exercise
      setExercises(prev => {
        const updated = [...prev];
        updated[editingIndex] = config;
        return updated;
      });
    } else {
      // Add new exercise
      setExercises(prev => [...prev, config]);
    }
    setConfigModalVisible(false);
    setEditingExercise(null);
    setEditingIndex(null);
  };

  const handleRemoveExercise = (index: number) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setExercises(prev => {
              const updated = prev.filter((_, i) => i !== index);
              // Update order numbers
              return updated.map((ex, i) => ({ ...ex, order: i }));
            });
          },
        },
      ]
    );
  };

  const handleMoveExercise = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= exercises.length) return;

    setExercises(prev => {
      const updated = [...prev];
      [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
      // Update order numbers
      return updated.map((ex, i) => ({ ...ex, order: i }));
    });
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a workout name.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise to your workout.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && templateId) {
        await updateExistingTemplate(templateId, {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          difficulty,
          exercises,
        });
      } else {
        await createNewTemplate({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          difficulty,
          exercises,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (name || exercises.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Quick add exercise for testing (will be replaced with ExerciseBrowser navigation)
  const handleQuickAddExercise = (exerciseId: string) => {
    const seedExercise = SEED_EXERCISES.find(e => e.id === exerciseId);
    if (!seedExercise) return;

    const newExercise: WorkoutExerciseConfig = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: seedExercise.id,
      exercise: seedExercise,
      order: exercises.length,
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      rir: 2,
      restSeconds: 90,
      setType: 'straight',
    };

    setEditingExercise(newExercise);
    setEditingIndex(null);
    setConfigModalVisible(true);
  };

  return (
    <ScreenChrome withPadding={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isEditing ? 'Edit Workout' : 'Create Workout'}
            </Text>
          </View>

          {/* Workout Name */}
          <GlassCard style={styles.section} intensity={16}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Workout Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { color: colors.textPrimary, backgroundColor: colors.surfaceAlt },
              ]}
              placeholder="e.g., Push Day, Leg Destroyer"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </GlassCard>

          {/* Category */}
          <GlassCard style={styles.section} intensity={16}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Category
            </Text>
            <CategoryPicker
              selected={category}
              onSelect={setCategory}
            />
          </GlassCard>

          {/* Difficulty */}
          <GlassCard style={styles.section} intensity={16}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Difficulty
            </Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.difficultyOption,
                    {
                      backgroundColor: difficulty === option.value
                        ? option.color + '30'
                        : colors.surfaceAlt,
                      borderColor: difficulty === option.value
                        ? option.color
                        : 'transparent',
                    },
                  ]}
                  onPress={() => setDifficulty(option.value)}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: difficulty === option.value ? option.color : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>

          {/* Exercises */}
          <GlassCard style={styles.section} intensity={16}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Exercises ({exercises.length})
              </Text>
              <Pressable
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddExercise}
              >
                <Icon name="plus" size="sm" color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {exercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <Icon name="barbell" size="xl" color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No exercises added yet
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
                  Tap "Add" to browse exercises
                </Text>
              </View>
            ) : (
              <View style={styles.exerciseList}>
                {exercises.map((exercise, index) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    totalCount={exercises.length}
                    onEdit={() => handleEditExercise(exercise, index)}
                    onRemove={() => handleRemoveExercise(index)}
                    onMoveUp={() => handleMoveExercise(index, 'up')}
                    onMoveDown={() => handleMoveExercise(index, 'down')}
                  />
                ))}
              </View>
            )}
          </GlassCard>

          {/* Description (optional) */}
          <GlassCard style={styles.section} intensity={16}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { color: colors.textPrimary, backgroundColor: colors.surfaceAlt },
              ]}
              placeholder="Add notes about this workout..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </GlassCard>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              saving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Workout'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Exercise Config Modal */}
      <ExerciseConfigModal
        visible={configModalVisible}
        exercise={editingExercise}
        onSave={handleSaveExerciseConfig}
        onClose={() => {
          setConfigModalVisible(false);
          setEditingExercise(null);
          setEditingIndex(null);
        }}
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 100,
    gap: SPACING.md,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.presets.heading2,
  },
  section: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
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
  textInput: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.presets.body,
  },
  textArea: {
    minHeight: 80,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  difficultyText: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.presets.body,
  },
  emptyHint: {
    ...TYPOGRAPHY.presets.caption,
  },
  exerciseList: {
    gap: SPACING.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  saveButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.presets.bodyBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
