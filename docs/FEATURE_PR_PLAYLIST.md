# PR Playlist Memory - Complete Feature Specification

## Overview

PR Playlist Memory automatically captures the song playing when a user hits a Personal Record, building a motivational playlist of songs associated with their best lifts.

## User Flow

### Step-by-Step Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Completes a Lift                                  │
├─────────────────────────────────────────────────────────────────┤
│ User is at gym, playlist is playing                            │
│ User opens app → Navigates to Profile → PR Logs                │
│                                                                 │
│ Current playlist state is tracked in real-time:                │
│ → Frontend knows what song is playing                          │
│ → Timestamp of when song started                               │
│ → Song metadata (BPM, energy, genre)                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: User Logs PR                                           │
├─────────────────────────────────────────────────────────────────┤
│ User taps "Log PR" button                                      │
│                                                                 │
│ Modal appears with pre-filled data:                            │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Exercise: [Deadlift ▼]                                  │   │
│ │ Weight: [405] [lbs ▼]                                   │   │
│ │ Reps: [1]                                               │   │
│ │ Date: [Today ▼]                                         │   │
│ │                                                          │   │
│ │ 🎵 Song playing:                                        │   │
│ │ "SICKO MODE" - Travis Scott                            │   │
│ │ [Album art preview]                                     │   │
│ │                                                          │   │
│ │ ☑ Save this song with my PR                            │   │
│ │                                                          │   │
│ │ Notes (optional):                                       │   │
│ │ [Felt incredible today! New PR! 💪]                    │   │
│ │                                                          │   │
│ │ [Cancel]                        [Log PR]                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ System automatically:                                           │
│ → Detects current song from playlist state                     │
│ → Fetches song metadata (BPM, energy, tempo)                   │
│ → Checks if this is a new personal best                       │
│ → Compares to previous PRs for this exercise                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: PR is Saved                                            │
├─────────────────────────────────────────────────────────────────┤
│ Success notification appears:                                   │
│ "🎉 New PR! 405 lbs Deadlift"                                  │
│ "Powered by: SICKO MODE - Travis Scott"                        │
│                                                                 │
│ System actions:                                                 │
│ → Save PRLog with song metadata                                │
│ → Add song to user's PR Playlist                              │
│ → Calculate PR stats (BPM average, genre distribution)         │
│ → Update user's global stats                                   │
│ → Check for achievement unlocks                                │
│ → Optionally share to gym feed                                │
│                                                                 │
│ If new personal best:                                           │
│ → Highlight with special badge                                 │
│ → Award bonus influence points                                 │
│ → Trigger celebration animation                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: View PR Playlist                                       │
├─────────────────────────────────────────────────────────────────┤
│ User navigates to Profile → PR Playlist                        │
│                                                                 │
│ Displays all songs associated with PRs:                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 🏋️ Your PR Playlist (24 songs)                          │   │
│ │                                                          │   │
│ │ Filter by: [All Lifts ▼] [All Time ▼]                  │   │
│ │ Sort by: [Most Recent ▼]                                │   │
│ │                                                          │   │
│ │ ───────────────────────────────────────────────────     │   │
│ │                                                          │   │
│ │ #1 SICKO MODE                                           │   │
│ │    Travis Scott • 155 BPM • Energy: 0.83                │   │
│ │    🏋️ Deadlift 405 lbs (PR!) • Jan 22, 2025            │   │
│ │    [▶ Play] [Share]                                     │   │
│ │                                                          │   │
│ │ #2 Till I Collapse                                      │   │
│ │    Eminem • 171 BPM • Energy: 0.84                      │   │
│ │    🏋️ Squat 365 lbs • Jan 15, 2025                     │   │
│ │    [▶ Play] [Share]                                     │   │
│ │                                                          │   │
│ │ #3 Eye of the Tiger                                     │   │
│ │    Survivor • 109 BPM • Energy: 0.72                    │   │
│ │    🏋️ Bench Press 275 lbs • Jan 10, 2025               │   │
│ │    [▶ Play] [Share]                                     │   │
│ │                                                          │   │
│ │ ... more songs ...                                       │   │
│ │                                                          │   │
│ │ [Export to Spotify] [Share Playlist]                    │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Analytics & Insights                                   │
├─────────────────────────────────────────────────────────────────┤
│ User taps "PR Insights" to see analytics:                      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 📊 PR MUSIC INSIGHTS                                     │   │
│ │                                                          │   │
│ │ Average BPM of PR Songs: 152 BPM                        │   │
│ │ (You hit PRs with high-tempo music!)                    │   │
│ │                                                          │   │
│ │ Top Genre for PRs: Hip Hop (62%)                        │   │
│ │ [██████████████████░░░░░░] 15 PRs                       │   │
│ │                                                          │   │
│ │ Average Song Energy: 0.81 (High)                        │   │
│ │ [███████████████████░░░] Very Energetic                │   │
│ │                                                          │   │
│ │ ───────────────────────────────────────────────────     │   │
│ │                                                          │   │
│ │ 🎵 Your PR Power Songs:                                 │   │
│ │                                                          │   │
│ │ 1. SICKO MODE - 3 PRs (Deadlift, Squat, OHP)           │   │
│ │ 2. Till I Collapse - 2 PRs (Squat, Deadlift)           │   │
│ │ 3. Thunderstruck - 2 PRs (Bench, Row)                  │   │
│ │                                                          │   │
│ │ ───────────────────────────────────────────────────     │   │
│ │                                                          │   │
│ │ 📈 PR Trends:                                            │   │
│ │                                                          │   │
│ │ Best lift by BPM:                                       │   │
│ │ • 150-170 BPM: Most PRs (18 total)                      │   │
│ │ • 120-149 BPM: Moderate PRs (6 total)                   │   │
│ │                                                          │   │
│ │ Best day for PRs: Wednesday (8 PRs)                     │   │
│ │ Best time: 6:00 PM - 8:00 PM                            │   │
│ │                                                          │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Table: PRLogs (Enhanced)

