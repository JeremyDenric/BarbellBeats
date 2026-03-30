import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Modal,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform,
  useWindowDimensions,
} from 'react-native';
import haptics from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { MusicStackParamList, QueueSong } from '../types';
import {
  addComment,
  addReaction,
  addSongToQueue,
  getGymQueue,
  getNowPlayingFeed,
  identifyNowPlaying,
  voteOnSong,
} from '../services/gymApi';
import { ErrorView, Button, IOSCard, Badge, EmptyState } from '../components/UI';
import SpotifySearch, { SpotifyTrack } from '../components/SpotifySearch';
import { SkeletonPlaylist } from '../components/SkeletonLoader';
import { SongCard } from '../components/SongCard';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { CommunitySection } from '../components/CommunitySection';
import { SaveTrackModal } from '../components/SaveTrackModal';
import { useThemeMode } from '../contexts/ThemeContext';
import { useGym } from '../contexts/GymContext';
import { IOS_COLORS, SPACING, LAYOUT, TYPOGRAPHY } from '../theme/tokens';
import { StaggerItem } from '../components/StaggerItem';
import { useAuth } from '../contexts/AuthContext';
import { addFavorite, addTrackToSetlist, listSetlists } from '../services/userDataApi';
import { useSpotify } from '../contexts/SpotifyContext';
import { addToGymHits } from '../services/spotifySync';
import { useToast } from '../contexts/ToastContext';
import SpotifyTemplate from '../components/SpotifyTemplate';
import ModalHeader from '../components/ModalHeader';
import { usePreferences } from '../contexts/PreferencesContext';
import devLog from '../utils/devLog';
import { safeParseJSON } from '../utils/storageHelpers';

type RouteParams = RouteProp<MusicStackParamList, 'GymPlaylist'>;

type MusicBadge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
};

type LikedEntry = {
  savedAt: string;
  destinations: string[];
};

type SaveDestination =
  | { type: 'favorites' }
  | { type: 'setlist'; setlistId: string; name: string };

function formatRelativeTime(iso?: string) {
  if (!iso) return 'unknown';
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(deltaMs)) return 'unknown';
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getEnergyLabel(score: number) {
  if (score >= 75) return 'High';
  if (score >= 45) return 'Rising';
  return 'Steady';
}

function isPeakHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 17 && hour <= 21;
}

