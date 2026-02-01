# Cardio Tracking Feature - Implementation Plan

## Overview
Add comprehensive cardio tracking to BarbellBeats with real-time metrics, GPS route tracking, music BPM sync, and integration with existing workout system. Transform BarbellBeats from strength-focused to complete fitness tracking.

## Target User Experience
"Start a run, track my pace and distance in real-time, listen to music that matches my running cadence, and save the workout alongside my strength training sessions."

---

## Feature Scope

### Core Cardio Activities
1. **Running** (outdoor/treadmill)
2. **Cycling** (outdoor/stationary)
3. **Walking**
4. **Rowing**
5. **Elliptical**
6. **Stair Climbing**

### Tracked Metrics

**Real-Time Metrics:**
- Duration (00:00:00 format)
- Distance (miles/km with unit toggle)
- Current Pace (min/mile or min/km)
- Average Pace
- Current Speed (mph or km/h)
- Calories Burned (calculated from distance, pace, user weight)
- Heart Rate (optional, via HealthKit/Google Fit)
- Elevation Gain (GPS-based)

**Post-Workout Metrics:**
- Total Time
- Total Distance
- Average/Max Pace
- Average/Max Speed
- Total Calories
- Average/Max Heart Rate
- Elevation Profile
- Route Map (for outdoor activities)
- Splits (per mile/km)

### Music Integration
- **BPM Sync:** Auto-adjust music BPM to match running cadence
- **Cadence Detection:** Detect steps per minute, recommend songs
- **Energy Boost:** High-energy tracks for final mile
- **Custom Cardio Playlists:** Pre-made playlists for different paces

---

## User Flows

### Flow 1: Start Cardio Workout
```
Home Screen → "Start Cardio" button
  ↓
Cardio Type Selection (Running, Cycling, Walking, etc.)
  ↓
Activity Settings:
  - Indoor/Outdoor toggle
  - Goal: Distance, Time, or Freeform
  - Target pace (optional)
  - Music playlist selection
  ↓
Start Workout (GPS permission for outdoor)
  ↓
Live Tracking Screen:
  - Large metrics display
  - Pause/Resume/Finish controls
  - Music controls
  - Map (outdoor)
  ↓
Finish Workout
  ↓
Summary Screen → Save to Workout History
```

### Flow 2: View Cardio History
```
Training Tab → Cardio History
  ↓
List of Cardio Workouts (sorted by date)
  ↓
Tap Workout → Detailed Summary
  - Route map
  - Pace graph
  - Heart rate graph
  - Splits table
  - Music played
```

### Flow 3: Cardio Progress Tracking
```
Training Tab → Cardio Stats
  ↓
Charts & Insights:
  - Weekly/Monthly distance
  - Average pace trends
  - Personal records
  - Calories burned over time
```

---

## Screen Designs

### 1. Cardio Type Selection Screen
**Path:** `Home` → `Start Cardio`

**Layout:**
```
┌─────────────────────────────────────┐
│  CHOOSE ACTIVITY                    │
│  ═════                              │
│                                     │
│  ┌────────────────┐ ┌─────────────┐│
│  │  🏃 RUNNING    │ │  🚴 CYCLING ││
│  │  Most Popular  │ │  Outdoor/In ││
│  └────────────────┘ └─────────────┘│
│                                     │
│  ┌────────────────┐ ┌─────────────┐│
│  │  🚶 WALKING    │ │  🚣 ROWING  ││
│  │  Low Impact    │ │  Full Body  ││
│  └────────────────┘ └─────────────┘│
│                                     │
│  ┌────────────────┐ ┌─────────────┐│
│  │  ⚡ ELLIPTICAL │ │  🪜 STAIRS  ││
│  │  Joint Friendly│ │  High Intens││
│  └────────────────┘ └─────────────┘│
│                                     │
│  Recent: Running (3.2 mi, 24:15)   │
└─────────────────────────────────────┘
```

**Components:**
- Glassmorphic grid cards with activity icons
- Last workout quick start
- Animated entry (fade + slide up)

---

### 2. Cardio Setup Screen
**Path:** `Cardio Type Selection` → `Running`

