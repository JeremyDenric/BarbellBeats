import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/tokens';
import { Button, SectionHeader } from '../components/UI';
import type { TrainingStackParamList } from '../types';

const OFFLINE_MODE_KEY = '@offline_mode_enabled';
const OFFLINE_QUEUE_KEY = '@offline_workout_queue';
const OFFLINE_SYNCED_KEY = '@offline_workout_synced';
const LAST_SYNC_KEY = '@offline_last_sync';
const TECHNIQUE_LOG_KEY = '@intensity_technique_logs';

type WorkoutLog = {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  repQuality?: number;
  technique?: string;
  createdAt: string;
};

type TechniqueLog = {
  id: string;
  technique: 'rest-pause' | 'drop-set';
  detail: string;
  createdAt: string;
};

type MobilityArea = 'hips' | 'shoulders' | 'ankles' | 't-spine';

type MobilityStep = {
  id: string;
  name: string;
  cue: string;
  durationSec: number;
};

const REP_QUALITY_GUIDE = [
  { score: 1, label: 'Breakdown', guidance: 'Form breaks early. Cut load 10-15%.' },
  { score: 2, label: 'Shaky', guidance: 'Noticeable form drift. Hold load and clean up.' },
  { score: 3, label: 'Solid', guidance: 'Acceptable reps. Repeat load and add reps.' },
  { score: 4, label: 'Strong', guidance: 'Clean reps. Add 2.5-5 next time.' },
  { score: 5, label: 'Crisp', guidance: 'Fast and stable. Progress weight or difficulty.' },
];

const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

const MOBILITY_LIBRARY: Record<MobilityArea, Array<{ name: string; cue: string }>> = {
  hips: [
    { name: '90/90 Switch', cue: 'Stay tall, slow transitions.' },
    { name: 'Hip Airplane', cue: 'Control the hip rotation.' },
    { name: 'Couch Stretch', cue: 'Squeeze glute, ribs down.' },
    { name: 'Frog Stretch', cue: 'Exhale and sink.' },
    { name: 'Pigeon Prep', cue: 'Square hips, long spine.' },
    { name: 'Lateral Lunge Hold', cue: 'Push knee out, heel flat.' },
    { name: 'Adductor Rockback', cue: 'Neutral spine, slow rocks.' },
    { name: 'Glute Bridge Hold', cue: 'Posterior tilt first.' },
  ],
  shoulders: [
    { name: 'Wall Slides', cue: 'Keep ribs down.' },
    { name: 'Thread the Needle', cue: 'Breathe into upper back.' },
    { name: 'Band Pull Aparts', cue: 'Pause at full reach.' },
    { name: 'Doorway Stretch', cue: 'No shrugging.' },
    { name: 'Scap Push Ups', cue: 'Move only shoulder blades.' },
    { name: 'Sleeper Stretch', cue: 'Gentle pressure.' },
    { name: 'Overhead Reach', cue: 'Thumbs back, ribs down.' },
    { name: 'Prone Y Hold', cue: 'Lift lightly, control down.' },
  ],
  ankles: [
    { name: 'Knee to Wall', cue: 'Keep heel down.' },
    { name: 'Calf Stretch', cue: 'Straight then bent knee.' },
    { name: 'Tibialis Raises', cue: 'Slow lowering.' },
    { name: 'Ankle Circles', cue: 'Full range, steady pace.' },
    { name: 'Split Squat Hold', cue: 'Drive knee forward.' },
    { name: 'Heel Raises', cue: 'Pause at top.' },
    { name: 'Toe Stretch', cue: 'Light pressure.' },
    { name: 'Foot Rolling', cue: 'Even pressure.' },
  ],
  't-spine': [
    { name: 'Open Books', cue: 'Keep knees stacked.' },
    { name: 'Cat Cow', cue: 'Move one segment at a time.' },
    { name: 'Thoracic Extension', cue: 'Extend over the roller.' },
    { name: 'Child Pose Reach', cue: 'Long exhale.' },
    { name: 'Thread the Needle', cue: 'Rotate from mid back.' },
    { name: 'Quadruped Reach', cue: 'Reach long, breathe.' },
    { name: 'Side Bend Hold', cue: 'Stay tall.' },
    { name: 'Seated Twist', cue: 'Grow tall, rotate.' },
  ],
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Never synced';
  return new Date(iso).toLocaleString();
}

