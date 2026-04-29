/**
 * useForgeMode
 * Orchestrates Forge Mode: adaptive programs + Spotify playlist generation.
 * Manages isPro subscription state (SecureStore), program locking,
 * playlist generation per session day-type, and post-workout RPE submission.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrograms, isDeloadWeekFn } from '../contexts/ProgramContext';
import { useSpotify } from '../contexts/SpotifyContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { spotifyApi } from '../services/spotifyApi';
import { FORGE_PROGRAMS, FREE_PROGRAM_IDS } from '../data/forgePrograms';
import devLog from '../utils/devLog';

// ============================================================================
// Storage Keys
// ============================================================================

const LAST_PLAYLIST_KEY = '@bb_forge_last_playlist';

// ============================================================================
// Types
// ============================================================================

type SessionDayType = 'push' | 'pull' | 'legs' | 'upper' | 'full_body' | 'deload' | 'cardio';

export interface ForgePlaylistResult {
  playlistId: string;
  playlistName: string;
  trackCount: number;
}

export interface UseForgeModeReturn {
  // Pro subscription state
  isPro: boolean;
  /** @deprecated Use useSubscription().devUnlockPro() in dev */
  unlockPro: () => Promise<void>;
  /** @deprecated Use useSubscription().devRevokePro() in dev */
  revokePro: () => Promise<void>;

  // Programs
  forgePrograms: typeof FORGE_PROGRAMS;
  isProgramLocked: (programId: string) => boolean;

  // Derived active-program state
  isDeloadWeek: boolean;
  currentDayType: SessionDayType | null;
  nextWorkoutName: string | null;
  progressPercent: number;
  currentStreak: number;

  // Playlist generation
  isGeneratingPlaylist: boolean;
  lastPlaylist: ForgePlaylistResult | null;
  generateSessionPlaylist: () => Promise<ForgePlaylistResult | null>;

  // RPE check-in
  pendingRpeSession: { weekNumber: number; dayNumber: number } | null;
  setPendingRpeSession: (session: { weekNumber: number; dayNumber: number } | null) => void;
  submitRpe: (rpe: number) => Promise<void>;
}

// ============================================================================
// Music Profile Map
// ============================================================================

const SESSION_MUSIC_PROFILE: Record<SessionDayType, {
  targetEnergy: number;
  targetTempo: number;
  seedGenres: string[];
}> = {
  push:      { targetEnergy: 0.85, targetTempo: 135, seedGenres: ['hip-hop', 'trap'] },
  pull:      { targetEnergy: 0.80, targetTempo: 145, seedGenres: ['rock', 'metal'] },
  legs:      { targetEnergy: 0.90, targetTempo: 148, seedGenres: ['edm', 'electronic'] },
  upper:     { targetEnergy: 0.75, targetTempo: 120, seedGenres: ['hip-hop', 'rnb'] },
  full_body: { targetEnergy: 0.80, targetTempo: 130, seedGenres: ['electronic', 'hip-hop'] },
  deload:    { targetEnergy: 0.50, targetTempo: 90,  seedGenres: ['lo-fi', 'chill'] },
  cardio:    { targetEnergy: 0.75, targetTempo: 128, seedGenres: ['pop', 'dance'] },
};

// ============================================================================
// Hook
// ============================================================================

