/**
 * Cardio Tracking Service
 * Handles GPS tracking, distance calculation, pace tracking, and auto-pause detection
 */

import * as Location from 'expo-location';
import type { RouteCoordinate, CardioMetrics } from '../../../shared/src/types/cardio';

// ============================================================================
// Types
// ============================================================================

interface TrackingCallbacks {
  onMetricsUpdate: (metrics: CardioMetrics) => void;
  onLocationUpdate: (coordinate: RouteCoordinate) => void;
  onAutoPause: () => void;
  onAutoResume: () => void;
}

interface TrackingState {
  isTracking: boolean;
  isPaused: boolean;
  startTime: number;
  pauseStartTime: number | null;
  totalPausedTime: number;
  routeCoordinates: RouteCoordinate[];
  totalDistance: number; // meters
  currentSpeed: number; // km/h
  maxSpeed: number; // km/h
  elevationGain: number; // meters
  lastLocation: RouteCoordinate | null;
  locationSubscription: Location.LocationSubscription | null;
}

// ============================================================================
// Constants
// ============================================================================

const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
const AUTO_PAUSE_SPEED_THRESHOLD = 0.5; // km/h - below this triggers auto-pause
const AUTO_PAUSE_DURATION = 10000; // 10 seconds - how long to be slow before pausing
const LOCATION_ACCURACY = Location.Accuracy.BestForNavigation;

// ============================================================================
// Service Class
// ============================================================================

class CardioTrackingService {
  private state: TrackingState = {
    isTracking: false,
    isPaused: false,
    startTime: 0,
    pauseStartTime: null,
    totalPausedTime: 0,
    routeCoordinates: [],
    totalDistance: 0,
    currentSpeed: 0,
    maxSpeed: 0,
    elevationGain: 0,
    lastLocation: null,
    locationSubscription: null,
  };

  private callbacks: TrackingCallbacks | null = null;
  private lowSpeedStartTime: number | null = null;
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private autoPauseEnabled: boolean = true;

  /**
   * Configure auto-pause behavior
   */
  setAutoPauseEnabled(enabled: boolean): void {
    this.autoPauseEnabled = enabled;
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        return false;
      }

