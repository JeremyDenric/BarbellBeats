/**
 * Shared types for BarbellBeats app
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
export type { Gym } from '../../api/api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  influencePoints: number;
  rank: string;
  level: number;
  createdAt: string;
  isPro?: boolean;
}


export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number;
  spotifyId?: string;
  addedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  addedAt: string;
  voteCount: number;
  weightedScore: number;
  userVoted?: boolean;
  isPlaying?: boolean;
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

export interface PrRecord {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  source: 'manual' | 'apple-health';
  createdAt: string;
}

/** A personal record moment with an optional soundtrack — song playing at the gym when the PR was hit */
export interface PRMoment {
  id: string;
  exerciseName: string;
  newE1RM: number;       // estimated 1RM (lbs)
  previousE1RM: number;
  achievedAt: string;    // ISO timestamp
  song?: {
    title: string;
    artist: string;
    uri: string;         // Spotify URI for "Open in Spotify" deep-link
    albumArt?: string;
  };
  gymId?: string;
  gymName?: string;
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

export interface Vote {
  id: string;
  songId: string;
  userId: string;
  voteType: 'up' | 'down';
  votedAt: string;
  weight: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  influencePoints: number;
  rank: number;
  level: number;
  songsAdded: number;
  votesCast: number;
}

export interface Notification {
  id: string;
  type: 'song_playing' | 'level_up' | 'achievement' | 'rank_change';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: any;
}

export type CardioActivityType =
  | 'running'
  | 'cycling'
  | 'walking'
  | 'rowing'
  | 'elliptical'
  | 'stairs'
  | 'other';

export interface CardioEntry {
  id: string;
  type: CardioActivityType;
  title: string;
  date: number;       // Unix ms timestamp
  duration: number;   // minutes
  distance?: number;  // km
  notes: string;
  photos: string[];   // filenames only (use resolvePhotoUri() to get full path)
  createdAt: number;
}

// Root navigator param list (Authentication level)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainApp: undefined;
};

// Tab navigator param list
export type TabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Discover: NavigatorScreenParams<GymsStackParamList>;
  Training: NavigatorScreenParams<TrainingStackParamList>;
  Music: NavigatorScreenParams<MusicStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Home tab stack param list
export type HomeStackParamList = {
  HomeMain: undefined;
  Features: undefined;
  FeatureDetail: { featureId: string; isLive?: boolean };
};

// Gyms tab stack param list
export type GymsStackParamList = {
  GymListMain: undefined;
  Map: undefined;
  GymDetails?: { gymId: string };
  AddSong?: { gymId: string };
  Leaderboard: { gymId?: string };
  FavoriteGyms: undefined;
};

// Training tab stack param list
export type TrainingStackParamList = {
  TrainingMain: undefined;
  WorkoutToolsMain: undefined;
  Timers: undefined;
  PRs: undefined;
  WorkoutLog: undefined;
  ProgressTracking: undefined;
  // Cardio screens
  CardioTypeSelection: undefined;
  CardioLog: undefined;
  AddCardioEntry: { activityType?: string };
  CardioDetail: { entryId: string };
  // Workout template screens
  WorkoutTemplates: undefined;
  CreateWorkout: { templateId?: string };
  ExerciseBrowser: undefined;
  // Active workout screens
  ActiveWorkout: { templateId: string };
  WorkoutSummary: { workoutId: string };
  // Forge Mode screens
  ForgeMain: undefined;
  ForgeProgramDetail: { programId: string };
  ForgePaywall: undefined;
};

// Music tab stack param list
export type MusicStackParamList = {
  MusicMain: undefined;
  GymPlaylist: { gymId: string };
  Setlists: undefined;
  Spotify: undefined;
  SpotifyConnect: undefined;
  GymPicker: undefined;
};

// Profile tab stack param list
export type ProfileStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
  Notifications: undefined;
  Friends: undefined;
  FriendProfile: { friendId: string };
  PRHallOfFame: undefined;
};

