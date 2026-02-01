/**
 * User-Friendly Error Messages
 * Provides consistent, actionable error messages for users
 */

// ============================================================================
// Error Message Types
// ============================================================================

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
}

// ============================================================================
// Network Errors
// ============================================================================

export const NetworkErrors = {
  NO_CONNECTION: {
    title: 'No Internet Connection',
    message: 'Please check your connection and try again.',
    actionLabel: 'Retry',
  },
  TIMEOUT: {
    title: 'Request Timed Out',
    message: 'The server took too long to respond. Please try again.',
    actionLabel: 'Retry',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    actionLabel: 'Retry',
  },
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
  },
};

// ============================================================================
// Authentication Errors
// ============================================================================

export const AuthErrors = {
  INVALID_CREDENTIALS: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect.',
    actionLabel: 'Try Again',
  },
  USER_NOT_FOUND: {
    title: 'Account Not Found',
    message: 'No account exists with this email address.',
    actionLabel: 'Sign Up',
  },
  EMAIL_IN_USE: {
    title: 'Email Already Registered',
    message: 'An account with this email already exists.',
    actionLabel: 'Sign In',
  },
  WEAK_PASSWORD: {
    title: 'Weak Password',
    message: 'Password must be at least 8 characters with a mix of letters and numbers.',
  },
  TOKEN_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    actionLabel: 'Sign In',
  },
  BIOMETRIC_FAILED: {
    title: 'Authentication Failed',
    message: 'Biometric authentication was not successful. Please try again or use your password.',
    actionLabel: 'Use Password',
  },
  PERMISSION_DENIED: {
    title: 'Permission Denied',
    message: 'Biometric authentication is not enabled on this device.',
  },
};

// ============================================================================
// Data Errors
// ============================================================================

export const DataErrors = {
  SAVE_FAILED: {
    title: 'Save Failed',
    message: 'Could not save your changes. Please try again.',
    actionLabel: 'Retry',
  },
  LOAD_FAILED: {
    title: 'Load Failed',
    message: 'Could not load your data. Please check your connection and try again.',
    actionLabel: 'Retry',
  },
  SYNC_FAILED: {
    title: 'Sync Failed',
    message: 'Could not sync your data. Changes will be synced when you\'re back online.',
  },
  CORRUPT_DATA: {
    title: 'Data Error',
    message: 'Some data could not be loaded. Default settings have been restored.',
  },
  EXPORT_FAILED: {
    title: 'Export Failed',
    message: 'Could not export your data. Please try again.',
    actionLabel: 'Retry',
  },
  IMPORT_FAILED: {
    title: 'Import Failed',
    message: 'The file you selected could not be imported. Please check the file and try again.',
    actionLabel: 'Try Another File',
  },
  INVALID_FORMAT: {
    title: 'Invalid Format',
    message: 'The file format is not supported or the file is corrupted.',
  },
};

// ============================================================================
// Spotify Errors
// ============================================================================

export const SpotifyErrors = {
  NOT_CONNECTED: {
    title: 'Spotify Not Connected',
    message: 'Please connect your Spotify account to use this feature.',
    actionLabel: 'Connect Spotify',
  },
  AUTHORIZATION_FAILED: {
    title: 'Authorization Failed',
    message: 'Could not connect to Spotify. Please try again.',
    actionLabel: 'Retry',
  },
  TOKEN_REFRESH_FAILED: {
    title: 'Spotify Connection Lost',
    message: 'Your Spotify session has expired. Please reconnect your account.',
    actionLabel: 'Reconnect',
  },
  PREMIUM_REQUIRED: {
    title: 'Spotify Premium Required',
    message: 'This feature requires a Spotify Premium subscription.',
  },
  PLAYBACK_FAILED: {
    title: 'Playback Error',
    message: 'Could not control Spotify playback. Make sure Spotify is open and a device is active.',
  },
};

// ============================================================================
// Workout Errors
// ============================================================================

export const WorkoutErrors = {
  LOG_FAILED: {
    title: 'Log Failed',
    message: 'Could not save your workout. It has been queued and will sync when you\'re back online.',
  },
  EXERCISE_NOT_FOUND: {
    title: 'Exercise Not Found',
    message: 'The exercise you\'re looking for could not be found.',
  },
  INVALID_SET_DATA: {
    title: 'Invalid Data',
    message: 'Please enter valid weight and reps values.',
  },
  PR_NOT_SAVED: {
    title: 'PR Not Saved',
    message: 'Could not save your personal record. Please try again.',
    actionLabel: 'Retry',
  },
};

