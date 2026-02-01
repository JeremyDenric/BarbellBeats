/**
 * Google Places API Service for Gym Discovery
 * Handles nearby search, caching, and deduplication
 */

import * as ngeohash from "ngeohash";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { cacheGet, cacheSet } from "../lib/redis";
import { BadRequestError, NotFoundError } from "../types";

// ============================================================================
// Types
// ============================================================================

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
}

interface NearbySearchResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
    };
    rating?: number;
    user_ratings_total?: number;
    business_status?: string;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
  };
  status: string;
  error_message?: string;
}

export interface DiscoveredGymResult {
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

export interface GymDetailsResult {
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

// ============================================================================
// Constants
// ============================================================================

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const CACHE_PREFIX = "places:nearby:";
const CACHE_TTL_SECONDS = (env.GOOGLE_PLACES_CACHE_TTL_HOURS || 24) * 3600;
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate geohash for location
 * @param precision 6 = ~1.2km, 4 = ~40km
 */
function generateGeohash(lat: number, lng: number, precision: number = 6): string {
  return ngeohash.encode(lat, lng, precision);
}

/**
 * Calculate distance between two coordinates in miles (Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Build photo URL from Google Places photo reference
 */
function buildPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!env.GOOGLE_MAPS_API_KEY) return "";
  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${env.GOOGLE_MAPS_API_KEY}`;
}

// ============================================================================
// Core Service Functions
// ============================================================================

/**
 * Search for gyms near a location
 */
export async function searchNearbyGyms(params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  pageToken?: string;
}): Promise<{
  gyms: DiscoveredGymResult[];
  nextPageToken?: string;
  fromCache: boolean;
}> {
  const {
    latitude,
    longitude,
    radiusMeters = env.GOOGLE_PLACES_DEFAULT_RADIUS_METERS || 8000,
    pageToken,
  } = params;

  // Validate radius
  const maxRadius = env.GOOGLE_PLACES_MAX_RADIUS_METERS || 50000;
  if (radiusMeters > maxRadius) {
    throw new BadRequestError(`Radius cannot exceed ${maxRadius} meters`);
  }

  // Check API key
  if (!env.GOOGLE_MAPS_API_KEY) {
    console.warn("[PlacesService] Google Maps API key not configured, returning empty results");
    return { gyms: [], fromCache: false };
  }

  // Generate cache key using 4-char geohash (~40km grid)
  const geoPrefix = generateGeohash(latitude, longitude, 4);
  const cacheKey = `${CACHE_PREFIX}${geoPrefix}:${radiusMeters}`;

  // Try Redis cache first (skip if paginating)
  if (!pageToken) {
    const cached = await cacheGet<string[]>(cacheKey);
    if (cached && cached.length > 0) {
      console.log(`[PlacesService] Cache hit for ${cacheKey}`);

      // Fetch gym details from database
      const gyms = await prisma.discoveredGym.findMany({
        where: {
          googlePlaceId: { in: cached },
        },
        select: {
          id: true,
          googlePlaceId: true,
          name: true,
          formattedAddress: true,
          latitude: true,
          longitude: true,
          rating: true,
          userRatingsTotal: true,
          businessStatus: true,
          openingHours: true,
        },
      });

      return {
        gyms: gyms.map((gym) => ({
          id: gym.id,
          googlePlaceId: gym.googlePlaceId,
          name: gym.name,
          address: gym.formattedAddress,
          latitude: gym.latitude,
          longitude: gym.longitude,
          rating: gym.rating ?? undefined,
          userRatingsTotal: gym.userRatingsTotal ?? undefined,
          distance: calculateDistance(latitude, longitude, gym.latitude, gym.longitude),
          isOpen: undefined, // Would need to parse openingHours
        })),
        fromCache: true,
      };
    }
  }

  // Make Google Places API request
  const url = new URL(`${PLACES_API_BASE}/nearbysearch/json`);
  url.searchParams.set("location", `${latitude},${longitude}`);
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("type", "gym");
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

  if (pageToken) {
    url.searchParams.set("pagetoken", pageToken);
  }

  console.log(`[PlacesService] Fetching from Google Places API...`);

  const response = await fetch(url.toString());
  const data: NearbySearchResponse = await response.json();

  // Handle API errors
  if (data.status === "REQUEST_DENIED") {
    console.error("[PlacesService] API request denied:", data.error_message);
    throw new BadRequestError(data.error_message || "Google Places API request denied");
  }

  if (data.status === "OVER_QUERY_LIMIT") {
    console.error("[PlacesService] API quota exceeded");
    throw new BadRequestError("Google Places API quota exceeded. Please try again later.");
  }

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("[PlacesService] API error:", data.status, data.error_message);
    throw new BadRequestError(`Google Places API error: ${data.status}`);
  }

  // Process and store results
  const gyms = await Promise.all(
    data.results.map(async (place) => {
      const gymGeohash = generateGeohash(
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      // Upsert gym in database (deduplication by googlePlaceId)
      const gym = await prisma.discoveredGym.upsert({
        where: { googlePlaceId: place.place_id },
        update: {
          name: place.name,
          formattedAddress: place.formatted_address || place.vicinity || "",
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          businessStatus: place.business_status,
          placeTypes: place.types || [],
          photoReferences: (place.photos || []).slice(0, 3).map((p) => p.photo_reference),
          lastFetchedAt: new Date(),
          fetchCount: { increment: 1 },
        },
        create: {
          googlePlaceId: place.place_id,
          name: place.name,
          formattedAddress: place.formatted_address || place.vicinity || "",
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          geohash: gymGeohash,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          businessStatus: place.business_status,
          placeTypes: place.types || [],
          photoReferences: (place.photos || []).slice(0, 3).map((p) => p.photo_reference),
        },
      });

      return {
        id: gym.id,
        googlePlaceId: gym.googlePlaceId,
        name: gym.name,
        address: gym.formattedAddress,
        latitude: gym.latitude,
        longitude: gym.longitude,
        rating: gym.rating ?? undefined,
        userRatingsTotal: gym.userRatingsTotal ?? undefined,
        distance: calculateDistance(latitude, longitude, gym.latitude, gym.longitude),
        isOpen: place.opening_hours?.open_now,
      };
    })
  );

  // Cache the place IDs (not full results)
  if (!pageToken && gyms.length > 0) {
    await cacheSet(cacheKey, gyms.map((g) => g.googlePlaceId), CACHE_TTL_SECONDS);
    console.log(`[PlacesService] Cached ${gyms.length} gym IDs for ${cacheKey}`);
  }

  return {
    gyms,
    nextPageToken: data.next_page_token,
    fromCache: false,
  };
}

/**
 * Get gym details by ID (from database, with optional refresh)
 */
export async function getGymDetails(gymId: string): Promise<GymDetailsResult> {
  const gym = await prisma.discoveredGym.findUnique({
    where: { id: gymId },
  });

  if (!gym) {
    throw new NotFoundError("Gym");
  }

  // Check if data is stale (older than 7 days)
  const isStale = Date.now() - gym.lastFetchedAt.getTime() > STALE_THRESHOLD_MS;
  if (isStale && env.GOOGLE_MAPS_API_KEY) {
    console.log(`[PlacesService] Refreshing stale gym data for ${gym.googlePlaceId}`);
    await refreshGymDetails(gym.googlePlaceId);

    // Re-fetch updated gym
    const updatedGym = await prisma.discoveredGym.findUnique({
      where: { id: gymId },
    });
    if (updatedGym) {
      return formatGymDetails(updatedGym);
    }
  }

  return formatGymDetails(gym);
}

/**
 * Format gym details for API response
 */
function formatGymDetails(gym: {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  userRatingsTotal: number | null;
  phoneNumber: string | null;
  website: string | null;
  openingHours: unknown;
  photoReferences: string[];
}): GymDetailsResult {
  return {
    id: gym.id,
    googlePlaceId: gym.googlePlaceId,
    name: gym.name,
    address: gym.formattedAddress,
    latitude: gym.latitude,
    longitude: gym.longitude,
    rating: gym.rating ?? undefined,
    userRatingsTotal: gym.userRatingsTotal ?? undefined,
    phoneNumber: gym.phoneNumber ?? undefined,
    website: gym.website ?? undefined,
    openingHours: gym.openingHours,
    photoUrls: gym.photoReferences.map((ref) => buildPhotoUrl(ref)),
  };
}

/**
 * Refresh gym details from Google Places Details API
 */
async function refreshGymDetails(googlePlaceId: string): Promise<void> {
  if (!env.GOOGLE_MAPS_API_KEY) return;

  const url = new URL(`${PLACES_API_BASE}/details/json`);
  url.searchParams.set("place_id", googlePlaceId);
  url.searchParams.set(
    "fields",
    [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "website",
      "opening_hours",
      "rating",
      "user_ratings_total",
      "business_status",
      "photos",
    ].join(",")
  );
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

  try {
    const response = await fetch(url.toString());
    const data: PlaceDetailsResponse = await response.json();

    if (data.status === "OK" && data.result) {
      await prisma.discoveredGym.update({
        where: { googlePlaceId },
        data: {
          name: data.result.name,
          formattedAddress: data.result.formatted_address,
          phoneNumber: data.result.formatted_phone_number,
          website: data.result.website,
          openingHours: data.result.opening_hours,
          rating: data.result.rating,
          userRatingsTotal: data.result.user_ratings_total,
          businessStatus: data.result.business_status,
          photoReferences: (data.result.photos || [])
            .slice(0, 3)
            .map((p) => p.photo_reference),
          lastFetchedAt: new Date(),
        },
      });
      console.log(`[PlacesService] Refreshed details for ${googlePlaceId}`);
    }
  } catch (error) {
    console.error("[PlacesService] Failed to refresh gym details:", error);
  }
}

/**
 * Get gym by Google Place ID (for check-in validation)
 */
export async function getGymByPlaceId(googlePlaceId: string): Promise<DiscoveredGymResult | null> {
  const gym = await prisma.discoveredGym.findUnique({
    where: { googlePlaceId },
  });

  if (!gym) return null;

  return {
    id: gym.id,
    googlePlaceId: gym.googlePlaceId,
    name: gym.name,
    address: gym.formattedAddress,
    latitude: gym.latitude,
    longitude: gym.longitude,
    rating: gym.rating ?? undefined,
    userRatingsTotal: gym.userRatingsTotal ?? undefined,
  };
}
