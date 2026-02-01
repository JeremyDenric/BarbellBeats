/**
 * Authentication Services
 * Barrel exports for all authentication services
 */

export { default as biometricAuth } from './biometricAuth';
export { default as appleAuth } from './appleAuth';
export { default as googleAuth } from './googleAuth';

export type { BiometricConfig } from './biometricAuth';
export type { AppleAuthResult } from './appleAuth';
export type { GoogleAuthResult } from './googleAuth';
