/**
 * Shared types for BarbellBeats app
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

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
}

export interface Gym {
  id: string;
  name: string;
  address: string;
  distance?: number;
  memberCount: number;
  currentSong?: Song;
  latitude: number;
  longitude: number;
  description?: string;
  image?: string;
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
  FeatureDetail: { featureId: string };
};

// Gyms tab stack param list
export type GymsStackParamList = {
  GymListMain: undefined;
  Map: undefined;
  GymDetails?: { gymId: string };
  AddSong?: { gymId: string };
  Leaderboard: { gymId?: string };
};

// Training tab stack param list
export type TrainingStackParamList = {
  TrainingMain: undefined;
  WorkoutToolsMain: undefined;
  Timers: undefined;
  PRs: undefined;
  WorkoutLog: undefined;
  ProgressTracking: undefined;
  // Cardio tracking screens
  CardioTypeSelection: undefined;
  CardioSetup: { activityType: string };
  LiveCardioTracking: undefined;
  CardioSummary: { workoutId: string };
  // Workout template screens
  WorkoutTemplates: undefined;
  CreateWorkout: { templateId?: string };
  ExerciseBrowser: undefined;
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
};

