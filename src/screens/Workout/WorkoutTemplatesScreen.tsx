/**
 * WorkoutTemplatesScreen
 * Lists user's saved workout templates with options to create, edit, and start workouts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Gradient } from '../../components/Gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { useWorkout } from '../../contexts/WorkoutContext';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { GlassCard, LoadingView } from '../../components/UI';
import ScreenChrome from '../../components/ScreenChrome';
import { Icon } from '../../components/Icon';
import WorkoutTemplateCard from '../../components/workout/WorkoutTemplateCard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, LAYOUT, GRADIENTS } from '../../theme/tokens';
import haptics from '../../utils/haptics';
import type { TrainingStackParamList } from '../../types';
import type { UserWorkoutTemplate } from '../../services/workoutTemplateStorage';

type NavigationProp = NativeStackNavigationProp<TrainingStackParamList>;

export default function WorkoutTemplatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const {
    templates,
    loading,
    error,
    refreshTemplates,
    removeTemplate,
    duplicateExistingTemplate,
  } = useWorkoutTemplates();
  const { activeWorkoutV2, startWorkoutFromTemplate } = useWorkout();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTemplates();
    setRefreshing(false);
  };

  const handleCreateNew = () => {
    navigation.navigate('CreateWorkout', {});
  };

  const handleEditTemplate = (template: UserWorkoutTemplate) => {
    navigation.navigate('CreateWorkout', { templateId: template.id });
  };

  const handleDeleteTemplate = (template: UserWorkoutTemplate) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTemplate(template.id);
          },
        },
      ]
    );
  };

  const handleDuplicateTemplate = async (template: UserWorkoutTemplate) => {
    await duplicateExistingTemplate(template.id);
  };

  const handleResumeWorkout = () => {
    if (activeWorkoutV2) {
      haptics.mediumTap();
      navigation.navigate('ActiveWorkout', { templateId: activeWorkoutV2.templateId ?? '' });
    }
  };

  const handleStartWorkout = (template: UserWorkoutTemplate) => {
    if (activeWorkoutV2) {
      Alert.alert(
        'Workout In Progress',
        'You already have an active workout. Finish or discard it before starting a new one.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Start Workout',
      `Ready to start "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            haptics.mediumTap();
            await startWorkoutFromTemplate(template);
            navigation.navigate('ActiveWorkout', { templateId: template.id });
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Icon name="barbell" size="xxl" color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No Workouts Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Create your first custom workout to get started
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateNew}
      >
        <Icon name="plus" size="sm" color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Create Workout</Text>
      </Pressable>
    </View>
  );

  const renderTemplate = ({ item }: { item: UserWorkoutTemplate }) => (
    <WorkoutTemplateCard
      template={item}
      onPress={() => handleStartWorkout(item)}
      onEdit={() => handleEditTemplate(item)}
      onDelete={() => handleDeleteTemplate(item)}
      onDuplicate={() => handleDuplicateTemplate(item)}
    />
  );

  if (loading && templates.length === 0) {
    return <LoadingView message="Loading workouts..." />;
  }

  return (
    <ScreenChrome withPadding={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: LAYOUT.screenPadding }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              My Workouts
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateNew}
          >
            <Icon name="plus" size="md" color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Resume workout banner */}
        {activeWorkoutV2 && (
          <AnimatedPressable
            onPress={handleResumeWorkout}
            style={[styles.resumeBanner, { marginHorizontal: LAYOUT.screenPadding }]}
          >
            <Gradient
              colors={[...GRADIENTS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resumeGradient}
            >
              <Icon name="play" size="md" color="#0A0A0F" />
              <View style={styles.resumeTextContainer}>
                <Text style={styles.resumeTitle}>Resume Workout</Text>
                <Text style={styles.resumeSubtitle}>{activeWorkoutV2.name}</Text>
              </View>
              <Icon name="caret-right" size="md" color="#0A0A0F" />
            </Gradient>
          </AnimatedPressable>
        )}

        {/* Error message */}
        {error && (
          <GlassCard style={[styles.errorCard, { marginHorizontal: LAYOUT.screenPadding }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </GlassCard>
        )}

        {/* Template list */}
        {templates.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={templates}
            renderItem={renderTemplate}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.presets.heading2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.presets.caption,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['4xl'],
    gap: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenPadding * 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.presets.heading3,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.presets.bodyBold,
  },
  resumeBanner: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  resumeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
  },
  resumeTextContainer: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#0A0A0F',
  },
  resumeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(10, 10, 15, 0.7)',
  },
  errorCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
  },
});