export function useForgeMode(): UseForgeModeReturn {
  const { activeProgram, logRpe } = usePrograms();
  const { isConnected: spotifyConnected, user: spotifyUser } = useSpotify();
  const { isPro, devUnlockPro, devRevokePro } = useSubscription();

  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [lastPlaylist, setLastPlaylist] = useState<ForgePlaylistResult | null>(null);
  const [pendingRpeSession, setPendingRpeSession] = useState<{ weekNumber: number; dayNumber: number } | null>(null);

  // Load cached last playlist on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_PLAYLIST_KEY).then((v) => {
      if (v) {
        try { setLastPlaylist(JSON.parse(v)); } catch { /* ignore corrupt cache */ }
      }
    });
  }, []);

  const isProgramLocked = useCallback(
    (programId: string): boolean => {
      if (isPro) return false;
      return !FREE_PROGRAM_IDS.includes(programId);
    },
    [isPro]
  );

  // ── Derived active-program state ──

  const isDeloadWeek = useMemo<boolean>(() => {
    if (!activeProgram) return false;
    return isDeloadWeekFn(activeProgram.progress.currentWeek);
  }, [activeProgram]);

  const currentDayType = useMemo<SessionDayType | null>(() => {
    if (!activeProgram) return null;
    const { program, progress } = activeProgram;
    const week = program.weeks.find((w) => w.weekNumber === progress.currentWeek);
    const workout = week?.workouts.find((w) => w.dayNumber === progress.currentDay);
    if (!workout) return null;
    if (isDeloadWeek) return 'deload';
    const desc = (workout.description ?? '').toLowerCase() as SessionDayType;
    const VALID_TYPES: SessionDayType[] = ['push', 'pull', 'legs', 'upper', 'full_body', 'deload', 'cardio'];
    return VALID_TYPES.includes(desc) ? desc : 'full_body';
  }, [activeProgram, isDeloadWeek]);

  const nextWorkoutName = useMemo<string | null>(() => {
    if (!activeProgram) return null;
    const { program, progress } = activeProgram;
    const week = program.weeks.find((w) => w.weekNumber === progress.currentWeek);
    return week?.workouts.find((w) => w.dayNumber === progress.currentDay)?.name ?? null;
  }, [activeProgram]);

  const progressPercent = useMemo<number>(() => {
    if (!activeProgram) return 0;
    const { program, progress } = activeProgram;
    const total = program.weeks.reduce((s, w) => s + w.workouts.length, 0);
    return total > 0 ? Math.round((progress.completedWorkouts.length / total) * 100) : 0;
  }, [activeProgram]);

  // Simple streak: number of sessions completed (proxy — real streak requires timestamps)
  const currentStreak = useMemo<number>(() => {
    return activeProgram?.progress.completedWorkouts.length ?? 0;
  }, [activeProgram]);

  // ── Playlist generation ──

  const generateSessionPlaylist = useCallback(async (): Promise<ForgePlaylistResult | null> => {
    if (!isPro) {
      devLog.warn('[ForgeMode] Playlist generation requires Pro');
      return null;
    }
    if (!spotifyConnected || !spotifyUser) {
      devLog.warn('[ForgeMode] Spotify not connected');
      return null;
    }
    if (!currentDayType || !activeProgram) return null;

    setIsGeneratingPlaylist(true);
    try {
      const profile = SESSION_MUSIC_PROFILE[currentDayType];
      const programName = activeProgram.program.name;
      const dayName = nextWorkoutName ?? currentDayType;

      const tracks = await spotifyApi.getRecommendations({
        seedGenres: profile.seedGenres,
        targetEnergy: profile.targetEnergy,
        targetTempo: profile.targetTempo,
        limit: 20,
      });

      if (tracks.length === 0) return null;

      const playlist = await spotifyApi.createPlaylist(spotifyUser.id, {
        name: `FORGE — ${programName}: ${dayName}`,
        description: `${profile.targetTempo} BPM · ${Math.round(profile.targetEnergy * 100)}% energy · Generated by BarbellBeats`,
        isPublic: false,
      });

      await spotifyApi.addTracksToPlaylist(playlist.id, tracks.map((t) => t.uri));

      const result: ForgePlaylistResult = {
        playlistId: playlist.id,
        playlistName: playlist.name,
        trackCount: tracks.length,
      };

      setLastPlaylist(result);
      await AsyncStorage.setItem(LAST_PLAYLIST_KEY, JSON.stringify(result));

      devLog.log('[ForgeMode] Playlist generated:', result.playlistName);
      return result;
    } catch (err) {
      devLog.error('[ForgeMode] Playlist generation failed:', err);
      return null;
    } finally {
      setIsGeneratingPlaylist(false);
    }
  }, [isPro, spotifyConnected, spotifyUser, currentDayType, activeProgram, nextWorkoutName]);

  // ── RPE submission ──

  const submitRpe = useCallback(
    async (rpe: number) => {
      if (!activeProgram || !pendingRpeSession) return;
      await logRpe(pendingRpeSession.weekNumber, pendingRpeSession.dayNumber, rpe);
      setPendingRpeSession(null);
    },
    [activeProgram, pendingRpeSession, logRpe]
  );

  return {
    isPro,
    unlockPro: devUnlockPro,
    revokePro: devRevokePro,
    forgePrograms: FORGE_PROGRAMS,
    isProgramLocked,
    isDeloadWeek,
    currentDayType,
    nextWorkoutName,
    progressPercent,
    currentStreak,
    isGeneratingPlaylist,
    lastPlaylist,
    generateSessionPlaylist,
    pendingRpeSession,
    setPendingRpeSession,
    submitRpe,
  };
}
