import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, SIGNAL, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Button } from '../../components/UI';
import haptics from '../../utils/haptics';
import { useSubscription } from '../../contexts/SubscriptionContext';

const FEATURES = [
  { label: '6 adaptive training programs', icon: '🏋️' },
  { label: 'Auto-generated Spotify playlists', icon: '🎵' },
  { label: 'RPE-based weight adaptation', icon: '📈' },
  { label: 'Deload week automation', icon: '🔄' },
  { label: 'Pro 2× vote weight in gym queue', icon: '🔊' },
  { label: 'Priority access to new programs', icon: '⚡' },
];

type PlanOption = 'monthly' | 'annual';

export default function ForgePaywallScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { monthlyPackage, annualPackage, purchasePackage, restorePurchases } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const monthlyPrice = monthlyPackage?.product.priceString ?? '$9.99';
  const annualPrice = annualPackage?.product.priceString ?? '$69.99';

  const handleUnlock = async () => {
    const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!pkg) return;
    haptics.heavyTap();
    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) navigation.goBack();
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    haptics.lightTap();
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) navigation.goBack();
    } finally {
      setIsRestoring(false);
    }
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

        {/* Plan picker */}
        <View style={styles.planRow}>
          <Pressable
            onPress={() => { haptics.lightTap(); setSelectedPlan('monthly'); }}
            style={[
              styles.planCard,
              { backgroundColor: colors.surface, borderColor: selectedPlan === 'monthly' ? SIGNAL.forge : colors.border },
            ]}
          >
            <Text style={[styles.planLabel, { color: colors.textPrimary }]}>Monthly</Text>
            <Text style={[styles.planPrice, { color: colors.textPrimary }]}>{monthlyPrice}</Text>
            <Text style={[styles.planSub, { color: colors.textSecondary }]}>per month</Text>
          </Pressable>

          <Pressable
            onPress={() => { haptics.lightTap(); setSelectedPlan('annual'); }}
            style={[
              styles.planCard,
              { backgroundColor: colors.surface, borderColor: selectedPlan === 'annual' ? SIGNAL.forge : colors.border },
            ]}
          >
            <View style={[styles.saveBadge, { backgroundColor: SIGNAL.forge }]}>
              <Text style={styles.saveBadgeText}>SAVE 42%</Text>
            </View>
            <Text style={[styles.planLabel, { color: colors.textPrimary }]}>Annual</Text>
            <Text style={[styles.planPrice, { color: colors.textPrimary }]}>{annualPrice}</Text>
            <Text style={[styles.planSub, { color: colors.textSecondary }]}>per year</Text>
          </Pressable>
        </View>

        {/* CTA */}
        <Button
          title={isPurchasing ? 'Processing…' : 'Unlock Forge Pro'}
          variant="primary"
          fullWidth
          onPress={handleUnlock}
          disabled={isPurchasing || isRestoring || (!monthlyPackage && !annualPackage)}
          style={styles.ctaButton}
        />

        {!monthlyPackage && !annualPackage && (
          <Text style={[styles.noOfferings, { color: colors.textTertiary }]}>
            Pricing unavailable — check your connection
          </Text>
        )}

        <Pressable onPress={() => navigation.goBack()} style={styles.maybeLater} disabled={isPurchasing}>
          <Text style={[styles.maybeLaterText, { color: colors.textTertiary }]}>
            Maybe Later
          </Text>
        </Pressable>

        <Pressable onPress={handleRestore} style={styles.restoreRow} disabled={isRestoring || isPurchasing}>
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.textTertiary }]}>
              Restore Purchase
            </Text>
          )}
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
  planRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  planCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
  planSub: {
    fontSize: 12,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  ctaButton: {
    marginBottom: SPACING.md,
  },
  noOfferings: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  maybeLater: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  maybeLaterText: {
    fontSize: 14,
  },
  restoreRow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
