import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import devLog from './devLog';

let availabilityPromise: Promise<boolean> | null = null;
let warnedFallback = false;

async function isSecureAvailable() {
  if (Platform.OS === 'web') return false;
  if (!availabilityPromise) {
    availabilityPromise = SecureStore.isAvailableAsync().catch(() => false);
  }
  return availabilityPromise;
}

function warnFallbackOnce() {
  if (warnedFallback) return;
  warnedFallback = true;
  devLog.warn('SecureStore unavailable; falling back to AsyncStorage for tokens.');
}

export async function getSecureItem(key: string) {
  if (await isSecureAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  warnFallbackOnce();
  return AsyncStorage.getItem(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (await isSecureAvailable()) {
    return SecureStore.setItemAsync(key, value, { keychainService: 'barbellbeats' });
  }
  // In production, refuse to store sensitive data in plaintext.
  if (!__DEV__) {
    throw new Error(
      `[SecureStore] Cannot store "${key}" securely — SecureStore unavailable in production.`
    );
  }
  warnFallbackOnce();
  return AsyncStorage.setItem(key, value);
}

export async function removeSecureItem(key: string) {
  if (await isSecureAvailable()) {
    return SecureStore.deleteItemAsync(key, { keychainService: 'barbellbeats' });
  }
  warnFallbackOnce();
  return AsyncStorage.removeItem(key);
}
