import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, TOUCH_TARGET } from '../theme/tokens';
import { ProfileStackParamList } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import ScreenChrome from '../components/ScreenChrome';
import { exportAndShare } from '../utils/dataExport';
import { importFromFile } from '../utils/dataImport';

type RowProps = {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  right?: React.ReactNode;
};

function SettingsRow({ label, value, icon, onPress, right }: RowProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => [
        styles.row,
        compact && styles.rowCompact,
        pressed && styles.rowPressed,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.rowIcon,
            compact && styles.rowIconCompact,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.rowIconText, compact && styles.rowIconTextCompact]}>{icon}</Text>
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
      </View>
      {right ? right : <Text style={[styles.chevron, { color: colors.textTertiary }]}>{'>'}</Text>}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { isDark, themeMode } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { preferences, updatePreferences } = usePreferences();
  const compact = preferences.compactMode;

  const [autoSync, setAutoSync] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [useCellular, setUseCellular] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportAndShare({ compress: true });
      if (result.success) {
        Alert.alert(
          'Export Successful',
          'Your data has been exported successfully. Share or save the file to keep your data safe.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Failed',
          result.error || 'Failed to export data. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Export Error',
        'An unexpected error occurred while exporting your data.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Data',
      'This will merge imported data with your existing data. Make sure you have a recent backup before proceeding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setIsImporting(true);
            try {
              const result = await importFromFile({ strategy: 'merge' });
              if (result.success) {
                Alert.alert(
                  'Import Successful',
                  `Imported ${result.imported || 0} items successfully.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Optionally reload the app or refresh data
                      },
                    },
                  ]
                );
              } else if (result.error === 'Import cancelled') {
                // User cancelled, no alert needed
              } else {
                Alert.alert(
                  'Import Failed',
                  result.error || 'Failed to import data. Please check the file and try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert(
                'Import Error',
                'An unexpected error occurred while importing your data.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenChrome withPadding={false}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, compact && styles.titleCompact, { color: colors.textPrimary }]}>
          Profile
        </Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact, { color: colors.textSecondary }]}>
          Manage your account, friends, and preferences
        </Text>

        <View
          style={[
            styles.section,
            compact && styles.sectionCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
          <SettingsRow
            icon="👤"
            label="Profile"
            value="Athlete"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingsRow
            icon="👥"
            label="Friends"
            value="Connections"
            onPress={() => navigation.navigate('Friends')}
          />
          <SettingsRow icon="⭐️" label="Membership" value="Free" />
          <SettingsRow icon="🎵" label="Connected Services" value="Spotify" />
        </View>

        <View
          style={[
            styles.section,
            compact && styles.sectionCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
          <SettingsRow
            icon="🎨"
            label="Theme"
            value={themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
            right={<ThemeToggle />}
          />
          <SettingsRow
            icon="📐"
            label="Compact layout"
            value={preferences.compactMode ? 'On' : 'Off'}
            onPress={() => updatePreferences({ compactMode: !preferences.compactMode })}
            right={
              <Switch
                value={preferences.compactMode}
                onValueChange={(value) => updatePreferences({ compactMode: value })}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '55' }}
                thumbColor={preferences.compactMode ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="🌀"
            label="Reduce motion"
            value={preferences.reduceMotion ? 'On' : 'Off'}
            onPress={() => updatePreferences({ reduceMotion: !preferences.reduceMotion })}
            right={
              <Switch
                value={preferences.reduceMotion}
                onValueChange={(value) => updatePreferences({ reduceMotion: value })}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '55' }}
                thumbColor={preferences.reduceMotion ? colors.primary : colors.textTertiary}
              />
            }
          />
        </View>

        <View
          style={[
            styles.section,
            compact && styles.sectionCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Training</Text>
          <SettingsRow
            icon="🔁"
            label="Auto sync workouts"
            onPress={() => setAutoSync((prev) => !prev)}
            right={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '55' }}
                thumbColor={autoSync ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="📶"
            label="Use cellular data"
            onPress={() => setUseCellular((prev) => !prev)}
            right={
              <Switch
                value={useCellular}
                onValueChange={setUseCellular}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '55' }}
                thumbColor={useCellular ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="⏰"
            label="Workout reminders"
            value="Customize"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View
          style={[
            styles.section,
            compact && styles.sectionCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notifications</Text>
          <SettingsRow
            icon="🔔"
            label="Notification settings"
            value="Reminders & alerts"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View
          style={[
            styles.section,
            compact && styles.sectionCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Personalization</Text>
          <SettingsRow
            icon="✨"
            label="Haptics"
            value={preferences.hapticsEnabled ? 'On' : 'Off'}
            onPress={() => updatePreferences({ hapticsEnabled: !preferences.hapticsEnabled })}
            right={
              <Switch
                value={preferences.hapticsEnabled}
                onValueChange={(value) => updatePreferences({ hapticsEnabled: value })}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '55' }}
                thumbColor={preferences.hapticsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Privacy & Data</Text>
          <SettingsRow
            icon="🔒"
            label="Private mode"
            onPress={() => setPrivacyMode((prev) => !prev)}
            right={
              <Switch
                value={privacyMode}
                onValueChange={setPrivacyMode}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '55' }}
                thumbColor={privacyMode ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="📤"
            label="Export data"
            value="Backup your workouts & settings"
            onPress={handleExportData}
            right={
              isExporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.chevron, { color: colors.textTertiary }]}>{'>'}</Text>
              )
            }
          />
          <SettingsRow
            icon="📥"
            label="Import data"
            value="Restore from backup"
            onPress={handleImportData}
            right={
              isImporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.chevron, { color: colors.textTertiary }]}>{'>'}</Text>
              )
            }
          />
          <SettingsRow icon="🗑️" label="Delete account" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Support</Text>
          <SettingsRow icon="💬" label="Help center" />
          <SettingsRow icon="🧩" label="Report a problem" />
          <SettingsRow icon="ℹ️" label="About" value={`v${appVersion}`} />
        </View>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    paddingTop: SPACING.base,
    gap: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleCompact: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  subtitleCompact: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  section: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionCompact: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    minHeight: TOUCH_TARGET.comfortable,
    gap: SPACING.sm,
  },
  rowCompact: {
    paddingVertical: SPACING.xs,
    minHeight: TOUCH_TARGET.min,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  rowIconText: {
    fontSize: 16,
  },
  rowIconTextCompact: {
    fontSize: 13,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    opacity: 0.7,
  },
  chevron: {
    fontSize: 16,
    opacity: 0.5,
    marginLeft: SPACING.sm,
  },
});
