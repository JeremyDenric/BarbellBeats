/**
 * AddCardioEntryScreen
 * Journal-style form to log a cardio session manually.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { TrainingStackParamList, CardioActivityType } from '../../types';
import { useCardioLog } from '../../hooks/useCardioLog';
import { copyToDocuments, resolvePhotoUri } from '../../utils/imageStorage';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Icon, IconName } from '../../components/Icon';
import { COLORS, IOS_COLORS, SIGNAL, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { mediumTap, success } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<TrainingStackParamList>;
type Route = RouteProp<TrainingStackParamList, 'AddCardioEntry'>;

// ─── Activity type metadata ───────────────────────────────────────────────────

const ACTIVITY_TYPES: Array<{ type: CardioActivityType; icon: IconName; label: string }> = [
  { type: 'running',   icon: 'person-run',  label: 'Run'       },
  { type: 'cycling',   icon: 'bicycle',     label: 'Cycle'     },
  { type: 'walking',   icon: 'person-walk', label: 'Walk'      },
  { type: 'rowing',    icon: 'rowing',      label: 'Row'       },
  { type: 'elliptical',icon: 'lightning',   label: 'Elliptical'},
  { type: 'stairs',    icon: 'stairs',      label: 'Stairs'    },
  { type: 'other',     icon: 'heart',       label: 'Other'     },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseDate(str: string): number {
  const d = new Date(str);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AddCardioEntryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const { addEntry } = useCardioLog();

  const [activityType, setActivityType] = useState<CardioActivityType>(
    (route.params?.activityType as CardioActivityType) ?? 'running'
  );
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(todayString());
  const [durationStr, setDurationStr] = useState('');
  const [distanceStr, setDistanceStr] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach photos to entries.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      const permanent = await copyToDocuments(result.assets[0].uri);
      setPhotos((prev) => [...prev, permanent]);
    }
  }, []);

  const handleRemovePhoto = useCallback((uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }, []);

  const handleSave = useCallback(async () => {
    const duration = parseFloat(durationStr);
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for this entry.');
      return;
    }
    if (!durationStr.trim() || isNaN(duration) || duration <= 0) {
      Alert.alert('Missing duration', 'Please enter how long the session was.');
      return;
    }

    setSaving(true);
    mediumTap();
    try {
      await addEntry({
        type: activityType,
        title: title.trim(),
        date: parseDate(dateStr),
        duration,
        distance: distanceStr ? parseFloat(distanceStr) || undefined : undefined,
        notes: notes.trim(),
        photos,
      });
      success();
      navigation.navigate('CardioLog');
    } finally {
      setSaving(false);
    }
  }, [activityType, addEntry, dateStr, distanceStr, durationStr, navigation, notes, photos, title]);

  const inputStyle = [
    styles.input,
    { color: iosColors.label, borderColor: colors.border, backgroundColor: iosColors.secondarySystemGroupedBackground },
  ];
  const labelStyle = [styles.label, { color: iosColors.secondaryLabel }];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: iosColors.systemGroupedBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Nav bar */}
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.navCancel, { color: iosColors.tint }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.navTitle, { color: iosColors.label }]}>Log Cardio</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.navSave, { color: saving ? iosColors.tertiaryLabel : SIGNAL.forge }]}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Activity type picker */}
          <Text style={[labelStyle, styles.sectionLabel]}>ACTIVITY TYPE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}
          >
            {ACTIVITY_TYPES.map(({ type, icon, label }) => {
              const selected = activityType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setActivityType(type)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: selected
                        ? SIGNAL.forge
                        : iosColors.secondarySystemGroupedBackground,
                      borderColor: selected ? SIGNAL.forge : colors.border,
                    },
                  ]}
                >
                  <Icon
                    name={icon}
                    size="sm"
                    color={selected ? (isDark ? '#0A0A0A' : '#fff') : iosColors.secondaryLabel}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: selected ? (isDark ? '#0A0A0A' : '#fff') : iosColors.label },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Title */}
          <Text style={labelStyle}>TITLE</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Morning Run"
            placeholderTextColor={iosColors.tertiaryLabel}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            autoCapitalize="words"
          />

          {/* Date */}
          <Text style={labelStyle}>DATE</Text>
          <TextInput
            style={inputStyle}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={iosColors.tertiaryLabel}
            value={dateStr}
            onChangeText={setDateStr}
            keyboardType="numbers-and-punctuation"
            returnKeyType="next"
          />

          {/* Duration + Distance row */}
          <View style={styles.rowFields}>
            <View style={styles.rowField}>
              <Text style={labelStyle}>DURATION (MIN)</Text>
              <TextInput
                style={inputStyle}
                placeholder="30"
                placeholderTextColor={iosColors.tertiaryLabel}
                value={durationStr}
                onChangeText={setDurationStr}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
            <View style={styles.rowField}>
              <Text style={labelStyle}>DISTANCE (KM)</Text>
              <TextInput
                style={inputStyle}
                placeholder="Optional"
                placeholderTextColor={iosColors.tertiaryLabel}
                value={distanceStr}
                onChangeText={setDistanceStr}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Notes */}
          <Text style={labelStyle}>NOTES</Text>
          <TextInput
            style={[inputStyle, styles.notesInput]}
            placeholder="How did it feel? Anything notable..."
            placeholderTextColor={iosColors.tertiaryLabel}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Photos */}
          <Text style={labelStyle}>PHOTOS</Text>
          <View style={styles.photoGrid}>
            {photos.map((filename) => (
              <View key={filename} style={styles.photoWrapper}>
                <Image source={{ uri: resolvePhotoUri(filename) }} style={styles.photo} />
                <Pressable
                  onPress={() => handleRemovePhoto(filename)}
                  style={styles.photoRemove}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={styles.photoRemoveIcon}>✕</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 4 && (
              <Pressable
                onPress={handleAddPhoto}
                style={[
                  styles.addPhotoBtn,
                  { backgroundColor: iosColors.secondarySystemGroupedBackground, borderColor: colors.border },
                ]}
              >
                <Icon name="plus" size="md" color={iosColors.secondaryLabel} />
                <Text style={[styles.addPhotoLabel, { color: iosColors.secondaryLabel }]}>
                  Add Photo
                </Text>
              </Pressable>
            )}
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: saving ? iosColors.systemFill : SIGNAL.forge },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: isDark ? '#0A0A0A' : '#fff' }]}>
              {saving ? 'Saving...' : 'Save Entry'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navCancel: {
    fontSize: 17,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  navSave: {
    fontSize: 17,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.xs,
  },
  sectionLabel: {
    marginTop: SPACING.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: SPACING.base,
  },
  typeRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowField: {
    flex: 1,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
    marginTop: 2,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.sm,
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveIcon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  addPhotoBtn: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  saveBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
});