**Layout:**
```
┌─────────────────────────────────────┐
│  🏃 RUNNING SETUP                   │
│  ═════                              │
│                                     │
│  Location                           │
│  ◉ Outdoor    ○ Treadmill          │
│                                     │
│  Goal                               │
│  ○ Distance (enter: ___ miles)     │
│  ○ Time (enter: ___ minutes)       │
│  ◉ Freeform (no goal)              │
│                                     │
│  Target Pace (optional)             │
│  ┌──────────────────────────────┐  │
│  │ 8:30 min/mile                │  │
│  └──────────────────────────────┘  │
│                                     │
│  Music Playlist                     │
│  ┌──────────────────────────────┐  │
│  │ ▶️  Running Hits (160 BPM)   │  │
│  └──────────────────────────────┘  │
│  ☑ Auto-adjust BPM to cadence      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      START RUNNING 🚀        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Features:**
- Indoor/Outdoor toggle (GPS only for outdoor)
- Goal-based training (distance, time, or open-ended)
- Target pace entry with picker
- Music playlist selector from Spotify
- BPM sync toggle
- Start button (green gradient)

---

### 3. Live Cardio Tracking Screen
**Path:** `Cardio Setup` → `Start Running`

**Layout (Portrait):**
```
┌─────────────────────────────────────┐
│  [Map View - Top Half]              │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │   🗺️  Route with markers        ││
│  │        Current location 📍      ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  00:24:15              3.24 mi      │
│  Duration              Distance     │
│                                     │
│  7:28                  ❤️ 142       │
│  Current Pace          Heart Rate   │
│                                     │
│  8:12 avg              524 cal      │
│  Avg Pace              Calories     │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  🎵 Running Up That Hill            │
│  Kate Bush • 160 BPM                │
│  [⏮️  ⏯️  ⏭️]                      │
│                                     │
│  ┌───────┐  ┌────────────┐  ┌─────┐│
│  │ PAUSE │  │   LOCK     │  │ END ││
│  └───────┘  └────────────┘  └─────┘│
└─────────────────────────────────────┘
```

**Features:**
- **Top Half:** Interactive map (outdoor) or blank (indoor)
- **Middle:** Large metric cards (glassmorphic)
- **Bottom:** Music player + controls
- **Controls:** Pause, Lock Screen (prevent touches), End Workout
- **Auto-pause:** Detect when user stops moving
- **Voice feedback:** Audio cues at mile markers

**Landscape Mode:** Map on left, metrics on right (for treadmill use)

---

### 4. Cardio Summary Screen
**Path:** `Live Tracking` → `End Workout`

**Layout:**
```
┌─────────────────────────────────────┐
│  ✅ WORKOUT COMPLETE                │
│  ═════                              │
│                                     │
│  🏃 Running • Outdoor               │
│  Today at 6:23 AM                   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  [Route Map with path]          ││
│  └─────────────────────────────────┘│
│                                     │
│  24:15        3.24 mi      524 cal  │
│  Duration     Distance     Calories │
│                                     │
│  7:28/mi      142 bpm      86 ft    │
│  Avg Pace     Avg HR       Elevation│
│                                     │
│  ━━ Splits ━━━━━━━━━━━━━━━━━━━━━━ │
│  Mile 1:  7:42  ━━━━━━━━━━━━━      │
│  Mile 2:  7:35  ━━━━━━━━━━━━━━     │
│  Mile 3:  7:18  ━━━━━━━━━━━━━━━    │
│  Last:    7:05  ━━━━━━━━━━━━━━━━━  │
│                                     │
│  🎵 11 songs played                 │
│  ♫  View full playlist              │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   SAVE WORKOUT               │  │
│  └──────────────────────────────┘  │
│                                     │
│  Share to Strava • Apple Health     │
└─────────────────────────────────────┘
```

**Features:**
- Route map with elevation profile
- Summary metrics in cards
- Splits table with pace bars
- Music played during workout
- Save to workout history
- Export options (Strava, HealthKit, GPX file)
- Social sharing

---

### 5. Cardio History Screen
**Path:** `Training Tab` → `Cardio History`

**Layout:**
```
┌─────────────────────────────────────┐
│  CARDIO HISTORY                     │
│  ═════                              │
│                                     │
│  [Week • Month • Year]              │
│                                     │
│  This Week: 12.4 miles • 3 workouts │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🏃 Running                      ││
│  │ Today, 6:23 AM                  ││
│  │ 3.24 mi • 24:15 • 7:28/mi       ││
│  │ ━━━━━━━━━━━━━━━━━━━━━          ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🚴 Cycling                      ││
│  │ Yesterday, 5:45 PM              ││
│  │ 8.7 mi • 32:12 • 16.2 mph       ││
│  │ ━━━━━━━━━━━━━━━━━━━━━          ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🏃 Running                      ││
│  │ 2 days ago, 6:15 AM             ││
│  │ 5.0 mi • 40:20 • 8:04/mi        ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━    ││
│  └─────────────────────────────────┘│
│                                     │
│  [Load More]                        │
└─────────────────────────────────────┘
```

**Features:**
- Filter by activity type
- Summary stats for selected period
- Swipe to delete
- Tap for detailed view
- Search by date/distance

---

### 6. Cardio Stats & Progress Screen
**Path:** `Training Tab` → `Cardio Stats`

**Layout:**
```
┌─────────────────────────────────────┐
│  CARDIO PROGRESS                    │
│  ═════                              │
│                                     │
│  [Week • Month • Year]              │
│                                     │
│  📊 Total Distance                  │
│  ┌─────────────────────────────────┐│
│  │  [Bar Chart: Daily Distance]    ││
│  │   Mon  Tue  Wed  Thu  Fri  Sat  ││
│  │    3.2  0   5.1  0   3.8  6.2   ││
│  └─────────────────────────────────┘│
│  18.3 miles this week               │
│                                     │
│  📈 Average Pace Trend              │
│  ┌─────────────────────────────────┐│
│  │  [Line Graph: Pace over time]   ││
│  │   Week 1  Week 2  Week 3  Week 4││
│  │    8:20   8:05   7:58   7:42    ││
│  └─────────────────────────────────┘│
│  You're getting faster! 🚀          │
│                                     │
│  🏆 Personal Records                │
│  Longest Run:    8.2 mi (Dec 18)   │
│  Fastest Mile:   6:42 (Dec 15)     │
│  Most Calories:  892 (Dec 18)      │
│                                     │
│  🔥 This Month                      │
│  42.7 miles • 8 runs • 3,245 cal    │
└─────────────────────────────────────┘
```

**Features:**
- Interactive charts (react-native-chart-kit)
- Personal records tracking
- Weekly/Monthly summaries
- Pace improvement trends
- Calorie tracking

---

## Data Models

### CardioWorkout Model
```typescript
interface CardioWorkout {
  id: string;
  userId: string;

