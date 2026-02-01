import { RateLimitError, NotFoundError, ForbiddenError } from "../types";
import { generateRandomToken } from "../utils/crypto";

export type Role = "user" | "admin";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GymRecord {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  memberCount: number;
}

export interface SongRecord {
  id: string;
  title: string;
  artist: string;
  uri: string;
  addedBy: string;
  addedAt: string;
  voteScore: number;
  isPlaying: boolean;
  isAutoSeed: boolean;
  duplicateCount?: number;
}

export interface ReactionRecord {
  id: string;
  songId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface CommentRecord {
  id: string;
  songId: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface VibeMomentRecord {
  id: string;
  gymId: string;
  userId: string;
  title: string;
  note?: string;
  songSnapshot?: {
    title: string;
    artist: string;
    uri: string;
  };
  createdAt: string;
  context?: string;
}

export interface PrRecord {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  source: "manual" | "apple-health";
  createdAt: string;
}

export interface SetlistRecord {
  id: string;
  userId: string;
  name: string;
  tracks: Array<{
    title: string;
    artist: string;
    uri: string;
  }>;
  createdAt: string;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  title: string;
  artist: string;
  uri: string;
  createdAt: string;
}

export interface SpotifyNowPlaying {
  gymId: string;
  track: {
    title: string;
    artist: string;
    uri: string;
  };
  deviceName?: string;
  syncedAt: string;
}

export interface PasswordResetRecord {
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
}

export interface VoteEvent {
  gymId: string;
  songId: string;
  userId: string;
  createdAt: string;
}

const gyms: GymRecord[] = [
  {
    id: "gym-1",
    name: "Iron Temple",
    city: "Los Angeles",
    address: "1101 Sunset Blvd",
    latitude: 34.0928,
    longitude: -118.3287,
    memberCount: 238,
  },
  {
    id: "gym-2",
    name: "Velocity Lab",
    city: "Austin",
    address: "501 W 3rd St",
    latitude: 30.2669,
    longitude: -97.7495,
    memberCount: 154,
  },
];

const users: UserRecord[] = [];
const queueByGym = new Map<string, SongRecord[]>();
const reactionsByGym = new Map<string, ReactionRecord[]>();
const commentsByGym = new Map<string, CommentRecord[]>();
const momentsByGym = new Map<string, VibeMomentRecord[]>();
const prsByUser = new Map<string, PrRecord[]>();
const setlistsByUser = new Map<string, SetlistRecord[]>();
const favoritesByUser = new Map<string, FavoriteRecord[]>();
const spotifyNowPlayingByGym = new Map<string, SpotifyNowPlaying>();
const voteEventsByGym = new Map<string, VoteEvent[]>();
const passwordResets: PasswordResetRecord[] = [];

const actionBuckets = new Map<string, number[]>();

const pumpPlaylists = [
  {
    startHour: 5,
    endHour: 11,
    tracks: [
      { title: "Rise Up", artist: "Atlas Mode", uri: "spotify:track:riseup" },
      { title: "Morning PR", artist: "Nova Lift", uri: "spotify:track:morningpr" },
    ],
  },
  {
    startHour: 11,
    endHour: 17,
    tracks: [
      { title: "Midday Heat", artist: "Pulse Theory", uri: "spotify:track:middayheat" },
      { title: "Tempo Grind", artist: "Forge", uri: "spotify:track:tempogrind" },
    ],
  },
  {
    startHour: 17,
    endHour: 23,
    tracks: [
      { title: "Nightlift", artist: "Voltage", uri: "spotify:track:nightlift" },
      { title: "Final Set", artist: "Ironwave", uri: "spotify:track:finalset" },
    ],
  },
];

function getNowIso() {
  return new Date().toISOString();
}

function getQueue(gymId: string) {
  if (!queueByGym.has(gymId)) {
    queueByGym.set(gymId, []);
  }
  return queueByGym.get(gymId) as SongRecord[];
}

function getReactions(gymId: string) {
  if (!reactionsByGym.has(gymId)) {
    reactionsByGym.set(gymId, []);
  }
  return reactionsByGym.get(gymId) as ReactionRecord[];
}

function getComments(gymId: string) {
  if (!commentsByGym.has(gymId)) {
    commentsByGym.set(gymId, []);
  }
  return commentsByGym.get(gymId) as CommentRecord[];
}

function getMoments(gymId: string) {
  if (!momentsByGym.has(gymId)) {
    momentsByGym.set(gymId, []);
  }
  return momentsByGym.get(gymId) as VibeMomentRecord[];
}

function getPrs(userId: string) {
  if (!prsByUser.has(userId)) {
    prsByUser.set(userId, []);
  }
  return prsByUser.get(userId) as PrRecord[];
}

function getSetlists(userId: string) {
  if (!setlistsByUser.has(userId)) {
    setlistsByUser.set(userId, []);
  }
  return setlistsByUser.get(userId) as SetlistRecord[];
}

function getFavorites(userId: string) {
  if (!favoritesByUser.has(userId)) {
    favoritesByUser.set(userId, []);
  }
  return favoritesByUser.get(userId) as FavoriteRecord[];
}

function getVoteEvents(gymId: string) {
  if (!voteEventsByGym.has(gymId)) {
    voteEventsByGym.set(gymId, []);
  }
  return voteEventsByGym.get(gymId) as VoteEvent[];
}

export function listGyms() {
  return gyms;
}

export function createUser(record: Omit<UserRecord, "createdAt" | "updatedAt">) {
  const now = new Date();
  const user: UserRecord = { ...record, createdAt: now, updatedAt: now };
  users.push(user);
  return user;
}

export function findUserByEmail(email: string) {
  return users.find((user) => user.email === email);
}

export function findUserById(userId: string) {
  return users.find((user) => user.id === userId);
}

export function updateUserPassword(userId: string, passwordHash: string) {
  const user = findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  user.passwordHash = passwordHash;
  user.updatedAt = new Date();
  return user;
}

export function createPasswordResetToken(userId: string, ttlMs: number = 60 * 60 * 1000) {
  const token = generateRandomToken(16);
  const expiresAt = new Date(Date.now() + ttlMs);
  const record: PasswordResetRecord = {
    token,
    userId,
    expiresAt,
    used: false,
  };
  passwordResets.push(record);
  return { token, expiresAt };
}

export function consumePasswordResetToken(token: string) {
  const record = passwordResets.find((entry) => entry.token === token);
  if (!record) {
    return null;
  }
  if (record.used || record.expiresAt.getTime() < Date.now()) {
    return null;
  }
  record.used = true;
  return record.userId;
}

export function assertOwnsResource(userId: string, targetUserId: string) {
  if (userId !== targetUserId) {
    throw new ForbiddenError("You can only access your own resources");
  }
}

export function seedQueueIfNeeded(gymId: string) {
  const queue = getQueue(gymId);
  if (queue.length > 0) {
    return;
  }

  const hour = new Date().getHours();
  const block = pumpPlaylists.find(
    (item) => hour >= item.startHour && hour < item.endHour
  );
  if (!block) return;

  block.tracks.forEach((track, index) => {
    queue.push({
      id: `auto-${gymId}-${Date.now()}-${index}`,
      title: track.title,
      artist: track.artist,
      uri: track.uri,
      addedBy: "system",
      addedAt: getNowIso(),
      voteScore: 0,
      isPlaying: index === 0,
      isAutoSeed: true,
    });
  });
}

export function addSongToQueue(gymId: string, song: Omit<SongRecord, "id" | "addedAt" | "voteScore" | "isPlaying" | "isAutoSeed">) {
  const queue = getQueue(gymId);
  const existing = queue.find((track) => track.uri === song.uri);
  if (existing) {
    existing.voteScore += 1;
    existing.duplicateCount = (existing.duplicateCount || 0) + 1;
    return existing;
  }
  const songRecord: SongRecord = {
    ...song,
    id: `song-${gymId}-${Date.now()}`,
    addedAt: getNowIso(),
    voteScore: 1,
    isPlaying: queue.length === 0,
    isAutoSeed: false,
  };
  queue.push(songRecord);
  return songRecord;
}

export function listQueue(gymId: string) {
  return getQueue(gymId);
}

export function voteOnSong(gymId: string, songId: string, delta: number) {
  const queue = getQueue(gymId);
  const song = queue.find((track) => track.id === songId);
  if (!song) {
    throw new NotFoundError("Song");
  }
  song.voteScore += delta;
  return song;
}

export function recordVote(gymId: string, songId: string, userId: string) {
  const events = getVoteEvents(gymId);
  events.push({
    gymId,
    songId,
    userId,
    createdAt: getNowIso(),
  });
}

export function getNowPlaying(gymId: string) {
  const queue = getQueue(gymId);
  return queue.find((song) => song.isPlaying) || null;
}

export function setNowPlaying(gymId: string, songId: string) {
  const queue = getQueue(gymId);
  queue.forEach((track) => {
    track.isPlaying = track.id === songId;
  });
  return getNowPlaying(gymId);
}

export function addReaction(gymId: string, reaction: Omit<ReactionRecord, "id" | "createdAt">) {
  const reactions = getReactions(gymId);
  const record: ReactionRecord = {
    ...reaction,
    id: `reaction-${gymId}-${Date.now()}`,
    createdAt: getNowIso(),
  };
  reactions.push(record);
  return record;
}

export function addComment(gymId: string, comment: Omit<CommentRecord, "id" | "createdAt">) {
  const comments = getComments(gymId);
  const record: CommentRecord = {
    ...comment,
    id: `comment-${gymId}-${Date.now()}`,
    createdAt: getNowIso(),
  };
  comments.push(record);
  return record;
}

export function listFeed(gymId: string) {
  return {
    reactions: getReactions(gymId),
    comments: getComments(gymId),
  };
}

export function addMoment(moment: Omit<VibeMomentRecord, "id" | "createdAt">) {
  const moments = getMoments(moment.gymId);
  const record: VibeMomentRecord = {
    ...moment,
    id: `moment-${moment.gymId}-${Date.now()}`,
    createdAt: getNowIso(),
  };
  moments.unshift(record);
  return record;
}

export function listMoments(gymId: string) {
  return getMoments(gymId);
}

export function addPr(record: Omit<PrRecord, "id" | "createdAt">) {
  const prs = getPrs(record.userId);
  const newRecord: PrRecord = {
    ...record,
    id: `pr-${record.userId}-${Date.now()}`,
    createdAt: getNowIso(),
  };
  prs.unshift(newRecord);
  return newRecord;
}

export function listPrs(userId: string) {
  return getPrs(userId);
}

export function addSetlist(record: Omit<SetlistRecord, "id" | "createdAt">) {
  const setlists = getSetlists(record.userId);
  const newRecord: SetlistRecord = {
    ...record,
    id: `setlist-${record.userId}-${Date.now()}`,
    createdAt: getNowIso(),
  };
  setlists.unshift(newRecord);
  return newRecord;
}

export function addTrackToSetlist(
  userId: string,
  setlistId: string,
  track: { title: string; artist: string; uri: string }
) {
  const setlists = getSetlists(userId);
  const setlist = setlists.find((item) => item.id === setlistId);
  if (!setlist) {
    throw new NotFoundError("Setlist");
  }
  const exists = setlist.tracks.some((item) => item.uri === track.uri);
  if (!exists) {
    setlist.tracks.unshift(track);
  }
  return setlist;
}

export function listSetlists(userId: string) {
  return getSetlists(userId);
}

export function addFavorites(record: Omit<FavoriteRecord, "id" | "createdAt">) {
  const favorites = getFavorites(record.userId);
  const newRecord: FavoriteRecord = {
    ...record,
    id: `fav-${record.userId}-${Date.now()}`,
    createdAt: getNowIso(),
  };
  favorites.unshift(newRecord);
  return newRecord;
}

export function listFavorites(userId: string) {
  return getFavorites(userId);
}

export function setSpotifyNowPlaying(gymId: string, track: SpotifyNowPlaying["track"], deviceName?: string) {
  const record: SpotifyNowPlaying = {
    gymId,
    track,
    deviceName,
    syncedAt: getNowIso(),
  };
  spotifyNowPlayingByGym.set(gymId, record);
  return record;
}

export function getSpotifyNowPlaying(gymId: string) {
  return spotifyNowPlayingByGym.get(gymId) || null;
}

export function getGymWrapped(gymId: string) {
  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const queue = getQueue(gymId);
  const voteEvents = getVoteEvents(gymId).filter(
    (event) => new Date(event.createdAt).getTime() >= weekAgo
  );

  const topTracks = queue
    .slice()
    .sort((a, b) => b.voteScore - a.voteScore)
    .slice(0, 5)
    .map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      votes: track.voteScore,
    }));

  const contributions = new Map<string, { userId: string; votes: number; adds: number }>();
  queue.forEach((track) => {
    const entry = contributions.get(track.addedBy) || { userId: track.addedBy, votes: 0, adds: 0 };
    entry.adds += 1;
    contributions.set(track.addedBy, entry);
  });
  voteEvents.forEach((vote) => {
    const entry = contributions.get(vote.userId) || { userId: vote.userId, votes: 0, adds: 0 };
    entry.votes += 1;
    contributions.set(vote.userId, entry);
  });

  const topContributors = Array.from(contributions.values())
    .sort((a, b) => b.votes + b.adds - (a.votes + a.adds))
    .slice(0, 5);

  return {
    gymId,
    weekStart: new Date(weekAgo).toISOString(),
    topTracks,
    topContributors,
  };
}