```typescript
interface PRLog {
  // Primary Key
  prId: string;                   // PK: "pr#userId#date#exercise"
  userId: string;                 // GSI-1 PK
  exerciseType: string;           // GSI-2 PK (for leaderboards)

  // PR Details
  exercise: string;               // "deadlift", "squat", "bench", etc.
  weight: number;
  unit: 'lbs' | 'kg';
  reps: number;
  date: string;                   // YYYY-MM-DD
  timestamp: string;              // Full ISO timestamp

  // Context
  gymId?: string;                 // Where it happened
  workoutSessionId?: string;      // Link to workout session if tracked

  // Song Data (NEW!)
  song?: PRSongData;              // The song playing during PR

  // Metadata
  notes?: string;
  videoUrl?: string;
  visibility: 'public' | 'friends' | 'private';
  isPersonalBest: boolean;
  previousBest?: number;
  improvement?: number;           // % improvement over previous

  // Stats
  timeOfDay: string;              // "18:30" (for analytics)
  dayOfWeek: string;              // "Wednesday"

  // Social
  reactions: number;
  shares: number;
  comments: number;

  createdAt: string;
  updatedAt: string;
}

interface PRSongData {
  // Song identifiers
  spotifyUri: string;
  appleMusicId?: string;

  // Metadata
  metadata: SongMetadata;         // Title, artist, album, artwork

  // Audio features (from Spotify/Apple Music API)
  bpm: number;                    // Beats per minute
  energy: number;                 // 0.0 - 1.0
  tempo: number;                  // Same as BPM, but more precise
  valence: number;                // 0.0 - 1.0 (musical positivity)
  danceability: number;           // 0.0 - 1.0
  loudness: number;               // dB
  genres: string[];

  // Playback context
  playedAt: string;               // When song was playing
  songProgress: number;           // Seconds into song when PR happened
  songDuration: number;

  // PR Context
  prMomentDescription: string;    // "During the hook" or "At the drop"
}
```

**GSIs:**
```
GSI-1: userId-date-index
  PK: userId
  SK: date (descending)
  Use: Get user's PR history

GSI-2: exerciseType-weight-index
  PK: exerciseType
  SK: weight (descending)
  Use: Global leaderboards by exercise

GSI-3: gymId-date-index
  PK: gymId
  SK: date (descending)
  Use: Gym PR leaderboard
```

### Table: PRPlaylists

```typescript
interface PRPlaylist {
  // Primary Key
  playlistId: string;             // PK: "prplaylist#userId"
  userId: string;

  // Playlist metadata
  name: string;                   // "My PR Power Songs"
  description: string;
  totalSongs: number;
  totalPRs: number;

  // Songs in playlist
  songs: PRPlaylistSong[];

  // Analytics
  avgBPM: number;
  avgEnergy: number;
  topGenres: GenreCount[];
  topArtists: ArtistCount[];

  // Sharing
  isPublic: boolean;
  shareUrl?: string;
  spotifyPlaylistId?: string;     // If exported to Spotify
  appleMusicPlaylistId?: string;

  // Stats
  plays: number;
  shares: number;
  followers: number;

  createdAt: string;
  updatedAt: string;
}

interface PRPlaylistSong {
  songId: string;
  spotifyUri: string;
  metadata: SongMetadata;
  audioFeatures: AudioFeatures;

  // PR context
  prsAssociated: PRAssociation[];
  totalPRs: number;               // How many PRs with this song

  firstPRDate: string;
  lastPRDate: string;
  avgWeightLifted: number;

  addedAt: string;
}

interface PRAssociation {
  prId: string;
  exercise: string;
  weight: number;
  date: string;
  isPersonalBest: boolean;
}

interface GenreCount {
  genre: string;
  count: number;
  percentage: number;
}

interface ArtistCount {
  artist: string;
  count: number;
  avgWeight: number;              // Average weight lifted to this artist
}
```

