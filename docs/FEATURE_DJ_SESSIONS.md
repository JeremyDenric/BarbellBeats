# Micro DJ Session Takeovers - Complete Feature Specification

## Overview

Micro DJ Session Takeovers allow users to temporarily control the gym playlist for 1-3 songs, subject to community approval through democratic voting.

## User Flow

### Step-by-Step Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Initiates DJ Session Request                      │
├─────────────────────────────────────────────────────────────────┤
│ User (Gold+ rank) taps "Request DJ Session" button             │
│ → System checks:                                                │
│   ✓ User rank (minimum: Gold)                                  │
│   ✓ Cooldown period (24 hours since last session)              │
│   ✓ Daily limit (max 3 sessions per gym per day)               │
│   ✓ No active session in progress                              │
│   ✓ No pending vote for this user                              │
│                                                                 │
│ If all checks pass → Show song selection modal                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: User Selects Songs                                     │
├─────────────────────────────────────────────────────────────────┤
│ User picks 1-3 songs from Spotify/Apple Music                  │
│ → Preview songs before selecting                                │
│ → See combined energy/tempo stats                              │
│ → Add optional message to community (max 100 chars)            │
│                                                                 │
│ User confirms selection → Request submitted                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Community Voting Period (60 seconds)                   │
├─────────────────────────────────────────────────────────────────┤
│ All active gym members see notification banner:                │
│ "🎧 @JohnLifts wants to DJ! Vote now (60s left)"               │
│                                                                 │
│ Voting options:                                                 │
│ ✅ Approve  ❌ Reject                                           │
│                                                                 │
│ Real-time vote counter visible to all                          │
│ → Weighted by user rank (Bronze 1x → Legend 5x)                │
│ → Live progress bar showing approval %                         │
│ → Countdown timer                                              │
│                                                                 │
│ Auto-votes after 60 seconds:                                   │
│ → If threshold met: APPROVED                                   │
│ → If not: REJECTED                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4A: Session APPROVED                                      │
├─────────────────────────────────────────────────────────────────┤
│ Notification to all: "🎉 @JohnLifts is now DJ!"                │
│                                                                 │
│ System actions:                                                 │
│ → Create DJSession record                                      │
│ → Insert selected songs at top of queue                        │
│ → Mark songs as "locked" (can't be removed/voted)              │
│ → Start session timer                                          │
│ → Award "DJ Session" achievement to user                       │
│                                                                 │
│ Playlist UI changes:                                            │
│ → DJ banner at top showing host & time remaining               │
│ → DJ's songs highlighted in gold                               │
│ → Normal voting disabled for DJ songs                          │
│ → Community can still vote on other songs                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4B: Session REJECTED                                      │
├─────────────────────────────────────────────────────────────────┤
│ Notification to requester: "Session denied by community"       │
│                                                                 │
│ System actions:                                                 │
│ → Log rejection (for analytics)                                │
│ → No cooldown penalty (can request again in 1 hour)            │
│ → Return to normal playlist                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Session In Progress                                    │
├─────────────────────────────────────────────────────────────────┤
│ DJ's songs play in order                                        │
│                                                                 │
│ Live stats shown:                                               │
│ → Current DJ song playing                                      │
│ → Songs remaining (e.g., "2/3 songs played")                   │
│ → Time until session ends                                      │
│ → Community engagement (reactions, likes)                      │
│                                                                 │
│ DJ privileges during session:                                   │
│ → Can skip own songs                                           │
│ → Can see live reactions                                       │
│ → Earns influence points for engagement                        │
│                                                                 │
│ Community members can:                                          │
│ → React with emojis (🔥 💪 🎵)                                 │
│ → Vote on upcoming community songs                             │
│ → Request to be next DJ                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Session Ends                                           │
├─────────────────────────────────────────────────────────────────┤
│ After last DJ song finishes:                                   │
│                                                                 │
│ Notification: "🎧 DJ session ended! Back to community queue"   │
│                                                                 │
│ System actions:                                                 │
│ → Calculate session stats (engagement, reactions)               │
│ → Award influence points to DJ                                 │
│ → Update DJ's stats (successful sessions counter)              │
│ → Start 24-hour cooldown                                       │
│ → Log session for analytics                                    │
│ → Return to normal playlist ranking                            │
│                                                                 │
│ DJ receives summary:                                            │
│ → Total reactions received                                     │
│ → Influence points earned                                      │
│ → Achievement unlocked (if milestone)                          │
└─────────────────────────────────────────────────────────────────┘
```

## UI/UX Screens

### Screen 1: DJ Session Request Button

**Location**: Gym Playlist Screen

```
┌─────────────────────────────────────────────────────────┐
│ Gold's Gym Playlist                        [DJ 🎧]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔴 LIVE • 342 listening                                │
│                                                         │
│ NOW PLAYING                                             │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [Album Art] SICKO MODE                          │   │
│ │             Travis Scott                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🎧 Want to DJ? Take over the playlist!          │   │
│ │                                                  │   │
│ │ Gold+ rank members can request a 1-3 song       │   │
│ │ DJ session. Community votes to approve.         │   │
│ │                                                  │   │
│ │         [Request DJ Session]                    │   │
│ │                                                  │   │
│ │ Cooldown: Ready! ✓                              │   │
│ │ Sessions today: 1/3                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ COMING UP (47 songs)                                   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Song Selection Modal

```
┌─────────────────────────────────────────────────────────┐
│ ← Create DJ Session                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Choose 1-3 songs to play                               │
│                                                         │
│ [1 song] [2 songs] [3 songs ✓]                         │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Song 1                                        [Remove]  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🎵 Search Spotify...                      [🔍]  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ✓ SICKO MODE                                           │
│   Travis Scott • ASTROWORLD • 5:12                     │
│   Energy: 0.83 🔥 • Tempo: 155 BPM                     │
│   [🎧 Preview]                                         │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Song 2                                        [Remove]  │
│ ✓ Can't Hold Us                                        │
│   Macklemore • The Heist • 4:18                        │
│   Energy: 0.91 🔥 • Tempo: 146 BPM                     │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Song 3                                        [Remove]  │
│ ✓ Till I Collapse                                      │
│   Eminem • The Eminem Show • 4:57                      │
│   Energy: 0.84 🔥 • Tempo: 171 BPM                     │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Session Stats:                                          │
│ Total duration: 14:27                                   │
│ Average energy: 0.86 (Perfect! 🔥)                     │
│ Average tempo: 157 BPM                                  │
│                                                         │
│ Message to community (optional)                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Chest day vibes! Let's go! 💪                   │   │
│ └─────────────────────────────────────────────────┘   │
│ 0/100 characters                                        │
│                                                         │
│ [Cancel]                    [Submit Request ($)]       │
│                                                         │
│ Cost: 50 influence points                               │
└─────────────────────────────────────────────────────────┘
```

### Screen 3: Community Voting Banner

```
┌─────────────────────────────────────────────────────────┐
│ 🎧 DJ SESSION VOTE                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ @JohnLifts (Platinum 💎) wants to DJ!                  │
│ "Chest day vibes! Let's go! 💪"                        │
│                                                         │
│ Songs: SICKO MODE, Can't Hold Us, Till I Collapse      │
│ Duration: ~14 min                                       │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │                                                  │   │
│ │   [██████████████████░░░░░░] 67% Approval       │   │
│ │                                                  │   │
│ │   ✓ 45 approve (weighted: 127.5)                │   │
│ │   ✗ 12 reject (weighted: 18.0)                  │   │
│ │                                                  │   │
│ │   Threshold: 60% needed                         │   │
│ │                                                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│            ⏱ 23 seconds remaining                      │
│                                                         │
│     [✅ Approve]            [❌ Reject]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 4: Active DJ Session Display

```
┌─────────────────────────────────────────────────────────┐
│ Gold's Gym Playlist                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🎧 DJ SESSION ACTIVE                                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ DJ: @JohnLifts (Platinum 💎)                    │   │
│ │ Songs: 1/3 played • 9:15 remaining               │   │
│ │                                                  │   │
│ │ 🔥 247 reactions • 👥 342 listening             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ NOW PLAYING (DJ LOCKED)                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [Album Art] Can't Hold Us                       │   │
│ │             Macklemore & Ryan Lewis              │   │
│ │             [████████░░░░] 2:15 / 4:18          │   │
│ │                                                  │   │
│ │             [🔥 Fire] [💪 Pump] [🎵 Vibe]       │   │
│ │              127       89       54               │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ UP NEXT (DJ QUEUE)                                      │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🥇 Till I Collapse                              │   │
│ │    Eminem • 4:57                                │   │
│ │    [DJ LOCKED 🔒]                               │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ COMMUNITY QUEUE (Voting Paused for DJ Songs)           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ #1 Master of Puppets   104▲ 12▼   ▲  ▼         │   │
│ │    Metallica                                     │   │
│ └─────────────────────────────────────────────────┘   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Screen 5: DJ Session Summary

```
┌─────────────────────────────────────────────────────────┐
│ DJ Session Complete! 🎉                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Great session, @JohnLifts!                             │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │                                                  │   │
│ │         🏆 SESSION STATS                        │   │
│ │                                                  │   │
│ │  Duration: 14:27                                │   │
│ │  Reactions: 247 total                           │   │
│ │    🔥 Fire: 127                                 │   │
│ │    💪 Pump: 89                                  │   │
│ │    🎵 Vibe: 54                                  │   │
│ │                                                  │   │
│ │  Listeners: 342 peak                            │   │
│ │  Engagement: 72% (Great!)                       │   │
│ │                                                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🎖 REWARDS                                       │   │
│ │                                                  │   │
│ │ +250 influence points                            │   │
│ │ +50 bonus (high engagement)                      │   │
│ │                                                  │   │
│ │ Achievement unlocked! 🏅                         │   │
│ │ "First DJ Session"                               │   │
│ │                                                  │   │
│ │ Next session available in: 23h 45m               │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│             [Share to Feed]  [Close]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Table: DJSessions

```typescript
interface DJSession {
  sessionId: string;              // PK: "session#uuid"
  gymId: string;                  // GSI-1 PK: For querying gym sessions
  hostUserId: string;             // User who requested
  status: 'pending' | 'voting' | 'approved' | 'active' | 'completed' | 'rejected';

  // Request details
  requestedAt: string;            // ISO timestamp
  message?: string;               // Optional message to community

  // Songs
  songs: DJSessionSong[];         // Array of 1-3 songs

  // Voting
  voteStartedAt?: string;
  voteEndsAt?: string;            // 60 seconds after vote start
  votesFor: number;               // Raw count
  votesAgainst: number;           // Raw count
  weightedVotesFor: number;       // Weighted by rank
  weightedVotesAgainst: number;   // Weighted by rank
  approvalThreshold: number;      // Required % (default: 60)

  // Session execution
  approvedAt?: string;
  startedAt?: string;
  endedAt?: string;
  currentSongIndex: number;       // Which song is playing (0-2)

  // Stats
  peakListeners: number;
  totalReactions: number;
  reactionBreakdown: {
    fire: number;
    pump: number;
    vibe: number;
  };
  engagementRate: number;         // % of listeners who reacted

  // Rewards
  influencePointsAwarded: number;
  achievementsUnlocked: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  ttl?: number;                   // Auto-delete after 30 days
}

interface DJSessionSong {
  position: number;               // 1, 2, or 3
  spotifyUri: string;
  appleMusicId?: string;
  metadata: SongMetadata;
  startedAt?: string;
  endedAt?: string;
  reactions: {
    fire: number;
    pump: number;
    vibe: number;
  };
}
```

**GSIs:**
```
GSI-1: gymId-requestedAt-index
  PK: gymId
  SK: requestedAt (descending)
  Use: Get session history for gym

GSI-2: hostUserId-requestedAt-index
  PK: hostUserId
  SK: requestedAt (descending)
  Use: Get user's session history

GSI-3: status-gymId-index
  PK: status
  SK: gymId
  Use: Find active/pending sessions globally
```

### Table: DJSessionVotes

```typescript
interface DJSessionVote {
  voteId: string;                 // PK: "vote#userId#sessionId"
  sessionId: string;              // GSI-1 PK
  userId: string;
  gymId: string;
  vote: 'approve' | 'reject';
  voterRank: RankTier;            // Rank at time of vote
  voteWeight: number;             // 1.0 - 5.0
  votedAt: string;

  // Optional feedback
  reason?: string;                // Why approved/rejected
}
```

**GSIs:**
```
GSI-1: sessionId-votedAt-index
  PK: sessionId
  SK: votedAt
  Use: Get all votes for a session
```

### Table: DJSessionCooldowns

```typescript
interface DJSessionCooldown {
  cooldownId: string;             // PK: "cooldown#userId#gymId"
  userId: string;                 // GSI-1 PK
  gymId: string;
  lastSessionAt: string;          // When last session ended
  cooldownEndsAt: string;         // 24 hours after lastSessionAt
  sessionsToday: number;          // Counter (resets at midnight)
  lastResetDate: string;          // Track daily reset
  ttl: number;                    // Auto-delete after cooldown
}
```

**GSIs:**
```
GSI-1: userId-gymId-index
  PK: userId
  SK: gymId
  Use: Check user's cooldowns across gyms
```

### Table: DJSessionReactions

```typescript
interface DJSessionReaction {
  reactionId: string;             // PK: "reaction#userId#sessionId#songIndex"
  sessionId: string;              // GSI-1 PK
  userId: string;
  songIndex: number;              // 0, 1, or 2
  reactionType: 'fire' | 'pump' | 'vibe';
  reactedAt: string;
}
```

## Real-Time Logic (WebSocket)

### Architecture

```
User Action → Lambda → DynamoDB → DynamoDB Stream → Broadcast Lambda → WebSocket API → All Connected Clients
```

### Event Types

```typescript
// 1. DJ Session Requested
{
  type: 'dj_session_requested',
  sessionId: 'session#uuid',
  gymId: 'gym#abc',
  host: {
    userId: 'user#123',
    username: 'JohnLifts',
    rank: 'Platinum'
  },
  songs: [...],
  message: 'Chest day vibes!',
  voteEndsAt: '2025-01-22T14:31:00Z'
}

// 2. Vote Cast
{
  type: 'dj_session_vote_cast',
  sessionId: 'session#uuid',
  vote: 'approve',
  currentVotes: {
    approve: 45,
    reject: 12,
    weightedApprove: 127.5,
    weightedReject: 18.0,
    approvalPercentage: 67
  },
  timeRemaining: 23
}

// 3. Session Approved
{
  type: 'dj_session_approved',
  sessionId: 'session#uuid',
  host: {...},
  songs: [...],
  startsAt: '2025-01-22T14:31:00Z',
  estimatedEndAt: '2025-01-22T14:45:27Z'
}

// 4. Session Rejected
{
  type: 'dj_session_rejected',
  sessionId: 'session#uuid',
  finalVotes: {...}
}

// 5. Session Started
{
  type: 'dj_session_started',
  sessionId: 'session#uuid',
  currentSong: {...},
  songsRemaining: 3
}

// 6. Song Changed (within session)
{
  type: 'dj_session_song_changed',
  sessionId: 'session#uuid',
  currentSong: {...},
  songIndex: 1,
  songsRemaining: 2
}

// 7. Reaction Added
{
  type: 'dj_session_reaction',
  sessionId: 'session#uuid',
  songIndex: 1,
  reactionType: 'fire',
  totalReactions: {
    fire: 128,
    pump: 90,
    vibe: 55
  }
}

// 8. Session Ended
{
  type: 'dj_session_ended',
  sessionId: 'session#uuid',
  stats: {
    duration: 867,
    totalReactions: 273,
    peakListeners: 342,
    engagementRate: 72
  },
  rewards: {
    influencePoints: 300
  }
}
```

### WebSocket Broadcast Flow

```typescript
// When vote is cast
async function handleVoteCast(vote: DJSessionVote) {
  // 1. Update vote in DynamoDB
  await saveVote(vote);

  // 2. Update session aggregate counts
  const session = await getSession(vote.sessionId);
  const updatedSession = await updateSessionVotes(session, vote);

  // 3. Get all WebSocket connections for this gym
  const connections = await getGymConnections(vote.gymId);

  // 4. Broadcast to all connected clients
  await broadcastToConnections(connections, {
    type: 'dj_session_vote_cast',
    sessionId: vote.sessionId,
    currentVotes: {
      approve: updatedSession.votesFor,
      reject: updatedSession.votesAgainst,
      weightedApprove: updatedSession.weightedVotesFor,
      weightedReject: updatedSession.weightedVotesAgainst,
      approvalPercentage: calculateApprovalPercentage(updatedSession)
    },
    timeRemaining: calculateTimeRemaining(updatedSession.voteEndsAt)
  });
}
```

## API Routes

### 1. Request DJ Session

```
POST /dj-sessions/request

Headers:
  Authorization: Bearer {token}

Body:
{
  "gymId": "gym#abc",
  "songs": [
    {
      "spotifyUri": "spotify:track:123",
      "appleMusicId": null
    },
    {
      "spotifyUri": "spotify:track:456",
      "appleMusicId": null
    },
    {
      "spotifyUri": "spotify:track:789",
      "appleMusicId": null
    }
  ],
  "message": "Chest day vibes! Let's go! 💪"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "sessionId": "session#uuid",
    "status": "voting",
    "voteEndsAt": "2025-01-22T14:31:00Z",
    "approvalThreshold": 60,
    "costInfluencePoints": 50
  }
}

