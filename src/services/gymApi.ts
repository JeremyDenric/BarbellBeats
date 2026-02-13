import {
  apiClient,
  type Gym,
  type QueueSong,
  type NowPlayingFeed,
  type SpotifyNowPlaying,
  type GymWrapped,
  type GymMatch,
  type DiscoveredGym,
  type GymDetailsResponse,
} from "../api/api-client";
import mockApi from "./mockApi";
import { enqueueGymAction } from "./offlineQueue";
import type { Song } from "../types";
import { isNetworkError } from "../utils/networkErrors";

const MOCK_LOCATION = { latitude: 40.7128, longitude: -74.006 };
const ALLOW_MOCK_GYM = __DEV__;

function createQueuedError(actionId: string) {
  const error = new Error("You're offline. We'll sync this action when you're back online.");
  (error as Error & { queuedActionId?: string }).queuedActionId = actionId;
  return error;
}

async function queueAndThrow(action: Parameters<typeof enqueueGymAction>[0]) {
  const { id: queuedId } = await enqueueGymAction(action);
  throw createQueuedError(queuedId);
}

function mapMockSong(song: Song): QueueSong {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    albumArt: song.albumArt,
    uri: song.spotifyId || `mock:${song.id}`,
    addedBy: song.addedBy?.id || "mock-user",
    addedAt: song.addedAt,
    voteScore: song.weightedScore || song.voteCount || 0,
    isPlaying: !!song.isPlaying,
    isAutoSeed: false,
  };
}

export async function listGyms() {
  try {
    const response = await apiClient.listGyms();
    if (!response.success) {
      throw new Error(response.message || "Failed to load gyms");
    }
    return response.data || [];
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return mockApi.getNearbyGyms(MOCK_LOCATION.latitude, MOCK_LOCATION.longitude);
    }
    throw error;
  }
}

/**
 * Discover gyms near a location using Google Places API
 */
export async function discoverNearbyGyms(params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  pageToken?: string;
}): Promise<{
  gyms: DiscoveredGym[];
  nextPageToken?: string;
  fromCache: boolean;
}> {
  try {
    const response = await apiClient.discoverGyms({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radiusMeters,
      pageToken: params.pageToken,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to discover gyms");
    }

    return {
      gyms: response.data || [],
      nextPageToken: (response as any).meta?.nextPageToken,
      fromCache: (response as any).meta?.fromCache || false,
    };
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      // Fall back to mock gyms for development
      const mockGyms = await mockApi.getNearbyGyms(params.latitude, params.longitude);
      return {
        gyms: mockGyms.map((g) => ({
          id: g.id,
          googlePlaceId: `mock-${g.id}`,
          name: g.name,
          address: g.address,
          latitude: g.latitude,
          longitude: g.longitude,
          rating: 4.5,
          userRatingsTotal: 100,
          distance: g.distance,
        })),
        fromCache: true,
      };
    }
    throw error;
  }
}

/**
 * Get detailed gym information including photos and hours
 */
export async function getDiscoveredGymDetails(gymId: string): Promise<GymDetailsResponse> {
  try {
    const response = await apiClient.getDiscoveredGymDetails(gymId);

    if (!response.success) {
      throw new Error(response.message || "Failed to get gym details");
    }

    return response.data as GymDetailsResponse;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      // Return mock data
      const gyms = await mockApi.getNearbyGyms(MOCK_LOCATION.latitude, MOCK_LOCATION.longitude);
      const gym = gyms.find((g) => g.id === gymId);
      if (!gym) throw new Error("Gym not found");

      return {
        id: gym.id,
        googlePlaceId: `mock-${gym.id}`,
        name: gym.name,
        address: gym.address,
        latitude: gym.latitude,
        longitude: gym.longitude,
        rating: 4.5,
        userRatingsTotal: 100,
        photoUrls: [],
      };
    }
    throw error;
  }
}

export async function getGymQueue(gymId: string) {
  try {
    const response = await apiClient.getGymQueue(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to load queue");
    }
    return response.data as { nowPlaying: QueueSong | null; queue: QueueSong[] };
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      const playlist = await mockApi.getPlaylist(gymId);
      const queue = playlist.map(mapMockSong);
      const nowPlaying = queue.find((track) => track.isPlaying) || queue[0] || null;
      return { nowPlaying, queue };
    }
    throw error;
  }
}

export async function addSongToQueue(gymId: string, data: { title: string; artist: string; uri: string }) {
  try {
    const response = await apiClient.addSongToGymQueue(gymId, data);
    if (!response.success) {
      throw new Error(response.message || "Failed to add song");
    }
    return response.data as QueueSong;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      const song = await mockApi.addSong(gymId, data.uri, data.title, data.artist);
      return mapMockSong(song);
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "addSong", gymId, data });
    }
    throw error;
  }
}

export async function voteOnSong(gymId: string, songId: string, direction: "up" | "down") {
  try {
    const response = await apiClient.voteOnSong(gymId, songId, direction);
    if (!response.success) {
      throw new Error(response.message || "Failed to vote");
    }
    return response.data as QueueSong;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      await mockApi.voteSong(songId, direction);
      const playlist = await mockApi.getPlaylist(gymId);
      const updated = playlist.find((track) => track.id === songId);
      if (updated) {
        return mapMockSong(updated);
      }
      return mapMockSong({
        id: songId,
        title: "Unknown",
        artist: "",
        duration: 0,
        addedBy: { id: "mock-user", name: "Mock" },
        addedAt: new Date().toISOString(),
        voteCount: 0,
        weightedScore: 0,
      });
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "voteSong", gymId, songId, direction });
    }
    throw error;
  }
}

