/**
 * Mock API Service for BarbellBeats
 * Simulates backend responses for development
 */

import { Gym, Song, User, LeaderboardEntry } from '../types';

// Mock data
const mockUser: User = {
  id: '1',
  email: 'john@example.com',
  name: 'John Doe',
  username: 'johndoe',
  influencePoints: 1250,
  rank: 'Gold',
  level: 12,
  createdAt: new Date().toISOString(),
};

const mockGyms: Gym[] = [
  {
    id: '1',
    name: 'Iron Paradise Gym',
    address: '123 Muscle St, Fitness City',
    distance: 0.5,
    memberCount: 142,
    latitude: 40.7128,
    longitude: -74.0060,
    description: 'Best gym in town with top equipment',
  },
  {
    id: '2',
    name: 'PowerHouse Fitness',
    address: '456 Strong Ave, Lift Town',
    distance: 1.2,
    memberCount: 89,
    latitude: 40.7580,
    longitude: -73.9855,
    description: 'Home of champions',
  },
  {
    id: '3',
    name: 'Fit Factory',
    address: '789 Health Blvd, Wellness City',
    distance: 2.1,
    memberCount: 210,
    latitude: 40.7489,
    longitude: -73.9680,
    description: '24/7 access, modern facilities',
  },
  {
    id: '4',
    name: 'Strength Zone',
    address: '321 Gains Rd, Muscle Valley',
    distance: 5.8,
    memberCount: 156,
    latitude: 40.7614,
    longitude: -73.9776,
    description: 'Dedicated strength training facility',
  },
  {
    id: '5',
    name: 'Elite Performance Center',
    address: '555 Victory Ln, Champion City',
    distance: 8.3,
    memberCount: 298,
    latitude: 40.7282,
    longitude: -73.7949,
    description: 'Professional athlete training center',
  },
  {
    id: '6',
    name: 'FitLife Studio',
    address: '777 Wellness Way, Healthy Heights',
    distance: 12.4,
    memberCount: 187,
    latitude: 40.6782,
    longitude: -73.9442,
    description: 'Modern studio with group classes',
  },
  {
    id: '7',
    name: 'Beast Mode Athletics',
    address: '999 Grind St, Hustle Town',
    distance: 18.7,
    memberCount: 234,
    latitude: 40.8448,
    longitude: -73.8648,
    description: 'Hardcore training environment',
  },
  {
    id: '8',
    name: 'The Iron Temple',
    address: '101 Barbells Blvd, Lift City',
    distance: 23.5,
    memberCount: 412,
    latitude: 40.6413,
    longitude: -74.0781,
    description: 'Legendary powerlifting gym',
  },
  {
    id: '9',
    name: 'Apex Fitness Hub',
    address: '202 Summit Ave, Peak District',
    distance: 31.2,
    memberCount: 189,
    latitude: 40.9176,
    longitude: -73.7821,
    description: 'State-of-the-art equipment',
  },
  {
    id: '10',
    name: 'Titan Gym',
    address: '404 Power Plaza, Strength Shore',
    distance: 38.9,
    memberCount: 276,
    latitude: 40.5795,
    longitude: -74.1502,
    description: 'Oceanfront fitness paradise',
  },
  {
    id: '11',
    name: 'Warrior Wellness',
    address: '606 Fighter St, Combat Corner',
    distance: 45.3,
    memberCount: 198,
    latitude: 41.0534,
    longitude: -73.5387,
    description: 'MMA and strength training',
  },
  {
    id: '12',
    name: 'Limitless Fitness',
    address: '808 Beyond Blvd, Potential Park',
    distance: 49.1,
    memberCount: 324,
    latitude: 40.3573,
    longitude: -74.6672,
    description: 'Push past your limits',
  },
];

// Seed users for adding songs
const seedUsers = [
  { id: 'seed-1', name: 'Alex Rivera' },
  { id: 'seed-2', name: 'Jordan Chen' },
  { id: 'seed-3', name: 'Taylor Morgan' },
  { id: 'seed-4', name: 'Casey Williams' },
  { id: 'seed-5', name: 'Morgan Lee' },
  { id: 'seed-6', name: 'Riley Thompson' },
  { id: 'seed-7', name: 'Jamie Parker' },
  { id: 'seed-8', name: 'Quinn Anderson' },
  { id: 'seed-9', name: 'Avery Martinez' },
  { id: 'seed-10', name: 'Drew Campbell' },
];