Errors:
- 403: Insufficient rank (need Gold+)
- 429: Cooldown active
- 409: Active session in progress
- 400: Invalid song count (must be 1-3)
```

### 2. Vote on DJ Session

```
POST /dj-sessions/{sessionId}/vote

Body:
{
  "vote": "approve" | "reject",
  "reason": "Optional feedback"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "voteRecorded": true,
    "currentVotes": {
      "approve": 46,
      "reject": 12,
      "approvalPercentage": 68
    },
    "timeRemaining": 18
  }
}
```

### 3. Get Active DJ Session

```
GET /gyms/{gymId}/dj-session/active

Response: 200 OK
{
  "success": true,
  "data": {
    "sessionId": "session#uuid",
    "status": "active",
    "host": {
      "userId": "user#123",
      "username": "JohnLifts",
      "rank": "Platinum"
    },
    "currentSong": {
      "index": 1,
      "metadata": {...},
      "progress": 145,
      "duration": 258
    },
    "songsRemaining": 2,
    "estimatedEndAt": "2025-01-22T14:45:27Z",
    "stats": {
      "reactions": {...},
      "listeners": 342
    }
  }
}

Response: 404 (No active session)
{
  "success": false,
  "error": "No active DJ session"
}
```

### 4. React to DJ Session

```
POST /dj-sessions/{sessionId}/react