### Table: WorkoutSessions (Optional)

```typescript
interface WorkoutSession {
  sessionId: string;              // PK: "session#userId#timestamp"
  userId: string;                 // GSI-1 PK
  gymId: string;

  // Session details
  startTime: string;
  endTime: string;
  duration: number;               // minutes

  // Exercises performed
  exercises: WorkoutExercise[];

  // Music context
  songsPlayed: SessionSong[];
  avgBPM: number;
  avgEnergy: number;

  // Performance
  totalVolume: number;            // Total weight × reps
  prsSet: number;                 // Number of PRs in this session
  prIds: string[];

  // Metrics
  avgHeartRate?: number;          // If synced from Apple Health
  caloriesBurned?: number;

  notes?: string;
  createdAt: string;
}

interface WorkoutExercise {
  exercise: string;
  sets: WorkoutSet[];
  totalVolume: number;
  bestSet: WorkoutSet;
  isPR: boolean;
}

interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  restTime?: number;
  songPlaying?: string;           // Song during this set
}

interface SessionSong {
  songId: string;
  spotifyUri: string;
  playedAt: string;
  duration: number;
  associatedExercises: string[];  // Exercises during this song
}
```

### Table: PRMusicAnalytics

```typescript
interface PRMusicAnalytics {
  analyticsId: string;            // PK: "analytics#userId#date"
  userId: string;                 // GSI-1 PK
  date: string;                   // YYYY-MM (monthly rollup)

  // Aggregate stats
  totalPRs: number;
  totalUniqueSongs: number;

  // BPM analysis
  avgBPM: number;
  bpmDistribution: {
    '0-99': number;
    '100-129': number;
    '130-159': number;
    '160-189': number;
    '190+': number;
  };
  optimalBPMRange: [number, number]; // BPM range with most PRs

  // Energy analysis
  avgEnergy: number;
  energyDistribution: {
    low: number;                  // 0.0 - 0.33
    medium: number;               // 0.34 - 0.66
    high: number;                 // 0.67 - 1.0
  };

  // Genre analysis
  genreDistribution: GenreCount[];
  topGenre: string;

  // Temporal patterns
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  prsByDayOfWeek: Record<string, number>;
  prsByTimeOfDay: Record<string, number>;

  // Song effectiveness
  mostEffectiveSongs: SongEffectiveness[];

  // Correlations
  correlations: {
    bpmToWeight: number;          // -1 to 1
    energyToWeight: number;
    tempoToReps: number;
  };

  calculatedAt: string;
}

interface SongEffectiveness {
  songId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  prsCount: number;
  avgWeightLifted: number;
  exercises: string[];
  effectiveness: number;          // 0-100 score
}
```

## API Endpoints

### 1. Log PR with Song

```
POST /pr/log

Headers:
  Authorization: Bearer {token}

Body:
{
  "exercise": "deadlift",
  "weight": 405,
  "unit": "lbs",
  "reps": 1,
  "date": "2025-01-22",
  "gymId": "gym#abc123",
  "notes": "Felt incredible today! New PR! 💪",
  "visibility": "public",

  // Song data (auto-captured from current playlist state)
  "song": {
    "spotifyUri": "spotify:track:1234567890abc",
    "playedAt": "2025-01-22T18:34:12Z",
    "songProgress": 145  // 2:25 into the song
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "prLog": {
      "prId": "pr#user#123#2025-01-22#deadlift",
      "exercise": "deadlift",
      "weight": 405,
      "isPersonalBest": true,
      "previousBest": 385,
      "improvement": 5.2,  // % improvement
      "song": {
        "title": "SICKO MODE",
        "artist": "Travis Scott",
        "bpm": 155,
        "energy": 0.83,
        "genres": ["hip hop", "trap"]
      }
    },
    "achievementsUnlocked": [
      {
        "achievementType": "four-plate-club",
        "name": "Four Plate Club",
        "description": "Deadlift 4 plates (405 lbs)"
      }
    ],
    "influencePointsGained": 150
  }
}
```

### 2. Get PR History

```
GET /pr/history?exercise=deadlift&limit=20&offset=0

Response: 200 OK
{
  "success": true,
  "data": {
    "prLogs": [
      {
        "prId": "pr#...",
        "exercise": "deadlift",
        "weight": 405,
        "date": "2025-01-22",
        "isPersonalBest": true,
        "song": {
          "title": "SICKO MODE",
          "artist": "Travis Scott",
          "bpm": 155,
          "energy": 0.83
        }
      }
    ],
    "total": 24,
    "personalBest": {
      "weight": 405,
      "date": "2025-01-22"
    }
  }
}
```

