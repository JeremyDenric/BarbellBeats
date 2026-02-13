/**
 * Type-safe API client for the Hono backend
 * Use this in your React Native app to make API calls
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
    kind?: ApiErrorKind;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ApiErrorKind =
  | "network"
  | "timeout"
  | "auth"
  | "client"
  | "server"
  | "unknown";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AppleLoginData {
  identityToken: string;
  email?: string;
  name?: string;
}

export interface GoogleLoginData {
  idToken: string;
  email?: string;
  name?: string;
}

export interface Gym {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  memberCount: number;
}

export interface DiscoveredGym {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  distance?: number;
  isOpen?: boolean;
}

export interface GymDiscoveryResponse {
  gyms: DiscoveredGym[];
  fromCache: boolean;
  nextPageToken?: string;
}

export interface GymDetailsResponse {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: unknown;
  photoUrls: string[];
}

export interface QueueSong {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  uri: string;
  addedBy: string;
  addedAt: string;
  voteScore: number;
  isPlaying: boolean;
  isAutoSeed: boolean;
}

export interface NowPlayingFeed {
  reactions: Array<{
    id: string;
    songId: string;
    userId: string;
    emoji: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    songId: string;
    userId: string;
    message: string;
    createdAt: string;
  }>;
}

export interface VibeMoment {
  id: string;
  gymId: string;
  userId: string;
  title: string;
  note?: string;
  context?: string;
  songSnapshot?: {
    title: string;
    artist: string;
    uri: string;
  };
  createdAt: string;
}

export interface PrRecord {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  source: "manual" | "apple-health";
  createdAt: string;
}

export interface Setlist {
  id: string;
  userId: string;
  name: string;
  tracks: Array<{
    title: string;
    artist: string;
    uri: string;
  }>;
  createdAt: string;
}

export interface FavoriteTrack {
  id: string;
  userId: string;
  title: string;
  artist: string;
  uri: string;
  createdAt: string;
}

export interface SpotifyNowPlaying {
  gymId: string;
  track: {
    title: string;
    artist: string;
    uri: string;
  };
  deviceName?: string;
  syncedAt: string;
}

export interface GymWrapped {
  gymId: string;
  weekStart: string;
  topTracks: Array<{ id: string; title: string; artist: string; votes: number }>;
  topContributors: Array<{ userId: string; votes: number; adds: number }>;
}

export interface GymMatch {
  userId: string;
  name: string;
  overlapScore: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG_API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  // Support older Expo manifests if present.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Constants.manifest as any)?.extra?.API_URL ||
  process.env.EXPO_PUBLIC_API_URL;

const API_BASE_URL = CONFIG_API_URL || (__DEV__
  ? "http://localhost:3000/api"
  : "https://your-production-api.com/api");

const TOKEN_KEY = "@auth_token";
const REFRESH_TOKEN_KEY = "@refresh_token";

// ============================================================================
// Helpers
// ============================================================================

type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 20000;
const AUTH_TIMEOUT_MS = 15000;

function isJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

function mapStatusToKind(status: number): ApiErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status >= 400 && status < 500) return "client";
  if (status >= 500) return "server";
  return "unknown";
}

function createAbortSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number
): { signal?: AbortSignal; cleanup: () => void } {
  if (!timeoutMs) {
    return { signal, cleanup: () => {} };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortHandler = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener("abort", abortHandler);
      }
    },
  };
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let body: any = null;

  if (isJsonResponse(response)) {
    try {
      body = await response.json();
    } catch {
      // fall back to text if json parse fails
      try {
        const text = await response.text();
        body = { message: text };
      } catch {
        body = null;
      }
    }
  } else {
    try {
      const text = await response.text();
      body = { message: text };
    } catch {
      body = null;
    }
  }

  // If backend already returns ApiResponse shape, respect it
  if (body && typeof body.success === "boolean") {
    return body as ApiResponse<T>;
  }

  if (response.ok) {
    return {
      success: true,
      data: body as T,
    };
  }

  return {
    success: false,
    message:
      (body && (body.message || body.error?.message)) ||
      `Request failed with status ${response.status}`,
    error: {
      code: String(response.status),
      message:
        (body && (body.message || body.error?.message)) ||
        response.statusText ||
        "Unknown error",
      details: body,
      kind: mapStatusToKind(response.status),
    },
  };
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const pruned: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    pruned[k] = String(v);
  });
  const qs = new URLSearchParams(pruned).toString();
  return qs ? `?${qs}` : "";
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readyPromise: Promise<void>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.readyPromise = this.loadTokens();
  }

  /**
   * Await this to ensure tokens are loaded before first use.
   */
  async init(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Load tokens from storage
   */
  private async loadTokens() {
    try {
      const [access, refresh] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);
      this.accessToken = access;
      this.refreshToken = refresh;
    } catch (error) {
      if (__DEV__) console.error("Failed to load tokens:", error);
    }
  }

  /**
   * Save tokens to storage
   */
  private async saveTokens(tokens: AuthTokens) {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
      ]);
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    } catch (error) {
      if (__DEV__) console.error("Failed to save tokens:", error);
    }
  }

  /**
   * Clear tokens from storage
   */
  private async clearTokens() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      ]);
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      if (__DEV__) console.error("Failed to clear tokens:", error);
    }
  }

  /**
   * Make authenticated request
   * - Awaits init() to ensure tokens are loaded
   * - On 401, attempts a single refresh + retry
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    _internal?: { retried?: boolean }
  ): Promise<ApiResponse<T>> {
    await this.init();

    const url = `${this.baseUrl}${endpoint}`;
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const { signal, cleanup } = createAbortSignal(
        fetchOptions.signal,
        timeoutMs
      );
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal,
        });

        // If unauthorized, try to refresh once
        if (response.status === 401 && this.refreshToken && !_internal?.retried) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.request<T>(endpoint, options, { retried: true });
          }
        }

        return parseApiResponse<T>(response);
      } finally {
        cleanup();
      }
    } catch (error: unknown) {
      if (__DEV__) {
        console.warn("API request failed:", error);
      }
      const message = error instanceof Error ? error.message : "Network error";
      const isTimeout = error instanceof Error && error.name === "AbortError";
      return {
        success: false,
        message: isTimeout ? "Request timed out" : message,
        error: {
          code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
          message: isTimeout ? "Request timed out" : message,
          details: error,
          kind: isTimeout ? "timeout" : "network",
        },
      };
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const { signal, cleanup } = createAbortSignal(undefined, AUTH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
          signal,
        });
      } finally {
        cleanup();
      }

      // Parse in a robust way
      const parsed = await parseApiResponse<AuthTokens>(response);

      if (parsed.success && parsed.data) {
        await this.saveTokens(parsed.data);
        return true;
      }

      // Refresh failed, clear tokens
      await this.clearTokens();
      return false;
    } catch (error) {
      if (__DEV__) console.error("Token refresh failed:", error);
      await this.clearTokens();
      return false;
    }
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  async register(data: RegisterData): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.request<{ user: User } & AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      await this.saveTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.request<{ user: User } & AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      await this.saveTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  }

  async loginWithApple(data: AppleLoginData): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.request<{ user: User } & AuthTokens>("/auth/apple", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      await this.saveTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  }

  async loginWithGoogle(data: GoogleLoginData): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.request<{ user: User } & AuthTokens>("/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      await this.saveTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      await this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/me");
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  // ==========================================================================
  // Users
  // ==========================================================================

  async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<User[]>> {
    const queryString = buildQuery(params as Record<string, any> | undefined);
    return this.request<User[]>(`/users${queryString}`);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      bio?: string;
      avatar?: string;
    }
  ): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, { method: "DELETE" });
  }

  // ==========================================================================
  // Gyms & Queue
  // ==========================================================================

  async listGyms(): Promise<ApiResponse<Gym[]>> {
    return this.request<Gym[]>("/gyms");
  }

  async getGymQueue(gymId: string): Promise<ApiResponse<{ nowPlaying: QueueSong | null; queue: QueueSong[] }>> {
    return this.request<{ nowPlaying: QueueSong | null; queue: QueueSong[] }>(`/gyms/${gymId}/queue`);
  }

  async addSongToGymQueue(
    gymId: string,
    data: { title: string; artist: string; uri: string }
  ): Promise<ApiResponse<QueueSong>> {
    return this.request<QueueSong>(`/gyms/${gymId}/queue`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async voteOnSong(
    gymId: string,
    songId: string,
    direction: "up" | "down"
  ): Promise<ApiResponse<QueueSong>> {
    return this.request<QueueSong>(`/gyms/${gymId}/queue/${songId}/vote`, {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
  }

  async getNowPlayingFeed(gymId: string): Promise<ApiResponse<NowPlayingFeed>> {
    return this.request<NowPlayingFeed>(`/gyms/${gymId}/now-playing/feed`);
  }

  async addReaction(
    gymId: string,
    data: { songId: string; emoji: string }
  ): Promise<ApiResponse<NowPlayingFeed["reactions"][number]>> {
    return this.request<NowPlayingFeed["reactions"][number]>(
      `/gyms/${gymId}/now-playing/reactions`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async addComment(
    gymId: string,
    data: { songId: string; message: string }
  ): Promise<ApiResponse<NowPlayingFeed["comments"][number]>> {
    return this.request<NowPlayingFeed["comments"][number]>(
      `/gyms/${gymId}/now-playing/comments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async identifyNowPlaying(gymId: string): Promise<ApiResponse<QueueSong | null>> {
    return this.request<QueueSong | null>(`/gyms/${gymId}/identify`, {
      method: "POST",
    });
  }

  async syncSpotifyNowPlaying(
    gymId: string,
    data: { title: string; artist: string; uri: string; deviceName?: string }
  ): Promise<ApiResponse<SpotifyNowPlaying>> {
    return this.request<SpotifyNowPlaying>(`/gyms/${gymId}/spotify/now-playing`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSpotifyNowPlaying(gymId: string): Promise<ApiResponse<SpotifyNowPlaying | null>> {
    return this.request<SpotifyNowPlaying | null>(`/gyms/${gymId}/spotify/now-playing`);
  }

  async createVibeMoment(
    gymId: string,
    data: {
      title: string;
      note?: string;
      context?: string;
      songSnapshot?: { title: string; artist: string; uri: string };
    }
  ): Promise<ApiResponse<VibeMoment>> {
    return this.request<VibeMoment>(`/gyms/${gymId}/moments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listVibeMoments(gymId: string): Promise<ApiResponse<VibeMoment[]>> {
    return this.request<VibeMoment[]>(`/gyms/${gymId}/moments`);
  }

  async getGymWrapped(gymId: string): Promise<ApiResponse<GymWrapped>> {
    return this.request<GymWrapped>(`/gyms/${gymId}/wrapped`);
  }

  async getGymMatches(gymId: string): Promise<ApiResponse<GymMatch[]>> {
    return this.request<GymMatch[]>(`/gyms/${gymId}/matches`);
  }

  async getGymDetails(gymId: string): Promise<ApiResponse<Gym>> {
    return this.request<Gym>(`/gyms/${gymId}`);
  }

  async checkInToGym(gymId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/gyms/${gymId}/check-in`, {
      method: "POST",
    });
  }

  async checkOutFromGym(gymId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/gyms/${gymId}/check-out`, {
      method: "POST",
    });
  }

  async getCurrentCheckIn(): Promise<ApiResponse<any>> {
    return this.request<any>("/gyms/current-check-in");
  }

  /**
   * Discover gyms near a location using Google Places
   */
  async discoverGyms(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    pageToken?: string;
  }): Promise<ApiResponse<DiscoveredGym[]> & { meta?: { fromCache: boolean; nextPageToken?: string } }> {
    const queryParams = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
    });
    if (params.radius) {
      queryParams.set("radius", String(params.radius));
    }
    if (params.pageToken) {
      queryParams.set("pageToken", params.pageToken);
    }
    return this.request<DiscoveredGym[]>(`/gyms/discover?${queryParams.toString()}`);
  }

  /**
   * Get detailed gym information including photos and hours
   */
  async getDiscoveredGymDetails(gymId: string): Promise<ApiResponse<GymDetailsResponse>> {
    return this.request<GymDetailsResponse>(`/gyms/${gymId}/details`);
  }

  // ==========================================================================
  // Personal Data
  // ==========================================================================

  async listSetlists(userId: string): Promise<ApiResponse<Setlist[]>> {
    return this.request<Setlist[]>(`/users/${userId}/setlists`);
  }

  async createSetlist(
    userId: string,
    data: { name: string; tracks: Array<{ title: string; artist: string; uri: string }> }
  ): Promise<ApiResponse<Setlist>> {
    return this.request<Setlist>(`/users/${userId}/setlists`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addTrackToSetlist(
    userId: string,
    setlistId: string,
    data: { title: string; artist: string; uri: string }
  ): Promise<ApiResponse<Setlist>> {
    return this.request<Setlist>(`/users/${userId}/setlists/${setlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listPrs(userId: string): Promise<ApiResponse<PrRecord[]>> {
    return this.request<PrRecord[]>(`/users/${userId}/prs`);
  }

  async createPr(
    userId: string,
    data: { exercise: string; weight: number; reps: number; source: "manual" | "apple-health" }
  ): Promise<ApiResponse<PrRecord>> {
    return this.request<PrRecord>(`/users/${userId}/prs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listFavorites(userId: string): Promise<ApiResponse<FavoriteTrack[]>> {
    return this.request<FavoriteTrack[]>(`/users/${userId}/favorites`);
  }

  async addFavorite(
    userId: string,
    data: { title: string; artist: string; uri: string }
  ): Promise<ApiResponse<FavoriteTrack>> {
    return this.request<FavoriteTrack>(`/users/${userId}/favorites`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================================================
  // Examples
  // ==========================================================================

  async listExamples(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const queryString = buildQuery(params as Record<string, any> | undefined);
    return this.request<any[]>(`/examples${queryString}`);
  }

  async getExampleById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/examples/${id}`);
  }

  async createExample(data: {
    name: string;
    description?: string;
    tags?: string[];
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/examples", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExample(
    id: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteExample(id: string): Promise<ApiResponse> {
    return this.request(`/examples/${id}`, { method: "DELETE" });
  }

  async searchExamples(params: {
    q: string;
    category?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const queryString = buildQuery(params as Record<string, any>);
    return this.request<any[]>(`/examples/search${queryString}`);
  }

  // ==========================================================================
  // Cardio Tracking
  // ==========================================================================

  async createCardioWorkout(workout: any): Promise<ApiResponse<any>> {
    return this.request<any>("/cardio/workouts", {
      method: "POST",
      body: JSON.stringify(workout),
    });
  }

  async getCardioWorkouts(filters?: {
    activityType?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const queryString = buildQuery(filters as Record<string, any> | undefined);
    return this.request<any[]>(`/cardio/workouts${queryString}`);
  }

  async getCardioWorkoutById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/cardio/workouts/${id}`);
  }

  async deleteCardioWorkout(id: string): Promise<ApiResponse> {
    return this.request(`/cardio/workouts/${id}`, { method: "DELETE" });
  }

  async updateCardioWorkout(
    id: string,
    updates: { notes?: string }
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/cardio/workouts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async getCardioStats(period: 'week' | 'month' | 'year'): Promise<ApiResponse<any>> {
    return this.request<any>(`/cardio/stats?period=${period}`);
  }

  async getCardioRecords(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/cardio/records");
  }

  async getCardioPreferences(): Promise<ApiResponse<any>> {
    return this.request<any>("/cardio/preferences");
  }

  async updateCardioPreferences(prefs: any): Promise<ApiResponse<any>> {
    return this.request<any>("/cardio/preferences", {
      method: "PUT",
      body: JSON.stringify(prefs),
    });
  }

  // ==========================================================================
  // Workout Logs
  // ==========================================================================

  async createWorkout(workout: {
    title: string;
    notes?: string;
    startedAt: string;
    completedAt?: string;
    duration?: number;
    gymId?: string;
    cardioWorkoutId?: string;
    programId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/workouts", {
      method: "POST",
      body: JSON.stringify(workout),
    });
  }

  async listWorkouts(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    gymId?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryString = buildQuery(params as Record<string, any> | undefined);
    return this.request<any[]>(`/workouts${queryString}`);
  }

  async getWorkoutById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/workouts/${id}`);
  }

  async updateWorkout(
    id: string,
    updates: {
      title?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/workouts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteWorkout(id: string): Promise<ApiResponse> {
    return this.request(`/workouts/${id}`, { method: "DELETE" });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// React Query Hooks (Example)
// ============================================================================

/**
 * Example usage with React Query:
 * 
 * import { useQuery, useMutation } from '@tanstack/react-query';
 * import { apiClient } from './api-client';
 * 
 * // Query hook
 * export function useCurrentUser() {
 *   return useQuery({
 *     queryKey: ['user', 'me'],
 *     queryFn: () => apiClient.getCurrentUser(),
 *     enabled: apiClient.isAuthenticated(),
 *   });
 * }
 * 
 * // Mutation hook
 * export function useLogin() {
 *   return useMutation({
 *     mutationFn: (credentials: LoginCredentials) =>
 *       apiClient.login(credentials),
 *   });
 * }
 * 
 * // Usage in component
 * function LoginScreen() {
 *   const loginMutation = useLogin();
 * 
 *   const handleLogin = async () => {
 *     const result = await loginMutation.mutateAsync({
 *       email: 'user@example.com',
 *       password: 'password',
 *     });
 * 
 *     if (result.success) {
 *       // Navigate to home
 *     }
 *   };
 * 
 *   return <Button onPress={handleLogin} />;
 * }
 */
