import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Icon from '../components/Icon';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button, GlassCard, SectionHeader, LoadingView } from '../components/UI';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';
import { validateTextField, validateDate } from '../utils/validation';
import devLog from '../utils/devLog';

type MedicationEntry = {
  id: string;
  name: string;
  schedule: string[];
};

type AppointmentEntry = {
  id: string;
  type: string;
  timing: string;
  date?: string;
  note?: string;
};

type ProfilePreferences = {
  showTraining: boolean;
  showHealth: boolean;
  showAppointments: boolean;
  showMedications: boolean;
};

type ProfileData = {
  displayName: string;
  pronouns: string | null;
  ageRange: string | null;
  goals: string[];
  activityLevel: string | null;
  preferredTimes: string[];
  conditions: string[];
  medications: MedicationEntry[];
  appointments: AppointmentEntry[];
  preferences: ProfilePreferences;
};

const PROFILE_KEY = '@bb_profile_data';
const DEFAULT_PROFILE: ProfileData = {
  displayName: '',
  pronouns: null,
  ageRange: null,
  goals: [],
  activityLevel: null,
  preferredTimes: [],
  conditions: [],
  medications: [],
  appointments: [],
  preferences: {
    showTraining: true,
    showHealth: true,
    showAppointments: true,
    showMedications: true,
  },
};

const PRONOUNS = ['He/Him', 'She/Her', 'They/Them', 'Prefer not to say'];
const AGE_RANGES = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'];
const GOALS = ['Strength', 'Hypertrophy', 'Endurance', 'Weight loss', 'Mobility', 'Performance'];
const ACTIVITY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PREFERRED_TIMES = ['Morning', 'Midday', 'Evening', 'Late night'];

const HEALTH_CONDITIONS = [
  'None',
  'Back pain',
  'Knee pain',
  'Shoulder pain',
  'Asthma',
  'Diabetes',
  'High blood pressure',
  'Heart condition',
  'Pregnancy',
];

const MEDICATION_TEMPLATES = [
  'Pain relief',
  'Blood pressure',
  'Diabetes',
  'Asthma',
  'Allergy',
  'Supplements',
];

const MEDICATION_SCHEDULES = ['Morning', 'Noon', 'Evening', 'As needed'];

const APPOINTMENT_TYPES = [
  'Checkup',
  'Physical therapy',
  'Doctor visit',
  'Specialist',
  'Nutritionist',
];

const APPOINTMENT_TIMINGS = ['This week', 'Next week', 'This month'];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toggleItem(list: string[], value: string) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

