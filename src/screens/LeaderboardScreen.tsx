import React, { useMemo, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import { GymsStackParamList, LeaderboardEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import mockApi from '../services/mockApi';
import { LoadingView, ErrorView, IOSListRow, IOSCard, Badge, EmptyState } from '../components/UI';
import { IOS_COLORS, TYPOGRAPHY, SPACING, LAYOUT, RADIUS } from '../theme/tokens';

type RouteParams = RouteProp<GymsStackParamList, 'Leaderboard'>;

const getMedalEmoji = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
};

// Memoized LeaderboardEntry Component - iOS Style
interface LeaderboardEntryItemProps {
  item: LeaderboardEntry;
  isCurrentUser: boolean;
  iosColors: typeof IOS_COLORS.light | typeof IOS_COLORS.dark;
  isLast: boolean;
  compact: boolean;
}

const LeaderboardEntryItem = memo<LeaderboardEntryItemProps>(
  ({ item, isCurrentUser, iosColors, isLast, compact }) => {
  return (
    <IOSListRow separator={!isLast} separatorInset={60}>
      <View style={[styles.entryContainer, compact && styles.entryContainerCompact]}>
        {/* Rank Badge */}
        <View
          style={[
            styles.rankBadge,
            compact && styles.rankBadgeCompact,
            { backgroundColor: iosColors.systemFill },
          ]}
        >
          <Text style={[styles.rankText, compact && styles.rankTextCompact, { color: iosColors.label }]}>
            {getMedalEmoji(item.rank) || `#${item.rank}`}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              compact && styles.userNameCompact,
              { color: isCurrentUser ? iosColors.tint : iosColors.label },
            ]}
            numberOfLines={1}
          >
            {item.name}{isCurrentUser && ' (You)'}
          </Text>
          <Text
            style={[
              styles.username,
              compact && styles.usernameCompact,
              { color: iosColors.secondaryLabel },
            ]}
            numberOfLines={1}
          >
            @{item.username}
          </Text>
          <Text
            style={[
              styles.stats,
              compact && styles.statsCompact,
              { color: iosColors.tertiaryLabel },
            ]}
            numberOfLines={1}
          >
            Level {item.level} • {item.songsAdded} songs • {item.votesCast} votes
          </Text>
        </View>

        {/* Influence Points */}
        <View style={styles.points}>
          <Text style={[styles.pointsValue, compact && styles.pointsValueCompact, { color: iosColors.tint }]}>
            {item.influencePoints}
          </Text>
          <Text style={[styles.pointsLabel, { color: iosColors.tertiaryLabel }]}>
            PTS
          </Text>
        </View>
      </View>
    </IOSListRow>
  );
}, (prev, next) => (
  prev.item.userId === next.item.userId &&
  prev.item.influencePoints === next.item.influencePoints &&
  prev.isCurrentUser === next.isCurrentUser &&
  prev.isLast === next.isLast &&
  prev.compact === next.compact
));