### 3. Get PR Playlist

```
GET /pr/playlist

Response: 200 OK
{
  "success": true,
  "data": {
    "playlist": {
      "playlistId": "prplaylist#user#123",
      "name": "My PR Power Songs",
      "totalSongs": 18,
      "totalPRs": 24,
      "avgBPM": 152,
      "avgEnergy": 0.81,
      "songs": [
        {
          "songId": "song#spotify:track:123",
          "spotifyUri": "spotify:track:123",
          "metadata": {
            "title": "SICKO MODE",
            "artist": "Travis Scott",
            "albumArtUrl": "https://..."
          },
          "audioFeatures": {
            "bpm": 155,
            "energy": 0.83,
            "genres": ["hip hop"]
          },
          "prsAssociated": [
            {
              "prId": "pr#...",
              "exercise": "deadlift",
              "weight": 405,
              "date": "2025-01-22",
              "isPersonalBest": true
            },
            {
              "exercise": "squat",
              "weight": 365,
              "date": "2025-01-15"
            }
          ],
          "totalPRs": 2
        }
      ]
    }
  }
}
```

### 4. Get PR Music Analytics

```
GET /pr/analytics

Response: 200 OK
{
  "success": true,
  "data": {
    "analytics": {
      "totalPRs": 24,
      "totalUniqueSongs": 18,
      "avgBPM": 152,
      "avgEnergy": 0.81,

      "bpmDistribution": {
        "130-159": 18,
        "160-189": 6
      },
      "optimalBPMRange": [150, 170],

      "topGenres": [
        {"genre": "Hip Hop", "count": 15, "percentage": 62},
        {"genre": "Rock", "count": 6, "percentage": 25}
      ],

      "bestDayOfWeek": "Wednesday",
      "bestTimeOfDay": "18:00-20:00",

      "mostEffectiveSongs": [
        {
          "title": "SICKO MODE",
          "artist": "Travis Scott",
          "prsCount": 3,
          "avgWeightLifted": 383,
          "exercises": ["deadlift", "squat", "ohp"],
          "effectiveness": 95
        }
      ],

      "correlations": {
        "bpmToWeight": 0.72,      // Strong positive correlation
        "energyToWeight": 0.68
      }
    }
  }
}
```

### 5. Get Current Playing Song

```
GET /gyms/{gymId}/now-playing

Response: 200 OK
{
  "success": true,
  "data": {
    "currentSong": {
      "songId": "song#spotify:track:123",
      "spotifyUri": "spotify:track:123",
      "metadata": {
        "title": "SICKO MODE",
        "artist": "Travis Scott",
        "album": "ASTROWORLD",
        "duration": 312,
        "albumArtUrl": "https://..."
      },
      "audioFeatures": {
        "bpm": 155,
        "energy": 0.83,
        "tempo": 155,
        "valence": 0.67,
        "danceability": 0.78,
        "genres": ["hip hop", "trap"]
      },
      "startedAt": "2025-01-22T18:34:00Z",
      "progress": 145,  // seconds into song
      "endsAt": "2025-01-22T18:39:12Z"
    }
  }
}
```

### 6. Export PR Playlist to Spotify

```
POST /pr/playlist/export

Body:
{
  "platform": "spotify",
  "playlistName": "My Gym PR Power Songs",
  "description": "Songs I hit PRs to! 💪",
  "public": true
}

Response: 200 OK
{
  "success": true,
  "data": {
    "spotifyPlaylistId": "37i9dQZF1DXcBWIGoYBM5M",
    "url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    "songsAdded": 18
  }
}
```

### 7. Share PR with Song

```
POST /pr/{prId}/share

Body:
{
  "platforms": ["feed", "instagram", "twitter"],
  "message": "Just hit 405 lbs deadlift to SICKO MODE! 💪🔥"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "shareUrl": "https://gymmusicshare.com/pr/xyz",
    "shareImage": "https://cdn.gymmusicshare.com/share/pr-xyz.jpg"
  }
}
```

## Getting Current Song (Technical Implementation)

### Method 1: Real-time Playlist State (Recommended)

