import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  RefreshControl,
} from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useToast } from '../contexts/ToastContext';
import { Button, GlassCard, SectionHeader } from '../components/UI';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  getNotificationSettings,
  requestNotificationPermission,
  saveNotificationSettings,
  scheduleWorkoutReminders,
  cancelWorkoutReminders,
} from '../services/notifications';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';

const TIME_PRESETS = [
  { label: '6:00 AM', hour: 6, minute: 0 },
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
];

const PERSONALIZED_CATEGORIES = [
  {
    key: 'featureUpdatesEnabled',
    label: 'Feature updates',
    helper: 'New tools, integrations, and major improvements.',
  },
  {
    key: 'gymUpdatesEnabled',
    label: 'Gym updates',
    helper: 'Local events, playlist drops, and gym highlights.',
  },
  {
    key: 'musicInsightsEnabled',
    label: 'Music insights',
    helper: 'Personalized playback highlights and trends.',
  },
  {
    key: 'restocksEnabled',
    label: 'Product restocks',
    helper: 'Gear restocks and merch drops you opt in to.',
  },
  {
    key: 'promotionsEnabled',
    label: 'Limited-time offers',
    helper: 'Promos and limited-time rewards.',
  },
] as const;

const PERSONALIZED_FREQUENCY = [1, 2, 3, 5];

