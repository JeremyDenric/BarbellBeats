# Gym Music Rankings - New Core Concept

## Overview

**Gym Music Rankings** is a competitive music curation platform where gym members vote on songs to build the ultimate workout playlist. Both **songs** and **users** progress through tier systems (Bronze → Silver → Gold) based on community votes.

---

## Core Concept Shift

### Old Focus (Live Playlist)
- Main feature: Real-time playlist that plays songs live
- Voting affects queue order
- Focused on "what's playing now"

### New Focus (Ranked Collection)
❌ **Removed as primary feature**

✅ **New Primary Feature: Competitive Song Rankings**
- Main feature: Static/dynamic collection of ranked songs
- Songs earn tiers (Bronze/Silver/Gold) through upvotes
- Users level up as their songs get upvoted
- Gym builds a curated "Hall of Fame" playlist
- Live playback becomes optional sub-feature

---

## How It Works

### Song Lifecycle

```
1. User adds song to gym
   ↓
2. Song starts at Bronze tier
   ↓
3. Community votes (↑/↓)
   ↓
4. Song accumulates net votes
   ↓
5. Song advances through tiers:
   - Bronze (0-9 net votes)
   - Silver (10-24 net votes)
   - Gold (25+ net votes)
   ↓
6. High-tier songs = gym's signature playlist
```

### User Progression

```
1. User joins gym
   ↓
2. User starts at Bronze rank
   ↓
3. User adds songs
   ↓
4. Songs get upvoted by community
   ↓
5. User earns influence points
   ↓
6. User levels up:
   - Bronze (0-499 points)
   - Silver (500-1499 points)
   - Gold (1500+ points)
   ↓
7. Higher rank = more voting weight
```

---

## Tier System

### Song Tiers

**Bronze Tier** (0-9 net votes)
- Just added or community unsure
- Color: `#CD7F32` (Bronze)
- Badge: 🥉
- Status: "Rising"

**Silver Tier** (10-24 net votes)
- Community approved
- Color: `#C0C0C0` (Silver)
- Badge: 🥈
- Status: "Approved"

**Gold Tier** (25+ net votes)
- Hall of Fame - gym classics
- Color: `#FFD700` (Gold)
- Badge: 🥇
- Status: "Hall of Fame"

**Special: Platinum Tier** (50+ net votes)
- Legendary gym anthems
- Color: `#E5E4E2` (Platinum)
- Badge: 💎
- Status: "Legendary"

### User Ranks

**Bronze** (0-499 influence points)
- New contributors
- Vote weight: 1.0x
- Can add: 5 songs/week

**Silver** (500-1499 influence points)
- Trusted curators
- Vote weight: 2.0x
- Can add: 10 songs/week

**Gold** (1500-4999 influence points)
- Elite taste-makers
- Vote weight: 3.0x
- Can add: 20 songs/week
- Can nominate for Platinum

**Platinum** (5000+ influence points)
- Legendary DJs
- Vote weight: 4.0x
- Can add: Unlimited
- Can create special playlists

---

## Influence Points Calculation

Users earn influence when their songs get upvoted:

```typescript
// When someone upvotes your song
influenceGained = voterRank.weight * songTier.multiplier

// Tier multipliers
Bronze song: 1x
Silver song: 2x
Gold song: 3x
Platinum song: 5x

// Example
Silver user (2.0x weight) upvotes your Gold song (3x multiplier)
= 2.0 * 3 = 6 influence points
```

**Bonus Points**:
- Song reaches Silver tier: +50 points
- Song reaches Gold tier: +100 points
- Song reaches Platinum tier: +250 points
- Song gets 100 total upvotes: +100 points
- Song gets featured: +200 points

---

## Main Screen: Ranked Playlist Browser

### Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Gym Music Rankings                                    ┃
┃ 🏋️ Gold's Gym Venice                                 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ [Tabs]                                                 ┃
┃ 🥇 GOLD  |  🥈 SILVER  |  🥉 BRONZE  |  🔥 RISING    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃ 🥇 GOLD TIER (Hall of Fame)                           ┃
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                        ┃
┃  #1  [Album]  Eye of the Tiger        🥇 Gold   +42  ┃
┃              Survivor                  by Mike   [↑↓] ┃
┃                                                        ┃
┃  #2  [Album]  Till I Collapse         🥇 Gold   +38  ┃
┃              Eminem                    by Sarah  [↑↓] ┃
┃                                                        ┃
┃  #3  [Album]  Lose Yourself           🥇 Gold   +35  ┃
┃              Eminem                    by John   [↑↓] ┃
┃                                                        ┃
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                        ┃
┃ 🥈 SILVER TIER (Community Approved)                   ┃
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                        ┃
┃  #4  [Album]  SICKO MODE              🥈 Silver +18  ┃
┃  #5  [Album]  Thunderstruck           🥈 Silver +15  ┃
┃  ...                                                   ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Features