// ============================================================================
// Gym Errors
// ============================================================================

export const GymErrors = {
  LOCATION_PERMISSION: {
    title: 'Location Permission Required',
    message: 'Please enable location access to find nearby gyms.',
    actionLabel: 'Open Settings',
  },
  LOCATION_UNAVAILABLE: {
    title: 'Location Unavailable',
    message: 'Could not determine your location. Please check your device settings.',
  },
  GYM_NOT_FOUND: {
    title: 'Gym Not Found',
    message: 'The selected gym could not be found.',
  },
  PLAYLIST_UNAVAILABLE: {
    title: 'Playlist Unavailable',
    message: 'This gym\'s playlist is currently unavailable.',
  },
  VOTE_FAILED: {
    title: 'Vote Failed',
    message: 'Could not register your vote. Please try again.',
    actionLabel: 'Retry',
  },
  JOIN_FAILED: {
    title: 'Join Failed',
    message: 'Could not join this gym. Please try again.',
    actionLabel: 'Retry',
  },
};

// ============================================================================
// Social Errors
// ============================================================================

export const SocialErrors = {
  FRIEND_REQUEST_FAILED: {
    title: 'Request Failed',
    message: 'Could not send friend request. Please try again.',
    actionLabel: 'Retry',
  },
  ALREADY_FRIENDS: {
    title: 'Already Friends',
    message: 'You are already friends with this user.',
  },
  PROFILE_LOAD_FAILED: {
    title: 'Profile Unavailable',
    message: 'Could not load user profile. Please try again.',
    actionLabel: 'Retry',
  },
  LEADERBOARD_UNAVAILABLE: {
    title: 'Leaderboard Unavailable',
    message: 'Could not load leaderboard data. Please try again.',
    actionLabel: 'Retry',
  },
};

// ============================================================================
// Generic Errors
// ============================================================================

export const GenericErrors = {
  UNKNOWN: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Retry',
  },
  MAINTENANCE: {
    title: 'Maintenance Mode',
    message: 'BarbellBeats is currently undergoing maintenance. Please check back later.',
  },
  UPDATE_REQUIRED: {
    title: 'Update Required',
    message: 'A new version of BarbellBeats is available. Please update to continue.',
    actionLabel: 'Update Now',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get error message from HTTP status code
 */
export function getErrorFromStatus(status: number): ErrorMessage {
  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message: 'The request could not be processed. Please check your input and try again.',
      };
    case 401:
      return AuthErrors.TOKEN_EXPIRED;
    case 403:
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
      };
    case 404:
      return NetworkErrors.NOT_FOUND;
    case 408:
      return NetworkErrors.TIMEOUT;
    case 429:
      return {
        title: 'Too Many Requests',
        message: 'You\'re doing that too often. Please wait a moment and try again.',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return NetworkErrors.SERVER_ERROR;
    default:
      return GenericErrors.UNKNOWN;
  }
}

/**
 * Get error message from error object
 */
export function getErrorMessage(error: any): ErrorMessage {
  // Network errors
  if (error.message === 'Network request failed' || error.code === 'NETWORK_ERROR') {
    return NetworkErrors.NO_CONNECTION;
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return NetworkErrors.TIMEOUT;
  }

  // HTTP errors
  if (error.response?.status) {
    return getErrorFromStatus(error.response.status);
  }

  // Auth errors
  if (error.code === 'auth/user-not-found') {
    return AuthErrors.USER_NOT_FOUND;
  }

  if (error.code === 'auth/wrong-password') {
    return AuthErrors.INVALID_CREDENTIALS;
  }

  if (error.code === 'auth/email-already-in-use') {
    return AuthErrors.EMAIL_IN_USE;
  }

  if (error.code === 'auth/weak-password') {
    return AuthErrors.WEAK_PASSWORD;
  }

  // Generic fallback
  return {
    title: GenericErrors.UNKNOWN.title,
    message: error.message || GenericErrors.UNKNOWN.message,
  };
}

/**
 * Format error for display
 */
export function formatError(error: any): string {
  const errorMsg = getErrorMessage(error);
  return `${errorMsg.title}: ${errorMsg.message}`;
}

export default {
  Network: NetworkErrors,
  Auth: AuthErrors,
  Data: DataErrors,
  Spotify: SpotifyErrors,
  Workout: WorkoutErrors,
  Gym: GymErrors,
  Social: SocialErrors,
  Generic: GenericErrors,
  getErrorFromStatus,
  getErrorMessage,
  formatError,
};