// Seed songs library - popular workout tracks
const seedSongsLibrary = [
  { title: 'Eye of the Tiger', artist: 'Survivor', duration: 245 },
  { title: 'Till I Collapse', artist: 'Eminem ft. Nate Dogg', duration: 297 },
  { title: 'Stronger', artist: 'Kanye West', duration: 311 },
  { title: 'Lose Yourself', artist: 'Eminem', duration: 326 },
  { title: 'Remember the Name', artist: 'Fort Minor', duration: 219 },
  { title: 'Can\'t Hold Us', artist: 'Macklemore & Ryan Lewis', duration: 258 },
  { title: 'Power', artist: 'Kanye West', duration: 292 },
  { title: 'Thunderstruck', artist: 'AC/DC', duration: 292 },
  { title: 'Enter Sandman', artist: 'Metallica', duration: 331 },
  { title: 'Welcome to the Jungle', artist: 'Guns N\' Roses', duration: 275 },
  { title: 'Run This Town', artist: 'Jay-Z ft. Rihanna', duration: 267 },
  { title: 'All I Do Is Win', artist: 'DJ Khaled', duration: 228 },
  { title: 'Pump It', artist: 'Black Eyed Peas', duration: 213 },
  { title: 'Levels', artist: 'Avicii', duration: 203 },
  { title: 'Titanium', artist: 'David Guetta ft. Sia', duration: 245 },
  { title: 'Don\'t Stop Me Now', artist: 'Queen', duration: 209 },
  { title: 'Centuries', artist: 'Fall Out Boy', duration: 222 },
  { title: 'Radioactive', artist: 'Imagine Dragons', duration: 186 },
  { title: 'The Pretender', artist: 'Foo Fighters', duration: 269 },
  { title: 'Blinding Lights', artist: 'The Weeknd', duration: 200 },
  { title: 'Sicko Mode', artist: 'Travis Scott', duration: 312 },
  { title: 'HUMBLE.', artist: 'Kendrick Lamar', duration: 177 },
  { title: 'Work Out', artist: 'J. Cole', duration: 235 },
  { title: 'Beast', artist: 'Rob Bailey', duration: 248 },
  { title: 'Motivation', artist: 'Normani', duration: 192 },
  { title: 'Physical', artist: 'Dua Lipa', duration: 194 },
  { title: 'Body', artist: 'Megan Thee Stallion', duration: 171 },
  { title: 'Good as Hell', artist: 'Lizzo', duration: 161 },
  { title: 'High Hopes', artist: 'Panic! At The Disco', duration: 190 },
  { title: 'Whatever It Takes', artist: 'Imagine Dragons', duration: 201 },
];

// Generate seed songs for a gym
function generateGymSongs(gymId: string, count: number = 5): Song[] {
  const songs: Song[] = [];
  const usedIndices = new Set<number>();
  const gymNumericId = parseInt(gymId) || 1;

  for (let i = 0; i < count; i++) {
    // Pick a song based on gym ID to ensure variety across gyms
    let songIndex = (gymNumericId * 3 + i * 7) % seedSongsLibrary.length;
    while (usedIndices.has(songIndex)) {
      songIndex = (songIndex + 1) % seedSongsLibrary.length;
    }
    usedIndices.add(songIndex);

    const seedSong = seedSongsLibrary[songIndex];
    const user = seedUsers[(gymNumericId + i) % seedUsers.length];
    const hoursAgo = (i + 1) * 2;

    songs.push({
      id: `${gymId}-seed-${i + 1}`,
      title: seedSong.title,
      artist: seedSong.artist,
      duration: seedSong.duration,
      addedBy: { id: user.id, name: user.name },
      addedAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      voteCount: Math.floor(Math.random() * 15) + 3,
      weightedScore: Math.floor(Math.random() * 20) + 5,
      userVoted: false,
      isPlaying: i === 0,
    });
  }

  // Sort by vote count descending
  return songs.sort((a, b) => b.voteCount - a.voteCount);
}

