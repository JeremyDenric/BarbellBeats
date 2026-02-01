# API Reference

Base URL: `https://your-api.execute-api.us-east-1.amazonaws.com/dev`

All endpoints require authentication unless marked as public.

## Authentication

### POST /auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "JohnLifts",
  "displayName": "John Doe"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "userId": "user#123e4567-e89b-12d3-a456-426614174000",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### POST /auth/login

Authenticate and receive access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "userId": "user#123e4567",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "email": "user@example.com",
      "username": "JohnLifts",
      "displayName": "John Doe",
      "profilePhotoUrl": "https://..."
    }
  }
}
```

## Gyms

### GET /gyms/nearby

Find gyms near a location.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in meters (default: 5000)
- `limit` (optional): Max results (default: 20)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "gyms": [
      {
        "gymId": "gym#a1b2c3d4",
        "name": "Gold's Gym Downtown",
        "distance": 1247,
        "address": {
          "street": "123 Main St",
          "city": "San Francisco"
        },
        "memberCount": 1247,
        "activeMemberCount": 342,
        "currentSong": {
          "title": "SICKO MODE",
          "artist": "Travis Scott"
        },
        "energyLevel": "high",
        "topGenres": ["Hip Hop", "Rock"]
      }
    ],
    "count": 12
  }
}
```

### GET /gyms/{gymId}

Get gym details.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "gymId": "gym#a1b2c3d4",
    "name": "Gold's Gym Downtown",
    "address": {...},
    "memberCount": 1247,
    "userIsMember": true,
    "userRank": "Gold",
    "musicIdentity": {
      "topGenres": [
        {"genre": "Hip Hop", "percentage": 42},
        {"genre": "Rock", "percentage": 28}
      ],
      "topArtists": ["Travis Scott", "Metallica"]
    }
  }
}
```

### POST /gyms/{gymId}/join

Join a gym.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "userGymRank": {
      "rank": "Bronze",
      "influencePoints": 0,
      "joinedAt": "2025-01-22T14:30:00Z"
    }
  }
}
```

## Playlist

### GET /gyms/{gymId}/playlist

Get gym's playlist.

**Query Parameters:**
- `limit` (optional): Number of songs (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "playlist": [
      {
        "songId": "song#spotify:track:123",
        "rank": 1,
        "metadata": {
          "title": "SICKO MODE",
          "artist": "Travis Scott",
          "album": "ASTROWORLD",
          "duration": 312,
          "albumArtUrl": "https://...",
          "energy": 0.83
        },
        "stats": {
          "upvotes": 127,
          "downvotes": 23,
          "netScore": 104,
          "weightedScore": 387.5
        },
        "addedBy": {
          "userId": "user#123",
          "username": "JohnLifts",
          "rank": "Platinum"
        },
        "trending": true,
        "userVote": 1
      }
    ],
    "total": 127
  }
}
```

### POST /songs/add

Add a song to gym playlist.

**Request:**
```json
{
  "gymId": "gym#a1b2c3d4",
  "spotifyUri": "spotify:track:1234567890abc"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "song": {
      "songId": "song#spotify:track:1234567890abc",
      "rank": 15,
      "addedAt": "2025-01-22T14:30:00Z"
    },
    "influencePointsGained": 10
  }
}
```

**Error Response:** 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "message": "You've added too many songs recently. Try again later.",
    "statusCode": 429,
    "details": {
      "retryAfter": 1847
    }
  }
}
```

### POST /songs/{songId}/vote

Vote on a song.

**Request:**
```json
{
  "gymId": "gym#a1b2c3d4",
  "voteType": 1
}
```

Vote types:
- `1`: Upvote
- `-1`: Downvote
- `0`: Remove vote

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "song": {
      "songId": "song#spotify:track:123",
      "stats": {
        "upvotes": 128,
        "downvotes": 23,
        "weightedScore": 390.5
      },
      "rank": 1,
      "rankChange": 2
    },
    "userVote": {
      "voteType": 1,
      "voteWeight": 2.0,
      "voterRank": "Gold"
    }
  }
}
```

## Rankings

### GET /users/{userId}/rank/{gymId}

Get user's rank at a gym.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "userGymRank": {
      "rank": "Gold",
      "influencePoints": 2847,
      "nextRank": "Platinum",
      "pointsToNextRank": 1153,
      "percentageToNext": 71.2,
      "stats": {
        "songsAdded": 34,
        "upvotesReceived": 892,
        "votesCast": 453
      }
    },
    "leaderboardPosition": 23,
    "totalMembers": 1247
  }
}
```

### GET /gyms/{gymId}/leaderboard

Get gym leaderboard.

**Query Parameters:**
- `timeframe` (optional): "all", "month", "week" (default: "all")
- `limit` (optional): Number of entries (default: 100)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user#123",
        "username": "JohnLifts",
        "displayName": "John Doe",
        "userRank": "Diamond",
        "influencePoints": 12847,
        "stats": {
          "songsAdded": 156,
          "upvotesReceived": 4521
        }
      }
    ],
    "userPosition": {
      "rank": 23,
      "percentile": 82.5
    }
  }
}
```

## WebSocket API

Connect to: `wss://your-websocket-api.amazonaws.com/dev`

### Connection

```javascript
const ws = new WebSocket('wss://...');

// Send auth
ws.send(JSON.stringify({
  action: 'connect',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIs...',
  gymId: 'gym#a1b2c3d4'
}));
```

### Subscribe to Updates

```javascript
ws.send(JSON.stringify({
  action: 'subscribe',
  channel: 'gym:playlist',
  gymId: 'gym#a1b2c3d4'
}));
```

### Real-time Events

#### Vote Cast Event
```json
{
  "type": "vote_cast",
  "gymId": "gym#a1b2c3d4",
  "songId": "song#spotify:track:123",
  "voteType": 1,
  "newStats": {
    "upvotes": 128,
    "weightedScore": 390.5
  },
  "rankChange": {
    "oldRank": 3,
    "newRank": 1
  },
  "timestamp": "2025-01-22T14:30:20Z"
}
```

#### Song Added Event
```json
{
  "type": "song_added",
  "gymId": "gym#a1b2c3d4",
  "song": {
    "songId": "song#spotify:track:123",
    "metadata": {...},
    "rank": 15
  },
  "timestamp": "2025-01-22T14:30:15Z"
}
```

#### Rank Level Up Event
```json
{
  "type": "rank_level_up",
  "userId": "user#123",
  "gymId": "gym#a1b2c3d4",
  "oldRank": "Gold",
  "newRank": "Platinum",
  "influencePoints": 4127,
  "timestamp": "2025-01-22T14:40:00Z"
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": {}
  }
}
```

**Status Codes:**
- `400` Bad Request - Invalid input
- `401` Unauthorized - Missing/invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource doesn't exist
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

## Rate Limits

- **Add Song**: 5 songs per hour per user per gym
- **Vote**: 10 votes per minute per user
- **API Requests**: 100 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1674398765
```
