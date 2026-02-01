/**
 * Spotify Search Component
 * Search for songs using Spotify's API
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { debounce } from '../utils/debounce';
import { SPOTIFY_THEME } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  uri: string;
}

interface SpotifySearchProps {
  onSelectTrack: (track: SpotifyTrack) => void;
  accessToken?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function SpotifySearch({ onSelectTrack, accessToken }: SpotifySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Search Spotify for tracks
   */
  const searchSpotify = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // For development, we'll use a mock search
      // In production, you'd use the Spotify Web API with an access token
      const mockResults = await mockSpotifySearch(searchQuery);
      setResults(mockResults);
    } catch (err) {
      setError('Failed to search Spotify. Please try again.');
      console.error('Spotify search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function - 300ms for better performance
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      // Only search if query has at least 2 characters
      if (text.trim().length >= 2) {
        searchSpotify(text);
      } else {
        setResults([]);
      }
    }, 300),
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handleSelectTrack = (track: SpotifyTrack) => {
    onSelectTrack(track);
    setQuery('');
    setResults([]);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <LinearGradient
        colors={SPOTIFY_THEME.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.searchContainer}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs on Spotify..."
          placeholderTextColor={SPOTIFY_THEME.textTertiary}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search Spotify"
          accessibilityHint="Type at least two characters to search for tracks"
        />
        {isSearching && (
          <ActivityIndicator size="small" color={SPOTIFY_THEME.accent} style={styles.loader} />
        )}
      </LinearGradient>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            removeClippedSubviews={true}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={9}
            updateCellsBatchingPeriod={50}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.trackWrapper}
                onPress={() => handleSelectTrack(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} by ${item.artists.map((a) => a.name).join(', ')}`}
                accessibilityHint="Adds this track to the queue"
              >
                <LinearGradient
                  colors={SPOTIFY_THEME.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.trackItem}
                >
                  {/* Album Art */}
                  {item.album.images[0]?.url ? (
                    <Image
                      source={{ uri: item.album.images[0].url }}
                      style={styles.albumArt}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.albumArt, styles.albumArtFallback]}>
                      <Text style={styles.albumArtIcon}>♪</Text>
                    </View>
                  )}

                  {/* Track Info */}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.artistName} numberOfLines={1}>
                      {item.artists.map((a) => a.name).join(', ')}
                    </Text>
                    <Text style={styles.albumName} numberOfLines={1}>
                      {item.album.name}
                    </Text>
                  </View>

                  {/* Duration */}
                  <View style={styles.durationContainer}>
                    <Text style={styles.durationText}>
                      {formatDuration(item.duration_ms)}
                    </Text>
                    <View style={styles.addPill}>
                      <Text style={styles.addIcon}>+</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Empty State */}
      {query && !isSearching && results.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Mock Spotify Search (for development)
// ============================================================================

async function mockSpotifySearch(query: string): Promise<SpotifyTrack[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Mock data based on query
  const mockTracks: SpotifyTrack[] = [
    {
      id: '1',
      name: 'Till I Collapse',
      artists: [{ name: 'Eminem' }, { name: 'Nate Dogg' }],
      album: {
        name: 'The Eminem Show',
        images: [
          {
            url: 'https://i.scdn.co/image/ab67616d0000b273dbb3dd82da2d7d939645d77e',
            height: 640,
            width: 640,
          },
        ],
      },
      duration_ms: 297000,
      uri: 'spotify:track:4xkOaSrkexMciUUogZKVTS',
    },
    {
      id: '2',
      name: 'Lose Yourself',
      artists: [{ name: 'Eminem' }],
      album: {
        name: '8 Mile Soundtrack',
        images: [
          {
            url: 'https://i.scdn.co/image/ab67616d0000b273355ad0ea8de9256acfc03971',
            height: 640,
            width: 640,
          },
        ],
      },
      duration_ms: 326000,
      uri: 'spotify:track:5Z01UMMf7V1o0MzF86s6WJ',
    },
    {
      id: '3',
      name: 'Eye of the Tiger',
      artists: [{ name: 'Survivor' }],
      album: {
        name: 'Eye of the Tiger',
        images: [
          {
            url: 'https://i.scdn.co/image/ab67616d0000b2737c0e5ec6fc91216e35c6a6f4',
            height: 640,
            width: 640,
          },
        ],
      },
      duration_ms: 245000,
      uri: 'spotify:track:2KH16WveTQWT6KOG9Rg6e2',
    },
    {
      id: '4',
      name: 'Stronger',
      artists: [{ name: 'Kanye West' }],
      album: {
        name: 'Graduation',
        images: [
          {
            url: 'https://i.scdn.co/image/ab67616d0000b273cd945b4e3de57edd28481a3f',
            height: 640,
            width: 640,
          },
        ],
      },
      duration_ms: 311000,
      uri: 'spotify:track:0j2T0R9dR9qdJYsB7ciXhf',
    },
    {
      id: '5',
      name: "Can't Hold Us",
      artists: [{ name: 'Macklemore & Ryan Lewis' }, { name: 'Ray Dalton' }],
      album: {
        name: 'The Heist',
        images: [
          {
            url: 'https://i.scdn.co/image/ab67616d0000b273c151f8e2e8b98e3d1f729de1',
            height: 640,
            width: 640,
          },
        ],
      },
      duration_ms: 258000,
      uri: 'spotify:track:18GEphYfx0dYUE3FKU6XYd',
    },
  ];

  // Filter based on query
  return mockTracks.filter(
    (track) =>
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artists.some((artist) =>
        artist.name.toLowerCase().includes(query.toLowerCase())
      )
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SPOTIFY_THEME.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: SPOTIFY_THEME.textPrimary,
    fontWeight: '700',
    paddingVertical: 0,
  },
  loader: {
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  errorText: {
    color: SPOTIFY_THEME.error,
    fontSize: 14,
    fontWeight: '700',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: SPOTIFY_THEME.textTertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultsList: {
    paddingBottom: 20,
  },
  trackWrapper: {
    marginBottom: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: SPOTIFY_THEME.border,
    shadowColor: SPOTIFY_THEME.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: SPOTIFY_THEME.surfaceAlt,
    marginRight: 12,
  },
  albumArtFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumArtIcon: {
    fontSize: 20,
    color: SPOTIFY_THEME.textTertiary,
    fontWeight: '700',
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackName: {
    fontSize: 15,
    fontWeight: '900',
    color: SPOTIFY_THEME.textPrimary,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  artistName: {
    fontSize: 13,
    color: SPOTIFY_THEME.textSecondary,
    marginBottom: 2,
    fontWeight: '700',
  },
  albumName: {
    fontSize: 12,
    color: SPOTIFY_THEME.textTertiary,
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: SPOTIFY_THEME.textTertiary,
    fontWeight: '700',
    marginBottom: 6,
  },
  addPill: {
    backgroundColor: SPOTIFY_THEME.accentSoft,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SPOTIFY_THEME.accent,
  },
  addIcon: {
    fontSize: 18,
    color: SPOTIFY_THEME.textPrimary,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: SPOTIFY_THEME.textPrimary,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: SPOTIFY_THEME.textTertiary,
  },
});