  // Activity
  activityType: 'running' | 'cycling' | 'walking' | 'rowing' | 'elliptical' | 'stairs';
  location: 'outdoor' | 'indoor';

  // Timing
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
  duration: number; // seconds
  pausedDuration: number; // seconds (excluded from active time)

  // Distance & Pace
  distance: number; // meters
  distanceUnit: 'miles' | 'kilometers';
  averagePace: number; // seconds per km
  maxPace: number; // seconds per km
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h

  // Physiological
  calories: number; // calculated
  averageHeartRate?: number; // bpm (optional, from HealthKit)
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
  goalType?: 'distance' | 'time' | 'freeform';
  goalValue?: number; // meters or seconds
  goalAchieved: boolean;

  // Metadata
  notes?: string;
  weatherCondition?: string; // "Sunny", "Rainy", etc.
  temperature?: number; // Celsius
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number; // meters
  timestamp: string; // ISO timestamp
  accuracy?: number; // meters
}

interface CardioSplit {
  splitNumber: number; // 1, 2, 3...
  distance: number; // meters (e.g., 1609.34 for 1 mile)
  duration: number; // seconds
  pace: number; // seconds per km
  averageHeartRate?: number;
}
```

### Prisma Schema Addition
```prisma
model CardioWorkout {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  activityType      String   // running, cycling, walking, rowing, elliptical, stairs
  location          String   // outdoor, indoor

  startedAt         DateTime
  completedAt       DateTime
  duration          Int      // seconds
  pausedDuration    Int      @default(0)

  distance          Float    // meters
  distanceUnit      String   @default("miles")
  averagePace       Float    // seconds per km
  maxPace           Float
  averageSpeed      Float    // km/h
  maxSpeed          Float

  calories          Int
  averageHeartRate  Int?
  maxHeartRate      Int?

  elevationGain     Float?
  elevationLoss     Float?

  routeCoordinates  Json?    // Array of RouteCoordinate
  splits            Json     // Array of CardioSplit

  musicPlaylistId   String?
  musicPlaylistName String?
  tracksPlayed      Json?    // Array of Spotify track IDs
  bpmSyncEnabled    Boolean  @default(false)

  goalType          String?
  goalValue         Float?
  goalAchieved      Boolean  @default(false)

  notes             String?
  weatherCondition  String?
  temperature       Float?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId, startedAt])
  @@index([activityType])
}