export default function LeaderboardScreen() {
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { fontScale } = useWindowDimensions();
  const useFixedLayout = fontScale <= 1.1;
  // Use provided gymId or default to 'gym-1' for now
  const gymId = route.params?.gymId || 'gym-1';
  // Keep in sync with IOSListRow padding and entry text line heights.
  const rowHeight = compact ? 82 : 92;

  const { data: leaderboard, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['leaderboard', gymId],
    queryFn: () => mockApi.getLeaderboard(gymId),
    staleTime: 1000 * 60, // 1 minute
  });

  // Memoize user stats for performance
  const userStats = useMemo(() => {
    if (!user || !leaderboard) return null;
    return leaderboard.find(entry => entry.userId === user.id);
  }, [user, leaderboard]);

  const leaderboardLength = leaderboard?.length ?? 0;
  const renderEntry = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <LeaderboardEntryItem
        item={item}
        isCurrentUser={item.userId === user?.id}
        iosColors={iosColors}
        isLast={index === leaderboardLength - 1}
        compact={compact}
      />
    ),
    [compact, iosColors, leaderboardLength, user?.id]
  );
  const entryKeyExtractor = useCallback((item: LeaderboardEntry) => item.userId, []);
  const getEntryLayout = useCallback(
    (_data: ArrayLike<LeaderboardEntry> | null | undefined, index: number) => ({
      length: rowHeight,
      offset: rowHeight * index,
      index,
    }),
    [rowHeight]
  );

  if (isLoading) {
    return <LoadingView message="Loading leaderboard..." />;
  }

  if (isError) {
    return <ErrorView error={error as Error} onRetry={refetch} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={leaderboard || []}
          keyExtractor={entryKeyExtractor}
          renderItem={renderEntry}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={useFixedLayout ? getEntryLayout : undefined}
          ListEmptyComponent={
            <EmptyState
              icon={<Text style={styles.emptyIcon}>🏆</Text>}
              title="No leaderboard yet"
              message="Start voting and adding tracks to appear here."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={iosColors.tint}
            />
          }
          contentContainerStyle={[styles.listContent, compact && styles.listContentCompact]}
          ListHeaderComponent={
            <>
              {/* User Profile Section */}
              {userStats && (
                <View style={[styles.profileSection, compact && styles.profileSectionCompact]}>
                  <IOSCard style={[styles.profileCard, compact && styles.profileCardCompact]}>
                    <View style={[styles.profileHeader, compact && styles.profileHeaderCompact]}>
                      <View style={[styles.avatar, compact && styles.avatarCompact, { backgroundColor: iosColors.tint }]}>
                        <Text style={[styles.avatarText, compact && styles.avatarTextCompact]}>
                          {user?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, compact && styles.profileNameCompact, { color: iosColors.label }]}>
                          {user?.name}
                        </Text>
                        <Text
                          style={[
                            styles.profileUsername,
                            compact && styles.profileUsernameCompact,
                            { color: iosColors.secondaryLabel },
                          ]}
                        >
                          @{user?.username} • Rank #{userStats.rank} {getMedalEmoji(userStats.rank)}
                        </Text>
                      </View>
                    </View>

                    {/* User Stats Grid */}
                    <View style={[styles.statsGrid, compact && styles.statsGridCompact]}>
                      <View
                        style={[
                          styles.statBox,
                          compact && styles.statBoxCompact,
                          { backgroundColor: iosColors.systemFill },
                        ]}
                      >
                        <Text style={[styles.statValue, compact && styles.statValueCompact, { color: iosColors.label }]}>
                          {userStats.influencePoints}
                        </Text>
                        <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: iosColors.secondaryLabel }]}>
                          Influence
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statBox,
                          compact && styles.statBoxCompact,
                          { backgroundColor: iosColors.systemFill },
                        ]}
                      >
                        <Text style={[styles.statValue, compact && styles.statValueCompact, { color: iosColors.label }]}>
                          {userStats.level}
                        </Text>
                        <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: iosColors.secondaryLabel }]}>
                          Level
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statBox,
                          compact && styles.statBoxCompact,
                          { backgroundColor: iosColors.systemFill },
                        ]}
                      >
                        <Text style={[styles.statValue, compact && styles.statValueCompact, { color: iosColors.label }]}>
                          {userStats.songsAdded}
                        </Text>
                        <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: iosColors.secondaryLabel }]}>
                          Songs
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statBox,
                          compact && styles.statBoxCompact,
                          { backgroundColor: iosColors.systemFill },
                        ]}
                      >
                        <Text style={[styles.statValue, compact && styles.statValueCompact, { color: iosColors.label }]}>
                          {userStats.votesCast}
                        </Text>
                        <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: iosColors.secondaryLabel }]}>
                          Votes
                        </Text>
                      </View>
                    </View>
                  </IOSCard>
                </View>
              )}

              {/* Leaderboard Header */}
              <View style={[styles.header, compact && styles.headerCompact]}>
                <Text style={[styles.headerTitle, { color: iosColors.secondaryLabel }]}>
                  TOP CONTRIBUTORS
                </Text>
              </View>
            </>
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
  listContent: {
    paddingBottom: SPACING.xl,
  },
  listContentCompact: {
    paddingBottom: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 32,
  },

  // Profile Section - iOS Style
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileSectionCompact: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  profileCard: {
    padding: 16,
  },
  profileCardCompact: {
    padding: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileHeaderCompact: {
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCompact: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarTextCompact: {
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    marginBottom: 2,
  },
  profileNameCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  profileUsername: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  profileUsernameCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statsGridCompact: {
    gap: 6,
  },
  statBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  statBoxCompact: {
    padding: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValueCompact: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  statLabelCompact: {
    fontSize: 10,
  },

  // Header - iOS Style
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerCompact: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Leaderboard Entry Rows - iOS Style
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryContainerCompact: {
    paddingVertical: 2,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankTextCompact: {
    fontSize: 13,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 2,
  },
  userNameCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  username: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 2,
  },
  usernameCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  stats: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  statsCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  points: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
  },
  pointsValueCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