      // Request background permissions for background tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      return backgroundStatus === 'granted' || foregroundStatus === 'granted';
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location services are available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Failed to check location services:', error);
      return false;
    }
  }

  /**
   * Start tracking
   */
  async startTracking(callbacks: TrackingCallbacks): Promise<void> {
    if (this.state.isTracking) {
      throw new Error('Tracking already started');
    }

    // Check permissions
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    // Check availability
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new Error('Location services not available');
    }

    // Initialize state
    this.state = {
      isTracking: true,
      isPaused: false,
      startTime: Date.now(),
      pauseStartTime: null,
      totalPausedTime: 0,
      routeCoordinates: [],
      totalDistance: 0,
      currentSpeed: 0,
      maxSpeed: 0,
      elevationGain: 0,
      lastLocation: null,
      locationSubscription: null,
    };

    this.callbacks = callbacks;
    this.lowSpeedStartTime = null;

    // Start location updates
    try {
      this.state.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: LOCATION_ACCURACY,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => this.handleLocationUpdate(location)
      );

      // Start metrics update interval (every second)
      this.metricsUpdateInterval = setInterval(() => {
        this.updateMetrics();
      }, 1000);
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  /**
   * Pause tracking
   */
  pause(): void {
    if (!this.state.isTracking || this.state.isPaused) {
      return;
    }

    this.state.isPaused = true;
    this.state.pauseStartTime = Date.now();
  }

  /**
   * Resume tracking
   */
  resume(): void {
    if (!this.state.isTracking || !this.state.isPaused) {
      return;
    }

    if (this.state.pauseStartTime) {
      const pauseDuration = Date.now() - this.state.pauseStartTime;
      this.state.totalPausedTime += pauseDuration;
    }

    this.state.isPaused = false;
    this.state.pauseStartTime = null;
  }

  /**
   * Stop tracking
   */
  async stopTracking(): Promise<{
    routeCoordinates: RouteCoordinate[];
    totalDistance: number;
    duration: number;
    pausedDuration: number;
    maxSpeed: number;
    elevationGain: number;
  }> {
    if (!this.state.isTracking) {
      throw new Error('Tracking not started');
    }

    // Stop location updates
    if (this.state.locationSubscription) {
      this.state.locationSubscription.remove();
      this.state.locationSubscription = null;
    }

    // Stop metrics update interval
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }

    // Calculate final duration
    const totalDuration = Date.now() - this.state.startTime;
    const activeDuration = totalDuration - this.state.totalPausedTime;

    const result = {
      routeCoordinates: this.state.routeCoordinates,
      totalDistance: this.state.totalDistance,
      duration: Math.floor(activeDuration / 1000), // seconds
      pausedDuration: Math.floor(this.state.totalPausedTime / 1000), // seconds
      maxSpeed: this.state.maxSpeed,
      elevationGain: this.state.elevationGain,
    };

    // Reset state
    this.state.isTracking = false;
    this.callbacks = null;

    return result;
  }

  /**
   * Handle location update
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.state.isTracking || this.state.isPaused) {
      return;
    }

    const coordinate: RouteCoordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      timestamp: new Date(location.timestamp).toISOString(),
      accuracy: location.coords.accuracy || undefined,
    };

    // Add to route
    this.state.routeCoordinates.push(coordinate);

    // Calculate distance from last location
    if (this.state.lastLocation) {
      const distance = this.calculateDistance(
        this.state.lastLocation.latitude,
        this.state.lastLocation.longitude,
        coordinate.latitude,
        coordinate.longitude
      );

      this.state.totalDistance += distance;

      // Calculate speed (km/h)
      const timeDiff = new Date(coordinate.timestamp).getTime() -
                       new Date(this.state.lastLocation.timestamp).getTime();
      if (timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600000); // km/h
        this.state.currentSpeed = speed;

        // Update max speed
        if (speed > this.state.maxSpeed) {
          this.state.maxSpeed = speed;
        }

        // Auto-pause detection
        this.checkAutoPause(speed);
      }

      // Calculate elevation gain
      if (this.state.lastLocation.altitude && coordinate.altitude) {
        const elevationDiff = coordinate.altitude - this.state.lastLocation.altitude;
        if (elevationDiff > 0) {
          this.state.elevationGain += elevationDiff;
        }
      }
    }

    this.state.lastLocation = coordinate;

    // Notify callback
    if (this.callbacks) {
      this.callbacks.onLocationUpdate(coordinate);
    }
  }

  /**
   * Check for auto-pause conditions
   */
  private checkAutoPause(speed: number): void {
    if (!this.autoPauseEnabled) {
      return;
    }

    if (speed < AUTO_PAUSE_SPEED_THRESHOLD) {
      if (!this.lowSpeedStartTime) {
        this.lowSpeedStartTime = Date.now();
      } else if (Date.now() - this.lowSpeedStartTime >= AUTO_PAUSE_DURATION) {
        // Trigger auto-pause
        this.pause();
        if (this.callbacks) {
          this.callbacks.onAutoPause();
        }
        this.lowSpeedStartTime = null;
      }
    } else {
      // Speed is above threshold
      if (this.state.isPaused) {
        // Auto-resume
        this.resume();
        if (this.callbacks) {
          this.callbacks.onAutoResume();
        }
      }
      this.lowSpeedStartTime = null;
    }
  }

  /**
   * Update and emit metrics
   */
  private updateMetrics(): void {
    if (!this.callbacks) {
      return;
    }

    const totalDuration = Date.now() - this.state.startTime;
    const activeDuration = totalDuration - this.state.totalPausedTime;
    const durationSeconds = Math.floor(activeDuration / 1000);

    // Calculate average pace (seconds per km)
    const distanceKm = this.state.totalDistance / 1000;
    const averagePace = distanceKm > 0 ? durationSeconds / distanceKm : 0;

    // Calculate current pace (using last 30 seconds of data)
    const currentPace = this.calculateCurrentPace();

    // Estimate calories (rough estimation, can be improved)
    const calories = this.estimateCalories(this.state.totalDistance, durationSeconds);

    const metrics: CardioMetrics = {
      duration: durationSeconds,
      distance: this.state.totalDistance,
      currentPace,
      averagePace,
      currentSpeed: this.state.currentSpeed,
      calories,
      elevationGain: this.state.elevationGain,
      currentLocation: this.state.lastLocation ? {
        latitude: this.state.lastLocation.latitude,
        longitude: this.state.lastLocation.longitude,
      } : undefined,
    };

    this.callbacks.onMetricsUpdate(metrics);
  }

  /**
   * Calculate current pace based on recent coordinates
   */
  private calculateCurrentPace(): number {
    if (this.state.routeCoordinates.length < 2) {
      return 0;
    }

    // Get coordinates from last 30 seconds
    const now = Date.now();
    const recentCoords = this.state.routeCoordinates.filter(coord => {
      const coordTime = new Date(coord.timestamp).getTime();
      return now - coordTime <= 30000; // 30 seconds
    });

    if (recentCoords.length < 2) {
      return 0;
    }

    // Calculate distance over recent coords
    let recentDistance = 0;
    for (let i = 1; i < recentCoords.length; i++) {
      const prev = recentCoords[i - 1];
      const curr = recentCoords[i];
      recentDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }

    // Calculate time span
    const firstTime = new Date(recentCoords[0].timestamp).getTime();
    const lastTime = new Date(recentCoords[recentCoords.length - 1].timestamp).getTime();
    const timeSpanSeconds = (lastTime - firstTime) / 1000;

    if (timeSpanSeconds === 0 || recentDistance === 0) {
      return 0;
    }

    // Pace = seconds per km
    const distanceKm = recentDistance / 1000;
    return timeSpanSeconds / distanceKm;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Estimate calories burned (basic MET-based calculation)
   */
  private estimateCalories(distanceMeters: number, durationSeconds: number): number {
    // Simplified calculation - should be enhanced with user weight and activity type
    const distanceKm = distanceMeters / 1000;
    const hours = durationSeconds / 3600;

    // Assume average MET value of 9.8 for running
    // Assume average user weight of 70kg
    const MET = 9.8;
    const weightKg = 70;

    return Math.round(MET * weightKg * hours);
  }

  /**
   * Get current tracking state
   */
  getState(): Readonly<TrackingState> {
    return { ...this.state };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const cardioTrackingService = new CardioTrackingService();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format pace as "M:SS" string
 */
export function formatPace(secondsPerKm: number, unit: 'miles' | 'kilometers' = 'miles'): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) {
    return '--:--';
  }

  const multiplier = unit === 'miles' ? 1.60934 : 1;
  const secondsPerUnit = secondsPerKm * multiplier;

  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.floor(secondsPerUnit % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format distance with unit
 */
export function formatDistance(meters: number, unit: 'miles' | 'kilometers' = 'miles'): string {
  if (unit === 'miles') {
    const miles = meters / 1609.34;
    return miles.toFixed(2);
  } else {
    const km = meters / 1000;
    return km.toFixed(2);
  }
}

/**
 * Format duration as "HH:MM:SS"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Convert speed from km/h to mph
 */
export function convertSpeed(kmh: number, toUnit: 'mph' | 'kmh' = 'mph'): number {
  if (toUnit === 'mph') {
    return kmh * 0.621371;
  }
  return kmh;
}
