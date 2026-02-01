/**
 * API Error Handler Utility
 * Wrapper for API calls with standardized error handling
 */

import * as Sentry from '@sentry/react-native';

export interface ApiResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Wraps an API call with error handling and optional Sentry reporting
 * @param apiCall - The async function to execute
 * @param operationName - Name of the operation for logging/tracking
 * @returns Object with data or error
 */
export async function withApiErrorHandling<T>(
  apiCall: () => Promise<T>,
  operationName: string
): Promise<ApiResult<T>> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    if (__DEV__) {
      console.error(`[${operationName}] API Error:`, error.message);
    } else {
      Sentry.captureException(error, {
        tags: { operation: operationName },
      });
    }

    return { data: null, error };
  }
}

/**
 * Extract user-friendly error message from API errors
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('Network')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