export function getGymMatches(userId: string) {
  const favorites = getFavorites(userId);
  const artists = new Set(
    favorites.map((track) => track.artist.split(",")[0]?.trim()).filter(Boolean)
  );

  const matches = users
    .filter((user) => user.id !== userId)
    .map((user) => {
      const userFavorites = getFavorites(user.id);
      const overlap = userFavorites.filter((track) =>
        artists.has(track.artist.split(",")[0]?.trim() || "")
      ).length;
      return {
        userId: user.id,
        name: user.name,
        overlapScore: overlap,
      };
    })
    .sort((a, b) => b.overlapScore - a.overlapScore)
    .slice(0, 5);

  if (matches.length > 0) {
    return matches;
  }

  return [
    { userId: "sample-1", name: "Lena", overlapScore: 2 },
    { userId: "sample-2", name: "Marco", overlapScore: 1 },
    { userId: "sample-3", name: "Tia", overlapScore: 1 },
  ];
}

export function enforceNewUserRateLimit(userId: string, action: string, max: number, windowMs: number) {
  const user = findUserById(userId);
  if (!user) return;

  const newUserWindowMs = 1000 * 60 * 60 * 24 * 7;
  const isNewUser = Date.now() - user.createdAt.getTime() < newUserWindowMs;
  if (!isNewUser) return;

  const key = `${userId}:${action}`;
  const now = Date.now();
  const bucket = actionBuckets.get(key) || [];
  const filtered = bucket.filter((timestamp) => now - timestamp < windowMs);
  if (filtered.length >= max) {
    throw new RateLimitError("Slow down while we get to know you.");
  }
  filtered.push(now);
  actionBuckets.set(key, filtered);
}