```typescript
class PlaylistStateManager {
  private currentSongState: CurrentSongState | null = null;

  async getCurrentSong(gymId: string): Promise<CurrentSongState> {
    // Check local cache first
    if (this.currentSongState && this.isSongStillPlaying()) {
      return this.currentSongState;
    }

    // Fetch from server
    const response = await apiClient.get(`/gyms/${gymId}/now-playing`);

    this.currentSongState = {
      songId: response.data.currentSong.songId,
      spotifyUri: response.data.currentSong.spotifyUri,
      metadata: response.data.currentSong.metadata,
      audioFeatures: response.data.currentSong.audioFeatures,
      startedAt: new Date(response.data.currentSong.startedAt),
      duration: response.data.currentSong.metadata.duration,
      progress: this.calculateProgress(response.data.currentSong.startedAt)
    };

    return this.currentSongState;
  }

  calculateProgress(startedAt: string): number {
    const started = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.floor((now - started) / 1000);
  }

  isSongStillPlaying(): boolean {
    if (!this.currentSongState) return false;

    const elapsed = Date.now() - this.currentSongState.startedAt.getTime();
    const duration = this.currentSongState.duration * 1000;

    return elapsed < duration;
  }

  // Subscribe to WebSocket updates
  subscribeToSongChanges(gymId: string) {
    this.websocket.on('song_started', (data) => {
      this.currentSongState = {
        songId: data.song.songId,
        spotifyUri: data.song.spotifyUri,
        metadata: data.song.metadata,
        audioFeatures: data.song.audioFeatures,
        startedAt: new Date(data.song.startedAt),
        duration: data.song.metadata.duration,
        progress: 0
      };
    });
  }
}

interface CurrentSongState {
  songId: string;
  spotifyUri: string;
  metadata: SongMetadata;
  audioFeatures: AudioFeatures;
  startedAt: Date;
  duration: number;
  progress: number;
}
```

### Method 2: Client-side Song History

```typescript
class SongHistoryTracker {
  private songHistory: SongHistoryEntry[] = [];
  private readonly MAX_HISTORY = 10;

  trackSong(song: CurrentSongState) {
    this.songHistory.unshift({
      ...song,
      playedAt: new Date()
    });

    // Keep only last 10 songs
    if (this.songHistory.length > this.MAX_HISTORY) {
      this.songHistory = this.songHistory.slice(0, this.MAX_HISTORY);
    }

    // Persist to async storage
    this.persistHistory();
  }

  async getSongAtTime(timestamp: Date): Promise<SongHistoryEntry | null> {
    // Find song that was playing at specific time
    return this.songHistory.find(entry => {
      const startTime = entry.playedAt.getTime();
      const endTime = startTime + (entry.duration * 1000);
      const targetTime = timestamp.getTime();

      return targetTime >= startTime && targetTime <= endTime;
    }) || null;
  }

  async persistHistory() {
    await AsyncStorage.setItem(
      'song-history',
      JSON.stringify(this.songHistory)
    );
  }

  async loadHistory() {
    const stored = await AsyncStorage.getItem('song-history');
    if (stored) {
      this.songHistory = JSON.parse(stored);
    }
  }
}
```

### Backend: Song Change Detection

```typescript
// DynamoDB Stream processor
export async function handleSongChange(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    if (record.eventName === 'MODIFY') {
      const newImage = record.dynamodb.NewImage;
      const oldImage = record.dynamodb.OldImage;

      // Check if currently playing song changed
      if (newImage.currentSongId !== oldImage.currentSongId) {
        const gymId = newImage.gymId;
        const newSong = await getSong(newImage.currentSongId);

        // Broadcast to all gym members
        await broadcastSongChanged(gymId, {
          song: newSong,
          startedAt: new Date().toISOString()
        });

        // Update gym state
        await updateGymCurrentSong(gymId, {
          currentSongId: newSong.songId,
          currentSongStartedAt: new Date().toISOString()
        });
      }
    }
  }
}
```

## PR Playlist View Architecture

### UI Component Structure

```typescript
// Main PR Playlist Screen
const PRPlaylistScreen = () => {
  const [filter, setFilter] = useState<PRFilter>('all');
  const [sortBy, setSortBy] = useState<PRSort>('recent');

  const { data: prPlaylist } = useQuery(['prPlaylist'], fetchPRPlaylist);
  const { data: analytics } = useQuery(['prAnalytics'], fetchPRAnalytics);

  return (
    <ScrollView>
      {/* Header with stats */}
      <PRPlaylistHeader
        totalSongs={prPlaylist.totalSongs}
        totalPRs={prPlaylist.totalPRs}
        avgBPM={prPlaylist.avgBPM}
      />

      {/* Filters and sorting */}
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Analytics insights */}
      <AnalyticsInsights analytics={analytics} />

      {/* Song list */}
      <SongList
        songs={prPlaylist.songs}
        filter={filter}
        sortBy={sortBy}
      />

      {/* Export button */}
      <ExportButton onExport={exportToSpotify} />
    </ScrollView>
  );
};
```

### Sorting Options