model CardioPreferences {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  defaultDistanceUnit  String @default("miles")  // miles or kilometers
  voiceCoachEnabled    Boolean @default(true)
  autoPauseEnabled     Boolean @default(true)
  bpmSyncEnabled       Boolean @default(true)

  targetPaceRunning    Float?  // seconds per km
  targetPaceCycling    Float?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## Technical Architecture

### Context Layer

**CardioContext.tsx** (`/src/contexts/CardioContext.tsx`)
```typescript
interface CardioContextValue {
  // Active Workout
  activeWorkout: CardioWorkout | null;
  isWorkoutActive: boolean;

  // Start/Stop
  startWorkout: (config: CardioWorkoutConfig) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => Promise<CardioWorkout>;

  // Real-time Metrics
  currentMetrics: CardioMetrics;

  // History
  workouts: CardioWorkout[];
  fetchWorkouts: (filters?: WorkoutFilters) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;

  // Stats
  stats: CardioStats;
  fetchStats: (period: 'week' | 'month' | 'year') => Promise<void>;

  // Preferences
  preferences: CardioPreferences;
  updatePreferences: (prefs: Partial<CardioPreferences>) => Promise<void>;
}

interface CardioMetrics {
  duration: number;
  distance: number;
  currentPace: number;
  averagePace: number;
  currentSpeed: number;
  calories: number;
  heartRate?: number;
  elevationGain: number;
  currentLocation?: { latitude: number; longitude: number };
}
```

### Service Layer

**cardioTracking.ts** (`/src/services/cardio/cardioTracking.ts`)
- GPS tracking via `expo-location`
- Real-time metric calculations
- Auto-pause detection (speed < 0.5 mph for 10 seconds)
- Calorie estimation (MET values by activity)
- Split generation (per mile/km)

**healthKitIntegration.ts** (`/src/services/cardio/healthKitIntegration.ts`)
- Heart rate monitoring (iOS HealthKit)
- Save workout to Apple Health
- Read historical heart rate data
- Permission management

**googleFitIntegration.ts** (`/src/services/cardio/googleFitIntegration.ts`)
- Heart rate monitoring (Google Fit)
- Save workout to Google Fit
- Read historical data
- Permission management

**bpmSync.ts** (`/src/services/cardio/bpmSync.ts`)
- Detect running cadence (steps per minute)
- Calculate target music BPM (cadence * 2)
- Auto-adjust Spotify playback speed (if available)
- Recommend songs matching target BPM

**routeTracking.ts** (`/src/services/cardio/routeTracking.ts`)
- GPS coordinate collection (every 5 seconds)
- Route smoothing/simplification (Douglas-Peucker algorithm)
- Elevation calculation
- GPX export

---

## Component Architecture

### Reusable Components

**CardioMetricCard.tsx** (`/src/components/cardio/CardioMetricCard.tsx`)
```typescript
interface CardioMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  size?: 'small' | 'medium' | 'large';
}

// Example:
<CardioMetricCard
  label="Current Pace"
  value="7:28"
  unit="min/mi"
  trend="down" // faster = down arrow
  trendValue="-12s"
  size="large"
/>
```

**CardioActivityCard.tsx** (`/src/components/cardio/CardioActivityCard.tsx`)
- Displays activity type with icon
- Shows distance, duration, pace
- Tap to select activity type
- Animated selection state

**RouteMap.tsx** (`/src/components/cardio/RouteMap.tsx`)
- React Native Maps integration
- Draw polyline route
- Current location marker
- Elevation visualization (color gradient)
- Start/finish markers

**PaceChart.tsx** (`/src/components/cardio/PaceChart.tsx`)
- Line chart showing pace over distance
- Highlights fastest/slowest splits
- Interactive (tap to see split details)
- Uses react-native-chart-kit

**SplitsTable.tsx** (`/src/components/cardio/SplitsTable.tsx`)
- Table of mile/km splits
- Pace bars (visual comparison)
- Highlight fastest split
- Color coding (green = PR, red = slowest)

**VoiceCoach.tsx** (`/src/components/cardio/VoiceCoach.tsx`)
- Audio feedback at intervals (mile markers)
- "Mile 1 complete, pace 7:28, keep it up!"
- Uses expo-speech
- Configurable (on/off in preferences)

---

## Implementation Phases

### Phase 1: Foundation (Days 1-3)

**1.1 Install Dependencies**
```bash
npm install expo-location react-native-maps expo-speech react-native-chart-kit
npm install @react-native-community/geolocation
npm install react-native-health expo-sensors
```

**1.2 Create Data Models**
- Add Prisma schema for CardioWorkout and CardioPreferences
- Run migration: `npx prisma migrate dev`
- Generate Prisma client

**1.3 Request Permissions**
- Location (Always, for background tracking)
- HealthKit / Google Fit (heart rate)
- Motion & Fitness (step counting for cadence)

**1.4 Create CardioContext**
- Set up context structure
- Implement state management
- Add AsyncStorage for preferences

---

### Phase 2: GPS & Tracking Services (Days 4-6)

**2.1 Build GPS Tracking Service**
Create: `/src/services/cardio/cardioTracking.ts`
- Start location tracking (foreground + background)
- Calculate real-time distance (Haversine formula)
- Calculate pace and speed
- Detect auto-pause
- Generate route coordinates array

**2.2 Build Calorie Calculator**
```typescript
// MET (Metabolic Equivalent of Task) values
const MET_VALUES = {
  running_6mph: 9.8,   // 10 min/mile
  running_7mph: 11.0,  // 8:34 min/mile
  running_8mph: 11.8,  // 7:30 min/mile
  cycling_10mph: 4.0,
  cycling_15mph: 8.0,
  walking_3mph: 3.5,
  rowing_moderate: 7.0,
};

// Formula: Calories = MET * weight(kg) * duration(hours)
function calculateCalories(
  activityType: string,
  pace: number, // seconds per km
  duration: number, // seconds
  userWeight: number // kg
): number {
  const met = getMETValue(activityType, pace);
  const hours = duration / 3600;
  return Math.round(met * userWeight * hours);
}
```

**2.3 Build Split Generator**
```typescript
function generateSplits(
  routeCoordinates: RouteCoordinate[],
  splitDistance: number // meters (1609.34 for 1 mile)
): CardioSplit[] {
  let splits: CardioSplit[] = [];
  let currentDistance = 0;
  let splitNumber = 1;
  let splitStartTime = routeCoordinates[0].timestamp;

  // Iterate through coordinates, create split when distance threshold reached
  // Calculate pace for each split

  return splits;
}
```

---

### Phase 3: UI Components (Days 7-9)

**3.1 Create Cardio Activity Cards**
Create: `/src/components/cardio/CardioActivityCard.tsx`
- Activity icon + name
- Selection state (border glow)
- Haptic feedback on tap
- Last workout quick stats

**3.2 Create Metric Cards**
Create: `/src/components/cardio/CardioMetricCard.tsx`
- Large/medium/small variants
- Glassmorphic background
- Optional trend arrow
- Animated value updates (CountUp effect)

**3.3 Create Route Map Component**
Create: `/src/components/cardio/RouteMap.tsx`
- React Native Maps setup
- Polyline drawing with gradient (elevation-based)
- Live location marker
- Route fitting (show full route on summary)

**3.4 Create Charts**
Create: `/src/components/cardio/PaceChart.tsx`
Create: `/src/components/cardio/SplitsTable.tsx`
- Line chart for pace trends
- Bar chart for splits comparison
- Glassmorphic styling

---

### Phase 4: Screens (Days 10-14)

**4.1 Cardio Type Selection Screen**
Create: `/src/screens/Cardio/CardioTypeSelectionScreen.tsx`
- Grid of activity cards
- Recent workout quick start
- Animations (staggered fade-in)

**4.2 Cardio Setup Screen**
Create: `/src/screens/Cardio/CardioSetupScreen.tsx`
- Indoor/Outdoor toggle
- Goal selection (distance/time/freeform)
- Target pace input
- Music playlist selector
- BPM sync toggle
- START button with haptic feedback

**4.3 Live Tracking Screen** (Most Complex)
Create: `/src/screens/Cardio/LiveCardioTrackingScreen.tsx`
- Real-time metric updates (useEffect with 1s interval)
- Map rendering (outdoor) or blank (indoor)
- Music player controls
- Pause/Resume/End buttons
- Auto-pause detection UI
- Voice coach integration
- Keep screen awake (expo-keep-awake)
- Background location tracking

**4.4 Summary Screen**
Create: `/src/screens/Cardio/CardioSummaryScreen.tsx`
- Route map with full path
- Summary metrics (glassmorphic cards)
- Splits table
- Music playlist
- Save to database
- Export options (Strava, GPX, HealthKit)

**4.5 History Screen**
Create: `/src/screens/Cardio/CardioHistoryScreen.tsx`
- List of past workouts (FlatList)
- Filter by activity type
- Weekly/Monthly summaries
- Swipe to delete

**4.6 Stats Screen**
Create: `/src/screens/Cardio/CardioStatsScreen.tsx`
- Distance chart (bar chart, daily)
- Pace trend (line chart, weekly)
- Personal records
- Monthly summary

---

### Phase 5: Music Integration (Days 15-16)

**5.1 BPM Sync Service**
Create: `/src/services/cardio/bpmSync.ts`

**Cadence Detection:**
```typescript
import { Pedometer } from 'expo-sensors';

async function detectCadence(): Promise<number> {
  // Use device pedometer to count steps
  const result = await Pedometer.getStepCountAsync(
    new Date(Date.now() - 60000), // Last 60 seconds
    new Date()
  );

  const stepsPerMinute = result.steps; // Already per minute
  return stepsPerMinute;
}
```

**BPM Matching:**
```typescript
function getTargetBPM(cadence: number, activityType: string): number {
  // Running: BPM = cadence * 2 (each step is half a beat)
  // Cycling: BPM = cadence * 2.5 (faster music for spinning)

  if (activityType === 'running') {
    return Math.round(cadence * 2);
  } else if (activityType === 'cycling') {
    return Math.round(cadence * 2.5);
  }

  return 140; // Default
}

async function getMatchingSongs(targetBPM: number): Promise<SpotifyTrack[]> {
  // Query Spotify for songs with BPM within ±5 of target
  // Use existing SpotifyContext methods
  const recommendations = await spotifyApi.getRecommendations({
    target_tempo: targetBPM,
    min_tempo: targetBPM - 5,
    max_tempo: targetBPM + 5,
    target_energy: 0.8,
  });

  return recommendations.tracks;
}
```

**5.2 Integrate with SpotifyContext**
- Add `cardioMode` flag to SpotifyContext
- Auto-update playlist every 2 minutes based on current cadence
- Show "BPM Synced" indicator in LiveTrackingScreen

---

### Phase 6: Health Platform Integration (Days 17-18)

**6.1 Apple HealthKit Integration**
Create: `/src/services/cardio/healthKitIntegration.ts`

```typescript
import AppleHealthKit from 'react-native-health';

async function requestHealthKitPermissions(): Promise<boolean> {
  const permissions = {
    permissions: {
      read: ['HeartRate', 'ActiveEnergyBurned', 'DistanceWalkingRunning'],
      write: ['Workout', 'DistanceWalkingRunning'],
    },
  };

  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissions, (err) => {
      resolve(!err);
    });
  });
}

async function saveWorkoutToHealthKit(workout: CardioWorkout): Promise<void> {
  const workoutType = getHealthKitWorkoutType(workout.activityType);

  AppleHealthKit.saveWorkout({
    type: workoutType,
    startDate: workout.startedAt,
    endDate: workout.completedAt,
    energyBurned: workout.calories,
    distance: workout.distance / 1000, // km
  }, (err, result) => {
    if (err) console.error('HealthKit save failed:', err);
  });
}

async function getHeartRate(): Promise<number | undefined> {
  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateSamples({
      startDate: new Date(Date.now() - 10000).toISOString(),
      endDate: new Date().toISOString(),
    }, (err, results) => {
      if (err || !results.length) {
        resolve(undefined);
        return;
      }

      const latestHR = results[results.length - 1].value;
      resolve(Math.round(latestHR));
    });
  });
}
```

**6.2 Google Fit Integration**
Create: `/src/services/cardio/googleFitIntegration.ts`
- Similar structure to HealthKit
- Use `react-native-google-fit` package
- Read heart rate, save workouts

---

### Phase 7: API & Backend (Days 19-20)

**7.1 Create API Endpoints**

Backend routes needed (`/server/src/routes/cardio.ts`):

```typescript
POST   /api/cardio/workouts          // Create new cardio workout
GET    /api/cardio/workouts          // Get user's cardio workouts (with filters)
GET    /api/cardio/workouts/:id      // Get specific workout
DELETE /api/cardio/workouts/:id      // Delete workout
PATCH  /api/cardio/workouts/:id      // Update workout (add notes, etc.)

GET    /api/cardio/stats             // Get cardio stats (week/month/year)
GET    /api/cardio/records           // Get personal records

GET    /api/cardio/preferences       // Get user preferences
PUT    /api/cardio/preferences       // Update preferences
```

**7.2 Extend API Client**

Modify: `/api/api-client.ts`

```typescript
async createCardioWorkout(workout: Omit<CardioWorkout, 'id'>): Promise<ApiResponse<CardioWorkout>> {
  return this.post('/cardio/workouts', workout);
}

async getCardioWorkouts(filters?: {
  activityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ApiResponse<CardioWorkout[]>> {
  return this.get('/cardio/workouts', { params: filters });
}

async deleteCardioWorkout(id: string): Promise<ApiResponse<void>> {
  return this.delete(`/cardio/workouts/${id}`);
}

async getCardioStats(period: 'week' | 'month' | 'year'): Promise<ApiResponse<CardioStats>> {
  return this.get('/cardio/stats', { params: { period } });
}

async getCardioPreferences(): Promise<ApiResponse<CardioPreferences>> {
  return this.get('/cardio/preferences');
}

async updateCardioPreferences(prefs: Partial<CardioPreferences>): Promise<ApiResponse<CardioPreferences>> {
  return this.put('/cardio/preferences', prefs);
}
```

---

### Phase 8: Navigation Integration (Days 21-22)

**8.1 Update Navigation Structure**

Modify: `/src/navigation/RootNavigator.tsx`

Add Cardio stack:
```typescript
const CardioStack = createNativeStackNavigator();

function CardioNavigator() {
  return (
    <CardioStack.Navigator screenOptions={{ headerShown: false }}>
      <CardioStack.Screen name="CardioTypeSelection" component={CardioTypeSelectionScreen} />
      <CardioStack.Screen name="CardioSetup" component={CardioSetupScreen} />
      <CardioStack.Screen name="LiveCardioTracking" component={LiveCardioTrackingScreen} />
      <CardioStack.Screen name="CardioSummary" component={CardioSummaryScreen} />
      <CardioStack.Screen name="CardioHistory" component={CardioHistoryScreen} />
      <CardioStack.Screen name="CardioStats" component={CardioStatsScreen} />
    </CardioStack.Navigator>
  );
}
```

**8.2 Add Entry Points**

**Home Screen** - Add "Start Cardio" button
```typescript
<TouchableOpacity onPress={() => navigation.navigate('CardioTypeSelection')}>
  <LinearGradient colors={['#22C55E', '#15803D']} style={styles.startCardioButton}>
    <Text style={styles.buttonText}>🏃 START CARDIO</Text>
  </LinearGradient>
</TouchableOpacity>
```

**Training Tab** - Add "Cardio" section
```typescript
<IOSSection title="Cardio Training">
  <IOSListRow
    label="Cardio History"
    rightComponent={<Text>{recentCardioCount} workouts</Text>}
    onPress={() => navigation.navigate('CardioHistory')}
  />
  <IOSListRow
    label="Cardio Stats"
    rightComponent={<ChevronRight />}
    onPress={() => navigation.navigate('CardioStats')}
  />
</IOSSection>
```

---

### Phase 9: Testing & Polish (Days 23-25)

**9.1 Unit Tests**
- Calorie calculation accuracy
- Pace/speed calculations
- Split generation logic
- Distance calculations (Haversine formula)

**9.2 Integration Tests**
- Full workout flow (start → track → finish → save)
- GPS tracking accuracy
- Auto-pause detection
- Music BPM sync

**9.3 Manual Testing Checklist**
- [ ] GPS tracking works outdoor
- [ ] Auto-pause detects stops correctly
- [ ] Calories calculation is reasonable
- [ ] Heart rate displays (if device supports)
- [ ] Music BPM syncs with cadence
- [ ] Route map renders correctly
- [ ] Splits are accurate
- [ ] Summary screen shows all metrics
- [ ] History saves and loads
- [ ] Stats charts render
- [ ] Export to HealthKit/Google Fit works
- [ ] Background tracking works (app minimized)
- [ ] Voice coach announces mile markers
- [ ] Pause/Resume works correctly
- [ ] Battery drain is acceptable

**9.4 Performance Optimization**
- Throttle GPS updates (every 5 seconds, not every second)
- Simplify route coordinates (Douglas-Peucker algorithm)
- Lazy load history (pagination)
- Cache stats calculations
- Optimize map rendering (limit polyline points to 500)

**9.5 Polish**
- Haptic feedback on all button presses
- Smooth animations (60fps)
- Loading states for API calls
- Error handling (GPS unavailable, network errors)
- Empty states (no workouts yet)
- Onboarding tour for first-time users

---

## Design Specifications

### Colors (Athletic Green Theme)
```typescript
// Use existing tokens from tokens.ts
primary: '#22C55E'      // Running green
accent: '#A3E635'       // Lime accent
error: '#F87171'        // Slower pace
warning: '#FBBF24'      // Medium pace
success: '#22C55E'      // Faster pace / PR

cardio: {
  running: '#22C55E',
  cycling: '#3B82F6',
  walking: '#A3E635',
  rowing: '#8B5CF6',
  elliptical: '#EC4899',
  stairs: '#F59E0B',
}
```

### Typography
```typescript
// Metric values (large)
metricValue: {
  fontSize: 48,
  fontWeight: '700',
  color: '#F5F7F2',
  letterSpacing: -1,
}

// Metric labels
metricLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#8B9482',
  textTransform: 'uppercase',
  letterSpacing: 1,
}

// Pace format: "7:28"
paceValue: {
  fontFamily: 'monospace', // Fixed-width for aligned colons
  fontSize: 42,
  fontWeight: '700',
}
```

### Animations
```typescript
// Metric value updates (CountUp)
Animated.timing(value, {
  toValue: newValue,
  duration: 500,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
}).start();

// Activity card selection
Animated.spring(scale, {
  toValue: 1.05,
  friction: 8,
  tension: 100,
  useNativeDriver: true,
}).start();

// Route polyline drawing (on summary)
Animated.timing(progress, {
  toValue: 1,
  duration: 1500,
  easing: Easing.inOut(Easing.ease),
  useNativeDriver: false,
}).start();
```

---

## Formulas & Calculations

### Distance (Haversine Formula)
```typescript
function getDistanceBetweenCoordinates(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
```

### Pace (Time per Distance)
```typescript
function calculatePace(duration: number, distance: number): number {
  // Returns seconds per kilometer
  const kilometers = distance / 1000;
  return duration / kilometers;
}

function formatPace(secondsPerKm: number, unit: 'miles' | 'kilometers'): string {
  const multiplier = unit === 'miles' ? 1.60934 : 1;
  const secondsPerUnit = secondsPerKm * multiplier;

  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.floor(secondsPerUnit % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

### Calories (MET-based)
```typescript
function getMETValue(activityType: string, pace: number): number {
  // pace in seconds per km
  const speedKmh = 3600 / pace; // Convert pace to speed
  const speedMph = speedKmh * 0.621371;

  if (activityType === 'running') {
    if (speedMph < 5) return 6.0;
    if (speedMph < 6) return 8.3;
    if (speedMph < 7) return 9.8;
    if (speedMph < 8) return 11.0;
    if (speedMph < 9) return 11.8;
    return 12.8;
  } else if (activityType === 'cycling') {
    if (speedMph < 10) return 4.0;
    if (speedMph < 12) return 6.8;
    if (speedMph < 14) return 8.0;
    if (speedMph < 16) return 10.0;
    return 12.0;
  } else if (activityType === 'walking') {
    return speedMph < 3 ? 2.5 : 3.5;
  }

  return 5.0; // Default MET
}
```

### Elevation Gain
```typescript
function calculateElevationGain(coordinates: RouteCoordinate[]): number {
  let gain = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];

    if (prev.altitude && curr.altitude) {
      const diff = curr.altitude - prev.altitude;
      if (diff > 0) {
        gain += diff;
      }
    }
  }

  return gain; // meters
}
```

---

## Error Handling

### GPS Errors
```typescript
const GPS_ERRORS = {
  PERMISSION_DENIED: {
    title: 'Location Permission Required',
    message: 'Please enable location access in Settings to track your outdoor workouts.',
    action: 'Open Settings',
  },
  LOCATION_UNAVAILABLE: {
    title: 'GPS Signal Weak',
    message: 'Unable to get accurate location. Move to an area with better GPS signal.',
    action: 'Retry',
  },
  TIMEOUT: {
    title: 'GPS Timeout',
    message: 'Taking longer than usual to acquire GPS signal.',
    action: 'Continue Waiting',
  },
};
```

### HealthKit Errors
```typescript
const HEALTHKIT_ERRORS = {
  NOT_AVAILABLE: {
    title: 'HealthKit Unavailable',
    message: 'HealthKit is not available on this device.',
    fallback: 'Continue without heart rate monitoring',
  },
  PERMISSION_DENIED: {
    title: 'Health Access Denied',
    message: 'Please grant access to Health data in Settings.',
    action: 'Open Settings',
  },
};
```

---

## Success Metrics

### Adoption Metrics
- Cardio Feature Usage: Target 40%+ of users
- Outdoor Workouts: Target 60% outdoor vs 40% indoor
- Music BPM Sync: Target 50%+ enable BPM sync
- HealthKit Integration: Target 70%+ save to Apple Health

### Performance Metrics
- GPS Accuracy: ±10 meters average
- Battery Drain: < 10% per hour of tracking
- App Response Time: < 100ms for UI updates
- Route Rendering: < 2 seconds for 10km route

### Quality Metrics
- GPS Tracking Success Rate: > 95%
- Workout Save Success Rate: > 99%
- User Satisfaction: > 4.5/5 stars

---

## Future Enhancements (Post-MVP)

1. **Social Features**
   - Share workouts to social media
   - Leaderboards (fastest mile, longest run)
   - Challenge friends

2. **Training Plans**
   - Couch to 5K program
   - Marathon training plans
   - Interval training templates

3. **Advanced Metrics**
   - VO2 Max estimation
   - Training load/stress
   - Recovery time recommendations

4. **Wearable Integration**
   - Apple Watch app (native workout tracking)
   - Garmin/Fitbit sync
   - Heart rate monitor support (Bluetooth)

5. **Route Features**
   - Save favorite routes
   - Discover popular routes nearby
   - Turn-by-turn navigation for routes

6. **Audio Coaching**
   - Personal trainer audio cues
   - Guided interval workouts
   - Real-time form tips

---

## Implementation Timeline

**Total Duration:** 25 days

- **Days 1-3:** Foundation (dependencies, data models, permissions)
- **Days 4-6:** GPS & Tracking Services (location, calories, splits)
- **Days 7-9:** UI Components (cards, maps, charts)
- **Days 10-14:** Screens (all 6 screens)
- **Days 15-16:** Music Integration (BPM sync, cadence detection)
- **Days 17-18:** Health Platform Integration (HealthKit, Google Fit)
- **Days 19-20:** API & Backend (endpoints, database)
- **Days 21-22:** Navigation Integration (routing, entry points)
- **Days 23-25:** Testing & Polish (unit tests, manual testing, optimization)

---

## Risk Mitigation

**Technical Risks:**
- GPS accuracy poor indoors → Clear messaging, "Indoor" mode with manual distance
- Battery drain too high → Throttle GPS updates, use significant location changes
- Background tracking fails → Test thoroughly, request "Always" permission, use background tasks
- Calorie calculations inaccurate → Use established MET values, allow user weight calibration
- Music BPM sync doesn't work → Make it optional, fall back to manual playlist

**UX Risks:**
- Too complex for casual users → Simplify setup flow, default to "Freeform" goal
- Metrics overwhelming → Use progressive disclosure (show 3 main metrics, expand for more)
- Auto-pause too sensitive → Make threshold configurable in preferences

**Business Risks:**
- Low adoption → Promote feature in app, add onboarding tutorial, incentivize first workout
- Competing with Strava/Nike Run Club → Differentiate with music integration, gym workout continuity

---

## Next Steps After Implementation

1. **Beta Testing:** Release to subset of users, gather feedback on GPS accuracy, battery usage
2. **Analytics:** Track which activity types are most popular, average workout duration, completion rate
3. **Iteration:** Refine based on user feedback, add requested features
4. **Marketing:** Promote cardio tracking in app store, social media, email
5. **Integration:** Connect with gym check-ins (e.g., run to the gym, do strength workout, run home)

---

## Notes

- Maintain existing athletic green branding (#22C55E, #A3E635)
- Reuse design tokens from `tokens.ts` for consistency
- Integrate seamlessly with existing WorkoutContext (cardio workouts appear in unified workout history)
- Prioritize outdoor tracking (GPS) for MVP, indoor is secondary
- Music integration is a key differentiator vs competitors
- Test extensively on real devices in real outdoor conditions
- Coordinate with backend team for new API endpoints and database migrations
