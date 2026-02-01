import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, IOS_COLORS, SPACING } from '../theme/tokens';
import { Gym } from '../types';

// ============================================================================
// Types
// ============================================================================

interface MapPreviewCardProps {
  gyms: Gym[];
  onGymPress: (gymId: string) => void;
  onMapPress: () => void;
  style?: any;
}

interface GymMarkerProps {
  gym: Gym;
  onPress: () => void;
  isActive: boolean;
}

// ============================================================================
// Gym Marker Component with Pulse Animation
// ============================================================================

const GymMarker = memo<GymMarkerProps>(({ gym, onPress, isActive }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive && gym.memberCount > 0) {
      // Pulsing animation for active gyms
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive, gym.memberCount]);

  return (
    <Marker
      coordinate={{
        latitude: gym.latitude || 0,
        longitude: gym.longitude || 0,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <Animated.View
        style={[
          styles.markerContainer,
          isActive && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View
          style={[
            styles.marker,
            {
              backgroundColor: gym.memberCount > 0 ? COLORS.dark.primary : 'rgba(255, 255, 255, 0.12)',
              shadowColor: gym.memberCount > 0 ? COLORS.dark.primary : 'transparent',
            },
          ]}
        >
          <Text style={styles.markerIcon}>🏋️</Text>
        </View>
      </Animated.View>
    </Marker>
  );
});

GymMarker.displayName = 'GymMarker';

// ============================================================================
// MapPreview Main Component
// ============================================================================

export const MapPreviewCard: React.FC<MapPreviewCardProps> = memo(({
  gyms,
  onGymPress,
  onMapPress,
  style,
}) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'error'>('loading');
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const mapRef = useRef<MapView>(null);

  // Request location permission and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setLocationStatus('denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const region: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05, // ~3.5 miles
          longitudeDelta: 0.05,
        };

        setUserLocation(region);
        setLocationStatus('granted');
      } catch (error) {
        console.error('Location error:', error);
        setLocationStatus('error');
      }
    })();
  }, []);

  const handleGymMarkerPress = (gym: Gym) => {
    setSelectedGym(gym);
    // Center map on selected gym
    if (mapRef.current && gym.latitude && gym.longitude) {
      mapRef.current.animateToRegion({
        latitude: gym.latitude,
        longitude: gym.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const handleCalloutPress = () => {
    if (selectedGym) {
      onGymPress(selectedGym.id);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  // Loading State
  if (locationStatus === 'loading') {
    return (
      <Pressable onPress={onMapPress} style={[styles.container, { backgroundColor: iosColors.secondarySystemGroupedBackground, borderColor: iosColors.separator }, style]}>
        <View style={styles.stateContainer}>
          <View style={[styles.loadingSkeleton, { backgroundColor: iosColors.systemFill }]} />
          <Text style={[styles.stateText, { color: iosColors.tertiaryLabel }]}>
            🗺️ Loading nearby gyms...
          </Text>
        </View>
      </Pressable>
    );
  }

  // Location Denied State
  if (locationStatus === 'denied') {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.secondarySystemGroupedBackground, borderColor: iosColors.separator }, style]}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateIcon}>📍</Text>
          <Text style={[styles.stateTitle, { color: iosColors.label }]}>
            Location access needed
          </Text>
          <Text style={[styles.stateMessage, { color: iosColors.secondaryLabel }]}>
            Enable in Settings to see nearby gyms on the map
          </Text>
          <Pressable
            onPress={handleOpenSettings}
            style={[styles.stateButton, { backgroundColor: iosColors.tint }]}
          >
            <Text style={styles.stateButtonText}>Open Settings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Error State
  if (locationStatus === 'error' || !userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.secondarySystemGroupedBackground, borderColor: iosColors.separator }, style]}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={[styles.stateTitle, { color: iosColors.label }]}>
            Unable to load map
          </Text>
          <Text style={[styles.stateMessage, { color: iosColors.secondaryLabel }]}>
            Check location permissions
          </Text>
          <Pressable
            onPress={onMapPress}
            style={[styles.stateButton, { backgroundColor: iosColors.systemFill }]}
          >
            <Text style={[styles.stateButtonText, { color: iosColors.label }]}>Open Full Map</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Empty State (No Gyms)
  if (gyms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.secondarySystemGroupedBackground, borderColor: iosColors.separator }, style]}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateIcon}>🏋️</Text>
          <Text style={[styles.stateTitle, { color: iosColors.label }]}>
            No gyms found nearby
          </Text>
          <Text style={[styles.stateMessage, { color: iosColors.secondaryLabel }]}>
            Try expanding your search
          </Text>
          <Pressable
            onPress={onMapPress}
            style={[styles.stateButton, { backgroundColor: iosColors.tint }]}
          >
            <Text style={styles.stateButtonText}>Open Full Map</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Success State - Show Map
  return (
    <Pressable onPress={onMapPress} style={[styles.container, { borderColor: 'rgba(34, 197, 94, 0.25)' }, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={userLocation}
        customMapStyle={darkMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        onPress={() => setSelectedGym(null)}
      >
        {/* Gym Markers */}
        {gyms.map((gym) => (
          <GymMarker
            key={gym.id}
            gym={gym}
            onPress={() => handleGymMarkerPress(gym)}
            isActive={gym.memberCount > 0}
          />
        ))}
      </MapView>

      {/* Selected Gym Callout */}
      {selectedGym && (
        <View style={[styles.callout, { backgroundColor: iosColors.secondarySystemGroupedBackground, borderColor: 'rgba(34, 197, 94, 0.35)' }]}>
          <View style={styles.calloutContent}>
            <View style={styles.calloutInfo}>
              <Text style={[styles.calloutName, { color: iosColors.label }]} numberOfLines={1}>
                {selectedGym.name}
              </Text>
              <Text style={[styles.calloutMeta, { color: iosColors.secondaryLabel }]} numberOfLines={1}>
                {selectedGym.memberCount} training • {selectedGym.distance?.toFixed(1)} mi
              </Text>
            </View>
            <Pressable
              onPress={handleCalloutPress}
              style={[styles.calloutButton, { backgroundColor: iosColors.tint }]}
            >
              <Text style={styles.calloutButtonText}>View</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
});

MapPreviewCard.displayName = 'MapPreviewCard';

// ============================================================================
// Dark Map Style (matching app theme)
// ============================================================================

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#060A07" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#060A07" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8B9482" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#1B271E" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#28352C" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#162119" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0C120C" }]
  }
];

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Marker Styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  markerIcon: {
    fontSize: 20,
  },

  // Callout Styles
  callout: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  calloutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calloutInfo: {
    flex: 1,
  },
  calloutName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutMeta: {
    fontSize: 13,
    fontWeight: '400',
  },
  calloutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  calloutButtonText: {
    color: '#060A07',
    fontSize: 15,
    fontWeight: '600',
  },

  // State Styles
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  stateIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  stateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stateButtonText: {
    color: '#060A07',
    fontSize: 15,
    fontWeight: '600',
  },
  stateText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: SPACING.md,
  },
  loadingSkeleton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
});
