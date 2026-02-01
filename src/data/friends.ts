export type FriendProfile = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  homeGym: string;
  goals: string[];
  weeklyWorkouts: number;
  streakWeeks: number;
  prs: Array<{ label: string; value: string }>;
  favoriteTracks: Array<{ title: string; artist: string }>;
  badges: string[];
};

export const FRIEND_PROFILES: FriendProfile[] = [
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    handle: '@maya.moves',
    bio: 'Powerlifting + tempo training. Always chasing a cleaner front squat.',
    homeGym: 'Iron Works',
    goals: ['Strength', 'Technique'],
    weeklyWorkouts: 4,
    streakWeeks: 6,
    prs: [
      { label: 'Back Squat', value: '275 lb' },
      { label: 'Deadlift', value: '315 lb' },
      { label: 'Bench', value: '165 lb' },
    ],
    favoriteTracks: [
      { title: 'Power', artist: 'Kanye West' },
      { title: 'Stronger', artist: 'Kelly Clarkson' },
      { title: 'Run It', artist: 'DJ Snake' },
    ],
    badges: ['PR Hunter', 'Tempo King'],
  },
  {
    id: 'darius-lee',
    name: 'Darius Lee',
    handle: '@dlee',
    bio: 'Morning sessions only. Building speed and jump power.',
    homeGym: 'Lift Lab',
    goals: ['Performance', 'Conditioning'],
    weeklyWorkouts: 5,
    streakWeeks: 9,
    prs: [
      { label: 'Clean', value: '205 lb' },
      { label: 'Vertical Jump', value: '32 in' },
      { label: '5K', value: '22:30' },
    ],
    favoriteTracks: [
      { title: 'Can’t Hold Us', artist: 'Macklemore' },
      { title: 'Titanium', artist: 'Sia' },
      { title: 'Remember the Name', artist: 'Fort Minor' },
    ],
    badges: ['Early Bird', 'Finisher'],
  },
  {
    id: 'alina-k',
    name: 'Alina K.',
    handle: '@alina.fit',
    bio: 'Hypertrophy splits + cardio stack. Tracking everything.',
    homeGym: 'Pulse Fitness',
    goals: ['Hypertrophy', 'Endurance'],
    weeklyWorkouts: 4,
    streakWeeks: 4,
    prs: [
      { label: 'Leg Press', value: '520 lb' },
      { label: 'Hip Thrust', value: '245 lb' },
      { label: 'Pullups', value: '8 reps' },
    ],
    favoriteTracks: [
      { title: 'Levitating', artist: 'Dua Lipa' },
      { title: 'Dance Monkey', artist: 'Tones and I' },
      { title: 'Don’t Start Now', artist: 'Dua Lipa' },
    ],
    badges: ['Consistency', 'Volume Builder'],
  },
  {
    id: 'oscar-m',
    name: 'Oscar M.',
    handle: '@oscar.moves',
    bio: 'Mobility + strength blend. Always down to train.',
    homeGym: 'Atlas Club',
    goals: ['Mobility', 'Strength'],
    weeklyWorkouts: 3,
    streakWeeks: 5,
    prs: [
      { label: 'Overhead Press', value: '135 lb' },
      { label: 'Front Squat', value: '205 lb' },
    ],
    favoriteTracks: [
      { title: 'Eye of the Tiger', artist: 'Survivor' },
      { title: 'Believer', artist: 'Imagine Dragons' },
      { title: 'Lose Yourself', artist: 'Eminem' },
    ],
    badges: ['Mobility Master'],
  },
  {
    id: 'tori-yao',
    name: 'Tori Yao',
    handle: '@tori.strength',
    bio: 'Training for my first meet. Big focus on volume.',
    homeGym: 'Iron Works',
    goals: ['Strength'],
    weeklyWorkouts: 5,
    streakWeeks: 7,
    prs: [
      { label: 'Bench', value: '145 lb' },
      { label: 'Deadlift', value: '285 lb' },
    ],
    favoriteTracks: [
      { title: 'The Motto', artist: 'Drake' },
      { title: 'Till I Collapse', artist: 'Eminem' },
      { title: 'All The Way Up', artist: 'Fat Joe' },
    ],
    badges: ['Meet Prep'],
  },
  {
    id: 'jules-r',
    name: 'Jules Rivera',
    handle: '@jules.r',
    bio: 'Tempo runner + kettlebell circuits.',
    homeGym: 'Pulse Fitness',
    goals: ['Conditioning', 'Endurance'],
    weeklyWorkouts: 6,
    streakWeeks: 8,
    prs: [
      { label: '10K', value: '49:10' },
      { label: 'KB Swing', value: '32 kg' },
    ],
    favoriteTracks: [
      { title: 'Levels', artist: 'Avicii' },
      { title: 'Blinding Lights', artist: 'The Weeknd' },
      { title: 'Midnight City', artist: 'M83' },
    ],
    badges: ['Tempo Runner'],
  },
  {
    id: 'rhea-p',
    name: 'Rhea Patel',
    handle: '@rhea.lifts',
    bio: 'Lifting to build confidence and power.',
    homeGym: 'Lift Lab',
    goals: ['Hypertrophy', 'Strength'],
    weeklyWorkouts: 4,
    streakWeeks: 3,
    prs: [
      { label: 'Hip Thrust', value: '265 lb' },
      { label: 'Romanian Deadlift', value: '185 lb' },
    ],
    favoriteTracks: [
      { title: 'Work', artist: 'Rihanna' },
      { title: 'Energy', artist: 'Drake' },
      { title: 'Good as Hell', artist: 'Lizzo' },
    ],
    badges: ['Momentum'],
  },
  {
    id: 'mateo-v',
    name: 'Mateo Vega',
    handle: '@mateo.fit',
    bio: 'Hybrid training. Heavy days + interval runs.',
    homeGym: 'Atlas Club',
    goals: ['Performance', 'Endurance'],
    weeklyWorkouts: 5,
    streakWeeks: 10,
    prs: [
      { label: 'Deadlift', value: '365 lb' },
      { label: '5K', value: '20:05' },
    ],
    favoriteTracks: [
      { title: 'Industry Baby', artist: 'Lil Nas X' },
      { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
      { title: 'Uptown Funk', artist: 'Mark Ronson' },
    ],
    badges: ['Hybrid Beast', 'Streak 10'],
  },
  {
    id: 'nina-s',
    name: 'Nina S.',
    handle: '@nina.s',
    bio: 'Low impact strength + recovery focus.',
    homeGym: 'Recovery Room',
    goals: ['Mobility', 'Recovery'],
    weeklyWorkouts: 3,
    streakWeeks: 4,
    prs: [
      { label: 'Step Ups', value: '35 lb' },
      { label: 'Farmer Carry', value: '70 lb' },
    ],
    favoriteTracks: [
      { title: 'Sunflower', artist: 'Post Malone' },
      { title: 'Golden Hour', artist: 'JVKE' },
      { title: 'Better Days', artist: 'NEIKED' },
    ],
    badges: ['Recovery Pro'],
  },
  {
    id: 'sam-g',
    name: 'Sam G.',
    handle: '@samgainz',
    bio: 'Core strength and functional fitness.',
    homeGym: 'Pulse Fitness',
    goals: ['Performance', 'Mobility'],
    weeklyWorkouts: 4,
    streakWeeks: 2,
    prs: [
      { label: 'Pullups', value: '12 reps' },
      { label: 'Row', value: '185 lb' },
    ],
    favoriteTracks: [
      { title: 'DNA.', artist: 'Kendrick Lamar' },
      { title: 'Can’t Feel My Face', artist: 'The Weeknd' },
      { title: 'Circus', artist: 'Brittany Spears' },
    ],
    badges: ['Core Engine'],
  },
  {
    id: 'lena-p',
    name: 'Lena P.',
    handle: '@lena.power',
    bio: 'Building volume for meet day.',
    homeGym: 'Iron Works',
    goals: ['Strength', 'Hypertrophy'],
    weeklyWorkouts: 5,
    streakWeeks: 6,
    prs: [
      { label: 'Squat', value: '295 lb' },
      { label: 'Bench', value: '175 lb' },
    ],
    favoriteTracks: [
      { title: 'Ambition', artist: 'Wale' },
      { title: 'Legend', artist: 'The Score' },
      { title: 'Nonstop', artist: 'Drake' },
    ],
    badges: ['PR Hunter'],
  },
  {
    id: 'trent-k',
    name: 'Trent K.',
    handle: '@trentk',
    bio: 'Focused on tempo strength and mobility.',
    homeGym: 'Atlas Club',
    goals: ['Mobility', 'Strength'],
    weeklyWorkouts: 3,
    streakWeeks: 1,
    prs: [
      { label: 'Front Squat', value: '185 lb' },
      { label: 'Split Squat', value: '110 lb' },
    ],
    favoriteTracks: [
      { title: 'Bad Guy', artist: 'Billie Eilish' },
      { title: 'Animals', artist: 'Martin Garrix' },
      { title: 'Lose Control', artist: 'Teddy Swims' },
    ],
    badges: ['Flexibility'],
  },
];

export const DEFAULT_FRIEND_IDS = ['maya-chen', 'darius-lee', 'alina-k'];
export const DEFAULT_REQUEST_IDS = ['oscar-m', 'tori-yao'];
export const DEFAULT_OUTGOING_IDS = ['jules-r'];

export function getFriendById(id: string) {
  return FRIEND_PROFILES.find((profile) => profile.id === id);
}