1. **Tier Tabs** - Browse by tier (Gold/Silver/Bronze/Rising)
2. **Ranked List** - Position based on net votes within tier
3. **Tier Badges** - Visual medals (🥇🥈🥉💎)
4. **Vote Power** - Your vote weight shown
5. **Add Song** - Contribute to collection
6. **Profile** - View your rank and influence

---

## Sub-Feature: Live Playback Mode

**Optional feature** for gyms that want it:

### Live Mode Toggle
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🎵 LIVE MODE                                   [STOP] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃  NOW PLAYING                                           ┃
┃  🥇 Eye of the Tiger - Survivor                       ┃
┃  ████████████████░░░░░░░░  2:34 / 4:05                ┃
┃                                                        ┃
┃  UP NEXT (Gold tier songs)                             ┃
┃  #2  Till I Collapse - Eminem                         ┃
┃  #3  Lose Yourself - Eminem                           ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

- Plays songs in tier order (Gold → Silver → Bronze)
- Position within tier determines play order
- Can skip/pause (requires higher rank)
- Vote during playback to adjust rankings

---

## Database Schema Updates

### Songs Table (Enhanced)

```typescript
interface Song {
  // Existing fields
  songId: string;
  gymId: string;
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;

  // NEW: Tier system
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  netVotes: number;           // upvotes - downvotes
  upvotes: number;
  downvotes: number;

  // NEW: Rankings
  rankInTier: number;         // Position within tier
  rankOverall: number;        // Position in gym

  // Existing
  addedBy: string;            // userId
  addedAt: string;

  // NEW: Stats
  totalVotes: number;         // Total votes received
  voteHistory: VoteSnapshot[]; // Historical tracking

  // Live mode (optional)
  playCount?: number;
  lastPlayedAt?: string;
  isCurrentlyPlaying?: boolean;
}

interface VoteSnapshot {
  date: string;
  netVotes: number;
  tier: string;
}
```

### UserGymRanks Table (Enhanced)

```typescript
interface UserGymRank {
  userId: string;
  gymId: string;

  // NEW: Tier rank system
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  influencePoints: number;

  // NEW: Contribution stats
  songsAdded: number;
  goldSongs: number;          // Songs that reached Gold
  silverSongs: number;
  totalUpvotesReceived: number;
  totalDownvotesReceived: number;

  // Existing
  votesCast: number;
  joinedAt: string;
  lastActiveAt: string;

  // NEW: Weekly limits
  songsAddedThisWeek: number;
  weekResetAt: string;
}
```

### New: SongTierHistory Table

```typescript
interface SongTierHistory {
  historyId: string;
  songId: string;
  gymId: string;

  previousTier: string;
  newTier: string;
  netVotesAtChange: number;

  triggeredAt: string;
  triggeredBy?: string;       // userId of voter who pushed it over
}
```

---

## Ranking Algorithm

### Song Tier Calculation

```typescript
function calculateSongTier(netVotes: number): SongTier {
  if (netVotes >= 50) return 'platinum';
  if (netVotes >= 25) return 'gold';
  if (netVotes >= 10) return 'silver';
  return 'bronze';
}

function calculateSongRank(song: Song, allSongs: Song[]): number {
  // Sort by tier first, then by net votes within tier
  const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

  const sorted = allSongs.sort((a, b) => {
    // First: tier priority
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;

    // Second: net votes within tier
    const voteDiff = b.netVotes - a.netVotes;
    if (voteDiff !== 0) return voteDiff;

    // Third: recency (newer songs ranked higher if tied)
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  return sorted.findIndex(s => s.songId === song.songId) + 1;
}
```

### User Rank Calculation

```typescript
function calculateUserRank(influencePoints: number): UserRank {
  if (influencePoints >= 5000) return 'platinum';
  if (influencePoints >= 1500) return 'gold';
  if (influencePoints >= 500) return 'silver';
  return 'bronze';
}

function calculateInfluenceGain(
  voterRank: UserRank,
  songTier: SongTier,
  voteType: 1 | -1
): number {
  const voteWeights = {
    bronze: 1.0,
    silver: 2.0,
    gold: 3.0,
    platinum: 4.0,
  };

  const tierMultipliers = {
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 5,
  };

  const basePoints = voteWeights[voterRank] * tierMultipliers[songTier];

  // Only gain points from upvotes
  return voteType === 1 ? basePoints : 0;
}
```

---

## API Endpoints (Updated)

### Get Ranked Playlist

