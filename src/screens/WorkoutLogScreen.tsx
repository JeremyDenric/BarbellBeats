import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Pressable,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useToast } from '../contexts/ToastContext';
import { Button, EmptyState, GlassCard, SectionHeader } from '../components/UI';
import { SkeletonCard } from '../components/SkeletonLoader';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';
import { validateTextField, validateDuration, validateRPE } from '../utils/validation';

type WorkoutLogEntry = {
  id: string;
  title: string;
  createdAt: string;
  durationMin?: number;
  rpe?: number;
  notes?: string;
  tags?: string[];
  focus?: string;
};

type WorkoutLogSettings = {
  showNotes: boolean;
  showRpe: boolean;
  showDuration: boolean;
  showTags: boolean;
  showFocus: boolean;
};

const LOG_KEY = '@workout_log_entries';
const SETTINGS_KEY = '@workout_log_settings';
const DEFAULT_SETTINGS: WorkoutLogSettings = {
  showNotes: true,
  showRpe: true,
  showDuration: true,
  showTags: true,
  showFocus: true,
};

const FOCUS_OPTIONS = ['Strength', 'Hypertrophy', 'Conditioning', 'Mobility'];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function WorkoutLogScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { showToast } = useToast();

  const [entries, setEntries] = useState<WorkoutLogEntry[]>([]);
  const [settings, setSettings] = useState<WorkoutLogSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedLogs, storedSettings] = await Promise.all([
          AsyncStorage.getItem(LOG_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (storedLogs) {
          setEntries(JSON.parse(storedLogs));
        }
        if (storedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
        }
      } catch (error) {
        console.error('Failed to load workout log:', error);
      } finally {
        setIsReady(true);
      }
    };
    load();
  }, []);

  const persistEntries = useCallback(async (next: WorkoutLogEntry[]) => {
    setEntries(next);
    try {
      await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save workout log:', error);
    }
  }, []);

  const persistSettings = useCallback(async (next: WorkoutLogSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save workout log settings:', error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    // Validate title
    const titleValidation = validateTextField(title, {
      required: true,
      minLength: 2,
      maxLength: 100,
      fieldName: 'Workout title',
    });
    if (!titleValidation.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(titleValidation.error || 'Invalid title', { type: 'error' });
      return;
    }

    // Validate duration if provided
    if (duration.trim()) {
      const durationValidation = validateDuration(duration);
      if (!durationValidation.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(durationValidation.error || 'Invalid duration', { type: 'error' });
        return;
      }
    }

    // Validate RPE if provided
    if (rpe.trim()) {
      const rpeValidation = validateRPE(rpe);
      if (!rpeValidation.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(rpeValidation.error || 'Invalid RPE', { type: 'error' });
        return;
      }
    }

    const durationValue = Number(duration);
    const rpeValue = Number(rpe);
    const tagsValue = tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const entry: WorkoutLogEntry = {
      id: createId(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
      durationMin: Number.isFinite(durationValue) && durationValue > 0 ? durationValue : undefined,
      rpe: Number.isFinite(rpeValue) && rpeValue > 0 ? rpeValue : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      tags: tagsValue.length > 0 ? tagsValue : undefined,
      focus: focus || undefined,
    };

    const nextEntries = [entry, ...entries];
    await persistEntries(nextEntries);
    setTitle('');
    setDuration('');
    setRpe('');
    setNotes('');
    setTags('');
    setFocus(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Workout logged', { type: 'success' });
  }, [title, duration, rpe, notes, tags, focus, entries, persistEntries, showToast]);

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      Alert.alert(
        'Delete Workout?',
        'This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const nextEntries = entries.filter((entry) => entry.id !== id);
                await persistEntries(nextEntries);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast('Entry removed', { type: 'info' });
              } catch (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                showToast('Failed to delete entry', { type: 'error' });
              }
            },
          },
        ]
      );
    },
    [entries, persistEntries, showToast]
  );

  const handleToggle = useCallback(
    (key: keyof WorkoutLogSettings, value: boolean) => {
      Haptics.selectionAsync();
      persistSettings({ ...settings, [key]: value });
    },
    [settings, persistSettings]
  );

  const renderEntry = useCallback(
    ({ item }: { item: WorkoutLogEntry }) => (
      <View
        style={[
          styles.logCard,
          compact && styles.logCardCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.logHeader, compact && styles.logHeaderCompact]}>
          <View style={styles.logInfo}>
            <Text style={[styles.logTitle, compact && styles.logTitleCompact, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.logMeta, compact && styles.logMetaCompact, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Pressable
            onPress={() => handleDelete(item.id)}
            style={[styles.deleteButton, compact && styles.deleteButtonCompact]}
            accessible={true}
            accessibilityLabel="Delete workout"
            accessibilityHint="Removes this workout from your log"
            accessibilityRole="button"
          >
            <Text style={[styles.deleteText, compact && styles.deleteTextCompact, { color: colors.error }]}>
              Delete
            </Text>
          </Pressable>
        </View>

        {settings.showFocus && item.focus && (
          <Text style={[styles.logDetail, compact && styles.logDetailCompact, { color: colors.textSecondary }]}>
            Focus: {item.focus}
          </Text>
        )}
        {settings.showDuration && item.durationMin && (
          <Text style={[styles.logDetail, compact && styles.logDetailCompact, { color: colors.textSecondary }]}>
            Duration: {item.durationMin} min
          </Text>
        )}
        {settings.showRpe && item.rpe && (
          <Text style={[styles.logDetail, compact && styles.logDetailCompact, { color: colors.textSecondary }]}>
            RPE: {item.rpe}/10
          </Text>
        )}
        {settings.showTags && item.tags && item.tags.length > 0 && (
          <View style={[styles.tagRow, compact && styles.tagRowCompact]}>
            {item.tags.map((tag) => (
              <View
                key={`${item.id}-${tag}`}
                style={[
                  styles.tag,
                  compact && styles.tagCompact,
                  { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' },
                ]}
              >
                <Text style={[styles.tagText, compact && styles.tagTextCompact, { color: colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
        {settings.showNotes && item.notes && (
          <Text style={[styles.logNotes, compact && styles.logNotesCompact, { color: colors.textSecondary }]}>
            {item.notes}
          </Text>
        )}
      </View>
    ),
    [colors, settings, handleDelete, compact]
  );

  const entryKeyExtractor = useCallback((item: WorkoutLogEntry) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View>
        <SectionHeader
          title="Workout Log"
          subtitle="Track sessions and customize your logging view"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Customize fields
          </Text>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show notes</Text>
            <Switch
              value={settings.showNotes}
              onValueChange={(value) => handleToggle('showNotes', value)}
              accessible={true}
              accessibilityLabel="Show notes toggle"
              accessibilityHint="Toggle visibility of notes in workout log entries"
              accessibilityRole="switch"
            />
          </View>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show RPE</Text>
            <Switch
              value={settings.showRpe}
              onValueChange={(value) => handleToggle('showRpe', value)}
              accessible={true}
              accessibilityLabel="Show RPE toggle"
              accessibilityHint="Toggle visibility of RPE ratings in workout log entries"
              accessibilityRole="switch"
            />
          </View>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show duration</Text>
            <Switch
              value={settings.showDuration}
              onValueChange={(value) => handleToggle('showDuration', value)}
              accessible={true}
              accessibilityLabel="Show duration toggle"
              accessibilityHint="Toggle visibility of workout duration in log entries"
              accessibilityRole="switch"
            />
          </View>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show tags</Text>
            <Switch
              value={settings.showTags}
              onValueChange={(value) => handleToggle('showTags', value)}
              accessible={true}
              accessibilityLabel="Show tags toggle"
              accessibilityHint="Toggle visibility of tags in workout log entries"
              accessibilityRole="switch"
            />
          </View>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show focus</Text>
            <Switch
              value={settings.showFocus}
              onValueChange={(value) => handleToggle('showFocus', value)}
              accessible={true}
              accessibilityLabel="Show focus toggle"
              accessibilityHint="Toggle visibility of workout focus in log entries"
              accessibilityRole="switch"
            />
          </View>
        </GlassCard>

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Log a workout
          </Text>
          <TextInput
            style={[
              styles.input,
              compact && styles.inputCompact,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Workout title"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            accessible={true}
            accessibilityLabel="Workout title"
            accessibilityHint="Enter a name for this workout"
          />

          {settings.showFocus && (
            <View style={[styles.focusRow, compact && styles.focusRowCompact]}>
              {FOCUS_OPTIONS.map((option) => {
                const isActive = focus === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFocus(isActive ? null : option);
                    }}
                    style={[
                      styles.focusChip,
                      compact && styles.focusChipCompact,
                      {
                        backgroundColor: isActive ? colors.primary + '20' : colors.surfaceAlt,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    accessible={true}
                    accessibilityLabel={`Focus: ${option}`}
                    accessibilityHint={`Select ${option} as workout focus`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.focusText,
                        compact && styles.focusTextCompact,
                        { color: isActive ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={[styles.row, compact && styles.rowCompact]}>
            {settings.showDuration && (
              <TextInput
                style={[
                  styles.input,
                  styles.halfInput,
                  compact && styles.inputCompact,
                  {
                    backgroundColor: colors.backgroundAlt,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Duration (min)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
                accessible={true}
                accessibilityLabel="Workout duration in minutes"
                accessibilityHint="Enter how long the workout lasted"
              />
            )}
            {settings.showRpe && (
              <TextInput
                style={[
                  styles.input,
                  styles.halfInput,
                  compact && styles.inputCompact,
                  {
                    backgroundColor: colors.backgroundAlt,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="RPE (1-10)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={rpe}
                onChangeText={setRpe}
                accessible={true}
                accessibilityLabel="Rate of perceived exertion"
                accessibilityHint="Rate workout difficulty from 1 to 10"
              />
            )}
          </View>

          {settings.showTags && (
            <TextInput
              style={[
                styles.input,
                compact && styles.inputCompact,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Tags (e.g. legs, strength)"
              placeholderTextColor={colors.textTertiary}
              value={tags}
              onChangeText={setTags}
              accessible={true}
              accessibilityLabel="Workout tags"
              accessibilityHint="Add comma-separated tags to categorize this workout"
            />
          )}

          {settings.showNotes && (
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                compact && styles.inputCompact,
                compact && styles.notesInputCompact,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Notes"
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              accessible={true}
              accessibilityLabel="Workout notes"
              accessibilityHint="Add any additional notes about this workout"
            />
          )}

          <Button
            title="Save log"
            onPress={handleSave}
            variant="primary"
            fullWidth
            disabled={!title.trim()}
            accessible={true}
            accessibilityLabel="Save workout log"
            accessibilityHint="Saves this workout to your log history"
            accessibilityRole="button"
          />
        </GlassCard>

        <SectionHeader
          title="Recent logs"
          subtitle={`${entries.length} session${entries.length === 1 ? '' : 's'}`}
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />
      </View>
    ),
    [
      colors,
      entries.length,
      focus,
      handleSave,
      handleToggle,
      compact,
      rpe,
      duration,
      notes,
      tags,
      settings,
      title,
    ]
  );

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonContainer}>
          {[...Array(5)].map((_, index) => (
            <SkeletonCard key={index} style={styles.skeletonCard} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        <FlatList
          data={entries}
          keyExtractor={entryKeyExtractor}
          renderItem={renderEntry}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon={<Text style={[styles.emptyIcon, compact && styles.emptyIconCompact]}>📝</Text>}
              title="No workouts logged"
              message="Use the form above to log your first session."
            />
          }
          contentContainerStyle={[styles.list, compact && styles.listCompact]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={9}
          updateCellsBatchingPeriod={50}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: SPACING['4xl'],
  },
  listCompact: {
    paddingBottom: SPACING['3xl'],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },
  sectionTitle: {
    color: '#F5F7F2',
    textShadowColor: 'rgba(34, 197, 94, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: '#B9C2B0',
  },
  card: {
    padding: SPACING.lg,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  cardCompact: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: SPACING.md,
  },
  cardTitleCompact: {
    marginBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
  },
  toggleRowCompact: {
    paddingVertical: 0,
  },
  toggleLabel: {
    ...TYPOGRAPHY.presets.body,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  inputCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowCompact: {
    gap: SPACING.xs,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  notesInputCompact: {
    minHeight: 72,
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  focusRowCompact: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  focusChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  focusChipCompact: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  focusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  focusTextCompact: {
    fontSize: 11,
  },
  logCard: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  logCardCompact: {
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  logHeaderCompact: {
    marginBottom: SPACING.xs,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: 4,
  },
  logTitleCompact: {
    fontSize: 16,
  },
  logMeta: {
    ...TYPOGRAPHY.presets.caption,
  },
  logMetaCompact: {
    fontSize: 11,
  },
  deleteButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  deleteButtonCompact: {
    paddingHorizontal: SPACING.xs,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deleteTextCompact: {
    fontSize: 11,
  },
  logDetail: {
    ...TYPOGRAPHY.presets.caption,
    marginBottom: 4,
  },
  logDetailCompact: {
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tagRowCompact: {
    gap: 6,
  },
  tag: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  tagCompact: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tagTextCompact: {
    fontSize: 10,
  },
  logNotes: {
    ...TYPOGRAPHY.presets.caption,
    marginTop: SPACING.sm,
  },
  logNotesCompact: {
    fontSize: 11,
    marginTop: SPACING.xs,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyIconCompact: {
    fontSize: 26,
  },
  // Skeleton Loader
  skeletonContainer: {
    padding: LAYOUT.screenPadding,
    gap: SPACING.md,
  },
  skeletonCard: {
    marginBottom: SPACING.sm,
  },
});
