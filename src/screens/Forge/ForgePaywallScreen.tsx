import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, SIGNAL, SPACING, RADIUS } from '../../theme/tokens';
import { Button } from '../../components/UI';
import haptics from '../../utils/haptics';
import { useForgeMode } from '../../hooks/useForgeMode';

const FEATURES = [
  { label: '6 adaptive training programs', icon: '🏋️' },
  { label: 'Auto-generated Spotify playlists', icon: '🎵' },
  { label: 'RPE-based weight adaptation', icon: '📈' },
  { label: 'Deload week automation', icon: '🔄' },
  { label: 'PR streak tracking', icon: '🔥' },
  { label: 'Priority access to new programs', icon: '⚡' },
];

export default function ForgePaywallScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { unlockPro } = useForgeMode();

  const handleUnlock = async () => {
    await unlockPro();
    haptics.heavyTap();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.badge, { color: SIGNAL.forge }]}>FORGE MODE</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Go Pro</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Train smarter. Sound better.
          </Text>
        </View>

        {/* Feature list */}
        <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {FEATURES.map((feature, index) => (
            <View
              key={feature.label}
              style={[
                styles.featureRow,
                index < FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={[styles.featureLabel, { color: colors.textPrimary }]}>
                {feature.label}
              </Text>
              <Text style={[styles.checkmark, { color: SIGNAL.forge }]}>✓</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingBlock}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>$9.99</Text>
          <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
            per month · free during beta
          </Text>
        </View>

        {/* CTA */}
        <Button
          title="Unlock Forge Pro"
          variant="primary"
          fullWidth
          onPress={handleUnlock}
          style={styles.ctaButton}
        />

        <Pressable onPress={() => navigation.goBack()} style={styles.maybeLater}>
          <Text style={[styles.maybeLaterText, { color: colors.textTertiary }]}>
            Maybe Later
          </Text>
        </Pressable>
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
    paddingBottom: SPACING['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  featuresCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  featureIcon: {
    fontSize: 18,
    width: 28,
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  pricingBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
  },
  pricePeriod: {
    fontSize: 14,
    marginTop: 4,
  },
  ctaButton: {
    marginBottom: SPACING.md,
  },
  maybeLater: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  maybeLaterText: {
    fontSize: 14,
  },
});
