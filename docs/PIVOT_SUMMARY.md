# App Pivot Summary: Live Playlist → Competitive Rankings

## 🎯 Core Change

**FROM**: Real-time playlist where songs play live and voting affects queue order
**TO**: Competitive song ranking system where songs and users level up through tiers

---

## What Changed

### Old System ❌
- **Main Feature**: Live playback queue
- **Voting Purpose**: Determine play order
- **User Progression**: Influence points for participation
- **Focus**: "What's playing now"
- **Experience**: Passive listening + voting

### New System ✅
- **Main Feature**: Static/dynamic ranked song collection
- **Voting Purpose**: Level up songs through tiers (Bronze → Platinum)
- **User Progression**: Gain influence when YOUR songs get upvoted
- **Focus**: Building the ultimate curated playlist
- **Experience**: Active curation + competitive ranking

---

## Tier Systems

### Song Tiers

| Tier | Net Votes | Badge | Label | Color |
|------|-----------|-------|-------|-------|
| **Bronze** | 0-9 | 🥉 | Rising | #CD7F32 |
| **Silver** | 10-24 | 🥈 | Approved | #C0C0C0 |
| **Gold** | 25-49 | 🥇 | Hall of Fame | #FFD700 |
| **Platinum** | 50+ | 💎 | Legendary | #E5E4E2 |

### User Ranks

| Rank | Influence Points | Badge | Vote Weight | Songs/Week |
|------|-----------------|-------|-------------|------------|
| **Bronze** | 0-499 | 🥉 | 1.0x | 5 |
| **Silver** | 500-1499 | 🥈 | 2.0x | 10 |
| **Gold** | 1500-4999 | 🥇 | 3.0x | 20 |
| **Platinum** | 5000+ | 💎 | 4.0x | Unlimited |

---

## How Users Gain Influence

**Key Mechanic**: Users gain influence when OTHER people upvote THEIR songs.

```typescript
influenceGained = voterRank.weight * songTier.multiplier

// Example:
// Gold user (3.0x weight) upvotes your Silver song (2x multiplier)
// You gain: 3.0 * 2 = 6 influence points
```

### Tier Multipliers
- Bronze song: 1x
- Silver song: 2x
- Gold song: 3x
- Platinum song: 5x

### Bonus Points
- Song reaches Silver: +50 points
- Song reaches Gold: +100 points
- Song reaches Platinum: +250 points
- Song gets 100 total upvotes: +100 points

---

## Updated Database Schema

### Songs Table

```typescript
interface Song {
  // Core
  songId: string;
  gymId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt: string;
  addedBy: string;
  addedAt: string;

  // NEW: Tier System
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  netVotes: number;           // upvotes - downvotes
  upvotes: number;
  downvotes: number;
  rankInTier: number;         // Position within tier
  rankOverall: number;        // Position in entire gym

  // Historical
  tierHistory?: TierChange[];
  voteHistory?: VoteSnapshot[];

  // Optional: Live mode
  isCurrentlyPlaying?: boolean;
  playCount?: number;
}
```

### UserGymRanks Table

```typescript
interface UserGymRank {
  userId: string;
  gymId: string;

  // NEW: Simplified Rank
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  influencePoints: number;

  // NEW: Contribution Tracking
  songsAdded: number;
  goldSongs: number;          // Count of songs that reached Gold
  silverSongs: number;
  platinumSongs: number;
  totalUpvotesReceived: number;

  // NEW: Weekly Limits
  songsAddedThisWeek: number;
  weekResetAt: string;

  // Stats
  votesCast: number;
  joinedAt: string;
  lastActiveAt: string;
}
```

---

## Updated API Endpoints

### Get Ranked Playlist

```
GET /gyms/{gymId}/playlist/ranked

Query params:
  tier: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum'
  sort: 'rank' | 'votes' | 'recent'
  offset: number
  limit: number

Response:
{
  songs: [
    {
      songId: "123",
      title: "Eye of the Tiger",
      tier: "gold",
      netVotes: 42,
      rankInTier: 1,
      rankOverall: 1,
      addedBy: {
        displayName: "Mike",
        rank: "gold"
      },
      userVote: 1
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

Body: { voteType: 1 | -1 | 0 }

Response:
{
  song: {
    netVotes: 43,
    tier: "gold",
    tierChanged: false
  },
  user: {
    influenceGained: 3,
    newInfluencePoints: 1523,
    rankChanged: false
  },
  songOwner: {
    influenceGained: 3,      // Song owner gains points!
    newInfluencePoints: 2150
  }
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
    silverSongs: 8
  },

  limits: {
    songsPerWeek: 20,
    songsAddedThisWeek: 5,
    weekResetAt: "2025-01-28T00:00:00Z"
  }
}
```

---

## Updated Types (TypeScript)

### New Exports from `shared/src/types/song.ts`

