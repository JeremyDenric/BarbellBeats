import React, { useMemo, useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { GymsStackParamList, Gym, TabParamList } from '../types';
import { listGyms } from '../services/gymApi';
import { useThemeMode } from '../contexts/ThemeContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { usePreferences } from '../contexts/PreferencesContext';
import useInteractionReady from '../hooks/useInteractionReady';
import { LoadingView, ErrorView, EmptyState, IOSListRow, IOSGroupedList } from '../components/UI';
import { MapPreviewCard } from '../components/MapPreviewCard';
import { SearchBar } from '../components/SearchBar';
import { SkeletonListItem } from '../components/SkeletonLoader';
import { COLORS, IOS_COLORS, TYPOGRAPHY, SPACING, LAYOUT, RADIUS } from '../theme/tokens';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<GymsStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

// Memoized iOS-style Gym Row Component
interface GymRowProps {
  item: Gym;
  index: number;
  onPress: (gymId: string) => void;
  iosColors: typeof IOS_COLORS.light | typeof IOS_COLORS.dark;
  isLast: boolean;
  compact: boolean;
}

const GymRow = memo<GymRowProps>(({ item, index, onPress, iosColors, isLast, compact }) => {
  return (
    <IOSListRow
      onPress={() => onPress(item.id)}
      chevron={true}
      separator={!isLast}
      separatorInset={60}
    >
      <View style={styles.rowContainer}>
        {/* Rank Badge */}
        <View
          style={[
            styles.rankBadge,
            compact && styles.rankBadgeCompact,
            { backgroundColor: iosColors.systemFill },
          ]}
        >
          <Text style={[styles.rankText, compact && styles.rankTextCompact, { color: iosColors.label }]}>
            {index <= 2 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
          </Text>
        </View>

        {/* Gym Info */}
        <View style={styles.gymContent}>
          <Text style={[styles.gymName, compact && styles.gymNameCompact, { color: iosColors.label }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles.gymAddress, compact && styles.gymAddressCompact, { color: iosColors.secondaryLabel }]}
            numberOfLines={1}
          >
            {item.address}
          </Text>
          <View style={styles.metadata}>
            <Text
              style={[styles.metadataText, compact && styles.metadataTextCompact, { color: iosColors.tertiaryLabel }]}
              numberOfLines={1}
            >
              {item.memberCount} training • {item.distance?.toFixed(1)} mi away
            </Text>
          </View>
        </View>
      </View>
    </IOSListRow>
  );
}, (prev, next) => (
  prev.item.id === next.item.id &&
  prev.item.memberCount === next.item.memberCount &&
  prev.index === next.index &&
  prev.isLast === next.isLast &&
  prev.compact === next.compact
));

export default function GymListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const compact = preferences.compactMode;
  const { fontScale } = useWindowDimensions();
  const useFixedLayout = fontScale <= 1.1;
  // Keep in sync with IOSListRow padding and gym text line heights.
  const rowHeight = compact ? 80 : 94;
  const { activeGymId, setActiveGymId } = useGym();
  const { showToast } = useToast();
  const interactionReady = useInteractionReady();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: gyms,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => listGyms(),
    enabled: interactionReady,
    staleTime: 1000 * 60 * 2,
  });

  // Filter gyms based on search query
  const filteredGyms = useMemo(() => {
    if (!gyms) return [];
    if (!searchQuery.trim()) return gyms;

    const query = searchQuery.toLowerCase();
    return gyms.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.address.toLowerCase().includes(query)
    );
  }, [gyms, searchQuery]);

  const totalMembers = useMemo(
    () => gyms?.reduce((sum, gym) => sum + (gym.memberCount || 0), 0) ?? 0,
    [gyms],
  );

  const nearbyGyms = useMemo(() => filteredGyms.slice(0, 10) || [], [filteredGyms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resolveGymId = () => activeGymId || filteredGyms[0]?.id || null;

  const handleGymPress = (gymId: string) => {
    setActiveGymId(gymId);
    navigation.navigate('Music', { screen: 'GymPlaylist', params: { gymId } });
  };

  const handleOpenPlaylist = () => {
    const gymId = resolveGymId();
    if (!gymId) {
      showToast('Pick a gym to open the playlist.', { type: 'info' });
      navigation.navigate('Music', { screen: 'GymPicker' });
      return;
    }
    setActiveGymId(gymId);
    navigation.navigate('Music', { screen: 'GymPlaylist', params: { gymId } });
  };

  const handleOpenLeaderboard = () => {
    const gymId = resolveGymId();
    if (!gymId) {
      showToast('Select a gym to view the leaderboard.', { type: 'info' });
      return;
    }
    navigation.navigate('Leaderboard', { gymId });
  };

  const renderGymRow = useCallback(
    ({ item, index }: { item: Gym; index: number }) => (
      <GymRow
        item={item}
        index={index}
        onPress={handleGymPress}
        iosColors={iosColors}
        isLast={index === (filteredGyms?.length ?? 0) - 1}
        compact={compact}
      />
    ),
    [compact, filteredGyms?.length, handleGymPress, iosColors]
  );

  const getGymLayout = useCallback(
    (_data: ArrayLike<Gym> | null | undefined, index: number) => ({
      length: rowHeight,
      offset: rowHeight * index,
      index,
    }),
    [rowHeight]
  );

  if (!interactionReady || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.skeletonWrapper}>
            {[...Array(10)].map((_, index) => (
              <SkeletonListItem key={index} />
            ))}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
        <ErrorView error={error as Error} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filteredGyms}
          keyExtractor={(item) => item.id}
          renderItem={renderGymRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, compact && styles.listCompact]}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={useFixedLayout ? getGymLayout : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <>
              <IOSGroupedList
                header="GYM EXPERIENCE"
                footer="Playlist, community, and map tools."
                style={[styles.toolsList, compact && styles.toolsListCompact]}
              >
                <IOSListRow chevron onPress={handleOpenPlaylist}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIcon, compact && styles.toolIconCompact, { backgroundColor: iosColors.systemFill }]}>
                      <Text style={[styles.toolEmoji, compact && styles.toolEmojiCompact]}>🎧</Text>
                    </View>
                    <View style={styles.toolInfo}>
                      <Text style={[styles.toolTitle, compact && styles.toolTitleCompact, { color: iosColors.label }]}>
                        Gym Playlist
                      </Text>
                      <Text style={[styles.toolSubtitle, compact && styles.toolSubtitleCompact, { color: iosColors.secondaryLabel }]}>
                        Live queue and voting
                      </Text>
                    </View>
                  </View>
                </IOSListRow>
                <IOSListRow chevron onPress={handleOpenLeaderboard}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIcon, compact && styles.toolIconCompact, { backgroundColor: iosColors.systemFill }]}>
                      <Text style={[styles.toolEmoji, compact && styles.toolEmojiCompact]}>🏆</Text>
                    </View>
                    <View style={styles.toolInfo}>
                      <Text style={[styles.toolTitle, compact && styles.toolTitleCompact, { color: iosColors.label }]}>
                        Leaderboard
                      </Text>
                      <Text style={[styles.toolSubtitle, compact && styles.toolSubtitleCompact, { color: iosColors.secondaryLabel }]}>
                        Top contributors and ranks
                      </Text>
                    </View>
                  </View>
                </IOSListRow>
                <IOSListRow chevron separator={false} onPress={() => navigation.navigate('Map')}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIcon, compact && styles.toolIconCompact, { backgroundColor: iosColors.systemFill }]}>
                      <Text style={[styles.toolEmoji, compact && styles.toolEmojiCompact]}>🗺️</Text>
                    </View>
                    <View style={styles.toolInfo}>
                      <Text style={[styles.toolTitle, compact && styles.toolTitleCompact, { color: iosColors.label }]}>
                        Map View
                      </Text>
                      <Text style={[styles.toolSubtitle, compact && styles.toolSubtitleCompact, { color: iosColors.secondaryLabel }]}>
                        Explore gyms around you
                      </Text>
                    </View>
                  </View>
                </IOSListRow>
              </IOSGroupedList>

              {/* Map Preview */}
              <MapPreviewCard
                gyms={nearbyGyms}
                onGymPress={handleGymPress}
                onMapPress={() => navigation.navigate('Map')}
                style={[styles.mapPreview, compact && styles.mapPreviewCompact]}
              />

              {/* Search Bar */}
              <SearchBar
                placeholder="Search gyms or locations..."
                onSearch={setSearchQuery}
                debounceMs={300}
                style={[styles.searchBar, compact && styles.searchBarCompact]}
              />

              <View style={[styles.listHeader, compact && styles.listHeaderCompact]}>
                <Text style={[styles.headerTitle, { color: iosColors.secondaryLabel }]}>
                  {searchQuery ? `SEARCH RESULTS (${filteredGyms.length})` : 'NEARBY GYMS'}
                </Text>
              </View>
              <View
                style={[
                  styles.groupedContainerStart,
                  compact && styles.groupedContainerCompact,
                  { backgroundColor: iosColors.secondarySystemGroupedBackground },
                ]}
              />
            </>
          }
          ListFooterComponent={
            <>
              <View
                style={[
                  styles.groupedContainerEnd,
                  compact && styles.groupedContainerCompact,
                  { backgroundColor: iosColors.secondarySystemGroupedBackground },
                ]}
              />
              <View style={[styles.listFooter, compact && styles.listFooterCompact]}>
                <Text style={[styles.footerText, { color: iosColors.secondaryLabel }]}>
                  {filteredGyms?.length ?? 0} gyms {searchQuery ? 'found' : `with ${totalMembers} people training now`}
                </Text>
              </View>
            </>
          }
          CellRendererComponent={({ children, index, style, ...props }) => (
            <View
              style={[
                style,
                index === 0 && styles.firstCell,
                index === (filteredGyms?.length ?? 0) - 1 && styles.lastCell,
              ]}
              {...props}
            >
              <View
                style={[
                  styles.cellWrapper,
                  compact && styles.cellWrapperCompact,
                  { backgroundColor: iosColors.secondarySystemGroupedBackground },
                ]}
              >
                {children}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Text style={styles.emptyIcon}>🏋️</Text>}
              title="No gyms found"
              message="Pull to refresh or try again later."
              action={{ label: 'Refresh', onPress: () => refetch() }}
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
    paddingBottom: SPACING.xl,
  },
  listCompact: {
    paddingBottom: SPACING.lg,
  },
  toolsList: {
    marginHorizontal: 16,
    marginTop: SPACING.base,
    marginBottom: SPACING.md,
  },
  toolsListCompact: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconCompact: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  toolEmoji: {
    fontSize: 20,
  },
  toolEmojiCompact: {
    fontSize: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toolTitleCompact: {
    fontSize: 14,
  },
  toolSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toolSubtitleCompact: {
    fontSize: 11,
    marginTop: 1,
  },
  mapPreview: {
    marginHorizontal: LAYOUT.screenPadding,
    marginTop: SPACING.base,
    marginBottom: SPACING.md,
  },
  mapPreviewCompact: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchBar: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  searchBarCompact: {
    marginBottom: SPACING.sm,
  },

  // iOS Grouped Container - Creates inset grouped appearance
  groupedContainerStart: {
    marginHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    height: 0,
  },
  groupedContainerEnd: {
    marginHorizontal: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    height: 0,
    marginBottom: 8,
  },
  groupedContainerCompact: {
    marginHorizontal: 12,
  },
  cellWrapper: {
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cellWrapperCompact: {
    marginHorizontal: 12,
  },
  firstCell: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  lastCell: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },

  // iOS List Header/Footer
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listHeaderCompact: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  listFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listFooterCompact: {
    paddingTop: 10,
    paddingBottom: 6,
  },

  // iOS Row Styles
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankTextCompact: {
    fontSize: 14,
  },
  gymContent: {
    flex: 1,
  },
  gymName: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 2,
  },
  gymNameCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  gymAddress: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 2,
  },
  gymAddressCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  metadata: {
    marginTop: 2,
  },
  metadataText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  metadataTextCompact: {
    fontSize: 11,
    lineHeight: 16,
  },

  // Empty state
  footerText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  emptyIcon: {
    fontSize: 48,
  },
  // Skeleton Loader
  skeletonWrapper: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
  },
});