export default function ProfileScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { user } = useAuth();
  const { showToast } = useToast();
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [customCondition, setCustomCondition] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [medSchedule, setMedSchedule] = useState<string[]>(['Morning']);
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPES[0]);
  const [appointmentTiming, setAppointmentTiming] = useState(APPOINTMENT_TIMINGS[0]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNote, setAppointmentNote] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Validation errors
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [customConditionError, setCustomConditionError] = useState<string | null>(null);
  const [medicationError, setMedicationError] = useState<string | null>(null);
  const [appointmentDateError, setAppointmentDateError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(stored) });
      }
    } catch (error) {
      devLog.error('Failed to load profile:', error);
    }
  }, []);

  useEffect(() => {
    loadProfile().then(() => setIsReady(true));
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => {
    if (!isReady) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch((error) => {
        devLog.error('Failed to save profile:', error);
      });
    }, 400);

    // Cleanup: clear timer on unmount or when dependencies change
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [profile, isReady]);

  useEffect(() => {
    if (user?.name && !profile.displayName) {
      setProfile((prev) => ({ ...prev, displayName: user.name }));
    }
  }, [user?.name, profile.displayName]);

  const profileCompletion = useMemo(() => {
    const total = 6;
    let score = 0;
    if (profile.displayName) score += 1;
    if (profile.pronouns) score += 1;
    if (profile.ageRange) score += 1;
    if (profile.goals.length > 0) score += 1;
    if (profile.activityLevel) score += 1;
    if (profile.preferredTimes.length > 0) score += 1;
    return Math.round((score / total) * 100);
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleToggleSingle = useCallback(
    (field: keyof ProfileData, value: string) => {
      updateProfile({ [field]: profile[field] === value ? null : value } as Partial<ProfileData>);
    },
    [profile, updateProfile]
  );

  const handleToggleMulti = useCallback(
    (field: keyof ProfileData, value: string) => {
      updateProfile({ [field]: toggleItem(profile[field] as string[], value) } as Partial<ProfileData>);
    },
    [profile, updateProfile]
  );

  const handleToggleCondition = useCallback(
    (value: string) => {
      if (value === 'None') {
        updateProfile({ conditions: ['None'] });
        return;
      }

      const withoutNone = profile.conditions.filter((item) => item !== 'None');
      const next = toggleItem(withoutNone, value);
      updateProfile({ conditions: next });
    },
    [profile.conditions, updateProfile]
  );

  const handleAddCondition = useCallback(() => {
    const validation = validateTextField(customCondition, {
      required: true,
      minLength: 2,
      maxLength: 50,
      fieldName: 'Condition',
    });

    if (!validation.isValid) {
      setCustomConditionError(validation.error || null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const trimmed = customCondition.trim();
    const next = toggleItem(profile.conditions, trimmed);
    updateProfile({ conditions: next });
    setCustomCondition('');
    setCustomConditionError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Condition added', { type: 'success' });
  }, [customCondition, profile.conditions, updateProfile, showToast]);

  const handleAddMedication = useCallback(() => {
    const validation = validateTextField(medicationInput, {
      required: true,
      minLength: 2,
      maxLength: 100,
      fieldName: 'Medication name',
    });

    if (!validation.isValid) {
      setMedicationError(validation.error || null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(validation.error || 'Invalid medication name', { type: 'error' });
      return;
    }

    const name = medicationInput.trim();
    const entry: MedicationEntry = {
      id: createId(),
      name,
      schedule: medSchedule.length ? medSchedule : ['As needed'],
    };
    updateProfile({ medications: [entry, ...profile.medications] });
    setMedicationInput('');
    setMedSchedule(['Morning']);
    setMedicationError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Medication added', { type: 'success' });
  }, [medicationInput, medSchedule, profile.medications, updateProfile, showToast]);

  const handleToggleMedicationSchedule = useCallback(
    (value: string) => {
      Haptics.selectionAsync();
      setMedSchedule((prev) => toggleItem(prev, value));
    },
    []
  );

  const handleRemoveMedication = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      Alert.alert(
        'Remove Medication?',
        'This will remove this medication from your list.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              updateProfile({ medications: profile.medications.filter((item) => item.id !== id) });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Medication removed', { type: 'info' });
            },
          },
        ]
      );
    },
    [profile.medications, updateProfile, showToast]
  );

  const handleAddAppointment = useCallback(() => {
    // Validate date if provided
    if (appointmentDate.trim()) {
      const dateValidation = validateDate(appointmentDate);
      if (!dateValidation.isValid) {
        setAppointmentDateError(dateValidation.error || null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(dateValidation.error || 'Invalid date format', { type: 'error' });
        return;
      }
    }

    const entry: AppointmentEntry = {
      id: createId(),
      type: appointmentType,
      timing: appointmentTiming,
      date: appointmentDate.trim() || undefined,
      note: appointmentNote.trim() || undefined,
    };
    updateProfile({ appointments: [entry, ...profile.appointments] });
    setAppointmentDate('');
    setAppointmentNote('');
    setAppointmentDateError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Appointment added', { type: 'success' });
  }, [appointmentType, appointmentTiming, appointmentDate, appointmentNote, profile.appointments, updateProfile, showToast]);

  const handleRemoveAppointment = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      Alert.alert(
        'Remove Appointment?',
        'This will remove this appointment from your list.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              updateProfile({ appointments: profile.appointments.filter((item) => item.id !== id) });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Appointment removed', { type: 'info' });
            },
          },
        ]
      );
    },
    [profile.appointments, updateProfile, showToast]
  );

  const togglePreference = useCallback(
    (key: keyof ProfilePreferences, value: boolean) => {
      Haptics.selectionAsync();
      updateProfile({ preferences: { ...profile.preferences, [key]: value } });
    },
    [profile.preferences, updateProfile]
  );

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: selected ? colors.primary + '20' : colors.surfaceAlt,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          compact && styles.chipTextCompact,
          { color: selected ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  if (!isReady) {
    return <LoadingView message="Loading profile..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, compact && styles.contentCompact]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <SectionHeader
            title="Profile"
            subtitle={`Profile completion: ${profileCompletion}%`}
            titleStyle={styles.sectionTitle}
            subtitleStyle={styles.sectionSubtitle}
          />

          <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Quick info</Text>
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
              placeholder="Display name"
              placeholderTextColor={colors.textTertiary}
              value={profile.displayName}
              onChangeText={(value) => updateProfile({ displayName: value })}
              accessible={true}
              accessibilityLabel="Display name"
              accessibilityHint="Enter your name as you'd like it to appear"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Pronouns</Text>
            <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
              {PRONOUNS.map((option) =>
                renderChip(option, profile.pronouns === option, () =>
                  handleToggleSingle('pronouns', option)
                )
              )}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Age range</Text>
            <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
              {AGE_RANGES.map((option) =>
                renderChip(option, profile.ageRange === option, () =>
                  handleToggleSingle('ageRange', option)
                )
              )}
            </View>
          </GlassCard>

          {profile.preferences.showTraining && (
            <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Training preferences
              </Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Goals</Text>
              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {GOALS.map((goal) =>
                  renderChip(goal, profile.goals.includes(goal), () =>
                    handleToggleMulti('goals', goal)
                  )
                )}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Activity level</Text>
              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {ACTIVITY_LEVELS.map((level) =>
                  renderChip(level, profile.activityLevel === level, () =>
                    handleToggleSingle('activityLevel', level)
                  )
                )}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Preferred times</Text>
              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {PREFERRED_TIMES.map((time) =>
                  renderChip(time, profile.preferredTimes.includes(time), () =>
                    handleToggleMulti('preferredTimes', time)
                  )
                )}
              </View>
            </GlassCard>
          )}

          {profile.preferences.showHealth && (
            <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Health snapshot</Text>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Tap any item that applies. These help us track appointments and medication reminders.
              </Text>

              {HEALTH_CONDITIONS.map((condition) => {
                const isSelected = profile.conditions.includes(condition);
                return (
                  <Pressable
                    key={condition}
                    onPress={() => {
                      Haptics.selectionAsync();
                      handleToggleCondition(condition);
                    }}
                    style={[
                      styles.checkRow,
                      compact && styles.checkRowCompact,
                      {
                        backgroundColor: isSelected ? colors.primary + '16' : colors.surfaceAlt,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Icon
                      name={isSelected ? 'check-square' : 'square'}
                      size={18}
                      color={isSelected ? colors.primary : colors.textTertiary}
                    />
                    <Text style={[styles.checkText, { color: colors.textPrimary }]}>
                      {condition}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={[styles.inlineRow, compact && styles.inlineRowCompact]}>
                <TextInput
                  style={[
                    styles.input,
                    compact && styles.inputCompact,
                    styles.inlineInput,
                    {
                      backgroundColor: colors.backgroundAlt,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Add a condition"
                  placeholderTextColor={colors.textTertiary}
                  value={customCondition}
                  onChangeText={setCustomCondition}
                  accessible={true}
                  accessibilityLabel="Custom health condition"
                  accessibilityHint="Enter a health condition not listed above"
                />
                <Button
                  title="Add"
                  onPress={handleAddCondition}
                  variant="secondary"
                  accessible={true}
                  accessibilityLabel="Add custom condition"
                  accessibilityHint="Adds the entered condition to your health profile"
                  accessibilityRole="button"
                />
              </View>
            </GlassCard>
          )}

          {profile.preferences.showAppointments && (
            <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Appointments</Text>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Choose a type and timing to add quickly.
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {APPOINTMENT_TYPES.map((type) =>
                  renderChip(type, appointmentType === type, () => setAppointmentType(type))
                )}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Timing</Text>
              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {APPOINTMENT_TIMINGS.map((timing) =>
                  renderChip(timing, appointmentTiming === timing, () => setAppointmentTiming(timing))
                )}
              </View>

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
                placeholder="Date (optional, e.g. 03/12)"
                placeholderTextColor={colors.textTertiary}
                value={appointmentDate}
                onChangeText={setAppointmentDate}
                accessible={true}
                accessibilityLabel="Appointment date"
                accessibilityHint="Optional: Enter appointment date in format like 03/12"
              />
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
                placeholder="Note (optional)"
                placeholderTextColor={colors.textTertiary}
                value={appointmentNote}
                onChangeText={setAppointmentNote}
                accessible={true}
                accessibilityLabel="Appointment note"
                accessibilityHint="Optional: Add any notes about this appointment"
              />

              <Button
                title="Add appointment"
                onPress={handleAddAppointment}
                variant="primary"
                fullWidth
                accessible={true}
                accessibilityLabel="Add appointment"
                accessibilityHint="Saves this appointment to your schedule"
                accessibilityRole="button"
              />

              {profile.appointments.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No appointments yet.
                  </Text>
                </View>
              ) : (
                profile.appointments.map((appointment) => (
                  <View
                    key={appointment.id}
                    style={[
                      styles.listItem,
                      compact && styles.listItemCompact,
                      { borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.listItemHeader}>
                      <Text style={[styles.listItemTitle, { color: colors.textPrimary }]}>
                        {appointment.type}
                      </Text>
                      <Pressable
                        onPress={() => handleRemoveAppointment(appointment.id)}
                        accessible={true}
                        accessibilityLabel="Remove appointment"
                        accessibilityHint={`Removes ${appointment.type} appointment`}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                      {appointment.timing}
                      {appointment.date ? ` • ${appointment.date}` : ''}
                    </Text>
                    {appointment.note ? (
                      <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                        {appointment.note}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </GlassCard>
          )}

          {profile.preferences.showMedications && (
            <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Medications</Text>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Add common meds quickly, then choose a schedule.
              </Text>

              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {MEDICATION_TEMPLATES.map((template) =>
                  renderChip(template, medicationInput === template, () => setMedicationInput(template))
                )}
              </View>

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
                placeholder="Medication name"
                placeholderTextColor={colors.textTertiary}
                value={medicationInput}
                onChangeText={setMedicationInput}
                accessible={true}
                accessibilityLabel="Medication name"
                accessibilityHint="Enter the name of your medication"
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Schedule</Text>
              <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
                {MEDICATION_SCHEDULES.map((schedule) =>
                  renderChip(schedule, medSchedule.includes(schedule), () =>
                    handleToggleMedicationSchedule(schedule)
                  )
                )}
              </View>

              <Button
                title="Add medication"
                onPress={handleAddMedication}
                variant="primary"
                fullWidth
                accessible={true}
                accessibilityLabel="Add medication"
                accessibilityHint="Saves this medication to your profile"
                accessibilityRole="button"
              />

              {profile.medications.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No medications added.
                  </Text>
                </View>
              ) : (
                profile.medications.map((med) => (
                  <View
                    key={med.id}
                    style={[
                      styles.listItem,
                      compact && styles.listItemCompact,
                      { borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.listItemHeader}>
                      <Text style={[styles.listItemTitle, { color: colors.textPrimary }]}>
                        {med.name}
                      </Text>
                      <Pressable onPress={() => handleRemoveMedication(med.id)}>
                        <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                      {med.schedule.join(', ')}
                    </Text>
                  </View>
                ))
              )}
            </GlassCard>
          )}

          <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={14}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Customize view</Text>
            <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show training preferences</Text>
              <Switch
                value={profile.preferences.showTraining}
                onValueChange={(value) => togglePreference('showTraining', value)}
              />
            </View>
            <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show health snapshot</Text>
              <Switch
                value={profile.preferences.showHealth}
                onValueChange={(value) => togglePreference('showHealth', value)}
              />
            </View>
            <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show appointments</Text>
              <Switch
                value={profile.preferences.showAppointments}
                onValueChange={(value) => togglePreference('showAppointments', value)}
              />
            </View>
            <View style={[styles.toggleRow, compact && styles.toggleRowCompact]}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Show medications</Text>
              <Switch
                value={profile.preferences.showMedications}
                onValueChange={(value) => togglePreference('showMedications', value)}
              />
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
  fieldLabel: {
    ...TYPOGRAPHY.presets.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  helperText: {
    ...TYPOGRAPHY.presets.caption,
    marginBottom: SPACING.sm,
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
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: SPACING.xs,
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  checkRowCompact: {
    paddingVertical: SPACING.xs,
  },
  checkText: {
    ...TYPOGRAPHY.presets.body,
  },
  emptyBox: {
    paddingVertical: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.presets.caption,
  },
  listItem: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  listItemCompact: {
    marginTop: SPACING.xs,
    padding: SPACING.xs,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  listItemDetail: {
    ...TYPOGRAPHY.presets.caption,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  toggleRowCompact: {
    paddingVertical: 4,
  },
  toggleLabel: {
    ...TYPOGRAPHY.presets.body,
    flex: 1,
    paddingRight: SPACING.sm,
  },
});