// Generate songs for all gyms
const mockSongs: Record<string, Song[]> = {};
mockGyms.forEach(gym => {
  mockSongs[gym.id] = generateGymSongs(gym.id, 5);
});

// Generate leaderboard for a gym using seed users
function generateGymLeaderboard(gymId: string): LeaderboardEntry[] {
  const gymNumericId = parseInt(gymId) || 1;
  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < 5; i++) {
    const user = seedUsers[(gymNumericId + i) % seedUsers.length];
    const basePoints = 2500 - (i * 400) + (gymNumericId * 50);

    entries.push({
      userId: user.id,
      username: user.name.toLowerCase().replace(' ', ''),
      name: user.name,
      influencePoints: Math.max(500, basePoints + Math.floor(Math.random() * 200)),
      rank: i + 1,
      level: Math.max(5, 18 - i * 2 + Math.floor(Math.random() * 3)),
      songsAdded: Math.max(10, 45 - i * 8 + Math.floor(Math.random() * 10)),
      votesCast: Math.max(50, 230 - i * 40 + Math.floor(Math.random() * 30)),
    });
  }

  return entries;
}

// Generate leaderboard for all gyms
const mockLeaderboard: Record<string, LeaderboardEntry[]> = {};
mockGyms.forEach(gym => {
  mockLeaderboard[gym.id] = generateGymLeaderboard(gym.id);
});

// API functions
export const mockApi = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(800);
    return {
      user: mockUser,
      token: 'mock_token_' + Date.now(),
    };
  },

  async signup(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    await delay(1000);
    return {
      user: { ...mockUser, email, name },
      token: 'mock_token_' + Date.now(),
    };
  },

  // Gyms
  async getNearbyGyms(latitude: number, longitude: number): Promise<Gym[]> {
    await delay(600);
    return mockGyms;
  },

  async getGymDetails(gymId: string): Promise<Gym> {
    await delay(400);
    const gym = mockGyms.find(g => g.id === gymId);
    if (!gym) throw new Error('Gym not found');
    return gym;
  },

  async joinGym(gymId: string): Promise<{ success: boolean }> {
    await delay(500);
    return { success: true };
  },

  // Playlist
  async getPlaylist(gymId: string): Promise<Song[]> {
    await delay(600);
    return mockSongs[gymId] || [];
  },

  async addSong(gymId: string, spotifyId: string, title: string, artist: string): Promise<Song> {
    await delay(700);
    const newSong: Song = {
      id: String(Date.now()),
      title,
      artist,
      duration: 240,
      addedBy: { id: mockUser.id, name: mockUser.name },
      addedAt: new Date().toISOString(),
      voteCount: 0,
      weightedScore: 0,
      userVoted: false,
    };

    if (!mockSongs[gymId]) {
      mockSongs[gymId] = [];
    }
    mockSongs[gymId].push(newSong);
    return newSong;
  },

  async voteSong(songId: string, voteType: 'up' | 'down'): Promise<{ voteCount: number; weightedScore: number }> {
    await delay(400);

    // Find song across all gyms
    for (const gymId in mockSongs) {
      const song = mockSongs[gymId].find(s => s.id === songId);
      if (song) {
        const delta = voteType === 'up' ? 1 : -1;
        song.voteCount += delta;
        song.weightedScore += delta * 1.5;
        song.userVoted = voteType === 'up';
        return {
          voteCount: song.voteCount,
          weightedScore: song.weightedScore,
        };
      }
    }

    throw new Error('Song not found');
  },

  // Leaderboard
  async getLeaderboard(gymId: string): Promise<LeaderboardEntry[]> {
    await delay(500);
    return mockLeaderboard[gymId] || [];
  },

  // User
  async getUserProfile(userId: string): Promise<User> {
    await delay(400);
    if (userId === mockUser.id) {
      return mockUser;
    }
    // Return a mock user
    return {
      ...mockUser,
      id: userId,
      name: 'Other User',
      username: 'otheruser',
    };
  },

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    await delay(600);
    Object.assign(mockUser, updates);
    return mockUser;
  },
};

// Helper function to simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default mockApi;
