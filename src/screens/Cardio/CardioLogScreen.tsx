/**
 * CardioLogScreen
 * Scrollable journal of all cardio entries, newest first.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList, CardioEntry, CardioActivityType } from '../../types';
import { useCardioLog } from '../../hooks/useCardioLog';
import { resolvePhotoUri } from '../../utils/imageStorage';
import { useThemeMode } from '../../contexts/ThemeContext';
import { SkeletonListItem } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/UI';
import { Icon, IconName } from '../../components/Icon';
import { COLORS, IOS_COLORS, SIGNAL, SPACING, RADIUS, LAYOUT } from '../../theme/tokens';

type Nav = NativeStackNavigationProp<TrainingStackParamList>;

// ─── Activity metadata ────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<CardioActivityType, IconName> = {
  running:   'person-run',
  cycling:   'bicycle',
  walking:   'person-walk',
  rowing:    'rowing',
  elliptical:'lightning',
  stairs:    'stairs',
  other:     'heart',
};

const ACTIVITY_LABEL: Record<CardioActivityType, string> = {
  running:   'Run',
  cycling:   'Cycle',
  walking:   'Walk',
  rowing:    'Row',
  elliptical:'Elliptical',
  stairs:    'Stairs',
  other:     'Cardio',
};

// ─── Row component ────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  onPress,
  iosColors,
  isLast,
}: {
  entry: CardioEntry;
  onPress: () => void;
  iosColors: typeof IOS_COLORS.light;
  isLast: boolean;
}) {
  const date = new Date(entry.date);
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const icon = ACTIVITY_ICON[entry.type];
  const label = ACTIVITY_LABEL[entry.type];

  const stats: string[] = [`${entry.duration} min`];
  if (entry.distance) stats.push(`${entry.distance} km`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: iosColors.secondarySystemGroupedBackground },
        pressed && { opacity: 0.75 },
      ]}
    >
      {/* Left: activity icon badge */}
      <View style={[styles.iconBadge, { backgroundColor: iosColors.systemFill }]}>
        <Icon name={icon} size="sm" color={SIGNAL.forge} />
      </View>

      {/* Center: text info */}
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: iosColors.label }]} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text style={[styles.rowMeta, { color: iosColors.secondaryLabel }]}>
          {label} · {dateLabel}
        </Text>
        <Text style={[styles.rowStats, { color: iosColors.tertiaryLabel }]}>
          {stats.join(' · ')}
        </Text>
      </View>

      {/* Right: thumbnail if photo exists */}
      {entry.photos[0] ? (
        <Image source={{ uri: resolvePhotoUri(entry.photos[0]) }} style={styles.thumbnail} />
      ) : null}

      <Icon name="caret-right" size="sm" color={iosColors.tertiaryLabel} />

      {/* Separator */}
      {!isLast && (
        <View style={[styles.separator, { backgroundColor: iosColors.separator }]} />
      )}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CardioLogScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { entries, isLoading } = useCardioLog();

  const handleAdd = useCallback(() => {
    navigation.navigate('CardioTypeSelection');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: CardioEntry; index: number }) => (
      <EntryRow
        entry={item}
        onPress={() => navigation.navigate('CardioDetail', { entryId: item.id })}
        iosColors={iosColors}
        isLast={index === entries.length - 1}
      />
    ),
    [entries.length, iosColors, navigation]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.skeletonWrapper}>
            {[...Array(6)].map((_, i) => <SkeletonListItem key={i} />)}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.headerTitle, { color: iosColors.secondaryLabel }]}>
                CARDIO LOG
              </Text>
              <Pressable
                onPress={handleAdd}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.addBtn, { backgroundColor: SIGNAL.forge }]}
              >
                <Text style={[styles.addBtnText, { color: isDark ? '#06060C' : '#fff' }]}>
                  + Add
                </Text>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Icon name="heart" size="xxl" color={iosColors.tertiaryLabel} />}
              title="No entries yet"
              message="Log your first cardio session to start tracking."
              action={{ label: 'Log Workout', onPress: handleAdd }}
            />
          }
        />
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
  list: {
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: LAYOUT.screenPadding,
  },
  skeletonWrapper: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.base,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  addBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    position: 'relative',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 13,
  },
  rowStats: {
    fontSize: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 60,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
