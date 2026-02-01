import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useThemeMode } from '../contexts/ThemeContext';
import { EXTRA_FEATURES } from '../data/extraFeatures';
import { Badge, Button, GlassCard } from '../components/UI';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';
import { HomeStackParamList } from '../types';

type RouteParams = RouteProp<HomeStackParamList, 'FeatureDetail'>;

export default function FeatureDetailScreen() {
  const route = useRoute<RouteParams>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const feature = EXTRA_FEATURES.find((item) => item.id === route.params.featureId);

  const handleNotify = () => {
    Alert.alert('Coming soon', 'We will notify you when this feature ships.');
  };

  if (!feature) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.fallback}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Feature not found</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This item is not available right now.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary + '35',
              },
            ]}
          >
            <Text style={styles.icon}>{feature.icon}</Text>
          </View>
          <Badge label="Coming soon" variant="primary" size="small" style={styles.badge} />
          <Text style={[styles.categoryLabel, { color: colors.textTertiary }]}>
            {feature.category}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{feature.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{feature.subtitle}</Text>
        </View>

        <GlassCard style={styles.card} intensity={20}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>What you will get</Text>
          <View style={styles.bullets}>
            {feature.bullets.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.card} intensity={16}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Why it matters</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Built to help you train smarter, stay consistent, and keep the gym energy in sync with your goals.
          </Text>
        </GlassCard>

        <Button title="Notify me" variant="primary" onPress={handleNotify} fullWidth />
        <Text style={[styles.note, { color: colors.textTertiary }]}>
          We will only use this to announce launches.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: LAYOUT.screenPadding,
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
    gap: SPACING.sm,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    fontSize: 32,
  },
  badge: {
    alignSelf: 'center',
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...TYPOGRAPHY.presets.heading1,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: SPACING.sm,
  },
  bullets: {
    gap: SPACING.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bulletDot: {
    fontSize: 18,
    lineHeight: 22,
  },
  bulletText: {
    ...TYPOGRAPHY.presets.body,
    flex: 1,
  },
  bodyText: {
    ...TYPOGRAPHY.presets.body,
  },
  note: {
    ...TYPOGRAPHY.presets.caption,
    textAlign: 'center',
  },
});
