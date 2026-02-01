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

const mockSongs: Record<string, Song[]> = {
  '1': [
    {
      id: '1',
      title: 'Eye of the Tiger',
      artist: 'Survivor',
      album: 'Rocky III Soundtrack',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b2737c0e5ec6fc91216e35c6a6f4',
      duration: 245,
      addedBy: { id: '2', name: 'Mike Johnson' },
      addedAt: new Date(Date.now() - 3600000).toISOString(),
      voteCount: 15,
      weightedScore: 23.5,
      userVoted: false,
      isPlaying: true,
    },
    {
      id: '2',
      title: 'Till I Collapse',
      artist: 'Eminem ft. Nate Dogg',
      album: 'The Eminem Show',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273dbb3dd82da2d7d939645d77e',
      duration: 297,
      addedBy: { id: '3', name: 'Sarah Williams' },
      addedAt: new Date(Date.now() - 7200000).toISOString(),
      voteCount: 12,
      weightedScore: 18.2,
      userVoted: true,
    },
    {
      id: '3',
      title: 'Stronger',
      artist: 'Kanye West',
      album: 'Graduation',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273cd945b4e3de57edd28481a3f',
      duration: 311,
      addedBy: { id: '1', name: 'John Doe' },
      addedAt: new Date(Date.now() - 10800000).toISOString(),
      voteCount: 10,
      weightedScore: 15.8,
      userVoted: false,
    },
    {
      id: '4',
      title: 'Lose Yourself',
      artist: 'Eminem',
      album: '8 Mile Soundtrack',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273355ad0ea8de9256acfc03971',
      duration: 326,
      addedBy: { id: '4', name: 'Chris Brown' },
      addedAt: new Date(Date.now() - 14400000).toISOString(),
      voteCount: 8,
      weightedScore: 12.4,
      userVoted: false,
    },
    {
      id: '5',
      title: 'Remember the Name',
      artist: 'Fort Minor',
      album: 'The Rising Tied',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273dbb3dd82da2d7d939645d77e',
      duration: 219,
      addedBy: { id: '5', name: 'Lisa Davis' },
      addedAt: new Date(Date.now() - 18000000).toISOString(),
      voteCount: 7,
      weightedScore: 10.1,
      userVoted: false,
    },
  ],
  '2': [],
  '3': [],
};

const mockLeaderboard: Record<string, LeaderboardEntry[]> = {
  '1': [
    {
      userId: '2',
      username: 'mikejohnson',
      name: 'Mike Johnson',
      influencePoints: 2450,
      rank: 1,
      level: 18,
      songsAdded: 45,
      votescast: 234,
    },
    {
      userId: '3',
      username: 'sarahwilliams',
      name: 'Sarah Williams',
      influencePoints: 1890,
      rank: 2,
      level: 15,
      songsAdded: 38,
      votescast: 189,
    },
    {
      userId: '1',
      username: 'johndoe',
      name: 'John Doe',
      influencePoints: 1250,
      rank: 3,
      level: 12,
      songsAdded: 25,
      votescast: 142,
    },
    {
      userId: '4',
      username: 'chrisbrown',
      name: 'Chris Brown',
      influencePoints: 980,
      rank: 4,
      level: 10,
      songsAdded: 20,
      votescast: 98,
    },
    {
      userId: '5',
      username: 'lisadavis',
      name: 'Lisa Davis',
      influencePoints: 756,
      rank: 5,
      level: 9,
      songsAdded: 15,
      votescast: 76,
    },
  ],
};

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