```typescript
export type SongTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum';

export const SONG_TIER_THRESHOLDS = {
  platinum: 50,
  gold: 25,
  silver: 10,
  bronze: 0,
};

export const TIER_MULTIPLIERS = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 5,
};

export const VOTE_WEIGHTS = {
  bronze: 1.0,
  silver: 2.0,
  gold: 3.0,
  platinum: 4.0,
};

export const TIER_INFO: Record<SongTier, TierInfo> = {
  bronze: {
    color: '#CD7F32',
    gradient: ['#CD7F32', '#A0522D'],
    badge: '🥉',
    label: 'Rising',
    minVotes: 0,
    maxVotes: 9,
  },
  // ... silver, gold, platinum
};

// Helper functions
export function calculateSongTier(netVotes: number): SongTier;
export function getVotesNeededForNextTier(currentNetVotes: number, currentTier: SongTier): number;
```

### New Exports from `shared/src/types/rank.ts`

```typescript
export const RANK_INFO: Record<UserRank, RankInfo> = {
  bronze: {
    minPoints: 0,
    maxPoints: 499,
    voteWeight: 1.0,
    songsPerWeek: 5,
    badge: '🥉',
  },
  // ... silver, gold, platinum
};

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_song: { name: 'First Song', icon: '🎵', ... },
  golden_touch: { name: 'Golden Touch', icon: '🥇', ... },
  // ... more achievements
};

// Helper functions
export function calculateUserRank(influencePoints: number): UserRank;
export function calculateInfluenceGain(voterRank: UserRank, songTier: SongTier, voteType: 1 | -1): number;
export function getProgressToNextRank(currentPoints: number, currentRank: UserRank): number;
```

---

## User Experience Flows

### Flow 1: New User Adds Song

1. User opens app → Sees ranked playlist (Gold/Silver/Bronze tabs)
2. User taps "Add Song" FAB
3. Search Spotify → Select "SICKO MODE"
4. Song added at Bronze tier (0 votes)
5. Toast: "Your song needs 10 upvotes to reach Silver!"
6. Song appears in "Bronze" tab, ranked by time
7. User can share to get votes

### Flow 2: Song Levels Up

1. User browses Bronze tier
2. Sees "SICKO MODE" (9 votes, almost Silver!)
3. User upvotes (vote weight 2.0x as Silver user)
4. Song net votes: 9 → 11
5. **Tier change: Bronze → Silver!** 🥈
6. Confetti animation
7. Song owner gains +50 bonus points
8. Voter gains small influence for participating
9. Song moves to Silver tier tab

### Flow 3: User Ranks Up

1. Sarah has 1490 influence points (Silver)
2. Her song "Eye of the Tiger" gets upvoted by Gold user (3.0x)
3. Song is Gold tier (3x multiplier)
4. Sarah gains: 3.0 * 3 = 9 points
5. New total: 1499 points
6. One more upvote pushes her to 1508
7. **Rank up: Silver → Gold!** 🥇
8. Level-up animation
9. New benefits:
   - Vote weight: 2.0x → 3.0x
   - Songs/week: 10 → 20
   - Can nominate for Platinum

---

## Live Playback (Optional Sub-Feature)

The old "live playlist" becomes an **optional mode**:

```
Toggle: "Live Mode" ON/OFF

When ON:
- Plays songs from ranked collection
- Play order: Gold tier → Silver → Bronze
- Within tier: Ranked by net votes
- Can vote during playback
- Votes update rankings in real-time
```

This preserves the original functionality while making rankings primary.

---

## Frontend UI Changes

### Old HomeScreen
- List of nearby gyms
- Tap gym → See live playlist
- Now playing hero card

### New HomeScreen
- List of nearby gyms
- Tap gym → See RANKED COLLECTION
- Tier tabs (🥇 Gold | 🥈 Silver | 🥉 Bronze)

### Old GymScreen
```
NOW PLAYING [Hero Card]
───────────────────────
QUEUE
#2 Song [votes]
#3 Song [votes]
```

### New GymScreen
```
[TABS: 🥇 GOLD | 🥈 SILVER | 🥉 BRONZE | 🔥 RISING]
───────────────────────
🥇 GOLD TIER (Hall of Fame)
#1  Eye of the Tiger  🥇 +42 [↑↓]
#2  Till I Collapse   🥇 +38 [↑↓]

───────────────────────
🥈 SILVER TIER (Approved)
#3  SICKO MODE         🥈 +18 [↑↓]
#4  Thunderstruck      🥈 +15 [↑↓]
```

---

## Migration Plan

### Phase 1: Type System (Completed ✅)
- [x] Update `shared/src/types/song.ts` with tier types
- [x] Update `shared/src/types/rank.ts` with user ranks
- [x] Add helper functions for tier/rank calculations
- [x] Add TIER_INFO and RANK_INFO constants

### Phase 2: Backend Updates
- [ ] Update DynamoDB table schemas
- [ ] Implement tier calculation logic
- [ ] Update voting endpoint to award influence
- [ ] Add ranked playlist endpoint
- [ ] Add user stats endpoint
- [ ] Implement weekly limit tracking