export async function getNowPlayingFeed(gymId: string) {
  try {
    const response = await apiClient.getNowPlayingFeed(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to load feed");
    }
    return response.data as NowPlayingFeed;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return { reactions: [], comments: [] };
    }
    throw error;
  }
}

export async function addReaction(gymId: string, data: { songId: string; emoji: string }) {
  try {
    const response = await apiClient.addReaction(gymId, data);
    if (!response.success) {
      throw new Error(response.message || "Failed to add reaction");
    }
    return response.data;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return {
        id: `mock-reaction-${Date.now()}`,
        songId: data.songId,
        userId: "mock-user",
        emoji: data.emoji,
        createdAt: new Date().toISOString(),
      };
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "addReaction", gymId, data });
    }
    throw error;
  }
}

export async function addComment(gymId: string, data: { songId: string; message: string }) {
  try {
    const response = await apiClient.addComment(gymId, data);
    if (!response.success) {
      throw new Error(response.message || "Failed to add comment");
    }
    return response.data;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return {
        id: `mock-comment-${Date.now()}`,
        songId: data.songId,
        userId: "mock-user",
        message: data.message,
        createdAt: new Date().toISOString(),
      };
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "addComment", gymId, data });
    }
    throw error;
  }
}

export async function identifyNowPlaying(gymId: string) {
  try {
    const response = await apiClient.identifyNowPlaying(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to identify song");
    }
    return response.data as QueueSong | null;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      const playlist = await mockApi.getPlaylist(gymId);
      const first = playlist[0];
      return first ? mapMockSong(first) : null;
    }
    throw error;
  }
}

export async function syncSpotifyNowPlaying(
  gymId: string,
  data: { title: string; artist: string; uri: string; deviceName?: string }
) {
  try {
    const response = await apiClient.syncSpotifyNowPlaying(gymId, data);
    if (!response.success) {
      throw new Error(response.message || "Failed to sync now playing");
    }
    return response.data as SpotifyNowPlaying;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return {
        gymId,
        track: {
          title: data.title,
          artist: data.artist,
          uri: data.uri,
        },
        deviceName: data.deviceName,
        syncedAt: new Date().toISOString(),
      };
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "syncNowPlaying", gymId, data });
    }
    throw error;
  }
}

export async function getSpotifyNowPlaying(gymId: string) {
  try {
    const response = await apiClient.getSpotifyNowPlaying(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to load Spotify now playing");
    }
    return response.data as SpotifyNowPlaying | null;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getGymWrapped(gymId: string) {
  try {
    const response = await apiClient.getGymWrapped(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to load gym wrapped");
    }
    return response.data as GymWrapped;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return {
        gymId,
        weekStart: new Date().toISOString(),
        topTracks: [],
        topContributors: [],
      };
    }
    throw error;
  }
}

export async function getGymMatches(gymId: string) {
  try {
    const response = await apiClient.getGymMatches(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to load gym matches");
    }
    return response.data as GymMatch[];
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      return [
        { userId: "mock-1", name: "Lena", overlapScore: 2 },
        { userId: "mock-2", name: "Marco", overlapScore: 1 },
      ];
    }
    throw error;
  }
}

export type CheckIn = {
  id: string;
  userId: string;
  gymId: string;
  checkedInAt: string;
  checkedOutAt?: string;
};

export async function getGymDetails(gymId: string) {
  try {
    const response = await apiClient.getGymDetails(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to load gym details");
    }
    return response.data as Gym;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      const gyms = await mockApi.getNearbyGyms(MOCK_LOCATION.latitude, MOCK_LOCATION.longitude);
      const gym = gyms.find((g) => g.id === gymId);
      if (!gym) {
        throw new Error("Gym not found");
      }
      return gym;
    }
    throw error;
  }
}

export async function checkInToGym(gymId: string): Promise<CheckIn> {
  try {
    const response = await apiClient.checkInToGym(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to check in");
    }
    return response.data as CheckIn;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      // Mock check-in
      return {
        id: `mock-checkin-${Date.now()}`,
        userId: "mock-user",
        gymId,
        checkedInAt: new Date().toISOString(),
      };
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "checkIn", gymId });
    }
    throw error;
  }
}

export async function checkOutFromGym(gymId: string): Promise<void> {
  try {
    const response = await apiClient.checkOutFromGym(gymId);
    if (!response.success) {
      throw new Error(response.message || "Failed to check out");
    }
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      // Mock check-out (no-op)
      return;
    }
    if (isNetworkError(error)) {
      await queueAndThrow({ type: "checkOut", gymId });
    }
    throw error;
  }
}

export async function getCurrentCheckIn(): Promise<CheckIn | null> {
  try {
    const response = await apiClient.getCurrentCheckIn();
    if (!response.success) {
      throw new Error(response.message || "Failed to get check-in status");
    }
    return response.data as CheckIn | null;
  } catch (error) {
    if (ALLOW_MOCK_GYM && isNetworkError(error)) {
      // No active check-in in mock mode
      return null;
    }
    throw error;
  }
}
