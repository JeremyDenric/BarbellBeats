/**
 * User-related TypeScript types
 */

export interface User {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  profilePhotoUrl?: string;
  bio?: string;
  createdAt: string;
  spotifyConnected: boolean;
  appleMusicConnected: boolean;
  preferences: UserPreferences;
  globalStats: UserGlobalStats;
}

export interface UserPreferences {
  prVisibility: 'public' | 'friends' | 'private';
  notificationsEnabled: boolean;
  headphoneMode: boolean;
}

export interface UserGlobalStats {
  totalVotesCast: number;
  totalSongsAdded: number;
  totalUpvotesReceived: number;
  gymsJoined: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  profilePhotoUrl?: string;
  bio?: string;
  createdAt: string;
  globalStats: UserGlobalStats;
  achievements: Achievement[];
  prStats?: PRStats;
}

export interface PRStats {
  visibility: 'public' | 'friends' | 'private';
  personalBests: PersonalRecord[];
}

export interface PersonalRecord {
  prId: string;
  userId: string;
  exercise: string;
  weight: number;
  unit: 'lbs' | 'kg';
  reps: number;
  date: string;
  notes?: string;
  videoUrl?: string;
  gymId?: string;
  visibility: 'public' | 'friends' | 'private';
  isPersonalBest: boolean;
  previousBest?: number;
}

export interface Achievement {
  achievementId: string;
  achievementType: AchievementType;
  achievementName: string;
  description: string;
  unlockedAt: string;
  gymId?: string;
  metadata?: Record<string, any>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsAwarded: number;
}

export type AchievementType =
  | 'hit-maker'
  | 'dj-of-the-month'
  | 'early-adopter'
  | 'music-maven'
  | 'the-peoples-choice'
  | 'crowd-controller'
  | 'genre-pioneer'
  | 'consistency-king';

export interface CreateUserInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface UpdateUserInput {
  displayName?: string;
  bio?: string;
  preferences?: Partial<UserPreferences>;
}
