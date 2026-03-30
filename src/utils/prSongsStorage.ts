import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeParseJSON } from './storageHelpers';
import type { PRMoment } from '../types';

const KEY = '@bb_pr_songs';
const MAX_STORED = 200;

export async function savePrMoment(moment: PRMoment): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const existing = safeParseJSON<PRMoment[]>(raw, []);
  // Newest first; cap at MAX_STORED to prevent unbounded growth
  const next = [moment, ...existing].slice(0, MAX_STORED);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadPrMoments(): Promise<PRMoment[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return safeParseJSON<PRMoment[]>(raw, []);
}

export async function clearPrMoments(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