function calculatePlates(totalWeight: number, barWeight: number, plates: number[]) {
  const load = totalWeight - barWeight;
  if (load < 0) {
    return { error: 'Target is below the bar weight.', perSide: 0, remaining: 0, list: [] };
  }
  const perSide = load / 2;
  let remaining = perSide;
  const list: Array<{ plate: number; count: number }> = [];

  plates.forEach((plate) => {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      list.push({ plate, count });
      remaining = Number((remaining - plate * count).toFixed(2));
    }
  });

  return { error: '', perSide, remaining, list };
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function WorkoutToolsScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const navigation = useNavigation<NativeStackNavigationProp<TrainingStackParamList>>();

  const [offlineMode, setOfflineMode] = useState(false);
  const [queue, setQueue] = useState<WorkoutLog[]>([]);
  const [syncedLogs, setSyncedLogs] = useState<WorkoutLog[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [repQuality, setRepQuality] = useState<number | null>(null);

  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState(45);

  const [techniqueMode, setTechniqueMode] = useState<'rest-pause' | 'drop-set'>('rest-pause');
  const [baseWeight, setBaseWeight] = useState('');
  const [baseReps, setBaseReps] = useState('');
  const [pauseReps, setPauseReps] = useState('4');
  const [pauseCount, setPauseCount] = useState('2');
  const [pauseRest, setPauseRest] = useState('15');
  const [dropPercent, setDropPercent] = useState('20');
  const [dropCount, setDropCount] = useState('2');
  const [techniqueLogs, setTechniqueLogs] = useState<TechniqueLog[]>([]);

  const [mobilityArea, setMobilityArea] = useState<MobilityArea>('hips');
  const [mobilityFlow, setMobilityFlow] = useState<MobilityStep[]>([]);

  const loadStorage = useCallback(async () => {
    const [modeRaw, queueRaw, syncedRaw, lastSyncRaw, techniqueRaw] = await Promise.all([
      AsyncStorage.getItem(OFFLINE_MODE_KEY),
      AsyncStorage.getItem(OFFLINE_QUEUE_KEY),
      AsyncStorage.getItem(OFFLINE_SYNCED_KEY),
      AsyncStorage.getItem(LAST_SYNC_KEY),
      AsyncStorage.getItem(TECHNIQUE_LOG_KEY),
    ]);

    setOfflineMode(modeRaw === '1');
    setQueue(queueRaw ? JSON.parse(queueRaw) : []);
    setSyncedLogs(syncedRaw ? JSON.parse(syncedRaw) : []);
    setLastSync(lastSyncRaw || null);
    setTechniqueLogs(techniqueRaw ? JSON.parse(techniqueRaw) : []);
  }, []);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  useEffect(() => {
    if (unit === 'lb') {
      setBarWeight(45);
      return;
    }
    setBarWeight(20);
  }, [unit]);

  const plateResult = useMemo(() => {
    const weightValue = Number(targetWeight);
    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      return null;
    }
    const plates = unit === 'lb' ? PLATES_LB : PLATES_KG;
    return calculatePlates(weightValue, barWeight, plates);
  }, [targetWeight, barWeight, unit]);

  const techniquePreview = useMemo(() => {
    const weightValue = Number(baseWeight);
    const repsValue = Number(baseReps);
    if (!Number.isFinite(weightValue) || !Number.isFinite(repsValue) || repsValue <= 0 || weightValue <= 0) {
      return '';
    }

    if (techniqueMode === 'rest-pause') {
      const miniReps = Math.max(0, Number(pauseReps) || 0);
      const pauses = Math.max(0, Number(pauseCount) || 0);
      const series = [repsValue, ...Array.from({ length: pauses }, () => miniReps)];
      const sequence = series.join(' + ');
      return `${sequence} reps @ ${weightValue} with ${pauseRest}s rests`;
    }

    const drops = Math.max(0, Number(dropCount) || 0);
    const percent = Math.max(0, Number(dropPercent) || 0) / 100;
    let currentWeight = weightValue;
    const sequence = [currentWeight.toFixed(1)];
    for (let i = 0; i < drops; i += 1) {
      currentWeight = Number((currentWeight * (1 - percent)).toFixed(1));
      sequence.push(currentWeight.toFixed(1));
    }
    return `Drop set weights: ${sequence.join(' -> ')} (reps ${repsValue} each)`;
  }, [baseWeight, baseReps, techniqueMode, pauseReps, pauseCount, pauseRest, dropCount, dropPercent]);

  const repQualityHint = useMemo(() => {
    if (!repQuality) return 'Select a quality score to see progression guidance.';
    const match = REP_QUALITY_GUIDE.find((item) => item.score === repQuality);
    return match?.guidance || '';
  }, [repQuality]);

  const handleToggleOffline = async (value: boolean) => {
    setOfflineMode(value);
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, value ? '1' : '0');
  };

  const handleSaveSet = async () => {
    const weightValue = Number(weight);
    const repsValue = Number(reps);
    if (!exercise.trim() || !Number.isFinite(weightValue) || !Number.isFinite(repsValue)) {
      return;
    }

    const entry: WorkoutLog = {
      id: createId(),
      exercise: exercise.trim(),
      weight: weightValue,
      reps: repsValue,
      repQuality: repQuality ?? undefined,
      createdAt: new Date().toISOString(),
    };

    if (offlineMode) {
      const nextQueue = [entry, ...queue];
      setQueue(nextQueue);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQueue));
    } else {
      const nextSynced = [entry, ...syncedLogs];
      setSyncedLogs(nextSynced);
      await AsyncStorage.setItem(OFFLINE_SYNCED_KEY, JSON.stringify(nextSynced));
      const now = new Date().toISOString();
      setLastSync(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
    }

    setExercise('');
    setWeight('');
    setReps('');
  };

  const handleSync = async () => {
    if (queue.length === 0) return;
    const nextSynced = [...queue, ...syncedLogs];
    setSyncedLogs(nextSynced);
    setQueue([]);
    await Promise.all([
      AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([])),
      AsyncStorage.setItem(OFFLINE_SYNCED_KEY, JSON.stringify(nextSynced)),
    ]);
    const now = new Date().toISOString();
    setLastSync(now);
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);
  };

  const handleLogTechnique = async () => {
    if (!techniquePreview) return;
    const entry: TechniqueLog = {
      id: createId(),
      technique: techniqueMode,
      detail: techniquePreview,
      createdAt: new Date().toISOString(),
    };
    const nextLogs = [entry, ...techniqueLogs].slice(0, 6);
    setTechniqueLogs(nextLogs);
    await AsyncStorage.setItem(TECHNIQUE_LOG_KEY, JSON.stringify(nextLogs));
  };

  const handleGenerateFlow = () => {
    const pool = MOBILITY_LIBRARY[mobilityArea];
    const steps = shuffle(pool).slice(0, 8).map((step) => ({
      id: createId(),
      name: step.name,
      cue: step.cue,
      durationSec: 60,
    }));
    setMobilityFlow(steps);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Progress Tracking"
          subtitle="Visualize progress with charts, milestones, and insights."
        />
        <Pressable
          onPress={() => navigation.navigate('ProgressTracking')}
          style={({ pressed }) => [
            styles.card,
            styles.ctaCard,
            compact && styles.cardCompact,
            compact && styles.ctaCardCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={styles.ctaBody}>
            <View
              style={[
                styles.ctaIcon,
                compact && styles.ctaIconCompact,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text style={[styles.ctaEmoji, compact && styles.ctaEmojiCompact]}>📊</Text>
            </View>
            <View style={styles.ctaText}>
              <Text style={[styles.ctaTitle, compact && styles.ctaTitleCompact, { color: colors.textPrimary }]}>
                Open Tracking
              </Text>
              <Text style={[styles.ctaSubtitle, compact && styles.ctaSubtitleCompact, { color: colors.textSecondary }]}>
                Monthly reports and AI insights
              </Text>
            </View>
          </View>
          <Text style={[styles.ctaChevron, compact && styles.ctaChevronCompact, { color: colors.textTertiary }]}>
            {'>'}
          </Text>
        </Pressable>
        <SectionHeader
          title="Offline Gym Mode"
          subtitle="Log everything without signal and sync later."
        />
        <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Offline mode</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Queue sets locally until you sync.
              </Text>
            </View>
            <Switch value={offlineMode} onValueChange={handleToggleOffline} />
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Pending: {queue.length}
            </Text>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Last sync: {formatDate(lastSync)}
            </Text>
          </View>
          <View style={[styles.formRow, compact && styles.formRowCompact]}>
            <TextInput
              style={[
                styles.input,
                compact && styles.inputCompact,
                { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
              ]}
              placeholder="Exercise"
              placeholderTextColor={colors.textTertiary}
              value={exercise}
              onChangeText={setExercise}
            />
            <View style={[styles.row, compact && styles.rowCompact]}>
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Weight"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Reps"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={reps}
                onChangeText={setReps}
              />
            </View>
            <Text style={[styles.label, compact && styles.labelCompact, { color: colors.textSecondary }]}>
              Rep quality
            </Text>
            <View style={[styles.ratingRow, compact && styles.ratingRowCompact]}>
              {REP_QUALITY_GUIDE.map((item) => (
                <Pressable
                  key={item.score}
                  onPress={() => setRepQuality(item.score)}
                  style={[
                    styles.ratingPill,
                    compact && styles.ratingPillCompact,
                    {
                      borderColor: repQuality === item.score ? colors.primary : colors.border,
                      backgroundColor: repQuality === item.score ? colors.primary + '20' : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text style={[styles.ratingText, compact && styles.ratingTextCompact, { color: colors.textPrimary }]}>
                    {item.score}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              title={offlineMode ? 'Save to Queue' : 'Save Set'}
              onPress={handleSaveSet}
              disabled={!exercise.trim() || !weight || !reps}
            />
            <Button
              title="Sync Now"
              variant="secondary"
              onPress={handleSync}
              disabled={offlineMode || queue.length === 0}
            />
          </View>
        </View>

        <SectionHeader
          title="Plate Math Assistant"
          subtitle="Get plates per side instantly."
        />
        <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, compact && styles.rowCompact]}>
            <Pressable
              onPress={() => setUnit('lb')}
              style={[
                styles.segment,
                compact && styles.segmentCompact,
                {
                  borderColor: unit === 'lb' ? colors.primary : colors.border,
                  backgroundColor: unit === 'lb' ? colors.primary + '20' : colors.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.segmentText, compact && styles.segmentTextCompact, { color: colors.textPrimary }]}>
                LB
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setUnit('kg')}
              style={[
                styles.segment,
                compact && styles.segmentCompact,
                {
                  borderColor: unit === 'kg' ? colors.primary : colors.border,
                  backgroundColor: unit === 'kg' ? colors.primary + '20' : colors.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.segmentText, compact && styles.segmentTextCompact, { color: colors.textPrimary }]}>
                KG
              </Text>
            </Pressable>
          </View>
          <TextInput
            style={[
              styles.input,
              compact && styles.inputCompact,
              { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
            ]}
            placeholder={`Target weight (${unit})`}
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            value={targetWeight}
            onChangeText={setTargetWeight}
          />
          <View style={[styles.row, compact && styles.rowCompact]}>
            {(unit === 'lb' ? [45, 35] : [20, 15]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setBarWeight(option)}
                style={[
                  styles.segment,
                  compact && styles.segmentCompact,
                  {
                    borderColor: barWeight === option ? colors.primary : colors.border,
                    backgroundColor: barWeight === option ? colors.primary + '20' : colors.surfaceAlt,
                  },
                ]}
              >
                <Text style={[styles.segmentText, compact && styles.segmentTextCompact, { color: colors.textPrimary }]}>
                  {option} {unit}
                </Text>
              </Pressable>
            ))}
          </View>

          {plateResult && (
            <View style={styles.resultBox}>
              {plateResult.error ? (
                <Text style={[styles.resultText, compact && styles.resultTextCompact, { color: colors.error }]}>
                  {plateResult.error}
                </Text>
              ) : (
                <>
                  <Text style={[styles.resultText, compact && styles.resultTextCompact, { color: colors.textPrimary }]}>
                    Per side: {plateResult.perSide.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.resultText, compact && styles.resultTextCompact, { color: colors.textSecondary }]}>
                    {plateResult.list.length > 0
                      ? plateResult.list.map((item) => `${item.plate} x${item.count}`).join(', ')
                      : 'No plates needed.'}
                  </Text>
                  {plateResult.remaining > 0 && (
                    <Text style={[styles.resultHint, compact && styles.resultHintCompact, { color: colors.textTertiary }]}>
                      Remainder: {plateResult.remaining.toFixed(2)} {unit}
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
        </View>

        <SectionHeader
          title="Rest-Pause and Drop-Set Builder"
          subtitle="Auto-log intensity technique details."
        />
        <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, compact && styles.rowCompact]}>
            <Pressable
              onPress={() => setTechniqueMode('rest-pause')}
              style={[
                styles.segment,
                compact && styles.segmentCompact,
                {
                  borderColor: techniqueMode === 'rest-pause' ? colors.primary : colors.border,
                  backgroundColor: techniqueMode === 'rest-pause' ? colors.primary + '20' : colors.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.segmentText, compact && styles.segmentTextCompact, { color: colors.textPrimary }]}>
                Rest-pause
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTechniqueMode('drop-set')}
              style={[
                styles.segment,
                compact && styles.segmentCompact,
                {
                  borderColor: techniqueMode === 'drop-set' ? colors.primary : colors.border,
                  backgroundColor: techniqueMode === 'drop-set' ? colors.primary + '20' : colors.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.segmentText, compact && styles.segmentTextCompact, { color: colors.textPrimary }]}>
                Drop set
              </Text>
            </Pressable>
          </View>
          <View style={[styles.row, compact && styles.rowCompact]}>
            <TextInput
              style={[
                styles.input,
                compact && styles.inputCompact,
                styles.inputSmall,
                compact && styles.inputSmallCompact,
                { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
              ]}
              placeholder={`Weight (${unit})`}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={baseWeight}
              onChangeText={setBaseWeight}
            />
            <TextInput
              style={[
                styles.input,
                compact && styles.inputCompact,
                styles.inputSmall,
                compact && styles.inputSmallCompact,
                { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
              ]}
              placeholder="Reps"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={baseReps}
              onChangeText={setBaseReps}
            />
          </View>
          {techniqueMode === 'rest-pause' ? (
            <View style={[styles.row, compact && styles.rowCompact]}>
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Mini reps"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={pauseReps}
                onChangeText={setPauseReps}
              />
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Pauses"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={pauseCount}
                onChangeText={setPauseCount}
              />
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Rest (sec)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={pauseRest}
                onChangeText={setPauseRest}
              />
            </View>
          ) : (
            <View style={[styles.row, compact && styles.rowCompact]}>
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Drop %"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={dropPercent}
                onChangeText={setDropPercent}
              />
              <TextInput
                style={[
                  styles.input,
                  compact && styles.inputCompact,
                  styles.inputSmall,
                  compact && styles.inputSmallCompact,
                  { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
                ]}
                placeholder="Drops"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={dropCount}
                onChangeText={setDropCount}
              />
            </View>
          )}
          {techniquePreview ? (
            <Text style={[styles.previewText, compact && styles.previewTextCompact, { color: colors.textSecondary }]}>
              {techniquePreview}
            </Text>
          ) : (
            <Text style={[styles.previewText, compact && styles.previewTextCompact, { color: colors.textTertiary }]}>
              Enter weight and reps to preview the sequence.
            </Text>
          )}
          <Button
            title="Log Technique"
            onPress={handleLogTechnique}
            disabled={!techniquePreview}
          />
          {techniqueLogs.length > 0 && (
            <View style={[styles.list, compact && styles.listCompact]}>
              {techniqueLogs.slice(0, 3).map((log) => (
                <View
                  key={log.id}
                  style={[styles.listItem, compact && styles.listItemCompact, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[styles.listTitle, compact && styles.listTitleCompact, { color: colors.textPrimary }]}>
                    {log.technique === 'rest-pause' ? 'Rest-pause' : 'Drop set'}
                  </Text>
                  <Text style={[styles.listDetail, compact && styles.listDetailCompact, { color: colors.textSecondary }]}>
                    {log.detail}
                  </Text>
                  <Text style={[styles.listMeta, compact && styles.listMetaCompact, { color: colors.textTertiary }]}>
                    {new Date(log.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <SectionHeader
          title="Rep Quality Rating"
          subtitle="Learn what quality scores mean for progression."
        />
        <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSubtitle, compact && styles.cardSubtitleCompact, { color: colors.textSecondary }]}>
            Score each set to guide the next session.
          </Text>
          <View style={[styles.ratingRow, compact && styles.ratingRowCompact]}>
            {REP_QUALITY_GUIDE.map((item) => (
              <Pressable
                key={`rep-${item.score}`}
                onPress={() => setRepQuality(item.score)}
                style={[
                  styles.ratingPill,
                  compact && styles.ratingPillCompact,
                  {
                    borderColor: repQuality === item.score ? colors.primary : colors.border,
                    backgroundColor: repQuality === item.score ? colors.primary + '20' : colors.surfaceAlt,
                  },
                ]}
              >
                <Text style={[styles.ratingText, compact && styles.ratingTextCompact, { color: colors.textPrimary }]}>
                  {item.score}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.previewText, compact && styles.previewTextCompact, { color: colors.textSecondary }]}>
            {repQualityHint}
          </Text>
          <View style={[styles.list, compact && styles.listCompact]}>
            {REP_QUALITY_GUIDE.map((item) => (
              <View
                key={`guide-${item.score}`}
                style={[styles.listItem, compact && styles.listItemCompact, { backgroundColor: colors.surfaceAlt }]}
              >
                <Text style={[styles.listTitle, compact && styles.listTitleCompact, { color: colors.textPrimary }]}>
                  {item.score} - {item.label}
                </Text>
                <Text style={[styles.listDetail, compact && styles.listDetailCompact, { color: colors.textSecondary }]}>
                  {item.guidance}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <SectionHeader
          title="Mobility Flow Generator"
          subtitle="Daily 8-minute flows for tight areas."
        />
        <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, compact && styles.rowCompact]}>
            {(['hips', 'shoulders', 'ankles', 't-spine'] as MobilityArea[]).map((area) => (
              <Pressable
                key={area}
                onPress={() => setMobilityArea(area)}
                style={[
                  styles.segment,
                  compact && styles.segmentCompact,
                  {
                    borderColor: mobilityArea === area ? colors.primary : colors.border,
                    backgroundColor: mobilityArea === area ? colors.primary + '20' : colors.surfaceAlt,
                  },
                ]}
              >
                <Text style={[styles.segmentText, compact && styles.segmentTextCompact, { color: colors.textPrimary }]}>
                  {area}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button title="Generate 8-minute Flow" onPress={handleGenerateFlow} />
          {mobilityFlow.length > 0 && (
            <View style={[styles.list, compact && styles.listCompact]}>
              {mobilityFlow.map((step, index) => (
                <View
                  key={step.id}
                  style={[styles.listItem, compact && styles.listItemCompact, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[styles.listTitle, compact && styles.listTitleCompact, { color: colors.textPrimary }]}>
                    {index + 1}. {step.name} ({step.durationSec}s)
                  </Text>
                  <Text style={[styles.listDetail, compact && styles.listDetailCompact, { color: colors.textSecondary }]}>
                    {step.cue}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    padding: SPACING.md,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardCompact: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  ctaCardCompact: {
    marginBottom: SPACING.xs,
  },
  ctaBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIconCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  ctaEmoji: {
    fontSize: 20,
  },
  ctaEmojiCompact: {
    fontSize: 16,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  ctaTitleCompact: {
    fontSize: 14,
  },
  ctaSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
  ctaSubtitleCompact: {
    fontSize: 11,
  },
  ctaChevron: {
    fontSize: 18,
  },
  ctaChevronCompact: {
    fontSize: 16,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
  cardSubtitleCompact: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  rowCompact: {
    gap: SPACING.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  statusText: {
    fontSize: 12,
  },
  formRow: {
    gap: SPACING.sm,
  },
  formRowCompact: {
    gap: SPACING.xs,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  inputSmall: {
    flex: 1,
    minWidth: 90,
  },
  inputSmallCompact: {
    minWidth: 78,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  ratingRowCompact: {
    gap: 6,
  },
  ratingPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingPillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingTextCompact: {
    fontSize: 12,
  },
  segment: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  segmentTextCompact: {
    fontSize: 12,
  },
  resultBox: {
    marginTop: SPACING.xs,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultTextCompact: {
    fontSize: 12,
  },
  resultHint: {
    fontSize: 12,
    marginTop: 4,
  },
  resultHintCompact: {
    fontSize: 11,
  },
  previewText: {
    fontSize: 12,
  },
  previewTextCompact: {
    fontSize: 11,
  },
  list: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  listCompact: {
    gap: 6,
  },
  listItem: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  listItemCompact: {
    padding: SPACING.xs,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  listTitleCompact: {
    fontSize: 12,
  },
  listDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  listDetailCompact: {
    fontSize: 11,
  },
  listMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  listMetaCompact: {
    fontSize: 10,
  },
});
