// ============================================================================
// Health & Wearable Integration Types
// ============================================================================

export interface AppleHealthSync {
  id: string;
  userId: string;

  // Sync status
  lastSyncAt?: string;
  syncEnabled: boolean;

  // Permissions
  workoutsRead: boolean;
  heartRateRead: boolean;
  caloriesRead: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface HealthWorkoutData {
  id: string;
  userId: string;
  workoutId?: string; // Link to our workout

  // Apple Health data
  healthKitId: string;
  activityType: string; // HKWorkoutActivityType
  startDate: string;
  endDate: string;
  duration: number; // seconds

  // Metrics
  caloriesBurned?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  distance?: number; // meters

  syncedAt: string;
}

export interface LiveActivity {
  type: 'timer' | 'now-playing' | 'workout';
  data: LiveActivityData;
}

export interface LiveActivityData {
  title: string;
  subtitle?: string;
  progress?: number; // 0-1
  timeRemaining?: number; // seconds
  currentValue?: string;
  targetValue?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface SyncHealthRequest {
  startDate?: string;
  endDate?: string;
  includeWorkouts?: boolean;
  includeHeartRate?: boolean;
  includeCalories?: boolean;
}

export interface UpdateHealthPermissionsRequest {
  syncEnabled?: boolean;
  workoutsRead?: boolean;
  heartRateRead?: boolean;
  caloriesRead?: boolean;
}

export interface HealthSyncStatus {
  lastSyncAt?: string;
  syncEnabled: boolean;
  workoutsRead: boolean;
  heartRateRead: boolean;
  caloriesRead: boolean;
  totalWorkoutsSynced: number;
  lastError?: string;
}

export interface SyncHealthResponse {
  workoutsSynced: number;
  startDate: string;
  endDate: string;
  errors?: string[];
}

// ============================================================================
// Apple Health Specific Types
// ============================================================================

export type HKWorkoutActivityType =
  | 'traditionalStrengthTraining'
  | 'functionalStrengthTraining'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'hiking'
  | 'walking'
  | 'yoga'
  | 'crossTraining'
  | 'elliptical'
  | 'rowing'
  | 'climbing'
  | 'other';

export interface HKWorkout {
  uuid: string;
  activityType: HKWorkoutActivityType;
  activityName?: string;
  startDate: Date;
  endDate: Date;
  duration: number; // seconds
  totalEnergyBurned?: number; // kcal
  totalDistance?: number; // meters
  metadata?: Record<string, any>;
}

export interface HKHeartRateSample {
  uuid: string;
  heartRate: number; // bpm
  startDate: Date;
  endDate: Date;
}

export interface HKQuantitySample {
  uuid: string;
  quantity: number;
  unit: string;
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// Live Activity Types (iOS 16.1+)
// ============================================================================

export interface WorkoutLiveActivity extends LiveActivity {
  type: 'workout';
  data: {
    title: string; // "Push Day A"
    subtitle?: string; // "3/5 exercises"
    progress: number; // 0-1
    currentValue: string; // "12,500 lbs"
    targetValue?: string; // "15,000 lbs"
    timeElapsed?: number; // seconds
  };
}

export interface TimerLiveActivity extends LiveActivity {
  type: 'timer';
  data: {
    title: string; // "Rest Timer"
    subtitle?: string; // "Squats - Set 3"
    timeRemaining: number; // seconds
    progress: number; // 0-1
  };
}

export interface NowPlayingLiveActivity extends LiveActivity {
  type: 'now-playing';
  data: {
    title: string; // Song name
    subtitle: string; // Artist name
    albumArt?: string; // URL
    progress?: number; // 0-1
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export interface HealthPermissions {
  workouts: boolean;
  heartRate: boolean;
  calories: boolean;
  distance: boolean;
  bodyMass: boolean;
}

export interface HealthAuthStatus {
  isAuthorized: boolean;
  permissions: Partial<HealthPermissions>;
  lastRequested?: string;
}

export const ACTIVITY_TYPE_MAP: Record<string, string> = {
  traditionalStrengthTraining: 'Strength Training',
  functionalStrengthTraining: 'Functional Training',
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  hiking: 'Hiking',
  walking: 'Walking',
  yoga: 'Yoga',
  crossTraining: 'Cross Training',
  elliptical: 'Elliptical',
  rowing: 'Rowing',
  climbing: 'Climbing',
  other: 'Other',
};
