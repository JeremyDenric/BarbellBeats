/**
 * CardioDetailScreen
 * Read-only view of a single cardio entry with edit/delete actions.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList, CardioActivityType } from '../../types';
import { useCardioLog } from '../../hooks/useCardioLog';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Icon, IconName } from '../../components/Icon';
import { COLORS, IOS_COLORS, SIGNAL, SPACING, RADIUS, LAYOUT } from '../../theme/tokens';
import { warning } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<TrainingStackParamList>;
type Route = RouteProp<TrainingStackParamList, 'CardioDetail'>;

const ACTIVITY_ICON: Record<CardioActivityType, IconName> = {
  running:    'person-run',
  cycling:    'bicycle',
  walking:    'person-walk',
  rowing:     'rowing',
  elliptical: 'lightning',
  stairs:     'stairs',
  other:      'heart',
};

const ACTIVITY_LABEL: Record<CardioActivityType, string> = {
  running:    'Running',
  cycling:    'Cycling',
  walking:    'Walking',
  rowing:     'Rowing',
  elliptical: 'Elliptical',
  stairs:     'Stairs',
  other:      'Cardio',
};

export default function CardioDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { entries, deleteEntry } = useCardioLog();
  const [deleting, setDeleting] = useState(false);

  const entry = entries.find((e) => e.id === route.params.entryId);

  const handleDelete = useCallback(() => {
    if (!entry) return;
    warning();
    Alert.alert(
      'Delete Entry',
      'This cannot be undone. Any attached photos will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            await deleteEntry(entry.id);
            navigation.goBack();
          },
        },
      ]
    );
  }, [deleteEntry, entry, navigation]);

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.notFound}>
            <Text style={[styles.notFoundText, { color: iosColors.secondaryLabel }]}>
              Entry not found.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const date = new Date(entry.date);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Duration', value: `${entry.duration} min` },
  ];
  if (entry.distance) {
    stats.push({ label: 'Distance', value: `${entry.distance} km` });
    const pace = entry.duration / entry.distance;
    stats.push({ label: 'Avg Pace', value: `${pace.toFixed(1)} min/km` });
  }

  return (
    <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Nav bar */}
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="caret-left" size="md" color={iosColors.tint} />
          </Pressable>
          <Text style={[styles.navTitle, { color: iosColors.label }]} numberOfLines={1}>
            {ACTIVITY_LABEL[entry.type]}
          </Text>
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash" size="md" color={deleting ? iosColors.tertiaryLabel : colors.error ?? '#FF3B30'} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.card, { backgroundColor: iosColors.secondarySystemGroupedBackground }]}>
            <View style={[styles.iconBadge, { backgroundColor: iosColors.systemFill }]}>
              <Icon name={ACTIVITY_ICON[entry.type]} size="lg" color={SIGNAL.forge} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.entryTitle, { color: iosColors.label }]}>{entry.title}</Text>
              <Text style={[styles.entryDate, { color: iosColors.secondaryLabel }]}>{dateLabel}</Text>
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {stats.map(({ label, value }) => (
              <View
                key={label}
                style={[styles.statCard, { backgroundColor: iosColors.secondarySystemGroupedBackground }]}
              >
                <Text style={[styles.statValue, { color: iosColors.label }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: iosColors.secondaryLabel }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          {entry.notes ? (
            <View style={[styles.notesCard, { backgroundColor: iosColors.secondarySystemGroupedBackground }]}>
              <Text style={[styles.notesLabel, { color: iosColors.secondaryLabel }]}>NOTES</Text>
              <Text style={[styles.notesText, { color: iosColors.label }]}>{entry.notes}</Text>
            </View>
          ) : null}

          {/* Photos */}
          {entry.photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={[styles.sectionLabel, { color: iosColors.secondaryLabel }]}>PHOTOS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                {entry.photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photo} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Edit button — navigates back to add form pre-filled */}
          <Pressable
            onPress={() =>
              navigation.navigate('AddCardioEntry', { activityType: entry.type })
            }
            style={[styles.editBtn, { backgroundColor: iosColors.secondarySystemGroupedBackground }]}
          >
            <Icon name="pencil" size="sm" color={iosColors.tint} />
            <Text style={[styles.editBtnText, { color: iosColors.tint }]}>Edit Entry</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 15,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  scroll: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  entryDate: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesCard: {
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  photosSection: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  photosRow: {
    gap: SPACING.sm,
  },
  photo: {
    width: 200,
    height: 140,
    borderRadius: RADIUS.md,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