```typescript
type PRSort =
  | 'recent'          // Most recent PR first
  | 'weight'          // Highest weight first
  | 'bpm-high'        // Highest BPM first
  | 'bpm-low'         // Lowest BPM first
  | 'energy'          // Highest energy first
  | 'frequency';      // Most PRs first

function sortPRSongs(
  songs: PRPlaylistSong[],
  sortBy: PRSort
): PRPlaylistSong[] {
  switch (sortBy) {
    case 'recent':
      return songs.sort((a, b) =>
        new Date(b.lastPRDate).getTime() - new Date(a.lastPRDate).getTime()
      );

    case 'weight':
      return songs.sort((a, b) => b.avgWeightLifted - a.avgWeightLifted);

    case 'bpm-high':
      return songs.sort((a, b) =>
        b.audioFeatures.bpm - a.audioFeatures.bpm
      );

    case 'bpm-low':
      return songs.sort((a, b) =>
        a.audioFeatures.bpm - b.audioFeatures.bpm
      );

    case 'energy':
      return songs.sort((a, b) =>
        b.audioFeatures.energy - a.audioFeatures.energy
      );

    case 'frequency':
      return songs.sort((a, b) => b.totalPRs - a.totalPRs);

    default:
      return songs;
  }
}
```

### Filtering Options

```typescript
type PRFilter =
  | 'all'
  | 'deadlift'
  | 'squat'
  | 'bench'
  | 'ohp'
  | 'personal-bests'
  | 'high-energy'    // Energy > 0.7
  | 'high-tempo';    // BPM > 140

function filterPRSongs(
  songs: PRPlaylistSong[],
  filter: PRFilter
): PRPlaylistSong[] {
  switch (filter) {
    case 'all':
      return songs;

    case 'personal-bests':
      return songs.filter(song =>
        song.prsAssociated.some(pr => pr.isPersonalBest)
      );

    case 'high-energy':
      return songs.filter(song => song.audioFeatures.energy > 0.7);

    case 'high-tempo':
      return songs.filter(song => song.audioFeatures.bpm > 140);

    default:
      // Filter by exercise
      return songs.filter(song =>
        song.prsAssociated.some(pr => pr.exercise === filter)
      );
  }
}
```

## Additional Analytics

### 1. Average BPM of Successful PRs

```typescript
async function calculateAverageBPMByExercise(
  userId: string
): Promise<Record<string, number>> {
  const prLogs = await getPRLogs(userId);

  const bpmByExercise: Record<string, number[]> = {};

  prLogs.forEach(pr => {
    if (pr.song && pr.isPersonalBest) {
      if (!bpmByExercise[pr.exercise]) {
        bpmByExercise[pr.exercise] = [];
      }
      bpmByExercise[pr.exercise].push(pr.song.bpm);
    }
  });

  // Calculate averages
  const averages: Record<string, number> = {};
  Object.entries(bpmByExercise).forEach(([exercise, bpms]) => {
    averages[exercise] = bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length;
  });

  return averages;
}

// Example output:
// {
//   "deadlift": 158,
//   "squat": 152,
//   "bench": 145,
//   "ohp": 160
// }
```

### 2. Top Genres for Best Lifts

```typescript
async function analyzeGenreEffectiveness(
  userId: string
): Promise<GenreEffectiveness[]> {
  const prLogs = await getPRLogs(userId);

  const genreStats: Record<string, {
    prs: number;
    avgWeight: number;
    totalWeight: number;
    exercises: Set<string>;
  }> = {};

  prLogs.forEach(pr => {
    if (pr.song) {
      pr.song.genres.forEach(genre => {
        if (!genreStats[genre]) {
          genreStats[genre] = {
            prs: 0,
            avgWeight: 0,
            totalWeight: 0,
            exercises: new Set()
          };
        }

        genreStats[genre].prs++;
        genreStats[genre].totalWeight += pr.weight;
        genreStats[genre].exercises.add(pr.exercise);
      });
    }
  });

  // Calculate averages and sort
  return Object.entries(genreStats)
    .map(([genre, stats]) => ({
      genre,
      prs: stats.prs,
      avgWeight: stats.totalWeight / stats.prs,
      exercises: Array.from(stats.exercises),
      effectiveness: calculateEffectivenessScore(stats)
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness);
}

function calculateEffectivenessScore(stats: any): number {
  // Composite score based on:
  // - Number of PRs
  // - Average weight
  // - Exercise variety
  const prScore = Math.min(stats.prs / 5, 1) * 40;
  const weightScore = 30; // Normalized weight score
  const varietyScore = (stats.exercises.size / 6) * 30;

  return prScore + weightScore + varietyScore;
}
```

### 3. Songs You PR Most With