Body:
{
  "songIndex": 1,
  "reactionType": "fire" | "pump" | "vibe"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "reactionRecorded": true,
    "totalReactions": {
      "fire": 129,
      "pump": 90,
      "vibe": 55
    }
  }
}
```

### 5. Get DJ Session History

```
GET /gyms/{gymId}/dj-sessions?limit=20&offset=0

Response: 200 OK
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "session#uuid",
        "host": {...},
        "status": "completed",
        "requestedAt": "2025-01-22T14:30:00Z",
        "songs": [...],
        "stats": {...}
      }
    ],
    "total": 47
  }
}
```

### 6. Check Eligibility

```
GET /dj-sessions/eligibility?gymId={gymId}

Response: 200 OK
{
  "success": true,
  "data": {
    "eligible": true,
    "rank": "Platinum",
    "minimumRank": "Gold",
    "cooldownActive": false,
    "nextAvailableAt": null,
    "sessionsToday": 1,
    "dailyLimit": 3,
    "activeSessionInProgress": false,
    "costInfluencePoints": 50,
    "currentInfluencePoints": 4127
  }
}

Response: 200 OK (Not eligible)
{
  "success": true,
  "data": {
    "eligible": false,
    "reason": "cooldown_active",
    "nextAvailableAt": "2025-01-23T14:30:00Z",
    "hoursRemaining": 23.5
  }
}
```

## Rules & Constraints

### 1. Rank Requirements

```typescript
const DJ_SESSION_REQUIREMENTS = {
  minimumRank: 'Gold',
  // Gold = 1500 influence points
  // Ensures experienced, trusted members
};
```

### 2. Cooldown System

```typescript
const COOLDOWN_RULES = {
  // Per user per gym
  cooldownHours: 24,

  // Daily limit per user per gym
  maxSessionsPerDay: 3,

  // Daily limit per gym (all users combined)
  maxSessionsPerGymPerDay: 20,

  // Grace period after rejection
  rejectionCooldown: 1, // 1 hour instead of 24
};
```

### 3. Voting Rules

```typescript
const VOTING_RULES = {
  // Voting period duration
  votingDurationSeconds: 60,

  // Approval threshold
  approvalThresholdPercentage: 60,

  // Minimum voters required
  minimumVoters: 5,

  // Vote weighting by rank
  voteWeights: {
    Bronze: 1.0,
    Silver: 1.5,
    Gold: 2.0,
    Platinum: 3.0,
    Diamond: 4.0,
    Legend: 5.0
  },

  // Auto-approval if these conditions met
  autoApprovalRules: {
    // If >80% of active users approve
    superMajority: 80,
    // Or if host is Legend and >50% approve
    legendHostThreshold: 50
  }
};
```

### 4. Session Limits

```typescript
const SESSION_LIMITS = {
  // Song count
  minSongs: 1,
  maxSongs: 3,

  // Duration limits
  maxSongDuration: 360, // 6 minutes per song
  maxTotalDuration: 900, // 15 minutes total

  // Cost
  influencePointCost: 50,

  // Queue insertion
  skipCurrentSong: false, // DJ songs go next, not immediate
  lockDJSongs: true, // Can't be voted down during session
};
```

### 5. Anti-Abuse Rules

```typescript
const ANTI_ABUSE = {
  // Rate limiting
  maxRequestsPerHour: 3,

  // Penalty for spam
  spamPenalty: {
    rejectionThreshold: 3, // 3 rejections in a row
    penaltyCooldownHours: 72, // 3-day ban from DJ
    influencePointPenalty: -100
  },

  // Session abandonment
  abandonmentPenalty: {
    // If host leaves gym during session
    influencePointPenalty: -200,
    cooldownExtension: 48 // 2 extra days
  },

  // Low engagement penalty
  lowEngagementThreshold: 20, // < 20% reaction rate
  lowEngagementPenalty: {
    influencePointsReduced: 0.5 // Only 50% of normal reward
  }
};
```

## Algorithms

### Algorithm 1: Session Approval Calculation

```typescript
async function calculateSessionApproval(sessionId: string): Promise<{
  approved: boolean;
  finalPercentage: number;
  reason: string;
}> {
  const session = await getSession(sessionId);
  const votes = await getSessionVotes(sessionId);

  // Check minimum voters
  if (votes.length < VOTING_RULES.minimumVoters) {
    return {
      approved: false,
      finalPercentage: 0,
      reason: 'Insufficient votes (minimum 5 required)'
    };
  }

  // Calculate weighted approval
  let weightedApprove = 0;
  let weightedReject = 0;

  votes.forEach(vote => {
    const weight = VOTING_RULES.voteWeights[vote.voterRank];

    if (vote.vote === 'approve') {
      weightedApprove += weight;
    } else {
      weightedReject += weight;
    }
  });

  const totalWeighted = weightedApprove + weightedReject;
  const approvalPercentage = (weightedApprove / totalWeighted) * 100;

  // Check super majority
  if (approvalPercentage >= VOTING_RULES.autoApprovalRules.superMajority) {
    return {
      approved: true,
      finalPercentage: approvalPercentage,
      reason: 'Super majority approval'
    };
  }

  // Check legend host special rule
  const host = await getUser(session.hostUserId);
  const hostRank = await getUserGymRank(host.userId, session.gymId);

  if (
    hostRank.rank === 'Legend' &&
    approvalPercentage >= VOTING_RULES.autoApprovalRules.legendHostThreshold
  ) {
    return {
      approved: true,
      finalPercentage: approvalPercentage,
      reason: 'Legend host approval'
    };
  }

  // Standard threshold check
  const approved = approvalPercentage >= VOTING_RULES.approvalThresholdPercentage;

  return {
    approved,
    finalPercentage: approvalPercentage,
    reason: approved ? 'Standard approval' : 'Below threshold'
  };
}
```

### Algorithm 2: Collision Handling (Multiple Requests)

```typescript
async function handleDJSessionRequest(
  userId: string,
  gymId: string,
  songs: DJSessionSong[]
): Promise<DJSession> {

  // 1. Acquire distributed lock
  const lockKey = `dj-session-lock:${gymId}`;
  const lock = await acquireLock(lockKey, 30); // 30 second timeout

  if (!lock) {
    throw new Error('Another session is being processed. Try again in a moment.');
  }

  try {
    // 2. Check for active or pending sessions
    const activeSessions = await queryItems(
      Tables.DJSessions,
      'status = :status AND gymId = :gymId',
      {
        ':status': 'voting',
        ':gymId': gymId
      }
    );

    if (activeSessions.length > 0) {
      throw new ConflictError('A session vote is already in progress');
    }

    // 3. Check eligibility (rank, cooldown, limits)
    const eligibility = await checkEligibility(userId, gymId);

    if (!eligibility.eligible) {
      throw new ForbiddenError(eligibility.reason);
    }

    // 4. Deduct influence points
    await deductInfluencePoints(
      userId,
      gymId,
      SESSION_LIMITS.influencePointCost
    );

    // 5. Create session record
    const session: DJSession = {
      sessionId: `session#${uuidv4()}`,
      gymId,
      hostUserId: userId,
      status: 'voting',
      requestedAt: new Date().toISOString(),
      songs,
      voteStartedAt: new Date().toISOString(),
      voteEndsAt: new Date(Date.now() + 60000).toISOString(),
      votesFor: 0,
      votesAgainst: 0,
      weightedVotesFor: 0,
      weightedVotesAgainst: 0,
      approvalThreshold: VOTING_RULES.approvalThresholdPercentage,
      currentSongIndex: 0,
      peakListeners: 0,
      totalReactions: 0,
      reactionBreakdown: { fire: 0, pump: 0, vibe: 0 },
      engagementRate: 0,
      influencePointsAwarded: 0,
      achievementsUnlocked: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await putItem(Tables.DJSessions, session);

    // 6. Schedule vote end check
    await scheduleVoteEndCheck(session.sessionId, 60);

    // 7. Broadcast to gym
    await broadcastDJSessionRequest(session);

    return session;

  } finally {
    // Always release lock
    await releaseLock(lock);
  }
}

// Priority queue if multiple requests at exact same time
function determineRequestPriority(
  request1: DJSessionRequest,
  request2: DJSessionRequest
): DJSessionRequest {
  // Higher rank = higher priority
  if (request1.hostRank !== request2.hostRank) {
    const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
    const rank1Index = rankOrder.indexOf(request1.hostRank);
    const rank2Index = rankOrder.indexOf(request2.hostRank);

    return rank1Index > rank2Index ? request1 : request2;
  }

  // Same rank: Earlier timestamp wins
  return request1.requestedAt < request2.requestedAt ? request1 : request2;
}
```

### Algorithm 3: Influence Points Calculation

```typescript
function calculateDJSessionInfluencePoints(session: DJSession): number {
  const baseReward = 200;

  // 1. Engagement multiplier (20% - 150%)
  const engagementMultiplier = Math.min(
    Math.max(session.engagementRate / 100, 0.2),
    1.5
  );

  // 2. Reaction bonus
  const reactionBonus = Math.min(session.totalReactions * 0.5, 100);

  // 3. Duration completion bonus
  const allSongsPlayed = session.currentSongIndex === session.songs.length - 1;
  const completionBonus = allSongsPlayed ? 50 : 0;

  // 4. Peak audience bonus
  const audienceBonus = Math.min(session.peakListeners * 0.1, 50);

  // 5. Quality penalty for low engagement
  let qualityPenalty = 0;
  if (session.engagementRate < ANTI_ABUSE.lowEngagementThreshold) {
    qualityPenalty = baseReward * 0.5; // Lose 50%
  }

  const totalPoints =
    (baseReward * engagementMultiplier) +
    reactionBonus +
    completionBonus +
    audienceBonus -
    qualityPenalty;

  return Math.round(totalPoints);
}
```

## Integration with Community Playlist

### Queue Management

```typescript
class PlaylistQueueManager {
  async insertDJSession(session: DJSession): Promise<void> {
    // 1. Get current playlist state
    const playlist = await getGymPlaylist(session.gymId);

    // 2. Mark DJ songs as locked
    const djSongs = session.songs.map((song, index) => ({
      ...song,
      isDJLocked: true,
      djSessionId: session.sessionId,
      djPosition: index,
      addedAt: new Date().toISOString(),
      rank: index // Will be 0, 1, 2 (top of queue)
    }));

    // 3. Insert at top of queue (after current playing song)
    await batchInsertSongs(session.gymId, djSongs);

    // 4. Shift down all other songs
    await shiftPlaylistRanks(session.gymId, djSongs.length);

    // 5. Pause normal voting/ranking for DJ songs
    await setDJSessionLock(session.gymId, true);
  }

  async removeDJSessionFromQueue(sessionId: string): Promise<void> {
    // 1. Get session
    const session = await getSession(sessionId);

    // 2. Remove DJ songs
    await removeDJSongs(session.gymId, sessionId);

    // 3. Resume normal playlist ranking
    await setDJSessionLock(session.gymId, false);

    // 4. Recalculate ranks
    await recalculatePlaylistRanks(session.gymId);
  }

  async handleSongTransition(gymId: string): Promise<void> {
    // Check if we're in a DJ session
    const activeSession = await getActiveDJSession(gymId);

    if (activeSession && activeSession.status === 'active') {
      // Move to next DJ song
      activeSession.currentSongIndex++;

      if (activeSession.currentSongIndex >= activeSession.songs.length) {
        // Session complete
        await endDJSession(activeSession);
      } else {
        // Next DJ song
        await updateSession(activeSession);
        await broadcastDJSongChanged(activeSession);
      }
    } else {
      // Normal community playlist behavior
      await playNextCommunityRankedSong(gymId);
    }
  }
}
```

### Voting Behavior During DJ Session

```typescript
// Community can still vote on non-DJ songs
async function voteSongDuringDJSession(
  userId: string,
  songId: string,
  voteType: 1 | -1
): Promise<void> {

  const song = await getSong(songId);

  // Check if this is a DJ-locked song
  if (song.isDJLocked) {
    throw new ForbiddenError(
      'Cannot vote on DJ session songs. Vote ends when session completes.'
    );
  }

  // Normal voting logic for community songs
  await castVote(userId, songId, voteType);

  // Note: Rankings will be recalculated, but DJ songs stay at top
}
```

## Sequence Diagram

```
User        Frontend    API Gateway    Lambda          DynamoDB    WebSocket
 │              │            │            │               │             │
 │──Request DJ──▶            │            │               │             │
 │              │────POST────▶            │               │             │
 │              │            │──invoke───▶                │             │
 │              │            │            │──check eligibility──▶       │
 │              │            │            │◀─eligibility OK─┘           │
 │              │            │            │──create session──▶          │
 │              │            │            │◀───session created          │
 │              │            │            │                             │
 │              │            │            │─────broadcast request──────▶
 │              │◀───200 OK───────────────                              │
 │              │                                                        │
 │              │◀───────WebSocket: session_requested────────────────────
 │◀─Show vote──┘                                                        │
 │                                                                       │
All Users:                                                               │
 │──Vote────────▶                                                       │
 │              │────POST────▶                                          │
 │              │            │──invoke───▶                              │
 │              │            │            │──save vote──▶               │
 │              │            │            │──update aggregates──▶       │
 │              │            │            │                             │
 │              │            │            │────broadcast vote update────▶
 │              │◀───200 OK───────────────                              │
 │◀─Update UI───                                                        │
 │              │◀───WebSocket: vote_cast─────────────────────────────│
 │                                                                       │
After 60s:                                                               │
 │              │            │  [Timer]   │                             │
 │              │            │     │      │                             │
 │              │            │     └──────▶──calculate approval──▶      │
 │              │            │            │◀──approved─────┘            │
 │              │            │            │──update session status───▶  │
 │              │            │            │──insert songs to queue───▶  │
 │              │            │            │                             │
 │              │            │            │─────broadcast approved──────▶
 │              │◀───WebSocket: session_approved──────────────────────│
 │◀─DJ Banner───┘                                                       │
 │                                                                       │
During Session:                                                          │
 │──React──────▶                                                        │
 │              │────POST────▶                                          │
 │              │            │──invoke───▶                              │
 │              │            │            │──save reaction──▶           │
 │              │            │            │                             │
 │              │            │            │─────broadcast reaction──────▶
 │              │◀───WebSocket: session_reaction──────────────────────│
 │◀─Update count┘                                                       │
 │                                                                       │
Session End:                                                             │
 │              │            │            │──calc rewards──▶            │
 │              │            │            │──award points──▶            │
 │              │            │            │──remove DJ songs──▶         │
 │              │            │            │                             │
 │              │            │            │─────broadcast ended─────────▶
 │              │◀───WebSocket: session_ended─────────────────────────│
 │◀─Show summary┘                                                       │
```

## Enhancements

### 1. DJ Badges & Achievements

```typescript
const DJ_ACHIEVEMENTS = {
  'first-spin': {
    name: 'First Spin',
    description: 'Complete your first DJ session',
    rarity: 'common',
    reward: 100
  },
  'crowd-pleaser': {
    name: 'Crowd Pleaser',
    description: 'Achieve 90%+ engagement rate',
    rarity: 'rare',
    reward: 300
  },
  'fire-starter': {
    name: 'Fire Starter',
    description: 'Get 500+ 🔥 reactions in one session',
    rarity: 'epic',
    reward: 500
  },
  'dj-legend': {
    name: 'DJ Legend',
    description: 'Host 50 successful sessions',
    rarity: 'legendary',
    reward: 2000
  },
  'perfect-set': {
    name: 'Perfect Set',
    description: '100% approval, 100% engagement, 500+ reactions',
    rarity: 'legendary',
    reward: 5000
  }
};

// Special badge displayed on profile
interface DJBadge {
  badgeId: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  sessionsHosted: number;
  avgEngagement: number;
  totalReactions: number;
  unlockedAt: string;
}
```

### 2. Weighted Voting (Already implemented via rank)

Your existing rank system automatically provides weighted voting:
- Bronze users: 1.0x vote weight
- Legend users: 5.0x vote weight

### 3. DJ Leaderboard

```typescript
// Weekly DJ stats
GET /dj-sessions/leaderboard?timeframe=week

Response:
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user#123",
      "username": "JohnLifts",
      "sessionsHosted": 12,
      "avgEngagement": 84.5,
      "totalReactions": 3421,
      "approvalRate": 92.3,
      "badges": ["crowd-pleaser", "fire-starter"]
    }
  ]
}
```

### 4. DJ Analytics Dashboard

```typescript
interface DJAnalytics {
  userId: string;
  totalSessions: number;
  approvedSessions: number;
  rejectedSessions: number;
  approvalRate: number;
  avgEngagement: number;
  totalReactions: number;
  favoriteGenres: string[];
  peakTime: string; // Best time of day for approval
  bestGym: string; // Gym with highest approval rate
  influencePointsEarned: number;
}
```

### 5. Scheduled DJ Slots

```typescript
// Future enhancement: Reserve DJ slots
interface ScheduledDJSlot {
  slotId: string;
  gymId: string;
  scheduledFor: string;
  hostUserId: string;
  status: 'reserved' | 'confirmed' | 'cancelled';
  songs: DJSessionSong[];
}
```

This feature is now **fully specified** and ready for implementation! 🎧
