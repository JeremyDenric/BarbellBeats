import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenChrome from '../../components/ScreenChrome';
import { Button, Badge } from '../../components/UI';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, SIGNAL, SPACING, RADIUS } from '../../theme/tokens';
import { usePrograms } from '../../contexts/ProgramContext';
import { useForgeMode } from '../../hooks/useForgeMode';
import { FORGE_PROGRAMS } from '../../data/forgePrograms';
import haptics from '../../utils/haptics';
import type { TrainingStackParamList } from '../../types';

type Props = NativeStackScreenProps<TrainingStackParamList, 'ForgeProgramDetail'>;
type NavProp = NativeStackNavigationProp<TrainingStackParamList>;

const GOAL_LABELS: Record<string, string> = {
  strength: 'STRENGTH',
  hypertrophy: 'HYPERTROPHY',
  endurance: 'ATHLETIC',
  powerlifting: 'POWERLIFTING',
  general: 'GENERAL',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

export default function ForgeProgramDetailScreen({ route }: Props) {
  const { programId } = route.params;
  const navigation = useNavigation<NavProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { startProgram } = usePrograms();
  const { isProgramLocked } = useForgeMode();

  const program = FORGE_PROGRAMS.find((p) => p.id === programId);

  if (!program) {
    return (
      <ScreenChrome>
        <View style={styles.centered}>
          <Text style={[styles.notFound, { color: colors.textSecondary }]}>
            Program not found.
          </Text>
        </View>
      </ScreenChrome>
    );
  }

  const locked = isProgramLocked(programId);
  const daysPerWeek = program.weeks[0]?.workouts.length ?? 0;

  const handleStart = useCallback(async () => {
    if (locked) {
      navigation.navigate('ForgePaywall');
      return;
    }
    haptics.mediumTap();
    try {
      await startProgram(programId);
      navigation.navigate('ForgeMain');
    } catch {
      Alert.alert('Error', 'Failed to start program. Please try again.');
    }
  }, [locked, startProgram, programId, navigation]);

  return (
    <ScreenChrome>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroMeta}>
            <Badge
              label={GOAL_LABELS[program.goal] ?? program.goal.toUpperCase()}
              variant="primary"
            />
            <Badge
              label={program.difficulty.toUpperCase()}
              variant={program.difficulty === 'beginner' ? 'success' : program.difficulty === 'intermediate' ? 'warning' : 'error'}
            />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{program.name}</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            {program.description}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: SIGNAL.forge }]}>
                {program.durationWeeks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Weeks</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: SIGNAL.forge }]}>{daysPerWeek}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Days/Week</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: SIGNAL.forge }]}>
                {program.estimatedTimePerWorkout}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Min/Session</Text>
            </View>
          </View>
        </View>

        {/* Equipment */}
        {program.equipmentRequired.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Equipment</Text>
            <View style={styles.tagRow}>
              {program.equipmentRequired.map((eq) => (
                <View
                  key={eq}
                  style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{eq}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weekly Structure */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Program Structure</Text>
          {program.weeks.slice(0, 4).map((week) => (
            <View
              key={week.weekNumber}
              style={[styles.weekCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.weekTitle, { color: colors.textPrimary }]}>
                Week {week.weekNumber}
                {week.weekNumber % 4 === 0 ? '  🔄 Deload' : ''}
              </Text>
              {week.description ? (
                <Text style={[styles.weekDesc, { color: colors.textSecondary }]}>
                  {week.description}
                </Text>
              ) : null}
              {week.workouts.map((workout) => (
                <Text key={workout.dayNumber} style={[styles.dayRow, { color: colors.textTertiary }]}>
                  Day {workout.dayNumber}: {workout.name}
                </Text>
              ))}
            </View>
          ))}
          {program.durationWeeks > 4 && (
            <Text style={[styles.moreWeeks, { color: colors.textTertiary }]}>
              + {program.durationWeeks - 4} more weeks following the same pattern
            </Text>
          )}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          {locked ? (
            <>
              <Text style={[styles.lockedNote, { color: colors.textSecondary }]}>
                This program requires Forge Pro.
              </Text>
              <Button
                title="Upgrade to Forge Pro"
                variant="primary"
                fullWidth
                onPress={handleStart}
              />
            </>
          ) : (
            <Button
              title="Start This Program"
              variant="primary"
              fullWidth
              onPress={handleStart}
            />
          )}
        </View>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 16,
  },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
  },
  weekCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    gap: 4,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  weekDesc: {
    fontSize: 12,
  },
  dayRow: {
    fontSize: 12,
    paddingLeft: SPACING.xs,
  },
  moreWeeks: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ctaSection: {
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  lockedNote: {
    fontSize: 14,
    textAlign: 'center',
  },
});