```
GET /gyms/{gymId}/playlist/ranked

Query params:
  - tier: 'all' | 'platinum' | 'gold' | 'silver' | 'bronze'
  - sort: 'rank' | 'votes' | 'recent'
  - offset: number
  - limit: number

Response:
{
  songs: [
    {
      songId: "123",
      title: "Eye of the Tiger",
      artist: "Survivor",
      tier: "gold",
      netVotes: 42,
      rankInTier: 1,
      rankOverall: 1,
      addedBy: {
        userId: "456",
        displayName: "Mike",
        rank: "gold"
      },
      userVote: 1  // Current user's vote
    }
  ],
  stats: {
    totalSongs: 150,
    goldTier: 15,
    silverTier: 45,
    bronzeTier: 90
  }
}
```

### Vote on Song

```
POST /gyms/{gymId}/songs/{songId}/vote

Body:
{
  voteType: 1 | -1 | 0
}

Response:
{
  song: {
    netVotes: 43,
    tier: "gold",
    rankInTier: 1,
    tierChanged: false
  },
  user: {
    influenceGained: 3,
    newInfluencePoints: 1523,
    rankChanged: false,
    newRank: "gold"
  },
  songOwner: {
    influenceGained: 3,  // Song owner gains points
    newInfluencePoints: 2150
  }
}
```

### Add Song

```
POST /gyms/{gymId}/songs

Body:
{
  spotifyId: "3eR23..."
  title: "SICKO MODE",
  artist: "Travis Scott",
  albumArt: "https://...",
}

Response:
{
  songId: "789",
  tier: "bronze",
  netVotes: 0,
  addedBy: userId,
  songsRemainingThisWeek: 4  // Based on user rank
}
```

### Get User Stats

```
GET /gyms/{gymId}/users/{userId}/stats

Response:
{
  rank: "gold",
  influencePoints: 1523,
  nextRankAt: 5000,

  contributions: {
    songsAdded: 25,
    goldSongs: 3,
    silverSongs: 8,
    bronzeSongs: 14
  },

  voting: {
    upvotesCast: 156,
    downvotesCast: 23,
    voteWeight: 3.0
  },

  recognition: {
    totalUpvotesReceived: 287,
    averageVotesPerSong: 11.5
  },

  limits: {
    songsPerWeek: 20,
    songsAddedThisWeek: 5,
    weekResetAt: "2025-01-28T00:00:00Z"
  }
}
```

### Get Tier Leaderboard

```
GET /gyms/{gymId}/leaderboard

Query params:
  - type: 'users' | 'songs'
  - period: 'all-time' | 'month' | 'week'

Response:
{
  users: [
    {
      userId: "456",
      displayName: "Mike",
      rank: "platinum",
      influencePoints: 6234,
      goldSongs: 12,
      position: 1
    },
    ...
  ]
}
```

---

## User Experience Flows

### Flow 1: New User Adds First Song

1. User opens app → Sees ranked playlist
2. User taps "Add Song" (FAB button)
3. Search Spotify → Select song
4. Song added at Bronze tier (0 votes)
5. Song appears in "Rising" tab
6. Toast: "Your song needs 10 upvotes to reach Silver!"
7. User shares song link to get votes

### Flow 2: Community Votes on Song

1. User browses Bronze tier
2. User sees "SICKO MODE" (8 votes)
3. User upvotes (vote weight 2.0x)
4. Song net votes: 8 → 10
5. **Song tier changes: Bronze → Silver!** 🥈
6. Confetti animation
7. Song owner (Travis) gains +50 bonus points
8. Song moves to Silver tier tab
9. Voter gains small influence for participating

### Flow 3: User Ranks Up

1. Sarah has 1480 influence points (Silver)
2. Her song gets upvoted by Gold user (3.0x weight)
3. Song is Silver tier (2x multiplier)
4. Influence gained: 3.0 * 2 = 6 points
5. New total: 1480 + 6 = 1486
6. ...more votes over time
7. Reaches 1500 influence points
8. **Rank up: Silver → Gold!** 🥇
9. Level-up animation
10. New benefits unlocked:
    - Vote weight: 2.0x → 3.0x
    - Songs/week: 10 → 20
    - Can nominate for Platinum

### Flow 4: Song Reaches Hall of Fame

