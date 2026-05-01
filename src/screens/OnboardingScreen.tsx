/**
 * Onboarding Screen
 * 3-step interactive quiz to personalize the experience, followed by a welcome screen.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences, FitnessGoal, MusicGenre, ExperienceLevel } from '../contexts/PreferencesContext';
import { TYPOGRAPHY, SPACING, RADIUS, SIGNAL } from '../theme/tokens';
import haptics from '../utils/haptics';

const ACCENT = SIGNAL.forge;        // #FF4D00
const ACCENT_DIM = 'rgba(255,77,0,0.18)';
const ACCENT_GLOW = 'rgba(255,77,0,0.40)';

// Map onboarding answers → recommended Forge program ID
function recommendedProgram(goal: FitnessGoal | null, level: ExperienceLevel | null): { id: string; name: string } | null {
  if (!goal || !level) return null;
  if (level === 'beginner') return { id: 'forge_beginner_foundation', name: 'Beginner Foundation' };
  if (goal === 'strength' && level === 'advanced') return { id: 'forge_531_strength', name: '5/3/1 Strength' };
  if (goal === 'strength') return { id: 'forge_531_strength', name: '5/3/1 Strength' };
  if (goal === 'cardio') return { id: 'forge_athletic_performance', name: 'Athletic Performance' };
  if (goal === 'weight-loss') return { id: 'forge_full_body_recomp', name: 'Full Body Recomp' };
  return { id: 'forge_ppl_hypertrophy', name: 'PPL Hypertrophy' };
}

const { width } = Dimensions.get('window');

type Step = 'goal' | 'music' | 'level' | 'welcome';

type GoalOption = { value: FitnessGoal; emoji: string; label: string; subtitle: string };
type MusicOption = { value: MusicGenre; emoji: string; label: string; subtitle: string };
type LevelOption = { value: ExperienceLevel; emoji: string; label: string; subtitle: string };

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'strength', emoji: '💪', label: 'Build Strength', subtitle: 'Get stronger every week' },
  { value: 'cardio', emoji: '🏃', label: 'Improve Cardio', subtitle: 'Build endurance and stamina' },
  { value: 'weight-loss', emoji: '⚖️', label: 'Lose Weight', subtitle: 'Move more, feel better' },
  { value: 'consistency', emoji: '🔁', label: 'Stay Consistent', subtitle: 'Show up every day' },
];

const MUSIC_OPTIONS: MusicOption[] = [
  { value: 'hiphop', emoji: '🎤', label: 'Hip-Hop / Rap', subtitle: 'High energy lyrics' },
  { value: 'rock', emoji: '🤘', label: 'Rock / Metal', subtitle: 'Hard-hitting riffs' },
  { value: 'edm', emoji: '⚡', label: 'EDM / Electronic', subtitle: 'Driving beats' },
  { value: 'mixed', emoji: '🎵', label: 'Mixed / Anything', subtitle: 'Surprise me' },
];

const LEVEL_OPTIONS: LevelOption[] = [
  { value: 'beginner', emoji: '🌱', label: 'Just Starting Out', subtitle: 'New to training' },
  { value: 'intermediate', emoji: '🔥', label: 'Got Some Experience', subtitle: 'A few months in' },
  { value: 'advanced', emoji: '🏆', label: 'Training Seriously', subtitle: 'Consistent for years' },
];

const GOAL_SUBTITLES: Record<FitnessGoal, string> = {
  strength: 'Time to get strong.',
  cardio: "Let's move.",
  'weight-loss': 'Progress over perfection.',
  consistency: 'Show up. Every day.',
};

const GENRE_LABELS: Record<MusicGenre, string> = {
  hiphop: 'Hip-Hop / Rap',
  rock: 'Rock / Metal',
  edm: 'EDM / Electronic',
  mixed: 'everything',
};

type Props = { onComplete: () => void };

export default function OnboardingScreen({ onComplete }: Props) {
  const { updatePreferences } = usePreferences();
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [music, setMusic] = useState<MusicGenre | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);

  const stepNumber = step === 'goal' ? 1 : step === 'music' ? 2 : step === 'level' ? 3 : 4;
  const totalSteps = 3;

  const handleGoalSelect = (value: FitnessGoal) => {
    haptics.lightTap();
    setGoal(value);
  };

  const handleMusicSelect = (value: MusicGenre) => {
    haptics.lightTap();
    setMusic(value);
  };

  const handleLevelSelect = (value: ExperienceLevel) => {
    haptics.lightTap();
    setLevel(value);
  };

  const handleNext = () => {
    haptics.mediumTap();
    if (step === 'goal') setStep('music');
    else if (step === 'music') setStep('level');
    else if (step === 'level') {
      setStep('welcome');
    }
  };

  const handleFinish = () => {
    haptics.success();
    updatePreferences({
      fitnessGoal: goal ?? undefined,
      musicGenre: music ?? undefined,
      experienceLevel: level ?? undefined,
      onboardingCompleted: true,
    });
    onComplete();
  };

  const canContinue =
    (step === 'goal' && goal !== null) ||
    (step === 'music' && music !== null) ||
    (step === 'level' && level !== null);

  if (step === 'welcome') {
    const goalLabel = goal ? GOAL_SUBTITLES[goal] : 'Time to get to work.';
    const musicLabel = music ? GENRE_LABELS[music] : 'great music';
    const program = recommendedProgram(goal, level);
    return (
      <LinearGradient
        colors={['#0A0A0A', '#111113', '#0A0A0A']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>🏋️</Text>
            <Text style={styles.welcomeTitle}>You're all set.</Text>
            <Text style={styles.welcomeSubtitle}>
              Here to help you{'\n'}
              <Text style={styles.welcomeAccent}>{goalLabel}</Text>
              {'\n\n'}
              With <Text style={styles.welcomeAccent}>{musicLabel}</Text> fueling every session.
            </Text>
            {program && (
              <View style={styles.programRecommendation}>
                <Text style={styles.programRecommendLabel}>RECOMMENDED PROGRAM</Text>
                <Text style={styles.programRecommendName}>{program.name}</Text>
                <Text style={styles.programRecommendHint}>You can start this from the Training tab</Text>
              </View>
            )}
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [styles.finishButton, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            >
              <LinearGradient
                colors={[ACCENT, '#CC2800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.finishButtonGradient}
              >
                <Text style={styles.finishButtonText}>LET'S GO</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderOptions = () => {
    if (step === 'goal') {
      return GOAL_OPTIONS.map((opt) => (
        <OptionTile
          key={opt.value}
          emoji={opt.emoji}
          label={opt.label}
          subtitle={opt.subtitle}
          selected={goal === opt.value}
          onPress={() => handleGoalSelect(opt.value)}
        />
      ));
    }
    if (step === 'music') {
      return MUSIC_OPTIONS.map((opt) => (
        <OptionTile
          key={opt.value}
          emoji={opt.emoji}
          label={opt.label}
          subtitle={opt.subtitle}
          selected={music === opt.value}
          onPress={() => handleMusicSelect(opt.value)}
        />
      ));
    }
    return LEVEL_OPTIONS.map((opt) => (
      <OptionTile
        key={opt.value}
        emoji={opt.emoji}
        label={opt.label}
        subtitle={opt.subtitle}
        selected={level === opt.value}
        onPress={() => handleLevelSelect(opt.value)}
      />
    ));
  };

  const stepTitle =
    step === 'goal' ? "What's your primary goal?" :
    step === 'music' ? 'Music that moves you?' :
    'How much experience do you have?';

  return (
    <LinearGradient
      colors={['#0A0A0A', '#111113', '#0A0A0A']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {stepNumber} of {totalSteps}
          </Text>
          <View style={styles.progressTrack}>
            {[1, 2, 3].map((n) => (
              <View
                key={n}
                style={[
                  styles.progressSegment,
                  n <= stepNumber && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.stepTitle}>{stepTitle}</Text>
          </View>

          <View style={styles.optionsGrid}>
            {renderOptions()}
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleNext}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.nextButton,
              !canContinue && styles.nextButtonDisabled,
              pressed && canContinue && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <LinearGradient
              colors={canContinue ? [ACCENT, '#CC2800'] : ['#333', '#222']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={[styles.nextButtonText, !canContinue && styles.nextButtonTextDisabled]}>
                CONTINUE
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

type OptionTileProps = {
  emoji: string;
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
};

function OptionTile({ emoji, label, subtitle, selected, onPress }: OptionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionTile,
        selected && styles.optionTileSelected,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}: ${subtitle}`}
    >
      {selected && (
        <LinearGradient
          colors={[ACCENT_DIM, 'rgba(255,77,0,0.06)']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  progressLabel: {
    color: '#9B9BAD',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    letterSpacing: 0.4,
    minWidth: 36,
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressSegmentActive: {
    backgroundColor: ACCENT,
  },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING['2xl'],
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 40,
    textShadowColor: ACCENT_GLOW,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  optionsGrid: {
    gap: SPACING.md,
  },
  optionTile: {
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  optionTileSelected: {
    borderColor: ACCENT,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: ACCENT,
  },
  optionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#9B9BAD',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['2xl'],
    paddingTop: SPACING.md,
  },
  nextButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    paddingVertical: SPACING.base + 2,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    color: '#0A0A0F',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '900',
    letterSpacing: 2,
  },
  nextButtonTextDisabled: {
    color: '#9B9BAD',
  },
  // Welcome screen
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
    paddingBottom: SPACING['4xl'],
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: SPACING['2xl'],
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    textShadowColor: ACCENT_GLOW,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  welcomeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: '#9B9BAD',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING['4xl'],
    maxWidth: width * 0.8,
  },
  welcomeAccent: {
    color: ACCENT,
    fontWeight: '700',
  },
  finishButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    paddingVertical: SPACING.base + 2,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  finishButtonText: {
    color: '#0A0A0F',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '900',
    letterSpacing: 2,
  },
  programRecommendation: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,77,0,0.30)',
    backgroundColor: 'rgba(255,77,0,0.08)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginBottom: SPACING['2xl'],
    alignItems: 'center',
    gap: 4,
  },
  programRecommendLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1.4,
  },
  programRecommendName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  programRecommendHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#9B9BAD',
    textAlign: 'center',
  },
});