### Phase 3: Frontend Components
- [ ] Create TierBadge component
- [ ] Create TierProgressBar component
- [ ] Update SongCard with tier display
- [ ] Create RankBadge component for users
- [ ] Add tier-up/rank-up animations

### Phase 4: Screen Redesign
- [ ] Add tier tabs to GymScreen
- [ ] Update song list to show tier groupings
- [ ] Add user profile with influence/rank
- [ ] Create leaderboard screen
- [ ] Add achievements view

### Phase 5: Polish
- [ ] Tier-up confetti animation
- [ ] Rank-up celebration modal
- [ ] Weekly limit warnings
- [ ] Tier progress indicators
- [ ] Achievement notifications

---

## Key Benefits of Pivot

### For Users
1. **Direct Investment**: Your contributions directly affect your rank
2. **Clear Goals**: Visual progress toward next tier/rank
3. **Recognition**: High-tier songs = status
4. **Competition**: Leaderboards and achievements
5. **Quality Control**: Community filters bad songs naturally

### For Gyms
1. **Curated Playlist**: Best songs naturally rise
2. **Engaged Community**: Users invested in building collection
3. **Less Moderation**: Tier system auto-filters
4. **Retention**: Progression systems keep users coming back
5. **Viral Potential**: Users share to get votes

### For Product
1. **Simpler Backend**: No live sync complexity
2. **Better Metrics**: Track tier distribution
3. **Monetization**: Premium users get more song adds
4. **Scalable**: Rankings calculated async
5. **Flexible**: Can add live mode later

---

## Breaking Changes

### API Changes
- ❌ Removed: `currentSong` from playlist response (unless live mode)
- ❌ Removed: `isCurrentlyPlaying` as required field
- ✅ Added: `tier`, `netVotes`, `rankInTier` to songs
- ✅ Added: `influencePoints`, `goldSongs`, `silverSongs` to users
- ✅ Changed: Vote response now includes influence calculations

### Type Changes
- ❌ `RankTier` (old): `'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Legend'`
- ✅ `UserRank` (new): `'bronze' | 'silver' | 'gold' | 'platinum'`
- ✅ `SongTier` (new): `'bronze' | 'silver' | 'gold' | 'platinum'`

### Database Schema Changes
- Songs table: Add `tier`, `netVotes`, `rankInTier`, `rankOverall`
- UserGymRanks table: Add `goldSongs`, `silverSongs`, `songsAddedThisWeek`, `weekResetAt`
- New table: SongTierHistory (optional, for analytics)

---

## Documentation

### Completed ✅
- [NEW_CONCEPT.md](./NEW_CONCEPT.md) - Complete new concept design
- [PIVOT_SUMMARY.md](./PIVOT_SUMMARY.md) - This document
- Updated `shared/src/types/song.ts` - Song tiers and helper functions
- Updated `shared/src/types/rank.ts` - User ranks and influence calculations

### TODO
- [ ] Update API_REFERENCE.md with new endpoints
- [ ] Update ARCHITECTURE.md with tier system
- [ ] Create TIER_SYSTEM.md deep dive
- [ ] Update README.md with new focus
- [ ] Create migration guide for existing data

---

## Next Steps

1. **Review & Approve** - Confirm this pivot aligns with vision
2. **Backend Implementation** - Update Lambda functions and DynamoDB
3. **Frontend Components** - Build tier badges and progress bars
4. **Screen Redesign** - Implement new GymScreen with tabs
5. **Testing** - Verify tier calculations and influence awards
6. **Migration** - Convert existing data (if any) to new schema
7. **Launch** - Roll out new ranking system

---

## Questions to Resolve

1. **Live Mode**: Keep as optional toggle or remove completely?
   - Recommendation: Keep as optional for gyms that want it

2. **Tier Thresholds**: Are current vote counts good?
   - Bronze: 0-9 votes
   - Silver: 10-24 votes
   - Gold: 25-49 votes
   - Platinum: 50+ votes

3. **User Ranks**: Simplify to 4 tiers or keep 6?
   - Current: Bronze, Silver, Gold, Platinum (4 tiers)
   - Could add: Diamond, Legend (6 tiers)
   - Recommendation: Start with 4, add more later if needed

4. **Weekly Limits**: Should they reset on specific day or rolling 7 days?
   - Current: Weekly reset (e.g., Monday 00:00)
   - Alternative: Rolling 7-day window
   - Recommendation: Weekly reset (simpler to understand)

5. **Downvote Impact**: Should downvotes reduce song owner's influence?
   - Current: No (only upvotes grant influence)
   - Alternative: Downvotes subtract influence
   - Recommendation: Keep current (encourages voting without punishment)

---

**Status**: ✅ Core Concept Designed, Types Updated, Ready for Implementation
**Last Updated**: 2025-01-22
**Next Milestone**: Backend Lambda Functions