```typescript
async function getMostEffectiveSongs(
  userId: string,
  limit: number = 10
): Promise<SongEffectiveness[]> {
  const prPlaylist = await getPRPlaylist(userId);

  return prPlaylist.songs
    .map(song => ({
      songId: song.songId,
      title: song.metadata.title,
      artist: song.metadata.artist,
      prsCount: song.totalPRs,
      avgWeightLifted:
        song.prsAssociated.reduce((sum, pr) => sum + pr.weight, 0) /
        song.prsAssociated.length,
      exercises: [...new Set(song.prsAssociated.map(pr => pr.exercise))],
      personalBests: song.prsAssociated.filter(pr => pr.isPersonalBest).length,
      effectiveness: calculateSongEffectiveness(song)
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, limit);
}

function calculateSongEffectiveness(song: PRPlaylistSong): number {
  const prScore = song.totalPRs * 20;
  const pbScore = song.prsAssociated.filter(pr => pr.isPersonalBest).length * 30;
  const weightScore = song.avgWeightLifted / 10;
  const recencyScore = isRecent(song.lastPRDate) ? 10 : 0;

  return prScore + pbScore + weightScore + recencyScore;
}
```

## Optional Social Features

### 1. Public/Private PR Playlist

```typescript
interface PRPlaylistSettings {
  isPublic: boolean;
  showWeights: boolean;
  showSongs: boolean;
  allowComments: boolean;
  allowSharing: boolean;
}

// Public profile view
GET /users/{userId}/pr-playlist

Response (if public):
{
  "playlist": {
    "name": "John's PR Power Songs",
    "totalPRs": 24,
    "totalSongs": 18,
    "topSongs": [...],
    "topGenres": [...]
  }
}
```

### 2. Share PR + Song Combo

```typescript
// Generate shareable card
POST /pr/{prId}/share-card

Response:
{
  "shareCard": {
    "imageUrl": "https://cdn.../share-card.jpg",
    "text": "@JohnLifts just hit 405 lbs deadlift to SICKO MODE by Travis Scott! 🔥💪",
    "link": "https://gymmusicshare.com/pr/xyz"
  }
}

// Card design:
// ┌─────────────────────────────────┐
// │  [Album Art]                    │
// │                                 │
// │  🏋️ NEW PR!                     │
// │  Deadlift: 405 lbs              │
// │                                 │
// │  Powered by:                    │
// │  🎵 SICKO MODE                  │
// │  Travis Scott                   │
// │  155 BPM • Energy: 0.83         │
// │                                 │
// │  @JohnLifts • Jan 22, 2025      │
// │  Gold's Gym Downtown            │
// └─────────────────────────────────┘
```

### 3. Compare with Gym Members

```typescript
GET /pr/compare?targetUserId={userId}&exercise=deadlift

Response:
{
  "comparison": {
    "exercise": "deadlift",
    "yourBest": {
      "weight": 405,
      "date": "2025-01-22",
      "song": "SICKO MODE - Travis Scott",
      "bpm": 155
    },
    "theirBest": {
      "weight": 425,
      "date": "2025-01-20",
      "song": "Till I Collapse - Eminem",
      "bpm": 171
    },
    "gap": 20,
    "insights": [
      "They PR'd to higher BPM music (171 vs 155)",
      "You're in the same BPM range for PRs",
      "Both prefer high-energy hip hop"
    ]
  }
}
```

## Pseudocode: PR Logging with Song

```typescript
async function logPRWithSong(prData: PRInput): Promise<PRLogResponse> {
  // 1. Get current song playing at gym
  const currentSong = await getCurrentPlayingSong(prData.gymId);

  // 2. Fetch song audio features from Spotify
  const audioFeatures = await fetchSongAudioFeatures(currentSong.spotifyUri);

  // 3. Get user's previous PRs for this exercise
  const previousPRs = await getPRHistory(prData.userId, prData.exercise);
  const previousBest = Math.max(...previousPRs.map(pr => pr.weight));

  // 4. Determine if this is a personal best
  const isPersonalBest = prData.weight > previousBest;

  // 5. Create PR log with song data
  const prLog: PRLog = {
    prId: `pr#${prData.userId}#${prData.date}#${prData.exercise}`,
    userId: prData.userId,
    exerciseType: prData.exercise,
    exercise: prData.exercise,
    weight: prData.weight,
    unit: prData.unit,
    reps: prData.reps,
    date: prData.date,
    timestamp: new Date().toISOString(),
    gymId: prData.gymId,

    // Song data
    song: {
      spotifyUri: currentSong.spotifyUri,
      metadata: currentSong.metadata,
      bpm: audioFeatures.tempo,
      energy: audioFeatures.energy,
      tempo: audioFeatures.tempo,
      valence: audioFeatures.valence,
      danceability: audioFeatures.danceability,
      loudness: audioFeatures.loudness,
      genres: audioFeatures.genres,
      playedAt: currentSong.startedAt,
      songProgress: currentSong.progress,
      songDuration: currentSong.metadata.duration,
      prMomentDescription: getPRMoment(currentSong.progress, currentSong.metadata.duration)
    },

    notes: prData.notes,
    visibility: prData.visibility,
    isPersonalBest,
    previousBest: previousBest > 0 ? previousBest : undefined,
    improvement: isPersonalBest ?
      ((prData.weight - previousBest) / previousBest) * 100 : undefined,

    timeOfDay: new Date().toTimeString().slice(0, 5),
    dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),

    reactions: 0,
    shares: 0,
    comments: 0,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 6. Save PR log
  await savePRLog(prLog);

  // 7. Update PR playlist
  await updatePRPlaylist(prData.userId, currentSong, prLog);

  // 8. Update analytics
  await updatePRAnalytics(prData.userId);

  // 9. Check for achievements
  const achievements = await checkPRAchievements(prLog);

  // 10. Calculate influence points
  let influencePoints = 50; // Base PR reward
  if (isPersonalBest) influencePoints += 100;
  if (prLog.improvement && prLog.improvement > 10) influencePoints += 50;

  // 11. Award influence points
  await awardInfluencePoints(prData.userId, prData.gymId, influencePoints);

  // 12. Broadcast to gym (if public)
  if (prData.visibility === 'public') {
    await broadcastPRAchievement(prData.gymId, {
      user: await getUser(prData.userId),
      pr: prLog,
      achievements
    });
  }

  return {
    prLog,
    achievementsUnlocked: achievements,
    influencePointsGained: influencePoints
  };
}

