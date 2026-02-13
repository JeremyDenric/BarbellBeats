/**
 * Advanced Map Screen with Clustering and Performance Optimizations
 * Featuring clean Apple Music-inspired interface with glassmorphism
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  TextInput,
  Animated,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { listGyms, checkInToGym, checkOutFromGym, getCurrentCheckIn } from "../services/gymApi";
import type { Gym } from "../types";
import { useNavigation } from "@react-navigation/native";
import { useThemeMode } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { GlassCard, Badge } from "../components/UI";
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT, RADIUS, TOUCH_TARGET } from "../theme/tokens";
import safeStorage from "../utils/safeStorage";
import devLog from "../utils/devLog";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Light map style for Apple Music aesthetic
const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#F9FAFB" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#E5E7EB" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E5E7EB" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F3F4F6" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#DBEAFE" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#60A5FA" }] },
];

// Dark map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#060A07" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#B9C2B0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#060A07" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#151F17" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7C7C8C" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#28352C" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#151F17" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#324235" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#162119" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6B7362" }] },
];

const FAVORITES_KEY = "@favorite_gyms";
const RECENT_SEARCHES_KEY = "@recent_gym_searches";
const MAX_RECENT_SEARCHES = 5;
const NEARBY_DISTANCE_MILES = 5;
const MIN_CLUSTER_GRID = 0.01;

const FavoritesSchema = z.array(z.string());
const RecentSearchesSchema = z.array(z.string());

interface GymMarkerData extends Gym {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  distanceMiles?: number;
}

interface ClusterMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  count: number;
  gyms: GymMarkerData[];
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusMiles = 3959;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

export default function MapScreenAdvanced() {
  const navigation = useNavigation();
  const { isDark } = useThemeMode();
  const { showToast } = useToast();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const mapRef = useRef<MapView>(null);
  const [selectedGym, setSelectedGym] = useState<GymMarkerData | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterMusicOnly, setFilterMusicOnly] = useState(false);
  const [filterNearby, setFilterNearby] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Animated values
  const bottomSheetHeight = useRef(new Animated.Value(0)).current;
  const searchBarOffset = useRef(new Animated.Value(-100)).current;

  // Fetch gyms with optimized caching
  const { data: gyms = [], isLoading, refetch } = useQuery({
    queryKey: ["gyms", region],
    queryFn: listGyms,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
  });

  const {
    data: currentCheckIn,
    refetch: refetchCheckIn,
  } = useQuery({
    queryKey: ["gym", "current-checkin"],
    queryFn: getCurrentCheckIn,
    staleTime: 1000 * 60 * 2,
  });

  // Request location permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Location Permission",
            "Please enable location to find gyms near you.",
            [{ text: "OK", onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) }]
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        devLog.error("Error getting location:", error);
        // Fallback to NYC
        setRegion({
          latitude: 40.7128,
          longitude: -74.006,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;

    safeStorage
      .getJSON<string[]>(FAVORITES_KEY, {
        schema: FavoritesSchema,
        defaultValue: [],
      })
      .then((stored) => {
        if (isMounted && stored) {
          setFavorites(stored);
        }
      })
      .catch((error) => {
        devLog.warn("Failed to load favorite gyms:", error);
      });

    safeStorage
      .getJSON<string[]>(RECENT_SEARCHES_KEY, {
        schema: RecentSearchesSchema,
        defaultValue: [],
      })
      .then((stored) => {
        if (isMounted && stored) {
          setRecentSearches(stored);
        }
      })
      .catch((error) => {
        devLog.warn("Failed to load recent searches:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Transform gyms with coordinates (memoized for performance)
  const gymMarkers = useMemo<GymMarkerData[]>(() => {
    const fallbackLat = region?.latitude ?? 40.7128;
    const fallbackLng = region?.longitude ?? -74.006;

    return gyms.map((gym) => {
      const latitude =
        typeof gym.latitude === "number"
          ? gym.latitude
          : fallbackLat + (Math.random() - 0.5) * 0.1;
      const longitude =
        typeof gym.longitude === "number"
          ? gym.longitude
          : fallbackLng + (Math.random() - 0.5) * 0.1;
      const distanceMiles = userLocation
        ? getDistanceMiles(
            {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            },
            { latitude, longitude }
          )
        : gym.distance;

      return {
        ...gym,
        coordinate: { latitude, longitude },
        distanceMiles,
      };
    });
  }, [gyms, region, userLocation]);

  // Filter gyms based on search
  const filteredMarkers = useMemo(() => {
    let next = gymMarkers;

    if (filterFavorites) {
      next = next.filter((gym) => favorites.includes(gym.id));
    }

    if (filterMusicOnly) {
      next = next.filter((gym) => !!gym.currentSong);
    }

    if (filterNearby) {
      next = next.filter(
        (gym) =>
          typeof gym.distanceMiles === "number" &&
          gym.distanceMiles <= NEARBY_DISTANCE_MILES
      );
    }

    if (!searchQuery.trim()) {
      return next;
    }

    const query = searchQuery.toLowerCase();
    return next.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.address.toLowerCase().includes(query)
    );
  }, [favorites, filterFavorites, filterMusicOnly, filterNearby, gymMarkers, searchQuery]);

  const { clusters, markersToRender } = useMemo(() => {
    if (!region) {
      return { clusters: [] as ClusterMarker[], markersToRender: filteredMarkers };
    }

    const shouldCluster = region.latitudeDelta > 0.03 && filteredMarkers.length > 12;
    if (!shouldCluster) {
      return { clusters: [] as ClusterMarker[], markersToRender: filteredMarkers };
    }

    const latGrid = Math.max(region.latitudeDelta / 8, MIN_CLUSTER_GRID);
    const lngGrid = Math.max(region.longitudeDelta / 8, MIN_CLUSTER_GRID);
    const buckets = new Map<string, GymMarkerData[]>();

    filteredMarkers.forEach((gym) => {
      const latKey = Math.floor(gym.coordinate.latitude / latGrid);
      const lngKey = Math.floor(gym.coordinate.longitude / lngGrid);
      const key = `${latKey}:${lngKey}`;
      const group = buckets.get(key) ?? [];
      group.push(gym);
      buckets.set(key, group);
    });

    const nextClusters: ClusterMarker[] = [];
    const singles: GymMarkerData[] = [];

    buckets.forEach((group, key) => {
      if (group.length === 1) {
        singles.push(group[0]);
        return;
      }

      const center = group.reduce(
        (acc, gym) => {
          acc.latitude += gym.coordinate.latitude;
          acc.longitude += gym.coordinate.longitude;
          return acc;
        },
        { latitude: 0, longitude: 0 }
      );

      nextClusters.push({
        id: `cluster-${key}`,
        count: group.length,
        gyms: group,
        coordinate: {
          latitude: center.latitude / group.length,
          longitude: center.longitude / group.length,
        },
      });
    });

    return { clusters: nextClusters, markersToRender: singles };
  }, [filteredMarkers, region]);

  // Handle marker press with haptic feedback
  const handleMarkerPress = useCallback(
    (gym: GymMarkerData) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedGym(gym);

      // Animate bottom sheet (respect reduceMotion preference)
      if (preferences.reduceMotion) {
        bottomSheetHeight.setValue(340);
      } else {
        Animated.spring(bottomSheetHeight, {
          toValue: 340,
          useNativeDriver: false,
          damping: 20,
          stiffness: 90,
        }).start();
      }

      // Center on marker
      if (mapRef.current) {
        const gymMarker = gymMarkers.find((g) => g.id === gym.id);
        if (gymMarker) {
          mapRef.current.animateToRegion({
            latitude: gymMarker.coordinate.latitude,
            longitude: gymMarker.coordinate.longitude,
            latitudeDelta: LATITUDE_DELTA * 0.5,
            longitudeDelta: LONGITUDE_DELTA * 0.5,
          }, 500);
        }
      }
    },
    [gymMarkers, preferences.reduceMotion, bottomSheetHeight]
  );

  const handleClusterPress = useCallback(
    (cluster: ClusterMarker) => {
      if (!region) {
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      mapRef.current?.animateToRegion(
        {
          latitude: cluster.coordinate.latitude,
          longitude: cluster.coordinate.longitude,
          latitudeDelta: region.latitudeDelta * 0.6,
          longitudeDelta: region.longitudeDelta * 0.6,
        },
        400
      );
    },
    [region]
  );

  // Close bottom sheet
  const closeBottomSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate close (respect reduceMotion preference)
    if (preferences.reduceMotion) {
      bottomSheetHeight.setValue(0);
      setSelectedGym(null);
    } else {
      Animated.timing(bottomSheetHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setSelectedGym(null));
    }
  }, [preferences.reduceMotion, bottomSheetHeight]);

  const persistFavorites = useCallback((next: string[]) => {
    safeStorage
      .setJSON(FAVORITES_KEY, next, { schema: FavoritesSchema })
      .catch((error) => {
        devLog.warn("Failed to save favorite gyms:", error);
      });
  }, []);

  const toggleFavorite = useCallback(
    (gymId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFavorites((prev) => {
        const next = prev.includes(gymId)
          ? prev.filter((id) => id !== gymId)
          : [...prev, gymId];
        persistFavorites(next);
        return next;
      });
    },
    [persistFavorites]
  );

  // Navigate to gym details
  const handleViewGym = useCallback(() => {
    if (selectedGym) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      closeBottomSheet();
      setTimeout(() => {
        (navigation.navigate as Function)(
          "Music",
          { screen: "GymPlaylist", params: { gymId: selectedGym.id } }
        );
      }, 300);
    }
  }, [selectedGym, navigation, closeBottomSheet]);

  const handleToggleCheckIn = useCallback(async () => {
    if (!selectedGym || checkInLoading) {
      return;
    }

    setCheckInLoading(true);
    try {
      const isCheckedIn = currentCheckIn?.gymId === selectedGym.id;
      if (isCheckedIn) {
        await checkOutFromGym(selectedGym.id);
        showToast("Checked out successfully.", { type: "success" });
      } else {
        await checkInToGym(selectedGym.id);
        showToast("Checked in successfully.", { type: "success" });
      }
      refetchCheckIn();
    } catch (error) {
      devLog.warn("Failed to update check-in status:", error);
      showToast("Check-in failed. Please try again.", { type: "error" });
    } finally {
      setCheckInLoading(false);
    }
  }, [checkInLoading, currentCheckIn?.gymId, refetchCheckIn, selectedGym, showToast]);

  const handleDirections = useCallback(() => {
    if (!selectedGym) {
      return;
    }

    const latitude = selectedGym.coordinate.latitude;
    const longitude = selectedGym.coordinate.longitude;

    if (latitude === undefined || longitude === undefined) {
      showToast("Location unavailable for this gym.", { type: "error" });
      return;
    }

    const encodedLabel = encodeURIComponent(selectedGym.name);
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

    Linking.openURL(url).catch(() => {
      showToast("Unable to open maps.", { type: "error" });
    });
  }, [selectedGym, showToast]);

  // Recenter map
  const handleRecenterMap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        500
      );
    }
  }, [userLocation]);

  // Toggle search bar
  const toggleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearch((prev) => {
      const newValue = !prev;

      // Animate search bar (respect reduceMotion preference)
      if (preferences.reduceMotion) {
        searchBarOffset.setValue(newValue ? 0 : -100);
      } else {
        Animated.spring(searchBarOffset, {
          toValue: newValue ? 0 : -100,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }).start();
      }
      return newValue;
    });
  }, [preferences.reduceMotion, searchBarOffset]);

  // Clear search
  const clearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
  }, []);

  const persistRecentSearches = useCallback((next: string[]) => {
    safeStorage
      .setJSON(RECENT_SEARCHES_KEY, next, { schema: RecentSearchesSchema })
      .catch((error) => {
        devLog.warn("Failed to save recent searches:", error);
      });
  }, []);

  const handleSearchSubmit = useCallback(
    (query?: string) => {
      const nextQuery = (query ?? searchQuery).trim();
      if (!nextQuery) {
        return;
      }

      setRecentSearches((prev) => {
        const deduped = prev.filter((item) => item.toLowerCase() !== nextQuery.toLowerCase());
        const next = [nextQuery, ...deduped].slice(0, MAX_RECENT_SEARCHES);
        persistRecentSearches(next);
        return next;
      });
    },
    [persistRecentSearches, searchQuery]
  );

  const handleRecentSearchSelect = useCallback(
    (query: string) => {
      setSearchQuery(query);
      handleSearchSubmit(query);
    },
    [handleSearchSubmit]
  );

  // Refresh gyms
  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refetch();
  }, [refetch]);

  // Animated styles
  const bottomSheetAnimatedStyle = { height: bottomSheetHeight };

  const searchBarAnimatedStyle = {
    transform: [{ translateY: searchBarOffset }],
  };

  const isFavoriteSelected =
    !!(selectedGym && favorites.includes(selectedGym.id));
  const isCheckedIn =
    !!(selectedGym && currentCheckIn?.gymId === selectedGym.id);

  if (!region) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          Loading map...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        loadingEnabled
        onRegionChangeComplete={setRegion}
        minZoomLevel={10}
        maxZoomLevel={18}
        pitchEnabled
        rotateEnabled
        scrollEnabled
        zoomEnabled
      >
        {/* Cluster Markers */}
        {clusters.map((cluster) => (
          <Marker
            key={cluster.id}
            coordinate={cluster.coordinate}
            onPress={() => handleClusterPress(cluster)}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.clusterMarker,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.clusterText, { color: colors.textPrimary }]}>
                {cluster.count}
              </Text>
            </View>
          </Marker>
        ))}

        {/* Gym Markers */}
        {markersToRender.map((gym) => {
          const isFavorite = favorites.includes(gym.id);
          const hasMusic = !!gym.currentSong;
          return (
            <Marker
              key={gym.id}
              coordinate={gym.coordinate}
              onPress={() => handleMarkerPress(gym)}
              tracksViewChanges={false}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerRing,
                    {
                      borderColor: hasMusic ? colors.accent : colors.border,
                    },
                    isFavorite && { borderColor: colors.primary },
                  ]}
                />
                <View style={[styles.markerCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.markerEmoji}>🏋️</Text>
                </View>
                {isFavorite && (
                  <View style={[styles.favoriteBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.favoriteBadgeText}>★</Text>
                  </View>
                )}
                {hasMusic && (
                  <View style={[styles.markerPulse, { backgroundColor: colors.accent }]} />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Search Bar */}
      <Animated.View style={[styles.searchBarContainer, searchBarAnimatedStyle]}>
        <BlurView
          intensity={isDark ? 20 : 30}
          tint={isDark ? "dark" : "light"}
          style={[styles.searchBar, { borderColor: colors.border }]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search gyms..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            onSubmitEditing={() => handleSearchSubmit()}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={clearSearch}
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: colors.backgroundAlt },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          )}
        </BlurView>

        {showSearch && (
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={isDark ? "dark" : "light"}
            style={[styles.searchPanel, { borderColor: colors.border }]}
          >
            <View style={styles.filterRow}>
              <Pressable
                onPress={() => setFilterFavorites((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Favorites"
                accessibilityState={{ selected: filterFavorites }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: filterFavorites
                      ? colors.primary
                      : colors.backgroundAlt,
                    borderColor: filterFavorites ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterFavorites ? colors.textPrimary : colors.textSecondary },
                  ]}
                >
                  Favorites
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterMusicOnly((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Music On"
                accessibilityState={{ selected: filterMusicOnly }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: filterMusicOnly
                      ? colors.primary
                      : colors.backgroundAlt,
                    borderColor: filterMusicOnly ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterMusicOnly ? colors.textPrimary : colors.textSecondary },
                  ]}
                >
                  Music On
                </Text>
              </Pressable>
              <Pressable
                disabled={!userLocation}
                onPress={() => setFilterNearby((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Nearby"
                accessibilityState={{ selected: filterNearby }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: filterNearby
                      ? colors.primary
                      : colors.backgroundAlt,
                    borderColor: filterNearby ? colors.primary : colors.border,
                    opacity: userLocation ? 1 : 0.5,
                  },
                  pressed && userLocation && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterNearby ? colors.textPrimary : colors.textSecondary },
                  ]}
                >
                  Nearby
                </Text>
              </Pressable>
            </View>

            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <View style={styles.recentSearches}>
                <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>
                  Recent searches
                </Text>
                <View style={styles.recentList}>
                  {recentSearches.map((query) => (
                    <Pressable
                      key={query}
                      onPress={() => handleRecentSearchSelect(query)}
                      style={({ pressed }) => [
                        styles.recentItem,
                        { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.recentText, { color: colors.textPrimary }]}>
                        {query}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </BlurView>
        )}
      </Animated.View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {/* Search Toggle */}
        <Pressable
          onPress={toggleSearch}
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: showSearch ? colors.primary : colors.surface },
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text style={styles.controlButtonText}>🔍</Text>
        </Pressable>

        {/* Recenter */}
        <Pressable
          onPress={handleRecenterMap}
          accessibilityRole="button"
          accessibilityLabel="Recenter map"
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: colors.surface },
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text style={styles.controlButtonText}>📍</Text>
        </Pressable>

        {/* Refresh */}
        <Pressable
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: colors.surface },
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text style={styles.controlButtonText}>🔄</Text>
        </Pressable>

        {/* Back Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.goBack();
          }}
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: colors.primary },
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text style={styles.controlButtonText}>←</Text>
        </Pressable>
      </View>

      {/* Results Counter */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsCounter}>
          <Badge
            label={`${filteredMarkers.length} gym${filteredMarkers.length !== 1 ? "s" : ""} found`}
            variant="primary"
            size="medium"
          />
        </View>
      )}

      {/* Bottom Sheet */}
      {selectedGym && (
        <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
          <BlurView
            intensity={isDark ? 30 : 40}
            tint={isDark ? "dark" : "light"}
            style={styles.bottomSheetContent}
          >
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

            <View style={styles.gymInfoContainer}>
              <View style={styles.gymHeader}>
                <Text style={[styles.gymName, { color: colors.textPrimary }]}>
                  {selectedGym.name}
                </Text>
                <Pressable
                  onPress={closeBottomSheet}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={({ pressed }) => [
                    styles.closeButton,
                    { backgroundColor: colors.backgroundAlt },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                    ✕
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.gymAddress, { color: colors.textSecondary }]}>
                {selectedGym.address}
              </Text>

              <View style={[styles.statsRow, { backgroundColor: colors.backgroundAlt }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {(selectedGym.distanceMiles ?? selectedGym.distance ?? 0).toFixed(1)} mi
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                    Distance
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {selectedGym.memberCount ?? 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                    Members
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {selectedGym.currentSong ? "🎵" : "🔇"}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                    Now Playing
                  </Text>
                </View>
              </View>

              <View style={styles.quickActionsRow}>
                <Pressable
                  onPress={() => toggleFavorite(selectedGym.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Favorite"
                  style={({ pressed }) => [
                    styles.quickActionButton,
                    {
                      backgroundColor: isFavoriteSelected
                        ? colors.primary
                        : colors.backgroundAlt,
                      borderColor: isFavoriteSelected ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.quickActionIcon}>
                    {isFavoriteSelected ? "★" : "☆"}
                  </Text>
                  <Text
                    style={[
                      styles.quickActionText,
                      {
                        color: isFavoriteSelected
                          ? colors.textPrimary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    Favorite
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDirections}
                  accessibilityRole="button"
                  accessibilityLabel="Directions"
                  style={({ pressed }) => [
                    styles.quickActionButton,
                    {
                      backgroundColor: colors.backgroundAlt,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.quickActionIcon}>🧭</Text>
                  <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
                    Directions
                  </Text>
                </Pressable>
              </View>

              {selectedGym.currentSong && (
                <GlassCard style={styles.nowPlayingContainer} variant="prominent" intensity={25}>
                  <View style={styles.nowPlayingContent}>
                    <Badge label="NOW PLAYING" variant="success" size="small" />
                    <Text
                      style={[styles.nowPlayingTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {selectedGym.currentSong.title}
                    </Text>
                    <Text
                      style={[styles.nowPlayingArtist, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {selectedGym.currentSong.artist}
                    </Text>
                  </View>
                </GlassCard>
              )}

              <Pressable
                onPress={handleToggleCheckIn}
                disabled={checkInLoading}
                accessibilityRole="button"
                accessibilityLabel={isCheckedIn ? "Check Out" : "Check In"}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: isCheckedIn ? colors.surface : colors.backgroundAlt,
                    borderColor: isCheckedIn ? colors.primary : colors.border,
                    opacity: checkInLoading ? 0.6 : 1,
                  },
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                {checkInLoading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                    {isCheckedIn ? "Check Out" : "Check In"}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleViewGym}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>View Playlist</Text>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.base,
    ...TYPOGRAPHY.presets.heading3,
  },

  // Marker Styles
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerRing: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 24,
  },
  markerPulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.3,
  },
  favoriteBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteBadgeText: {
    fontSize: 11,
    color: "#0B0B0B",
    fontWeight: "800",
  },
  clusterMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  clusterText: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Search Bar
  searchBarContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: SPACING.base,
    right: 80,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  searchIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  searchPanel: {
    marginTop: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  recentSearches: {
    gap: SPACING.xs,
  },
  recentTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  recentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  recentItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  recentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  // Controls
  controlsContainer: {
    position: "absolute",
    right: SPACING.base,
    top: Platform.OS === "ios" ? 60 : 40,
    gap: SPACING.md,
    zIndex: 20,
  },
  controlButton: {
    width: TOUCH_TARGET.comfortable,
    height: TOUCH_TARGET.comfortable,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  controlButtonText: {
    fontSize: 24,
  },

  // Results Counter
  resultsCounter: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    left: SPACING.base,
  },

  // Bottom Sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetContent: {
    flex: 1,
    padding: LAYOUT.screenPadding,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.base,
  },
  gymInfoContainer: {
    flex: 1,
  },
  gymHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.xs,
  },
  gymName: {
    flex: 1,
    ...TYPOGRAPHY.presets.heading2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: SPACING.md,
  },
  closeButtonText: {
    fontSize: 18,
  },
  gymAddress: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.base,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  quickActionIcon: {
    fontSize: 14,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  nowPlayingContainer: {
    marginBottom: SPACING.base,
  },
  nowPlayingContent: {
    gap: SPACING.xs,
  },
  nowPlayingTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginTop: SPACING.xs,
  },
  nowPlayingArtist: {
    ...TYPOGRAPHY.presets.body,
  },
  primaryButton: {
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    minHeight: TOUCH_TARGET.comfortable,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: "#FFFFFF",
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: SPACING.sm,
    minHeight: TOUCH_TARGET.comfortable,
  },
  secondaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