export default function PlaylistScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp<MusicStackParamList>>();
  const queryClient = useQueryClient();
  const { isDark } = useThemeMode();
  const { gymId } = route.params;
  const { setActiveGymId } = useGym();
  const { user } = useAuth();
  const { isConnected, user: spotifyUser } = useSpotify();
  const { showToast } = useToast();
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { fontScale } = useWindowDimensions();
  const useFixedLayout = fontScale <= 1.1;
  // Keep in sync with IOSListRow padding and song text line heights.
  const rowHeight = compact ? 78 : 92;

  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const [showAddSong, setShowAddSong] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const voteCooldownRef = useRef<Record<string, number>>({});
  const lastNowPlayingRef = useRef<string | null>(null);

  const queueCacheKey = `@bb_gym_queue_cache_${gymId}`;
  const queueCacheUpdatedKey = `@bb_gym_queue_cache_updated_${gymId}`;
  const lastPlayedKey = `@bb_music_last_played_${gymId}`;
  const playCountsKey = `@bb_music_play_counts_${gymId}`;
  const voteHistoryKey = `@bb_music_vote_history_${gymId}`;
  const badgeKey = `@bb_music_badges_${gymId}`;
  const likedSongsKey = `@bb_music_liked_${gymId}_${user?.id ?? 'guest'}`;
  const recommenderCreditsKey = `@bb_music_recommender_credits_${gymId}`;

  const [offlineQueue, setOfflineQueue] = useState<QueueSong[]>([]);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
  const [lastPlayedMap, setLastPlayedMap] = useState<Record<string, string>>({});
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [voteHistory, setVoteHistory] = useState<Record<string, { voteType: 'up' | 'down'; votedAt: string }>>({});
  const [badges, setBadges] = useState<MusicBadge[]>([]);
  const [likedSongs, setLikedSongs] = useState<Record<string, LikedEntry>>({});
  const [recommenderCredits, setRecommenderCredits] = useState<Record<string, number>>({});
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [saveTarget, setSaveTarget] = useState<QueueSong | null>(null);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    setActiveGymId(gymId);
  }, [gymId, setActiveGymId]);

  useEffect(() => {
    const loadCached = async () => {
      try {
        const [
          queueRaw,
          queueUpdatedRaw,
          lastPlayedRaw,
          playCountsRaw,
          voteHistoryRaw,
          badgesRaw,
          likedSongsRaw,
          recommenderRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(queueCacheKey),
          AsyncStorage.getItem(queueCacheUpdatedKey),
          AsyncStorage.getItem(lastPlayedKey),
          AsyncStorage.getItem(playCountsKey),
          AsyncStorage.getItem(voteHistoryKey),
          AsyncStorage.getItem(badgeKey),
          AsyncStorage.getItem(likedSongsKey),
          AsyncStorage.getItem(recommenderCreditsKey),
        ]);
        setOfflineQueue(safeParseJSON(queueRaw, []));
        if (queueUpdatedRaw) setCacheUpdatedAt(queueUpdatedRaw);
        setLastPlayedMap(safeParseJSON(lastPlayedRaw, {}));
        setPlayCounts(safeParseJSON(playCountsRaw, {}));
        setVoteHistory(safeParseJSON(voteHistoryRaw, {}));
        setBadges(safeParseJSON(badgesRaw, []));
        setLikedSongs(safeParseJSON(likedSongsRaw, []));
        const parsedCredits = safeParseJSON<number | null>(recommenderRaw, null);
        if (parsedCredits !== null) setRecommenderCredits(parsedCredits);
      } catch (error) {
        devLog.error('Failed to load cached playlist data:', error);
        // Continue with empty state, will load from API
      }
    };
    loadCached();
  }, [
    queueCacheKey,
    queueCacheUpdatedKey,
    lastPlayedKey,
    playCountsKey,
    voteHistoryKey,
    badgeKey,
    likedSongsKey,
    recommenderCreditsKey,
  ]);

  const { data: queueData, isLoading, isError, error, refetch: refetchQueue } = useQuery({
    queryKey: ['queue', gymId],
    queryFn: () => getGymQueue(gymId),
    refetchInterval: 30000, // Updated: 15s → 30s for better performance
    staleTime: 10000,
  });

  const { data: feedData, refetch: refetchFeed } = useQuery({
    queryKey: ['now-playing', gymId],
    queryFn: () => getNowPlayingFeed(gymId),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const { data: setlists = [], isLoading: setlistsLoading } = useQuery({
    queryKey: ['setlists', user?.id],
    queryFn: () => listSetlists(user?.id || ''),
    enabled: !!user?.id && showSavePicker,
  });

  useEffect(() => {
    if (!queueData?.queue || queueData.queue.length === 0) return;
    const saveQueue = async () => {
      try {
        const updatedAt = new Date().toISOString();
        setOfflineQueue(queueData.queue);
        setCacheUpdatedAt(updatedAt);
        await AsyncStorage.setItem(queueCacheKey, JSON.stringify(queueData.queue));
        await AsyncStorage.setItem(queueCacheUpdatedKey, updatedAt);
      } catch (error) {
        devLog.error('Failed to cache queue data:', error);
        // State is updated, just caching failed
      }
    };
    saveQueue();
  }, [queueData, queueCacheKey, queueCacheUpdatedKey]);

  const voteMutation = useMutation({
    mutationFn: ({ songId, voteType }: { songId: string; voteType: 'up' | 'down' }) =>
      voteOnSong(gymId, songId, voteType),
    onMutate: async ({ songId, voteType }) => {
      haptics.selectionChanged();
      await queryClient.cancelQueries({ queryKey: ['queue', gymId] });
      const previous = queryClient.getQueryData<{ nowPlaying: QueueSong | null; queue: QueueSong[] }>([
        'queue',
        gymId,
      ]);

      if (previous) {
        const delta = voteType === 'up' ? 1 : -1;
        queryClient.setQueryData(['queue', gymId], {
          ...previous,
          queue: previous.queue.map((song) =>
            song.id === songId ? { ...song, voteScore: song.voteScore + delta } : song
          ),
          nowPlaying:
            previous.nowPlaying?.id === songId
              ? { ...previous.nowPlaying, voteScore: previous.nowPlaying.voteScore + delta }
              : previous.nowPlaying,
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      haptics.error();
      if (context?.previous) {
        queryClient.setQueryData(['queue', gymId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', gymId] });
    },
  });

  const addSongMutation = useMutation({
    mutationFn: (track: SpotifyTrack) =>
      addSongToQueue(gymId, {
        uri: track.uri,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', gymId] });
      setShowAddSong(false);
      haptics.success();
      showToast('Track added to the playlist', { type: 'success' });
    },
    onError: (error) => {
      haptics.error();
      showToast('Failed to add song. Please try again.', { type: 'error' });
      devLog.error('Add song error:', error);
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ songId, emoji }: { songId: string; emoji: string }) =>
      addReaction(gymId, { songId, emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing', gymId] });
      haptics.success();
      showToast('Reaction added', { type: 'success' });
    },
    onError: (error) => {
      haptics.error();
      showToast('Failed to add reaction', { type: 'error' });
      devLog.error('Reaction error:', error);
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ songId, message }: { songId: string; message: string }) =>
      addComment(gymId, { songId, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing', gymId] });
      haptics.success();
      showToast('Comment posted', { type: 'success' });
    },
    onError: (error) => {
      haptics.error();
      showToast('Failed to post comment', { type: 'error' });
      devLog.error('Comment error:', error);
    },
  });

  const updateLikedEntry = useCallback(
    async (song: QueueSong, destinationKey: string) => {
      try {
        const existing = likedSongs[song.uri];
        const destinations = new Set(existing?.destinations || []);
        if (destinations.has(destinationKey)) {
          return false;
        }
        destinations.add(destinationKey);
        const next = {
          ...likedSongs,
          [song.uri]: {
            savedAt: new Date().toISOString(),
            destinations: Array.from(destinations),
          },
        };
        setLikedSongs(next);
        await AsyncStorage.setItem(likedSongsKey, JSON.stringify(next));
        return true;
      } catch (error) {
        devLog.error('Failed to persist liked track:', error);
        return false;
      }
    },
    [likedSongs, likedSongsKey]
  );

  const bumpRecommenderCredit = useCallback(
    async (song: QueueSong) => {
      const recommenderId = song.addedBy;
      if (!recommenderId || recommenderId === 'system') return;
      try {
        const next = {
          ...recommenderCredits,
          [recommenderId]: (recommenderCredits[recommenderId] || 0) + 1,
        };
        setRecommenderCredits(next);
        await AsyncStorage.setItem(recommenderCreditsKey, JSON.stringify(next));
      } catch (error) {
        devLog.error('Failed to record recommender credit:', error);
      }
    },
    [recommenderCredits, recommenderCreditsKey]
  );

  const saveMutation = useMutation({
    mutationFn: async ({ song, destination }: { song: QueueSong; destination: SaveDestination }) => {
      if (!user?.id) {
        throw new Error('Sign in to save tracks.');
      }
      const payload = {
        title: song.title,
        artist: song.artist,
        uri: song.uri,
      };
      if (destination.type === 'favorites') {
        await addFavorite(user.id, payload);
      } else {
        await addTrackToSetlist(user.id, destination.setlistId, payload);
      }
      return destination;
    },
    onSuccess: async (destination, variables) => {
      const destinationKey =
        destination.type === 'favorites' ? 'favorites' : `setlist:${destination.setlistId}`;
      const saved = await updateLikedEntry(variables.song, destinationKey);
      if (saved) {
        await bumpRecommenderCredit(variables.song);
      }
      if (destination.type === 'setlist') {
        queryClient.invalidateQueries({ queryKey: ['setlists', user?.id] });
      }
      setShowSavePicker(false);
      setSaveTarget(null);
      const label =
        destination.type === 'favorites' ? 'Liked Songs' : destination.name;
      showToast(saved ? `Saved to ${label}` : `Already in ${label}`, {
        type: saved ? 'success' : 'info',
      });
    },
    onError: (error) => {
      devLog.error('Save track error:', error);
      showToast('Unable to save track right now.', { type: 'error' });
    },
  });

  const recordVote = useCallback(
    async (songId: string, voteType: 'up' | 'down') => {
      try {
        const next = {
          ...voteHistory,
          [songId]: { voteType, votedAt: new Date().toISOString() },
        };
        setVoteHistory(next);
        await AsyncStorage.setItem(voteHistoryKey, JSON.stringify(next));
      } catch (error) {
        devLog.error('Failed to record vote history:', error);
        // Vote still went through to API, just local tracking failed
      }
    },
    [voteHistory, voteHistoryKey]
  );

  // Memoize callbacks for better performance
  const handleVote = useCallback((songId: string, voteType: 'up' | 'down') => {
    const now = Date.now();
    const lastVote = voteCooldownRef.current[songId] || 0;
    if (now - lastVote < 700) {
      return;
    }
    const previousVote = voteHistory[songId];
    if (previousVote?.voteType === voteType) {
      showToast('Vote already counted.', { type: 'info' });
      return;
    }
    voteCooldownRef.current[songId] = now;
    recordVote(songId, voteType);
    voteMutation.mutate({ songId, voteType });
  }, [voteHistory, recordVote, showToast, voteMutation]);

  const handleSelectTrack = useCallback((track: SpotifyTrack) => {
    addSongMutation.mutate(track);
  }, [addSongMutation]);

  const handleSongLongPress = useCallback((song: QueueSong) => {
    const isAlreadyLiked = !!likedSongs[song.id];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            isAlreadyLiked ? 'Saved' : 'Save to Liked Songs',
            'Share Song',
            'Report Inappropriate',
            'Cancel',
          ],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 3,
          disabledButtonIndices: isAlreadyLiked ? [0] : [],
        },
        (buttonIndex) => {
          if (buttonIndex === 0 && !isAlreadyLiked) {
            handleOpenSavePicker(song);
          } else if (buttonIndex === 1) {
            showToast('Share feature coming soon', { type: 'info' });
          } else if (buttonIndex === 2) {
            Alert.alert(
              'Report Song',
              'Report this song as inappropriate?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Report',
                  style: 'destructive',
                  onPress: () => showToast('Song reported. Thank you.', { type: 'success' }),
                },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(
        song.title,
        `by ${song.artist}`,
        [
          {
            text: isAlreadyLiked ? 'Saved ✓' : 'Save to Liked Songs',
            onPress: () => !isAlreadyLiked && handleOpenSavePicker(song),
          },
          {
            text: 'Share Song',
            onPress: () => showToast('Share feature coming soon', { type: 'info' }),
          },
          {
            text: 'Report Inappropriate',
            onPress: () => showToast('Song reported. Thank you.', { type: 'success' }),
            style: 'destructive',
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [likedSongs, showToast]);

  const handleOpenSavePicker = useCallback((song: QueueSong) => {
    if (!user?.id) {
      showToast('Sign in to save tracks.', { type: 'info' });
      return;
    }
    setSaveTarget(song);
    setShowSavePicker(true);
  }, [showToast, user?.id]);

  const handleSaveToDestination = useCallback((destination: SaveDestination) => {
    if (!saveTarget) return;
    saveMutation.mutate({ song: saveTarget, destination });
  }, [saveMutation, saveTarget]);

  const handleOpenSetlists = useCallback(() => {
    setShowSavePicker(false);
    setSaveTarget(null);
    navigation.navigate('Setlists');
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchQueue(), refetchFeed()]);
    setRefreshing(false);
  }, [refetchQueue, refetchFeed]);

  const fallbackActive = isError && offlineQueue.length > 0;
  const effectiveQueue = fallbackActive ? offlineQueue : queueData?.queue || [];

  // Memoize sorted songs for performance
  const sortedSongs = useMemo(
    () => effectiveQueue.slice().sort((a, b) => b.voteScore - a.voteScore),
    [effectiveQueue]
  );

  const nowPlaying = fallbackActive
    ? offlineQueue.find((song) => song.isPlaying) || offlineQueue[0] || null
    : queueData?.nowPlaying || sortedSongs.find((song) => song.isPlaying) || null;

  const handleReaction = useCallback((emoji: string) => {
    if (!nowPlaying) {
      showToast('Nothing is playing right now.', { type: 'info' });
      return;
    }
    haptics.selectionChanged();
    reactionMutation.mutate({ songId: nowPlaying.id, emoji });
  }, [nowPlaying, reactionMutation, showToast]);

  const handleSendComment = useCallback((message: string) => {
    if (!nowPlaying) {
      showToast('Nothing is playing right now.', { type: 'info' });
      return;
    }
    commentMutation.mutate({ songId: nowPlaying.id, message });
  }, [nowPlaying, commentMutation, showToast]);

  const handleIdentify = useCallback(async () => {
    try {
      haptics.selectionChanged();
      const result = await identifyNowPlaying(gymId);
      if (!result) {
        showToast('Nothing is playing right now.', { type: 'info' });
        return;
      }
      if (user?.id) {
        await addFavorite(user.id, {
          title: result.title,
          artist: result.artist,
          uri: result.uri,
        });
      }
      if (isConnected && spotifyUser?.id) {
        try {
          await addToGymHits(spotifyUser.id, result.uri);
        } catch (syncError) {
          devLog.warn('Gym Hits sync failed:', syncError);
        }
      }
      haptics.success();
      showToast(`Identified: ${result.title} · ${result.artist}`, { type: 'success' });
    } catch (identifyError) {
      haptics.error();
      showToast('Unable to identify the song right now.', { type: 'error' });
    }
  }, [gymId, user?.id, isConnected, spotifyUser?.id, showToast]);

  const nextUp = useMemo(
    () => sortedSongs.find((song) => song.id !== nowPlaying?.id) || null,
    [sortedSongs, nowPlaying?.id]
  );

  const nextUpIntent = useMemo(() => {
    if (!nextUp) return null;
    const maxVotes = sortedSongs.reduce((max, song) => Math.max(max, song.voteScore), 1);
    const waitMinutes = nextUp.addedAt
      ? Math.max(0, (Date.now() - new Date(nextUp.addedAt).getTime()) / 60000)
      : 0;
    const energyScore = Math.min(
      100,
      Math.round((nextUp.voteScore / maxVotes) * 60 + Math.min(waitMinutes, 60) * (40 / 60))
    );
    const lastPlayedAt = lastPlayedMap[nextUp.id];
    return {
      votes: Math.round(nextUp.voteScore),
      energyLabel: getEnergyLabel(energyScore),
      lastPlayedText: lastPlayedAt ? formatRelativeTime(lastPlayedAt) : 'First play today',
    };
  }, [nextUp, sortedSongs, lastPlayedMap]);

  const renderSongCard = useCallback(
    ({ item, index }: { item: QueueSong; index: number }) => (
      <StaggerItem index={index}>
        <SongCard
          item={item}
          index={index}
          onVote={handleVote}
          onLike={handleOpenSavePicker}
          onLongPress={handleSongLongPress}
          isVoting={voteMutation.isPending}
          isLiked={Boolean(likedSongs[item.uri])}
          userVote={voteHistory[item.id]?.voteType}
          recommenderScore={recommenderCredits[item.addedBy] || 0}
          compact={compact}
          gymName={undefined}
        />
      </StaggerItem>
    ),
    [
      compact,
      handleOpenSavePicker,
      handleSongLongPress,
      handleVote,
      likedSongs,
      recommenderCredits,
      voteHistory,
      voteMutation.isPending,
    ]
  );

  const songKeyExtractor = useCallback((item: QueueSong) => item.id, []);

  const getSongLayout = useCallback(
    (_data: ArrayLike<QueueSong> | null | undefined, index: number) => ({
      length: rowHeight,
      offset: rowHeight * index,
      index,
    }),
    [rowHeight]
  );

  const awardBadge = useCallback(
    async (badge: MusicBadge) => {
      try {
        if (badges.some((item) => item.id === badge.id)) return;
        const next = [badge, ...badges].slice(0, 6);
        setBadges(next);
        await AsyncStorage.setItem(badgeKey, JSON.stringify(next));
        showToast(`Badge earned: ${badge.title}`, { type: 'success' });
      } catch (error) {
        devLog.error('Failed to save badge:', error);
        // Badge is shown in UI, just persistence failed
      }
    },
    [badges, badgeKey, showToast]
  );

  useEffect(() => {
    if (!nowPlaying) return;
    if (lastNowPlayingRef.current === nowPlaying.id) return;
    lastNowPlayingRef.current = nowPlaying.id;

    const trackPlay = async () => {
      try {
        const playedAt = new Date().toISOString();

        const nextLastPlayed = { ...lastPlayedMap, [nowPlaying.id]: playedAt };
        setLastPlayedMap(nextLastPlayed);
        await AsyncStorage.setItem(lastPlayedKey, JSON.stringify(nextLastPlayed));

        const nextCounts = { ...playCounts, [nowPlaying.id]: (playCounts[nowPlaying.id] || 0) + 1 };
        setPlayCounts(nextCounts);
        await AsyncStorage.setItem(playCountsKey, JSON.stringify(nextCounts));

        const peak = isPeakHours();
        const voteMeta = voteHistory[nowPlaying.id];
        if (voteMeta?.voteType === 'up' && peak) {
          const minutesSinceVote =
            (Date.now() - new Date(voteMeta.votedAt).getTime()) / 60000;
          if (minutesSinceVote <= 10) {
            awardBadge({
              id: `clutch-${nowPlaying.id}`,
              title: 'Clutch Vote',
              description: 'Your vote landed during peak hours.',
              icon: '⚡️',
              earnedAt: playedAt,
            });
          }
        }

        const currentCount = nextCounts[nowPlaying.id];
        const highestCount = Math.max(...Object.values(nextCounts));
        if (currentCount >= 3 && currentCount === highestCount) {
          awardBadge({
            id: `most-played-${nowPlaying.id}`,
            title: 'Most Played Track',
            description: 'Your top track is on repeat.',
            icon: '🏆',
            earnedAt: playedAt,
          });
        }
      } catch (error) {
        devLog.error('Failed to track play data:', error);
        // Non-critical tracking feature, continue silently
      }
    };

    trackPlay();
  }, [
    nowPlaying,
    lastPlayedMap,
    lastPlayedKey,
    playCounts,
    playCountsKey,
    voteHistory,
    awardBadge,
  ]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonCard, { backgroundColor: iosColors.systemBackground }]}>
              <View style={[styles.skeletonCover, { backgroundColor: iosColors.systemFill }]} />
            </View>
          </View>
          <SkeletonPlaylist count={8} style={{ paddingHorizontal: SPACING.lg }} />
        </SafeAreaView>
      </View>
    );
  }

  if (isError && !fallbackActive) {
    return <ErrorView error={error as Error} onRetry={refetchQueue} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        {fallbackActive && (
          <IOSCard style={[styles.fallbackCard, compact && styles.fallbackCardCompact]}>
            <View style={styles.fallbackHeader}>
              <Badge label="Offline fallback" variant="warning" size="small" icon="📡" />
              {cacheUpdatedAt && (
                <Text style={[styles.fallbackMeta, { color: iosColors.secondaryLabel }]}>
                  Updated {formatRelativeTime(cacheUpdatedAt)}
                </Text>
              )}
            </View>
            <Text style={[styles.fallbackText, { color: iosColors.secondaryLabel }]}>
              Showing the last cached gym-approved playlist.
            </Text>
          </IOSCard>
        )}

        {/* Now Playing Header */}
        {nowPlaying && <NowPlayingCard track={nowPlaying} compact={compact} />}

        {nextUp && nextUpIntent && (
          <IOSCard style={[styles.intentCard, compact && styles.intentCardCompact]}>
            <View style={styles.intentHeader}>
              <Text style={[styles.intentTitle, { color: iosColors.label }]}>Up Next</Text>
              <Badge label="Intent" variant="primary" size="small" icon="🎯" />
            </View>
            <Text style={[styles.intentTrack, { color: iosColors.label }]} numberOfLines={1}>
              {nextUp.title}
            </Text>
            <Text style={[styles.intentArtist, { color: iosColors.secondaryLabel }]} numberOfLines={1}>
              {nextUp.artist}
            </Text>
            <View style={styles.intentRow}>
              <View style={[styles.intentPill, { backgroundColor: iosColors.systemFill }]}>
                <Text style={[styles.intentPillText, { color: iosColors.label }]}>
                  Votes {nextUpIntent.votes}
                </Text>
              </View>
              <View style={[styles.intentPill, { backgroundColor: iosColors.systemFill }]}>
                <Text style={[styles.intentPillText, { color: iosColors.label }]}>
                  Energy {nextUpIntent.energyLabel}
                </Text>
              </View>
              <View style={[styles.intentPill, { backgroundColor: iosColors.systemFill }]}>
                <Text style={[styles.intentPillText, { color: iosColors.label }]}>
                  Last played {nextUpIntent.lastPlayedText}
                </Text>
              </View>
            </View>
          </IOSCard>
        )}

        {/* Action Button */}
        <View style={[styles.header, compact && styles.headerCompact]}>
          <Button
            title="Add Track"
            onPress={() => setShowAddSong(true)}
            variant="primary"
            icon={<Text style={{ fontSize: 20 }}>+</Text>}
            style={styles.addButton}
            accessible={true}
            accessibilityLabel="Add track to playlist"
            accessibilityHint="Opens search to add a song to the gym playlist"
            accessibilityRole="button"
          />
        </View>

        {/* Queue Header */}
        <View style={[styles.queueHeader, compact && styles.queueHeaderCompact]}>
          <Text style={[styles.queueTitle, { color: iosColors.secondaryLabel }]}>UP NEXT</Text>
          <Text style={[styles.queueMeta, { color: iosColors.tertiaryLabel }]}>
            {sortedSongs.length} tracks
          </Text>
        </View>

        {/* Songs List */}
        <View
          style={[
            styles.groupedContainerStart,
            compact && styles.groupedContainerCompact,
            { backgroundColor: iosColors.secondarySystemGroupedBackground },
          ]}
        />
        <FlatList
          data={sortedSongs}
          renderItem={renderSongCard}
          keyExtractor={songKeyExtractor}
          contentContainerStyle={[styles.list, compact && styles.listCompact]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={useFixedLayout ? getSongLayout : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={iosColors.tint}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Text style={styles.emptyIconText}>🎵</Text>}
              title="Queue is empty"
              message="Be the first to add a track."
              action={{ label: 'Add Track', onPress: () => setShowAddSong(true) }}
            />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <IOSCard style={[styles.extrasCard, compact && styles.extrasCardCompact]}>
                <Pressable
                  onPress={() => setShowExtras((prev) => !prev)}
                  style={({ pressed }) => [
                    styles.extrasToggle,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Community activity"
                  accessibilityHint="Show or hide the live feed and rewards"
                >
                  <View style={styles.extrasText}>
                    <Text style={[styles.extrasTitle, { color: iosColors.label }]}>Community</Text>
                    <Text style={[styles.extrasSubtitle, { color: iosColors.secondaryLabel }]}>
                      Live reactions, comments, and rewards
                    </Text>
                  </View>
                  <Text style={[styles.extrasAction, { color: iosColors.tint }]}>
                    {showExtras ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </IOSCard>

              {showExtras && nowPlaying && (
                <CommunitySection
                  comments={feedData?.comments || []}
                  badges={badges}
                  onReaction={handleReaction}
                  onSendComment={handleSendComment}
                  onIdentify={handleIdentify}
                  compact={compact}
                />
              )}
            </View>
          }
          CellRendererComponent={({ children, index, style, ...props }) => (
            <View
              style={[
                style,
                index === 0 && styles.firstCell,
                index === sortedSongs.length - 1 && styles.lastCell,
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
        />
        <View
          style={[
            styles.groupedContainerEnd,
            compact && styles.groupedContainerCompact,
            { backgroundColor: iosColors.secondarySystemGroupedBackground },
          ]}
        />

        {/* Add Song Modal */}
        <Modal visible={showAddSong} animationType="slide" presentationStyle="pageSheet">
          <SpotifyTemplate contentStyle={styles.modalContainer}>
            <ModalHeader
              title="Add Track"
              subtitle="Search Spotify"
              onClose={() => setShowAddSong(false)}
            />

            <View style={styles.modalBody}>
              <SpotifySearch onSelectTrack={handleSelectTrack} />
            </View>
          </SpotifyTemplate>
        </Modal>

        <SaveTrackModal
          visible={showSavePicker}
          track={saveTarget}
          setlists={setlists}
          isLoadingSetlists={setlistsLoading}
          isSaving={saveMutation.isPending}
          onSave={handleSaveToDestination}
          onOpenSetlists={handleOpenSetlists}
          onClose={() => {
            setShowSavePicker(false);
            setSaveTarget(null);
          }}
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
  // Now Playing Card
  nowPlayingCard: {
    margin: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  nowPlayingCardCompact: {
    margin: SPACING.base,
    marginBottom: SPACING.sm,
  },
  nowPlayingGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(203, 255, 0, 0.18)',
  },
  nowPlayingHeader: {
    marginBottom: SPACING.md,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  nowPlayingCover: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingCoverImage: {
    width: 56,
    height: 56,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  nowPlayingArtist: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  // Feed Section
  feedSection: {
    margin: LAYOUT.screenPadding,
    marginTop: 0,
    marginBottom: SPACING.md,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  identifyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  identifyText: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
  },
  reactionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  commentsSection: {
    marginBottom: SPACING.md,
  },
  commentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  commentUser: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
  },
  commentMessage: {
    ...TYPOGRAPHY.presets.caption,
    flex: 1,
  },
  commentEmpty: {
    ...TYPOGRAPHY.presets.caption,
    fontStyle: 'italic',
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    ...TYPOGRAPHY.presets.caption,
  },
  commentSend: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  commentSendText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    paddingBottom: SPACING['2xl'],
  },
  extrasCard: {
    marginHorizontal: LAYOUT.screenPadding,
    marginTop: SPACING.md,
  },
  extrasCardCompact: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
  },
  extrasToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extrasText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  extrasTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  extrasSubtitle: {
    fontSize: 13,
  },
  extrasAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Action Buttons
  header: {
    flexDirection: 'row',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  headerCompact: {
    paddingVertical: SPACING.sm,
  },
  addButton: {
    flex: 1,
  },
  leaderboardButton: {
    flex: 1,
  },
  // Queue Header
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  queueHeaderCompact: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  queueTitle: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  queueMeta: {
    fontSize: 12,
    fontWeight: '500',
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

  // Song List
  list: {
    paddingBottom: SPACING.xl,
  },
  listCompact: {
    paddingBottom: SPACING.lg,
  },
  // Save Modal
  saveModalContainer: {
    flex: 1,
  },
  saveModalSafeArea: {
    flex: 1,
  },
  saveTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING.md,
  },
  saveTrackCover: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTrackCoverImage: {
    width: 54,
    height: 54,
  },
  saveTrackInfo: {
    flex: 1,
  },
  saveTrackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  saveTrackArtist: {
    fontSize: 14,
  },
  saveOptions: {
    paddingHorizontal: LAYOUT.screenPadding,
    gap: SPACING.sm,
  },
  saveSectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: SPACING.sm,
  },
  saveOptionRow: {
    padding: SPACING.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  saveOptionMeta: {
    fontSize: 12,
  },
  saveOptionAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveLoadingText: {
    fontSize: 13,
    paddingHorizontal: SPACING.xs,
  },
  saveEmptyState: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  saveEmptyText: {
    fontSize: 13,
  },

  // Song Card
  songCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  songCardContentCompact: {
    gap: SPACING.sm,
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songCoverCompact: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  songCoverImage: {
    width: 48,
    height: 48,
  },
  songCoverImageCompact: {
    width: 40,
    height: 40,
  },
  songCoverIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  songCoverIconCompact: {
    fontSize: 16,
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
  songInfo: {
    flex: 1,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  likedIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  likedIconCompact: {
    fontSize: 11,
  },
  songTitle: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    flex: 1,
  },
  songTitleCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  songArtist: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 2,
  },
  songArtistCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  songMeta: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  songMetaCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  voteSection: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  voteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  voteIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  voteIconCompact: {
    fontSize: 12,
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  likeIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  likeIconCompact: {
    fontSize: 11,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  scoreTextCompact: {
    fontSize: 13,
    minWidth: 26,
  },

  // Empty State
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['4xl'],
    marginHorizontal: 16,
  },
  emptyIconText: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '400',
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.presets.heading1,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.md,
  },
  modalAccent: {
    width: 60,
    height: 3,
    borderRadius: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
  },
  fallbackCard: {
    margin: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  fallbackCardCompact: {
    margin: SPACING.base,
    marginBottom: SPACING.sm,
  },
  fallbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  fallbackMeta: {
    ...TYPOGRAPHY.presets.caption,
  },
  fallbackText: {
    ...TYPOGRAPHY.presets.caption,
  },
  intentCard: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  intentCardCompact: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  intentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  intentTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  intentTrack: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  intentArtist: {
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  intentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  intentPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  intentPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeCard: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  badgeCardCompact: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  badgeHeader: {
    marginBottom: SPACING.sm,
  },
  badgeTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  badgeMeta: {
    ...TYPOGRAPHY.presets.caption,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  // Skeleton Loader
  skeletonHeader: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  skeletonCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  skeletonCover: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
});