export default function NotificationsScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { showToast } = useToast();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [calorieThreshold, setCalorieThreshold] = useState(String(DEFAULT_NOTIFICATION_SETTINGS.calorieThreshold));
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');

  const loadSettings = useCallback(async () => {
    const stored = await getNotificationSettings();
    setSettings(stored);
    setCalorieThreshold(String(stored.calorieThreshold));
    setQuietStart(`${String(stored.quietStartHour).padStart(2, '0')}:${String(stored.quietStartMinute).padStart(2, '0')}`);
    setQuietEnd(`${String(stored.quietEndHour).padStart(2, '0')}:${String(stored.quietEndMinute).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    loadSettings().then(() => setIsReady(true));
  }, [loadSettings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  }, [loadSettings]);

  const handleSave = useCallback(
    async (next: NotificationSettings) => {
      setSettings(next);
      await saveNotificationSettings(next);
      if (next.workoutRemindersEnabled) {
        await scheduleWorkoutReminders(next);
      } else {
        await cancelWorkoutReminders();
      }
    },
    []
  );

  const handleToggleReminders = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          showToast('Enable notifications in Settings to use reminders.', { type: 'info' });
          return;
        }
      }
      await handleSave({ ...settings, workoutRemindersEnabled: value });
    },
    [settings, handleSave, showToast]
  );

  const handleToggleOvertraining = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          showToast('Enable notifications in Settings to use alerts.', { type: 'info' });
          return;
        }
      }
      await handleSave({ ...settings, overtrainingAlertsEnabled: value });
    },
    [settings, handleSave, showToast]
  );

  const handleTogglePersonalized = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          showToast('Enable notifications in Settings to personalize updates.', { type: 'info' });
          return;
        }
      }
      await handleSave({ ...settings, personalizedEnabled: value });
    },
    [settings, handleSave, showToast]
  );

  const handleToggleCategory = useCallback(
    async (key: typeof PERSONALIZED_CATEGORIES[number]['key'], value: boolean) => {
      await handleSave({ ...settings, [key]: value });
    },
    [settings, handleSave]
  );

  const handleQuietHoursToggle = useCallback(
    async (value: boolean) => {
      await handleSave({ ...settings, quietHoursEnabled: value });
    },
    [settings, handleSave]
  );

  const handleQuietHoursSave = useCallback(async () => {
    const [startHourRaw, startMinuteRaw] = quietStart.split(':');
    const [endHourRaw, endMinuteRaw] = quietEnd.split(':');
    const startHour = Number(startHourRaw);
    const startMinute = Number(startMinuteRaw);
    const endHour = Number(endHourRaw);
    const endMinute = Number(endMinuteRaw);
    const isValid =
      Number.isFinite(startHour) &&
      Number.isFinite(startMinute) &&
      Number.isFinite(endHour) &&
      Number.isFinite(endMinute) &&
      startHour >= 0 &&
      startHour <= 23 &&
      endHour >= 0 &&
      endHour <= 23 &&
      startMinute >= 0 &&
      startMinute <= 59 &&
      endMinute >= 0 &&
      endMinute <= 59;

    if (!isValid) {
      showToast('Enter quiet hours as HH:MM', { type: 'info' });
      return;
    }

    await handleSave({
      ...settings,
      quietStartHour: startHour,
      quietStartMinute: startMinute,
      quietEndHour: endHour,
      quietEndMinute: endMinute,
    });
    showToast('Quiet hours updated', { type: 'success' });
  }, [quietStart, quietEnd, settings, handleSave, showToast]);

  const handleFrequencySelect = useCallback(
    async (value: number) => {
      await handleSave({ ...settings, personalizedWeeklyCap: value });
    },
    [settings, handleSave]
  );

  const handleSelectTime = useCallback(
    async (hour: number, minute: number) => {
      setCustomTime('');
      await handleSave({ ...settings, reminderHour: hour, reminderMinute: minute });
    },
    [settings, handleSave]
  );

  const handleCustomTime = useCallback(async () => {
    const [hourRaw, minuteRaw] = customTime.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      showToast('Enter time as HH:MM', { type: 'info' });
      return;
    }
    await handleSave({ ...settings, reminderHour: hour, reminderMinute: minute });
  }, [customTime, settings, handleSave, showToast]);

  const scheduleLabel = useMemo(
    () => (settings.reminderSchedule === 'weekdays' ? 'Weekdays' : 'Daily'),
    [settings.reminderSchedule]
  );

  const reminderTimeLabel = `${String(settings.reminderHour).padStart(2, '0')}:${String(settings.reminderMinute).padStart(2, '0')}`;

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <SectionHeader
          title="Notifications"
          subtitle="Stay on track with reminders and alerts"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Workout reminders
          </Text>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Enable reminders</Text>
            <Switch value={settings.workoutRemindersEnabled} onValueChange={handleToggleReminders} />
          </View>
          <Text style={[styles.helperText, compact && styles.helperTextCompact, { color: colors.textSecondary }]}>
            Current schedule: {scheduleLabel} at {reminderTimeLabel}
          </Text>

          <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact, { color: colors.textSecondary }]}>
            Time presets
          </Text>
          <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
            {TIME_PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                onPress={() => handleSelectTime(preset.hour, preset.minute)}
                style={[
                  styles.chip,
                  compact && styles.chipCompact,
                  {
                    backgroundColor:
                      settings.reminderHour === preset.hour && settings.reminderMinute === preset.minute
                        ? colors.primary + '20'
                        : colors.surfaceAlt,
                    borderColor:
                      settings.reminderHour === preset.hour && settings.reminderMinute === preset.minute
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    compact && styles.chipTextCompact,
                    {
                      color:
                        settings.reminderHour === preset.hour && settings.reminderMinute === preset.minute
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact, { color: colors.textSecondary }]}>
            Custom time
          </Text>
          <View style={[styles.inlineRow, compact && styles.inlineRowCompact]}>
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                compact && styles.inputCompact,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="HH:MM"
              placeholderTextColor={colors.textTertiary}
              value={customTime}
              onChangeText={setCustomTime}
            />
            <Button title="Set" onPress={handleCustomTime} variant="secondary" />
          </View>

          <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact, { color: colors.textSecondary }]}>
            Schedule
          </Text>
          <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
            {(['daily', 'weekdays'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => handleSave({ ...settings, reminderSchedule: option })}
                style={[
                  styles.chip,
                  compact && styles.chipCompact,
                  {
                    backgroundColor: settings.reminderSchedule === option ? colors.primary + '20' : colors.surfaceAlt,
                    borderColor: settings.reminderSchedule === option ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    compact && styles.chipTextCompact,
                    { color: settings.reminderSchedule === option ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {option === 'daily' ? 'Daily' : 'Weekdays'}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Overtraining alerts
          </Text>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Notify when calories exceed</Text>
            <Switch value={settings.overtrainingAlertsEnabled} onValueChange={handleToggleOvertraining} />
          </View>
          <View style={[styles.inlineRow, compact && styles.inlineRowCompact]}>
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                compact && styles.inputCompact,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Calorie threshold"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={calorieThreshold}
              onChangeText={setCalorieThreshold}
            />
            <Button
              title="Save"
              onPress={async () => {
                const value = Number(calorieThreshold);
                if (!Number.isFinite(value) || value <= 0) {
                  showToast('Enter a valid number.', { type: 'info' });
                  return;
                }
                await handleSave({ ...settings, calorieThreshold: value });
                showToast('Threshold updated', { type: 'success' });
              }}
              variant="secondary"
            />
          </View>
          <Text style={[styles.helperText, compact && styles.helperTextCompact, { color: colors.textSecondary }]}>
            Alerts trigger when a new activity log exceeds your threshold.
          </Text>
        </GlassCard>

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Personalized updates
          </Text>
          <Text style={[styles.helperText, compact && styles.helperTextCompact, { color: colors.textSecondary }]}>
            Only the topics you care about, capped to avoid notification overload.
          </Text>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Enable personalized notifications</Text>
            <Switch value={settings.personalizedEnabled} onValueChange={handleTogglePersonalized} />
          </View>

          <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact, { color: colors.textSecondary }]}>
            Topics
          </Text>
          <View style={[styles.categoryList, compact && styles.categoryListCompact]}>
            {PERSONALIZED_CATEGORIES.map((category) => (
              <View key={category.key} style={[styles.categoryRow, compact && styles.categoryRowCompact]}>
                <View style={styles.categoryText}>
                  <Text style={[styles.categoryTitle, compact && styles.categoryTitleCompact, { color: colors.textPrimary }]}>
                    {category.label}
                  </Text>
                  <Text style={[styles.categoryHelper, compact && styles.categoryHelperCompact, { color: colors.textSecondary }]}>
                    {category.helper}
                  </Text>
                </View>
                <Switch
                  value={settings[category.key]}
                  onValueChange={(value) => handleToggleCategory(category.key, value)}
                  disabled={!settings.personalizedEnabled}
                />
              </View>
            ))}
          </View>

          <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact, { color: colors.textSecondary }]}>
            Frequency cap
          </Text>
          <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
            {PERSONALIZED_FREQUENCY.map((value) => (
              <Pressable
                key={value}
                onPress={() => handleFrequencySelect(value)}
                style={[
                  styles.chip,
                  compact && styles.chipCompact,
                  {
                    backgroundColor: settings.personalizedWeeklyCap === value ? colors.primary + '20' : colors.surfaceAlt,
                    borderColor: settings.personalizedWeeklyCap === value ? colors.primary : colors.border,
                    opacity: settings.personalizedEnabled ? 1 : 0.6,
                  },
                ]}
                disabled={!settings.personalizedEnabled}
              >
                <Text
                  style={[
                    styles.chipText,
                    compact && styles.chipTextCompact,
                    { color: settings.personalizedWeeklyCap === value ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {value} / week
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact, { color: colors.textSecondary }]}>
            Quiet hours
          </Text>
          <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Silence non-urgent updates</Text>
            <Switch value={settings.quietHoursEnabled} onValueChange={handleQuietHoursToggle} />
          </View>
          <View style={[styles.inlineRow, compact && styles.inlineRowCompact]}>
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                styles.inlineInputCompact,
                compact && styles.inputCompact,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Start HH:MM"
              placeholderTextColor={colors.textTertiary}
              value={quietStart}
              onChangeText={setQuietStart}
              editable={settings.quietHoursEnabled}
              accessibilityLabel="Quiet hours start time"
            />
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                styles.inlineInputCompact,
                compact && styles.inputCompact,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="End HH:MM"
              placeholderTextColor={colors.textTertiary}
              value={quietEnd}
              onChangeText={setQuietEnd}
              editable={settings.quietHoursEnabled}
              accessibilityLabel="Quiet hours end time"
            />
            <Button
              title="Set"
              onPress={handleQuietHoursSave}
              variant="secondary"
              disabled={!settings.quietHoursEnabled}
            />
          </View>
          <Text style={[styles.helperText, compact && styles.helperTextCompact, { color: colors.textSecondary }]}>
            We will hold non-urgent messages during this window.
          </Text>
        </GlassCard>

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={14}>
          <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
            Auto tracking
          </Text>
          <Text style={[styles.helperText, compact && styles.helperTextCompact, { color: colors.textSecondary }]}>
            Automatic sleep and step tracking will be enabled once Apple Health / Google Fit is connected.
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    paddingBottom: SPACING['3xl'],
    gap: SPACING.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },
  loadingText: {
    ...TYPOGRAPHY.presets.body,
  },
  sectionTitle: {
    color: '#F0F0F5',
    textShadowColor: 'rgba(203, 255, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: '#9B9BAD',
  },
  card: {
    padding: SPACING.lg,
    marginHorizontal: LAYOUT.screenPadding,
    borderRadius: RADIUS.lg,
  },
  cardCompact: {
    padding: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: SPACING.md,
  },
  cardTitleCompact: {
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    ...TYPOGRAPHY.presets.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  fieldLabelCompact: {
    letterSpacing: 0.4,
  },
  helperText: {
    ...TYPOGRAPHY.presets.caption,
    marginBottom: SPACING.sm,
  },
  helperTextCompact: {
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  toggleRowCompact: {
    paddingVertical: 0,
  },
  toggleLabel: {
    ...TYPOGRAPHY.presets.body,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chipRowCompact: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  categoryList: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryListCompact: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  categoryRowCompact: {
    gap: SPACING.xs,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    ...TYPOGRAPHY.presets.body,
  },
  categoryTitleCompact: {
    fontSize: 13,
  },
  categoryHelper: {
    ...TYPOGRAPHY.presets.caption,
  },
  categoryHelperCompact: {
    fontSize: 11,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipCompact: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: 11,
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
  inlineRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  inlineRowCompact: {
    gap: SPACING.xs,
  },
  inlineInput: {
    flex: 1,
    marginBottom: 0,
  },
  inlineInputCompact: {
    minWidth: 110,
  },
});
