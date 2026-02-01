/**
 * API request/response TypeScript types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Auth API types
export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface SignupResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    username: string;
    displayName: string;
    profilePhotoUrl?: string;
  };
}

// WebSocket message types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
}

export type WebSocketMessageType =
  | 'connection_success'
  | 'song_added'
  | 'vote_cast'
  | 'playlist_reorder'
  | 'song_started'
  | 'rank_level_up'
  | 'achievement_unlocked'
  | 'crowd_dj_started'
  | 'energy_change'
  | 'error';

export interface WebSocketSubscribeMessage {
  action: 'subscribe';
  channel: string;
  gymId?: string;
  userId?: string;
}

export interface WebSocketConnectionMessage {
  action: 'connect';
  authorization: string;
  gymId?: string;
}

// Error types
export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class TooManyRequestsError extends Error {
  statusCode = 429;
  retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'TooManyRequestsError';
    this.retryAfter = retryAfter;
  }
}

export class InternalServerError extends Error {
  statusCode = 500;
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}