1. "Eye of the Tiger" has 24 votes (Silver, rank #1)
2. Multiple Gold/Platinum users upvote
3. Net votes reach 25
4. **Tier upgrade: Silver → Gold!** 🥇
5. Song enters "Hall of Fame"
6. Song owner gains +100 bonus points
7. Gym gets achievement: "First Gold Song"
8. Song pinned at top of Gold tier

---

## Gamification Elements

### Achievements

**Song Achievements**:
- "First Song" - Add your first song
- "Silver Standard" - Get a song to Silver
- "Golden Touch" - Get a song to Gold
- "Platinum Producer" - Get a song to Platinum
- "Perfect 10" - Song with 50+ upvotes, 0 downvotes
- "Trendsetter" - 5 Gold songs
- "Legend" - 10 Gold songs

**User Achievements**:
- "Curator" - Add 10 songs
- "Influencer" - Reach 500 influence
- "Taste-Maker" - Reach Gold rank
- "DJ Elite" - Reach Platinum rank
- "Community Hero" - Cast 100 votes
- "Generous" - Give 50 upvotes

### Streaks

- Daily voting streak (vote at least once per day)
- Consistency bonus (add songs regularly)
- Engagement multiplier (active participation = bonus points)

### Gym-Wide Stats

- Hall of Fame size (total Gold+ songs)
- Most influential curator
- Most upvoted song all-time
- Fastest rise (Bronze → Gold)
- Current "rising star" song

---

## Visual Design Updates

### Tier Color System

```typescript
tiers: {
  bronze: {
    color: '#CD7F32',
    gradient: ['#CD7F32', '#A0522D'],
    badge: '🥉',
    glow: 'rgba(205, 127, 50, 0.3)'
  },
  silver: {
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    badge: '🥈',
    glow: 'rgba(192, 192, 192, 0.3)'
  },
  gold: {
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
    badge: '🥇',
    glow: 'rgba(255, 215, 0, 0.5)'
  },
  platinum: {
    color: '#E5E4E2',
    gradient: ['#E5E4E2', '#B9F2FF'],
    badge: '💎',
    glow: 'rgba(185, 242, 255, 0.5)'
  }
}
```

### Song Card (Updated)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [Tier Color Top Border]                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃  #1    [Album]   Eye of the Tiger       🥇 Gold +42  ┃
┃  🥇             Survivor                              ┃
┃                  Added by Mike (Gold)         [↑][↓] ┃
┃                                                        ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━  Progress to Platinum   ┃
┃  ████████████████░░░░░░░░  42/50 votes               ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    Tier    Album    Info        Badge    Votes  Vote
    Badge   Art                  Tier     Count  Actions
```

### User Profile Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  [Avatar]   Mike                           🥇 GOLD   ┃
┃             Gold's Gym Venice                         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃  Influence Points: 1,523                              ┃
┃  ████████████████░░░░░  1523/5000 to Platinum        ┃
┃                                                        ┃
┃  📊 Stats                                             ┃
┃  ├─ 25 songs added                                    ┃
┃  ├─ 3 🥇 Gold songs                                   ┃
┃  ├─ 8 🥈 Silver songs                                 ┃
┃  └─ 287 upvotes received                              ┃
┃                                                        ┃
┃  🏆 Achievements (8/20)                               ┃
┃  🥇 Golden Touch    🎯 Trendsetter    ⚡ Influencer   ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Migration Strategy

### Phase 1: Core Rankings (Week 1-2)
1. Update database schema
2. Implement tier calculation logic
3. Update voting endpoints
4. Add influence point system
5. Create ranked playlist view

### Phase 2: UI Updates (Week 3)
1. Redesign main screen with tier tabs
2. Update song cards with tier badges
3. Add tier progress bars
4. Create user profile with stats
5. Add tier-up animations

### Phase 3: Gamification (Week 4)
1. Implement achievements system
2. Add leaderboards
3. Create streaks tracking
4. Add tier change notifications
5. Implement weekly limits

### Phase 4: Polish (Week 5)
1. Add confetti/animations for tier changes
2. Implement gym-wide stats dashboard
3. Add social sharing for achievements
4. Create onboarding for new users
5. Performance optimization

### Phase 5: Live Mode (Optional, Week 6+)
1. Add live playback toggle
2. Implement play queue from rankings
3. Add playback controls
4. Create now playing view
5. Real-time sync

---

## Success Metrics

**Engagement**:
- Average votes per user per day: Target 5+
- Songs added per day: Target 10+ per gym
- Daily active voters: Target 60%+ of members

**Quality**:
- Average tier distribution: 60% Bronze, 30% Silver, 10% Gold
- Song churn rate: <20% stay at 0 votes
- User retention: 70%+ return within 7 days

**Growth**:
- Gold songs per gym per month: Target 3+
- Platinum users per gym: Target 2+
- New song discovery: 50+ unique songs per gym per month

---

## Competitive Advantages

1. **Meritocracy** - Best songs rise naturally through voting
2. **User Investment** - Your contributions directly affect your rank
3. **Quality Control** - Tier system filters low-quality submissions
4. **Clear Progression** - Visual feedback on song/user growth
5. **Community Building** - Shared goal of building ultimate playlist
6. **Gamification** - Achievements and leaderboards drive engagement

---

**Status**: ✅ New Core Concept Defined
**Next Step**: Implement database schema updates and ranking algorithms
