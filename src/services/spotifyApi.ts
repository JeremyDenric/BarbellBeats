/**
 * Spotify API Service
 * Handles all Spotify Web API calls with automatic token refresh
 * Includes methods for recommendations, top tracks, and playback control
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import devLog from '../utils/devLog';

// ============================================================================
// Types
// ============================================================================

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  uri: string;
  preview_url: string | null;
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: {
    total: number;
  };
  owner: {
    display_name: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity: number;
}

// ============================================================================
// API Client with Auto-Refresh
// ============================================================================

class SpotifyApiClient {
  private baseUrl = 'https://api.spotify.com/v1';
  private refreshTokenCallback: (() => Promise<string | null>) | null = null;

  /**
   * Set callback for token refresh
   */
  setRefreshTokenCallback(callback: () => Promise<string | null>) {
    this.refreshTokenCallback = callback;
  }

  /**
   * Make authenticated request with auto-refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true
  ): Promise<T> {
    const accessToken = await AsyncStorage.getItem('@spotify_access_token');

    if (!accessToken) {
      throw new Error('No Spotify access token available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized - token expired
    if (response.status === 401 && retryOnAuth && this.refreshTokenCallback) {
      const newToken = await this.refreshTokenCallback();
      if (newToken) {
        // Retry with new token
        return this.request<T>(endpoint, options, false);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || 'Spotify API request failed');
    }

    return response.json();
  }

  // ========================================================================
  // User Profile
  // ========================================================================

  /**
   * Get current user's profile
   */
  async getCurrentUser() {
    return this.request<{
      id: string;
      display_name: string;
      email: string;
      images: { url: string }[];
    }>('/me');
  }

  // ========================================================================
  // Top Tracks & Recommendations
  // ========================================================================

  /**
   * Get user's top tracks (for recommendations)
   * @param timeRange - short_term (4 weeks), medium_term (6 months), long_term (years)
   * @param limit - Number of tracks (max 50)
   */
  async getTopTracks(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 20
  ): Promise<SpotifyTrack[]> {
    const response = await this.request<{ items: SpotifyTrack[] }>(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  /**
   * Get user's top artists
   */
  async getTopArtists(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 5
  ): Promise<SpotifyArtist[]> {
    const response = await this.request<{ items: SpotifyArtist[] }>(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  /**
   * Get personalized recommendations based on seed tracks/artists
   */
  async getRecommendations(params: {
    seedTracks?: string[];
    seedArtists?: string[];
    seedGenres?: string[];
    limit?: number;
    targetEnergy?: number;
    targetTempo?: number;
  }): Promise<SpotifyTrack[]> {
    const queryParams = new URLSearchParams({
      limit: (params.limit || 20).toString(),
    });

    if (params.seedTracks?.length) {
      queryParams.append('seed_tracks', params.seedTracks.join(','));
    }
    if (params.seedArtists?.length) {
      queryParams.append('seed_artists', params.seedArtists.join(','));
    }
    if (params.seedGenres?.length) {
      queryParams.append('seed_genres', params.seedGenres.join(','));
    }
    if (params.targetEnergy !== undefined) {
      queryParams.append('target_energy', params.targetEnergy.toString());
    }
    if (params.targetTempo !== undefined) {
      queryParams.append('target_tempo', params.targetTempo.toString());
    }

    const response = await this.request<{ tracks: SpotifyTrack[] }>(
      `/recommendations?${queryParams.toString()}`
    );
    return response.tracks;
  }

  /**
   * Get workout-optimized recommendations (high energy, fast tempo)
   */
  async getWorkoutRecommendations(limit = 20): Promise<SpotifyTrack[]> {
    try {
      // Get user's top artists for seed
      const topArtists = await this.getTopArtists('short_term', 3);
      const seedArtists = topArtists.map(a => a.id);

      // Get recommendations with workout-friendly parameters
      return this.getRecommendations({
        seedArtists,
        seedGenres: ['work-out', 'power-pop', 'hip-hop'],
        limit,
        targetEnergy: 0.8, // High energy
        targetTempo: 130, // Fast tempo (120-140 BPM ideal for workouts)
      });
    } catch (err) {
      devLog.error('Failed to get workout recommendations:', err);
      // Fallback to general recommendations
      return this.getRecommendations({
        seedGenres: ['work-out', 'hip-hop', 'rock'],
        limit,
        targetEnergy: 0.8,
      });
    }
  }

  // ========================================================================
  // Search
  // ========================================================================

  /**
   * Search for tracks
   */
  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    if (!query.trim()) {
      return [];
    }

    const response = await this.request<{ tracks: { items: SpotifyTrack[] } }>(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
    );
    return response.tracks.items;
  }

  // ========================================================================
  // User Library
  // ========================================================================

  /**
   * Get user's saved tracks
   */
  async getSavedTracks(limit = 50, offset = 0): Promise<SpotifyTrack[]> {
    const response = await this.request<{ items: { track: SpotifyTrack }[] }>(
      `/me/tracks?limit=${limit}&offset=${offset}`
    );
    return response.items.map(item => item.track);
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(limit = 50, offset = 0): Promise<SpotifyPlaylist[]> {
    const response = await this.request<{ items: SpotifyPlaylist[] }>(
      `/me/playlists?limit=${limit}&offset=${offset}`
    );
    return response.items;
  }

  /**
   * Get playlist tracks
   */
  async getPlaylistTracks(playlistId: string, limit = 100): Promise<SpotifyTrack[]> {
    const response = await this.request<{ items: { track: SpotifyTrack }[] }>(
      `/playlists/${playlistId}/tracks?limit=${limit}`
    );
    return response.items.map(item => item.track);
  }

  // ========================================================================
  // Recently Played
  // ========================================================================

  /**
   * Get recently played tracks
   */
  async getRecentlyPlayed(limit = 50): Promise<SpotifyTrack[]> {
    const response = await this.request<{ items: { track: SpotifyTrack }[] }>(
      `/me/player/recently-played?limit=${limit}`
    );
    return response.items.map(item => item.track);
  }

  // ========================================================================
  // Playback Control (Premium only)
  // ========================================================================

  /**
   * Get current playback state
   */
  async getCurrentPlayback() {
    try {
      return await this.request<{
        is_playing: boolean;
        item: SpotifyTrack;
        progress_ms: number;
        device: {
          id: string;
          name: string;
          type: string;
        };
      }>('/me/player');
    } catch (err) {
      // User might not have Premium or no active device
      devLog.warn('Failed to get playback state:', err);
      return null;
    }
  }

  /**
   * Get available devices
   */
  async getDevices() {
    try {
      const response = await this.request<{
        devices: Array<{
          id: string;
          name: string;
          type: string;
          is_active: boolean;
        }>;
      }>('/me/player/devices');
      return response.devices;
    } catch (err) {
      devLog.warn('Failed to get devices:', err);
      return [];
    }
  }

  /**
   * Play tracks on user's active device
   */
  async play(trackUris?: string[], deviceId?: string) {
    const body: any = {};
    if (trackUris) {
      body.uris = trackUris;
    }

    const endpoint = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play';

    try {
      await this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (err) {
      devLog.warn('Failed to play:', err);
      throw err;
    }
  }

  /**
   * Pause playback
   */
  async pause() {
    try {
      await this.request('/me/player/pause', {
        method: 'PUT',
      });
    } catch (err) {
      devLog.warn('Failed to pause:', err);
      throw err;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const spotifyApi = new SpotifyApiClient();
