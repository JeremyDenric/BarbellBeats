/**
 * Cardio Tracking Types
 * Shared types for cardio workout tracking functionality
 */

export type ActivityType = 'running' | 'cycling' | 'walking' | 'rowing' | 'elliptical' | 'stairs';
export type CardioLocation = 'outdoor' | 'indoor';
export type DistanceUnit = 'miles' | 'kilometers';
export type GoalType = 'distance' | 'time' | 'freeform';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number; // meters
  timestamp: string; // ISO timestamp
  accuracy?: number; // meters
}

export interface CardioSplit {
  splitNumber: number; // 1, 2, 3...
  distance: number; // meters (e.g., 1609.34 for 1 mile)
  duration: number; // seconds
  pace: number; // seconds per km
  averageHeartRate?: number;
}

export interface CardioWorkout {
  id: string;
  userId: string;

  // Activity
  activityType: ActivityType;
  location: CardioLocation;

  // Timing
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
  duration: number; // seconds (active time)
  pausedDuration: number; // seconds (excluded from active time)

  // Distance & Pace
  distance: number; // meters
  distanceUnit: DistanceUnit;
  averagePace: number; // seconds per km
  maxPace: number; // seconds per km (fastest)
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h

  // Physiological
  calories: number;
  averageHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm

  // Elevation (GPS-based)
  elevationGain?: number; // meters
  elevationLoss?: number; // meters

  // Route (outdoor only)
  routeCoordinates?: RouteCoordinate[];

  // Splits
  splits: CardioSplit[];

  // Music
  musicPlaylistId?: string;
  musicPlaylistName?: string;
  tracksPlayed?: string[]; // Spotify track IDs
  bpmSyncEnabled: boolean;

  // Goals
  goalType?: GoalType;
  goalValue?: number; // meters or seconds
  goalAchieved: boolean;

  // Metadata
  notes?: string;
  weatherCondition?: string;
  temperature?: number; // Celsius

  // Timestamps
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface CardioPreferences {
  id: string;
  userId: string;

  // Display preferences
  defaultDistanceUnit: DistanceUnit;

  // Feature toggles
  voiceCoachEnabled: boolean;
  autoPauseEnabled: boolean;
  bpmSyncEnabled: boolean;

  // Target paces (seconds per km)
  targetPaceRunning?: number;
  targetPaceCycling?: number;

  // Timestamps
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface CardioWorkoutConfig {
  activityType: ActivityType;
  location: CardioLocation;
  goalType?: GoalType;
  goalValue?: number;
  targetPace?: number;
  musicPlaylistId?: string;
  musicPlaylistName?: string;
  bpmSyncEnabled: boolean;
  gymId?: string;
}

export interface CardioMetrics {
  duration: number; // seconds
  distance: number; // meters
  currentPace: number; // seconds per km
  averagePace: number; // seconds per km
  currentSpeed: number; // km/h
  calories: number;
  heartRate?: number; // bpm
  elevationGain: number; // meters
  currentLocation?: { latitude: number; longitude: number };
}

export interface CardioStats {
  period: 'week' | 'month' | 'year';
  totalDistance: number; // meters
  totalDuration: number; // seconds
  totalCalories: number;
  totalWorkouts: number;
  averagePace: number; // seconds per km
  fastestPace: number; // seconds per km
  longestDistance: number; // meters
  longestDuration: number; // seconds
  personalRecords: PersonalCardioRecord[];
}

export interface PersonalCardioRecord {
  type: 'longest_run' | 'fastest_mile' | 'most_calories' | 'longest_duration';
  value: number;
  achievedAt: string; // ISO timestamp
  workoutId: string;
}

export interface WorkoutFilters {
  activityType?: ActivityType;
  location?: CardioLocation;
  startDate?: string; // ISO timestamp
  endDate?: string; // ISO timestamp
  limit?: number;
  offset?: number;
}
