/**
 * Spotify Screen - Main Spotify Section
 * Browse user's library, playlists, and control playback
 * Tabs: Library, Playlists, Now Playing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useSpotify } from '../contexts/SpotifyContext';
import { useGym } from '../contexts/GymContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { SPOTIFY_THEME, SPACING, TOUCH_TARGET } from '../theme/tokens';
import { spotifyApi, SpotifyTrack, SpotifyPlaylist } from '../services/spotifyApi';
import {
  addSongToQueue,
  getGymQueue,
  getGymMatches,
  getGymWrapped,
  getSpotifyNowPlaying,
  syncSpotifyNowPlaying,
} from '../services/gymApi';
import { LoadingView, ErrorView } from '../components/UI';
import SpotifyTemplate from '../components/SpotifyTemplate';
import SpotifyButton from '../components/SpotifyButton';
import type { QueueSong } from '../types';

type TabType = 'library' | 'playlists' | 'playing' | 'gym';

const CACHE_KEYS = {
  tracks: '@spotify_cached_tracks',
  playlists: '@spotify_cached_playlists',
  gymQueue: (gymId: string) => `@gym_queue_cache_${gymId}`,
  gymQueueUpdated: (gymId: string) => `@gym_queue_cache_updated_${gymId}`,
};

function formatRelativeTime(iso?: string | null) {
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

export default function SpotifyScreen() {
  const navigation = useNavigation();
  const { isConnected, user, refreshAccessToken } = useSpotify();
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [refreshing, setRefreshing] = useState(false);
  const { activeGymId } = useGym();
  const [cachedTracks, setCachedTracks] = useState<SpotifyTrack[]>([]);
  const [cachedPlaylists, setCachedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<QueueSong[]>([]);
  const [offlineUpdatedAt, setOfflineUpdatedAt] = useState<string | null>(null);
  const [lastPlaybackAt, setLastPlaybackAt] = useState<string | null>(null);

  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { fontScale } = useWindowDimensions();
  const useFixedLayout = fontScale <= 1.1;
  // Keep in sync with card padding, image sizes, and list spacing.
  const trackRowHeight = compact ? 62 : 84;
  const playlistRowHeight = compact ? 66 : 88;

  const colors = SPOTIFY_THEME;

  // Set up token refresh callback
  useEffect(() => {
    spotifyApi.setRefreshTokenCallback(refreshAccessToken);
  }, [refreshAccessToken]);

  useEffect(() => {
    const loadCache = async () => {
      const [tracksRaw, playlistsRaw] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.tracks),
        AsyncStorage.getItem(CACHE_KEYS.playlists),
      ]);
      if (tracksRaw) {
        setCachedTracks(JSON.parse(tracksRaw));
      }
      if (playlistsRaw) {
        setCachedPlaylists(JSON.parse(playlistsRaw));
      }
    };
    loadCache();
  }, []);

  useEffect(() => {
    if (!activeGymId) {
      setOfflineQueue([]);
      setOfflineUpdatedAt(null);
      return;
    }
    const loadGymCache = async () => {
      const [queueRaw, updatedRaw] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.gymQueue(activeGymId)),
        AsyncStorage.getItem(CACHE_KEYS.gymQueueUpdated(activeGymId)),
      ]);
      if (queueRaw) {
        setOfflineQueue(JSON.parse(queueRaw));
      }
      if (updatedRaw) {
        setOfflineUpdatedAt(updatedRaw);
      }
    };
    loadGymCache();
  }, [activeGymId]);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      navigation.navigate('SpotifyConnect' as never);
    }
  }, [isConnected, navigation]);

  // Fetch user's saved tracks
  const {
    data: savedTracks,
    isLoading: isLoadingTracks,
    error: tracksError,
    refetch: refetchTracks,
  } = useQuery({
    queryKey: ['spotify', 'saved-tracks'],
    queryFn: () => spotifyApi.getSavedTracks(50),
    enabled: isConnected && activeTab === 'library',
    staleTime: 1000 * 60 * 5, // 5 minutes
    onSuccess: async (data) => {
      await AsyncStorage.setItem(CACHE_KEYS.tracks, JSON.stringify(data));
    },
  });

  // Fetch user's playlists
  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    error: playlistsError,
    refetch: refetchPlaylists,
  } = useQuery({
    queryKey: ['spotify', 'playlists'],
    queryFn: () => spotifyApi.getUserPlaylists(50),
    enabled: isConnected && activeTab === 'playlists',
    staleTime: 1000 * 60 * 5,
    onSuccess: async (data) => {
      await AsyncStorage.setItem(CACHE_KEYS.playlists, JSON.stringify(data));
    },
  });

  // Fetch current playback
  const {
    data: playback,
    isLoading: isLoadingPlayback,
    error: playbackError,
    refetch: refetchPlayback,
  } = useQuery({
    queryKey: ['spotify', 'playback'],
    queryFn: () => spotifyApi.getCurrentPlayback(),
    enabled: isConnected && (activeTab === 'playing' || activeTab === 'gym'),
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const {
    data: gymWrapped,
    isLoading: isLoadingWrapped,
    error: wrappedError,
    refetch: refetchWrapped,
  } = useQuery({
    queryKey: ['gym', 'wrapped', activeGymId],
    queryFn: () => getGymWrapped(activeGymId || ''),
    enabled: !!activeGymId && activeTab === 'gym',
    staleTime: 1000 * 60,
  });

  const {
    data: gymMatches,
    isLoading: isLoadingMatches,
    error: matchesError,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ['gym', 'matches', activeGymId],
    queryFn: () => getGymMatches(activeGymId || ''),
    enabled: !!activeGymId && activeTab === 'gym',
    staleTime: 1000 * 60,
  });

  const {
    data: gymNowPlaying,
    refetch: refetchGymNowPlaying,
  } = useQuery({
    queryKey: ['gym', 'spotify-now-playing', activeGymId],
    queryFn: () => getSpotifyNowPlaying(activeGymId || ''),
    enabled: !!activeGymId && activeTab === 'gym',
    staleTime: 1000 * 5,
    refetchInterval: 5000,
  });

  useQuery({
    queryKey: ['gym', 'queue-cache', activeGymId],
    queryFn: () => getGymQueue(activeGymId || ''),
    enabled: !!activeGymId && activeTab === 'gym',
    staleTime: 1000 * 60,
    onSuccess: async (data) => {
      const updatedAt = new Date().toISOString();
      setOfflineQueue(data.queue);
      setOfflineUpdatedAt(updatedAt);
      await AsyncStorage.setItem(CACHE_KEYS.gymQueue(activeGymId || ''), JSON.stringify(data.queue));
      await AsyncStorage.setItem(CACHE_KEYS.gymQueueUpdated(activeGymId || ''), updatedAt);
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    switch (activeTab) {
      case 'library':
        await refetchTracks();
        break;
      case 'playlists':
        await refetchPlaylists();
        break;
      case 'playing':
        await refetchPlayback();
        break;
      case 'gym':
        await Promise.all([refetchWrapped(), refetchMatches(), refetchGymNowPlaying(), refetchPlayback()]);
        break;
    }
    setRefreshing(false);
  }, [
    activeTab,
    refetchTracks,
    refetchPlaylists,
    refetchPlayback,
    refetchWrapped,
    refetchMatches,
    refetchGymNowPlaying,
  ]);

  useEffect(() => {
    if (!playback?.item) return;
    setLastPlaybackAt(new Date().toISOString());
  }, [playback?.item?.id, playback?.progress_ms, playback?.is_playing]);

  const connectionStatus = useMemo(() => {
    if (playbackError) {
      return { label: 'Connection lost', color: colors.error };
    }
    if (!playback) {
      return { label: 'Waiting for Spotify', color: colors.textSecondary };
    }
    if (playback.is_playing) {
      return { label: 'Live on Spotify', color: colors.accent };
    }
    return { label: 'Playback paused', color: colors.textSecondary };
  }, [playback, playbackError, colors]);

  const offlineFallbackActive = !playback?.item && offlineQueue.length > 0;

  if (!isConnected) {
    return <LoadingView message="Checking Spotify connection..." />;
  }

  const renderTabs = () => (
    <View
      style={[
        styles.tabs,
        compact && styles.tabsCompact,
        { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.tab,
          compact && styles.tabCompact,
          activeTab === 'library' && [styles.tabActive, { borderBottomColor: colors.accent }],
        ]}
        onPress={() => setActiveTab('library')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            compact && styles.tabTextCompact,
            { color: colors.textPrimary },
            activeTab === 'library' && [styles.tabTextActive, { color: colors.accent }],
          ]}
        >
          Library
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          compact && styles.tabCompact,
          activeTab === 'playlists' && [styles.tabActive, { borderBottomColor: colors.accent }],
        ]}
        onPress={() => setActiveTab('playlists')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            compact && styles.tabTextCompact,
            { color: colors.textPrimary },
            activeTab === 'playlists' && [styles.tabTextActive, { color: colors.accent }],
          ]}
        >
          Playlists
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          compact && styles.tabCompact,
          activeTab === 'playing' && [styles.tabActive, { borderBottomColor: colors.accent }],
        ]}
        onPress={() => setActiveTab('playing')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            compact && styles.tabTextCompact,
            { color: colors.textPrimary },
            activeTab === 'playing' && [styles.tabTextActive, { color: colors.accent }],
          ]}
        >
          Now Playing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          compact && styles.tabCompact,
          activeTab === 'gym' && [styles.tabActive, { borderBottomColor: colors.accent }],
        ]}
        onPress={() => setActiveTab('gym')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            compact && styles.tabTextCompact,
            { color: colors.textPrimary },
            activeTab === 'gym' && [styles.tabTextActive, { color: colors.accent }],
          ]}
        >
          Gym
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleQueueTrack = useCallback(async (track: SpotifyTrack) => {
    if (!activeGymId) {
      return;
    }
    await addSongToQueue(activeGymId, {
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      uri: track.uri,
    });
  }, [activeGymId]);

  const renderTrackItem = useCallback(({ item }: { item: SpotifyTrack }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        compact && styles.trackItemCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      {item.album.images[0] && (
        <Image
          source={{ uri: item.album.images[0].url }}
          style={[styles.albumArt, compact && styles.albumArtCompact]}
          contentFit="cover"
        />
      )}
      <View style={styles.trackInfo}>
        <Text style={[styles.trackName, compact && styles.trackNameCompact, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[styles.trackArtist, compact && styles.trackArtistCompact, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.artists.map(a => a.name).join(', ')}
        </Text>
      </View>
      <View style={styles.trackActions}>
        <Text style={[styles.trackDuration, compact && styles.trackDurationCompact, { color: colors.textTertiary }]}>
          {Math.floor(item.duration_ms / 60000)}:{((item.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
        </Text>
        <TouchableOpacity
          style={[styles.queueButton, compact && styles.queueButtonCompact, { borderColor: colors.primary }]}
          onPress={() => handleQueueTrack(item)}
          disabled={!activeGymId}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.queueButtonText, compact && styles.queueButtonTextCompact, { color: colors.primary }]}>
            Queue
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [activeGymId, colors, compact, handleQueueTrack]);

  const renderPlaylistItem = useCallback(({ item }: { item: SpotifyPlaylist }) => (
    <TouchableOpacity
      style={[
        styles.playlistItem,
        compact && styles.playlistItemCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      {item.images[0] && (
        <Image
          source={{ uri: item.images[0].url }}
          style={[styles.playlistImage, compact && styles.playlistImageCompact]}
          contentFit="cover"
        />
      )}
      <View style={styles.playlistInfo}>
        <Text
          style={[styles.playlistName, compact && styles.playlistNameCompact, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.playlistDetails, compact && styles.playlistDetailsCompact, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.tracks.total} tracks · {item.owner.display_name}
        </Text>
      </View>
      <View style={[styles.playlistChevron, compact && styles.playlistChevronCompact, { borderColor: colors.border }]}>
        <Text style={[styles.chevronText, compact && styles.chevronTextCompact, { color: colors.textSecondary }]}>›</Text>
      </View>
    </TouchableOpacity>
  ), [colors, compact]);

  const getTrackLayout = useCallback(
    (_data: ArrayLike<SpotifyTrack> | null | undefined, index: number) => ({
      length: trackRowHeight,
      offset: trackRowHeight * index,
      index,
    }),
    [trackRowHeight]
  );

  const getPlaylistLayout = useCallback(
    (_data: ArrayLike<SpotifyPlaylist> | null | undefined, index: number) => ({
      length: playlistRowHeight,
      offset: playlistRowHeight * index,
      index,
    }),
    [playlistRowHeight]
  );

  const renderContent = () => {
    if (activeTab === 'library') {
      if (isLoadingTracks) return <LoadingView message="Loading your library..." />;
      if (tracksError && cachedTracks.length === 0) {
        return <ErrorView error={tracksError as Error} onRetry={refetchTracks} />;
      }

      return (
        <FlatList
          data={savedTracks || cachedTracks}
          renderItem={renderTrackItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, compact && styles.listCompact]}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={11}
          updateCellsBatchingPeriod={50}
          getItemLayout={useFixedLayout ? getTrackLayout : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
              <Text style={[styles.emptyText, compact && styles.emptyTextCompact, { color: colors.textSecondary }]}>
                No saved tracks yet
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'playlists') {
      if (isLoadingPlaylists) return <LoadingView message="Loading playlists..." />;
      if (playlistsError && cachedPlaylists.length === 0) {
        return <ErrorView error={playlistsError as Error} onRetry={refetchPlaylists} />;
      }

      return (
        <FlatList
          data={playlists || cachedPlaylists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, compact && styles.listCompact]}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={9}
          updateCellsBatchingPeriod={50}
          getItemLayout={useFixedLayout ? getPlaylistLayout : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
              <Text style={[styles.emptyText, compact && styles.emptyTextCompact, { color: colors.textSecondary }]}>
                No playlists found
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'playing') {
      if (isLoadingPlayback) return <LoadingView message="Loading playback..." />;

      if (!playback || !playback.item) {
        return (
          <View style={[styles.nowPlayingContainer, compact && styles.nowPlayingContainerCompact]}>
            <View
              style={[
                styles.connectionCard,
                compact && styles.connectionCardCompact,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.connectionRow}>
                <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
                <Text style={[styles.connectionTitle, compact && styles.connectionTitleCompact, { color: colors.textPrimary }]}>
                  {connectionStatus.label}
                </Text>
              </View>
              <Text style={[styles.connectionMeta, compact && styles.connectionMetaCompact, { color: colors.textSecondary }]}>
                {lastPlaybackAt ? `Last sync ${formatRelativeTime(lastPlaybackAt)}` : 'Waiting for Spotify updates.'}
              </Text>
            </View>

            {offlineFallbackActive && (
              <View
                style={[
                  styles.offlineCard,
                  compact && styles.offlineCardCompact,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.offlineHeader}>
                  <View style={[styles.offlineBadge, compact && styles.offlineBadgeCompact]}>
                    <Text style={[styles.offlineBadgeText, compact && styles.offlineBadgeTextCompact]}>📡 Offline</Text>
                  </View>
                  {offlineUpdatedAt && (
                    <Text style={[styles.offlineMeta, compact && styles.offlineMetaCompact, { color: colors.textSecondary }]}>
                      Updated {formatRelativeTime(offlineUpdatedAt)}
                    </Text>
                  )}
                </View>
                {offlineQueue.slice(0, 5).map((track) => (
                  <View key={track.id} style={styles.offlineRow}>
                    <Text style={[styles.offlineTitle, compact && styles.offlineTitleCompact, { color: colors.textPrimary }]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={[styles.offlineArtist, compact && styles.offlineArtistCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.playingEmpty, compact && styles.playingEmptyCompact]}>
              <Text style={[styles.emptyIcon, compact && styles.emptyIconCompact, { fontSize: compact ? 44 : 60 }]}>🎵</Text>
              <Text style={[styles.emptyTitle, compact && styles.emptyTitleCompact, { color: colors.textPrimary }]}>
                Nothing Playing
              </Text>
              <Text style={[styles.emptyText, compact && styles.emptyTextCompact, { color: colors.textSecondary }]}>
                Open Spotify and start playing music
              </Text>
            </View>
          </View>
        );
      }

      const track = playback.item;
      return (
        <View style={[styles.nowPlayingContainer, compact && styles.nowPlayingContainerCompact]}>
          <View
            style={[
              styles.connectionCard,
              compact && styles.connectionCardCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.connectionRow}>
              <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
              <Text style={[styles.connectionTitle, compact && styles.connectionTitleCompact, { color: colors.textPrimary }]}>
                {connectionStatus.label}
              </Text>
              {playback.device?.name ? (
                <Text
                  style={[
                    styles.connectionDevice,
                    compact && styles.connectionDeviceCompact,
                    { color: colors.textSecondary },
                  ]}
                >
                  · {playback.device.name}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.connectionMeta, compact && styles.connectionMetaCompact, { color: colors.textSecondary }]}>
              {lastPlaybackAt ? `Last sync ${formatRelativeTime(lastPlaybackAt)}` : 'Tracking Spotify playback.'}
            </Text>
          </View>

          {track.album.images[0] && (
            <Image
              source={{ uri: track.album.images[0].url }}
              style={[styles.nowPlayingArt, compact && styles.nowPlayingArtCompact]}
              contentFit="cover"
            />
          )}
          <Text style={[styles.nowPlayingTitle, compact && styles.nowPlayingTitleCompact, { color: colors.textPrimary }]}>
            {track.name}
          </Text>
          <Text style={[styles.nowPlayingArtist, compact && styles.nowPlayingArtistCompact, { color: colors.textSecondary }]}>
            {track.artists.map(a => a.name).join(', ')}
          </Text>

          <View style={[styles.playbackBar, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.playbackProgress,
                {
                  backgroundColor: colors.primary,
                  width: `${(playback.progress_ms / track.duration_ms) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.playbackTimes}>
            <Text style={[styles.timeText, compact && styles.timeTextCompact, { color: colors.textSecondary }]}>
              {Math.floor(playback.progress_ms / 60000)}:{((playback.progress_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
            </Text>
            <Text style={[styles.timeText, compact && styles.timeTextCompact, { color: colors.textSecondary }]}>
              {Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
            </Text>
          </View>

          <View
            style={[
              styles.deviceInfo,
              compact && styles.deviceInfoCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.deviceText, compact && styles.deviceTextCompact, { color: colors.textSecondary }]}>
              Playing on: {playback.device?.name || 'Unknown device'}
            </Text>
          </View>
        </View>
      );
    }

    if (activeTab === 'gym') {
      return (
        <View style={[styles.gymTab, compact && styles.gymTabCompact]}>
          <View
            style={[
              styles.gymCard,
              compact && styles.gymCardCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.gymCardTitle, compact && styles.gymCardTitleCompact, { color: colors.textPrimary }]}>
              DJ Sync
            </Text>
            <Text style={[styles.gymCardSubtitle, compact && styles.gymCardSubtitleCompact, { color: colors.textSecondary }]}>
              {activeGymId ? `Gym: ${activeGymId}` : 'Select a gym to sync.'}
            </Text>
            <Text style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textTertiary }]}>
              {gymNowPlaying?.track ? `Synced: ${gymNowPlaying.track.title} · ${gymNowPlaying.track.artist}` : 'No synced track yet'}
            </Text>
            <SpotifyButton
              title="Sync Now Playing"
              onPress={async () => {
                if (!activeGymId || !playback?.item) return;
                await syncSpotifyNowPlaying(activeGymId, {
                  title: playback.item.name,
                  artist: playback.item.artists.map((a) => a.name).join(', '),
                  uri: playback.item.uri,
                  deviceName: playback.device?.name,
                });
                refetchGymNowPlaying();
              }}
              disabled={!activeGymId || !playback?.item}
            />
          </View>

          <View
            style={[
              styles.gymCard,
              compact && styles.gymCardCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.gymCardTitle, compact && styles.gymCardTitleCompact, { color: colors.textPrimary }]}>
              Gym Wrapped
            </Text>
            {isLoadingWrapped && <LoadingView message="Loading wrapped..." />}
            {wrappedError && <ErrorView error={wrappedError as Error} onRetry={refetchWrapped} />}
            {gymWrapped && gymWrapped.topTracks.length === 0 && (
              <Text style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
                No data yet.
              </Text>
            )}
            {gymWrapped?.topTracks.map((track) => (
              <Text key={track.id} style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
                {track.title} · {track.artist} ({track.votes})
              </Text>
            ))}
          </View>

          <View
            style={[
              styles.gymCard,
              compact && styles.gymCardCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.gymCardTitle, compact && styles.gymCardTitleCompact, { color: colors.textPrimary }]}>
              Gym Buddy Matches
            </Text>
            {isLoadingMatches && <LoadingView message="Finding matches..." />}
            {matchesError && <ErrorView error={matchesError as Error} onRetry={refetchMatches} />}
            {gymMatches?.map((match) => (
              <Text key={match.userId} style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
                {match.name} · {match.overlapScore} shared artists
              </Text>
            ))}
          </View>

          <View
            style={[
              styles.gymCard,
              compact && styles.gymCardCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.gymCardTitle, compact && styles.gymCardTitleCompact, { color: colors.textPrimary }]}>
              Offline Cache
            </Text>
            <Text style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
              Cached tracks: {cachedTracks.length}
            </Text>
            <Text style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
              Cached playlists: {cachedPlaylists.length}
            </Text>
            <Text style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
              Gym-approved tracks: {offlineQueue.length}
            </Text>
            {offlineUpdatedAt && (
              <Text style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
                Updated {formatRelativeTime(offlineUpdatedAt)}
              </Text>
            )}
            {offlineQueue.slice(0, 3).map((track) => (
              <Text key={track.id} style={[styles.gymCardMeta, compact && styles.gymCardMetaCompact, { color: colors.textSecondary }]}>
                {track.title} · {track.artist}
              </Text>
            ))}
            <SpotifyButton title="Refresh Cache" onPress={handleRefresh} variant="secondary" />
          </View>
        </View>
      );
    }
  };

  return (
    <SpotifyTemplate>
      {renderTabs()}
      {renderContent()}
    </SpotifyTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabsCompact: {
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabCompact: {
    paddingVertical: SPACING.md,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextCompact: {
    fontSize: 13,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  list: {
    padding: SPACING.md,
  },
  listCompact: {
    padding: SPACING.sm,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    minHeight: TOUCH_TARGET.comfortable,
  },
  trackItemCompact: {
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.xs,
    minHeight: TOUCH_TARGET.min,
  },
  albumArt: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: SPACING.md,
  },
  albumArtCompact: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackNameCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
  },
  trackArtistCompact: {
    fontSize: 12,
  },
  trackActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  trackDuration: {
    fontSize: 13,
    marginLeft: SPACING.sm,
  },
  trackDurationCompact: {
    fontSize: 11,
  },
  queueButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueButtonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 26,
    minWidth: 56,
  },
  queueButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  queueButtonTextCompact: {
    fontSize: 11,
  },
  gymTab: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  gymTabCompact: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  gymCard: {
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
  },
  gymCardCompact: {
    borderRadius: 14,
    padding: SPACING.sm,
  },
  gymCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  gymCardTitleCompact: {
    fontSize: 14,
    marginBottom: 4,
  },
  gymCardSubtitle: {
    fontSize: 12,
    marginBottom: 6,
  },
  gymCardSubtitleCompact: {
    fontSize: 11,
    marginBottom: 4,
  },
  gymCardMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  gymCardMetaCompact: {
    fontSize: 11,
    marginBottom: 2,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    minHeight: TOUCH_TARGET.comfortable,
  },
  playlistItemCompact: {
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.xs,
    minHeight: TOUCH_TARGET.min,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: SPACING.md,
  },
  playlistImageCompact: {
    width: 46,
    height: 46,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistNameCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  playlistDetails: {
    fontSize: 13,
  },
  playlistDetailsCompact: {
    fontSize: 11,
  },
  playlistChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  playlistChevronCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  chevronText: {
    fontSize: 24,
    fontWeight: '300',
  },
  chevronTextCompact: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['4xl'],
  },
  emptyStateCompact: {
    padding: SPACING['3xl'],
  },
  emptyIcon: {
    marginBottom: SPACING.lg,
  },
  emptyIconCompact: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptyTitleCompact: {
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyTextCompact: {
    fontSize: 12,
  },
  nowPlayingContainer: {
    flex: 1,
    padding: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingContainerCompact: {
    padding: SPACING.xl,
  },
  nowPlayingArt: {
    width: 220,
    height: 220,
    borderRadius: 20,
    marginBottom: SPACING['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nowPlayingArtCompact: {
    width: 168,
    height: 168,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  nowPlayingTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  nowPlayingTitleCompact: {
    fontSize: 18,
    marginBottom: SPACING.xs,
  },
  nowPlayingArtist: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  nowPlayingArtistCompact: {
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  playbackBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  playbackProgress: {
    height: '100%',
    borderRadius: 2,
  },
  playbackTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timeTextCompact: {
    fontSize: 11,
  },
  deviceInfo: {
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: SPACING.lg,
  },
  deviceInfoCompact: {
    padding: SPACING.sm,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  deviceText: {
    fontSize: 14,
  },
  deviceTextCompact: {
    fontSize: 12,
  },
  connectionCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  connectionCardCompact: {
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  connectionTitleCompact: {
    fontSize: 12,
  },
  connectionDevice: {
    fontSize: 12,
  },
  connectionDeviceCompact: {
    fontSize: 10,
  },
  connectionMeta: {
    fontSize: 12,
  },
  connectionMetaCompact: {
    fontSize: 10,
  },
  offlineCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  offlineCardCompact: {
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  offlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: SPOTIFY_THEME.accentSoft,
    borderWidth: 1,
    borderColor: SPOTIFY_THEME.accent,
  },
  offlineBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offlineBadgeText: {
    color: SPOTIFY_THEME.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  offlineBadgeTextCompact: {
    fontSize: 10,
  },
  offlineMeta: {
    fontSize: 12,
  },
  offlineMetaCompact: {
    fontSize: 10,
  },
  offlineRow: {
    marginTop: SPACING.xs,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  offlineTitleCompact: {
    fontSize: 12,
  },
  offlineArtist: {
    fontSize: 12,
  },
  offlineArtistCompact: {
    fontSize: 10,
  },
  playingEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
    paddingHorizontal: SPACING.lg,
  },
  playingEmptyCompact: {
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.md,
  },
});
