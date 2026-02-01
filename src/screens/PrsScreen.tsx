import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, Switch, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING } from '../theme/tokens';
import { Button, LoadingView, ErrorView, EmptyState } from '../components/UI';
import { useToast } from '../contexts/ToastContext';
import { createPr, listPrs } from '../services/userDataApi';
import type { PrRecord } from '../types';

export default function PrsScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [useHealthSync, setUseHealthSync] = useState(false);

  const { data: prs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['prs', user?.id],
    queryFn: () => listPrs(user?.id || ''),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createPr(user?.id || '', {
        exercise,
        weight: Number(weight),
        reps: Number(reps),
        source: useHealthSync ? 'apple-health' : 'manual',
      });
    },
    onSuccess: () => {
      setExercise('');
      setWeight('');
      setReps('');
      queryClient.invalidateQueries({ queryKey: ['prs', user?.id] });
      showToast('PR saved', { type: 'success' });
    },
  });

  const renderPrItem = useCallback(
    ({ item }: { item: PrRecord }) => (
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
          {item.exercise}
        </Text>
        <Text style={[styles.cardValue, compact && styles.cardValueCompact, { color: colors.textSecondary }]}>
          {item.weight} lbs · {item.reps} reps
        </Text>
        <Text style={[styles.cardMeta, compact && styles.cardMetaCompact, { color: colors.textTertiary }]}>
          {item.source === 'apple-health' ? 'Apple Health' : 'Manual'} · {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    ),
    [colors, compact]
  );

  const prKeyExtractor = useCallback((item: PrRecord) => item.id, []);

  if (isLoading) {
    return <LoadingView message="Loading PRs..." />;
  }

  if (isError) {
    return <ErrorView error={error as Error} onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.form, compact && styles.formCompact]}>
        <Text style={[styles.heading, compact && styles.headingCompact, { color: colors.textPrimary }]}>
          Track PRs
        </Text>
        <TextInput
          style={[
            styles.input,
            compact && styles.inputCompact,
            { backgroundColor: colors.surface, color: colors.textPrimary },
          ]}
          placeholder="Exercise (e.g. Bench Press)"
          placeholderTextColor={colors.textTertiary}
          value={exercise}
          onChangeText={setExercise}
        />
        <View style={[styles.row, compact && styles.rowCompact]}>
          <TextInput
            style={[
              styles.input,
              compact && styles.inputCompact,
              styles.smallInput,
              { backgroundColor: colors.surface, color: colors.textPrimary },
            ]}
            placeholder="Weight"
            placeholderTextColor={colors.textTertiary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <TextInput
            style={[
              styles.input,
              compact && styles.inputCompact,
              styles.smallInput,
              { backgroundColor: colors.surface, color: colors.textPrimary },
            ]}
            placeholder="Reps"
            placeholderTextColor={colors.textTertiary}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.syncRow, compact && styles.syncRowCompact]}>
          <Text style={[styles.syncLabel, compact && styles.syncLabelCompact, { color: colors.textSecondary }]}>
            Apple Health Sync (optional)
          </Text>
          <Switch value={useHealthSync} onValueChange={setUseHealthSync} />
        </View>
        <Button
          title="Save PR"
          onPress={() => createMutation.mutate()}
          variant="primary"
          disabled={!exercise.trim() || !weight || !reps || createMutation.isPending}
        />
        {useHealthSync && (
          <Text style={[styles.syncNote, compact && styles.syncNoteCompact, { color: colors.textTertiary }]}>
            Sync is a stub for now. You can toggle this to tag the PR source.
          </Text>
        )}
      </View>

      <FlatList
        data={prs || []}
        keyExtractor={prKeyExtractor}
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={[styles.emptyIcon, compact && styles.emptyIconCompact]}>📈</Text>}
            title="No PRs yet"
            message="Log your first personal record to start tracking progress."
          />
        }
        renderItem={renderPrItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  formCompact: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
  },
  headingCompact: {
    fontSize: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowCompact: {
    gap: SPACING.xs,
  },
  smallInput: {
    flex: 1,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncRowCompact: {
    gap: SPACING.xs,
  },
  syncLabel: {
    fontSize: 14,
  },
  syncLabelCompact: {
    fontSize: 12,
  },
  syncNote: {
    fontSize: 12,
  },
  syncNoteCompact: {
    fontSize: 11,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  listCompact: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyIconCompact: {
    fontSize: 26,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  cardCompact: {
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTitleCompact: {
    fontSize: 14,
  },
  cardValue: {
    marginTop: 4,
    fontSize: 14,
  },
  cardValueCompact: {
    marginTop: 2,
    fontSize: 12,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  cardMetaCompact: {
    marginTop: 2,
    fontSize: 11,
  },
});