function getPRMoment(progress: number, duration: number): string {
  const percentage = (progress / duration) * 100;

  if (percentage < 25) return "During the intro";
  if (percentage < 50) return "During the verse";
  if (percentage < 75) return "At the hook/chorus";
  return "During the outro/climax";
}

async function updatePRPlaylist(
  userId: string,
  song: CurrentSongState,
  prLog: PRLog
): Promise<void> {
  // Get user's PR playlist
  let playlist = await getPRPlaylist(userId);

  if (!playlist) {
    // Create new playlist
    playlist = createNewPRPlaylist(userId);
  }

  // Find if song already exists
  const existingSong = playlist.songs.find(
    s => s.spotifyUri === song.spotifyUri
  );

  if (existingSong) {
    // Add PR to existing song
    existingSong.prsAssociated.push({
      prId: prLog.prId,
      exercise: prLog.exercise,
      weight: prLog.weight,
      date: prLog.date,
      isPersonalBest: prLog.isPersonalBest
    });
    existingSong.totalPRs++;
    existingSong.lastPRDate = prLog.date;
    existingSong.avgWeightLifted =
      existingSong.prsAssociated.reduce((sum, pr) => sum + pr.weight, 0) /
      existingSong.prsAssociated.length;
  } else {
    // Add new song to playlist
    playlist.songs.push({
      songId: song.songId,
      spotifyUri: song.spotifyUri,
      metadata: song.metadata,
      audioFeatures: song.audioFeatures,
      prsAssociated: [{
        prId: prLog.prId,
        exercise: prLog.exercise,
        weight: prLog.weight,
        date: prLog.date,
        isPersonalBest: prLog.isPersonalBest
      }],
      totalPRs: 1,
      firstPRDate: prLog.date,
      lastPRDate: prLog.date,
      avgWeightLifted: prLog.weight,
      addedAt: new Date().toISOString()
    });
  }

  // Recalculate playlist stats
  playlist.totalSongs = playlist.songs.length;
  playlist.totalPRs++;
  playlist.avgBPM = playlist.songs.reduce((sum, s) => sum + s.audioFeatures.bpm, 0) / playlist.songs.length;
  playlist.avgEnergy = playlist.songs.reduce((sum, s) => sum + s.audioFeatures.energy, 0) / playlist.songs.length;

  // Save updated playlist
  await savePRPlaylist(playlist);
}
```

## Impact on User Ranking/Achievements

### Influence Points from PRs

```typescript
const PR_INFLUENCE_POINTS = {
  basePR: 50,
  personalBest: 100,
  bigImprovement: 50,      // >10% improvement
  firstPRAtGym: 25,
  withSong: 10             // Bonus for tracking song
};

// PR-related achievements
const PR_ACHIEVEMENTS = {
  'first-pr': {
    name: 'First PR',
    points: 100
  },
  'power-lifter': {
    name: 'Power Lifter',
    description: 'Log 10 PRs',
    points: 500
  },
  'consistency': {
    name: 'Consistent Gains',
    description: 'Log PRs 4 weeks in a row',
    points: 1000
  },
  'music-motivated': {
    name: 'Music Motivated',
    description: 'Log 20 PRs with songs',
    points: 300
  }
};
```

This feature is now **fully specified** and ready for implementation! 🏋️‍♂️🎵
