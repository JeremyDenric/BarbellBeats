/**
 * API Client Configuration
 * Centralized HTTP client setup with interceptors and error handling
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api' // Development
  : 'https://api.yourapp.com';   // Production

// ============================================================================
// Axios Instance
// ============================================================================

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ============================================================================
// Request Interceptors
// ============================================================================

/**
 * Add authentication token to requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Get auth token from AsyncStorage or auth context
    // const token = await AsyncStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    if (__DEV__) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    if (__DEV__) console.warn('Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptors
// ============================================================================

/**
 * Handle responses and errors globally
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      console.warn(`❌ Request failed:`, error.message);
    }

    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          // await AsyncStorage.removeItem('auth_token');
          // navigationRef.navigate('Login');
          break;

        case 403:
          if (__DEV__) console.warn('Access forbidden');
          break;

        case 404:
          if (__DEV__) console.warn('Resource not found');
          break;

        case 500:
        case 502:
        case 503:
          if (__DEV__) console.warn('Server error, please try again later');
          break;

        default:
          if (__DEV__) console.warn(`Unexpected error: ${status}`);
      }
    } else if (error.request) {
      if (__DEV__) console.warn('Network error - no response received');
    } else {
      if (__DEV__) console.warn('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API Helper Functions
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

/**
 * GET request helper
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data.data;
}

/**
 * POST request helper
 */
export async function post<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * PUT request helper
 */
export async function put<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * PATCH request helper
 */
export async function patch<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * DELETE request helper
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data.data;
}

// ============================================================================
// File Upload Helper
// ============================================================================

/**
 * Upload file with progress tracking
 */
export async function uploadFile<T>(
  url: string,
  file: {
    uri: string;
    type: string;
    name: string;
  },
  onProgress?: (progress: number) => void
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file as any);

  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(Math.round(progress));
      }
    },
  });

  return response.data.data;
}

// ============================================================================
// Error Helper
// ============================================================================

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

// ============================================================================
// Auth Helpers
// ============================================================================

/**
 * Set authentication token
 */
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

/**
 * Clear authentication
 */
export function clearAuth() {
  setAuthToken(null);
}

export default apiClient;
