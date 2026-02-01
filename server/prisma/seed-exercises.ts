/**
 * Exercise Library Seed Data
 *
 * Comprehensive exercise database covering all major muscle groups and equipment types
 * To run: npx tsx prisma/seed-exercises.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExerciseSeed {
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  muscleGroups: string[];
  equipment: string;
  description?: string;
}

const exercises: ExerciseSeed[] = [
  // ============================================================================
  // CHEST - Compound
  // ============================================================================
  {
    name: 'Barbell Bench Press',
    category: 'compound',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    description: 'The king of chest exercises. Lie flat, lower bar to chest, press explosively.',
  },
  {
    name: 'Incline Barbell Bench Press',
    category: 'compound',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    description: 'Targets upper chest. Set bench to 30-45 degrees.',
  },
  {
    name: 'Decline Barbell Bench Press',
    category: 'compound',
    muscleGroups: ['chest', 'triceps'],
    equipment: 'barbell',
    description: 'Emphasizes lower chest. Decline bench 15-30 degrees.',
  },
  {
    name: 'Dumbbell Bench Press',
    category: 'compound',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'dumbbell',
    description: 'Greater range of motion than barbell. Control the stretch.',
  },
  {
    name: 'Incline Dumbbell Press',
    category: 'compound',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'dumbbell',
    description: 'Upper chest focus with dumbbells. 30-45 degree incline.',
  },
  {
    name: 'Push-Ups',
    category: 'compound',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: 'bodyweight',
    description: 'Classic bodyweight chest builder. Keep core tight.',
  },
  {
    name: 'Dips',
    category: 'compound',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'bodyweight',
    description: 'Lean forward for chest emphasis. Great for lower chest.',
  },

  // CHEST - Isolation
  {
    name: 'Dumbbell Flyes',
    category: 'isolation',
    muscleGroups: ['chest'],
    equipment: 'dumbbell',
    description: 'Pure chest stretch. Control the eccentric.',
  },
  {
    name: 'Incline Dumbbell Flyes',
    category: 'isolation',
    muscleGroups: ['chest'],
    equipment: 'dumbbell',
    description: 'Upper chest isolation. Light weight, high control.',
  },
  {
    name: 'Cable Flyes',
    category: 'isolation',
    muscleGroups: ['chest'],
    equipment: 'cable',
    description: 'Constant tension throughout movement. Squeeze at peak.',
  },
  {
    name: 'Pec Deck Machine',
    category: 'isolation',
    muscleGroups: ['chest'],
    equipment: 'machine',
    description: 'Machine-guided chest isolation. Focus on the squeeze.',
  },

  // ============================================================================
  // BACK - Compound
  // ============================================================================
  {
    name: 'Deadlift',
    category: 'compound',
    muscleGroups: ['back', 'legs', 'core'],
    equipment: 'barbell',
    description: 'The ultimate full-body lift. Hip hinge, neutral spine.',
  },
  {
    name: 'Barbell Row',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'barbell',
    description: 'Classic back builder. Pull to lower chest, squeeze lats.',
  },
  {
    name: 'Pull-Ups',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'bodyweight',
    description: 'King of back bodyweight exercises. Full ROM crucial.',
  },
  {
    name: 'Chin-Ups',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'bodyweight',
    description: 'Underhand grip pull-up. More bicep emphasis.',
  },
  {
    name: 'Lat Pulldown',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'cable',
    description: 'Vertical pulling pattern. Pull to upper chest.',
  },
  {
    name: 'T-Bar Row',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'barbell',
    description: 'Thick back builder. Keep chest up, pull to sternum.',
  },
  {
    name: 'Dumbbell Row',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'dumbbell',
    description: 'Unilateral back work. Support bench, pull elbow high.',
  },
  {
    name: 'Seated Cable Row',
    category: 'compound',
    muscleGroups: ['back', 'biceps'],
    equipment: 'cable',
    description: 'Horizontal pull. Keep torso upright, squeeze shoulder blades.',
  },

  // BACK - Isolation
  {
    name: 'Face Pulls',
    category: 'isolation',
    muscleGroups: ['back', 'shoulders'],
    equipment: 'cable',
    description: 'Rear delt and upper back. Pull to face, external rotation.',
  },
  {
    name: 'Straight Arm Pulldown',
    category: 'isolation',
    muscleGroups: ['back'],
    equipment: 'cable',
    description: 'Lat isolation. Keep arms nearly straight, pull with lats.',
  },

  // ============================================================================
  // SHOULDERS - Compound
  // ============================================================================
  {
    name: 'Overhead Press',
    category: 'compound',
    muscleGroups: ['shoulders', 'triceps', 'core'],
    equipment: 'barbell',
    description: 'Standing barbell press. The ultimate shoulder builder.',
  },
  {
    name: 'Seated Barbell Press',
    category: 'compound',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'barbell',
    description: 'Seated variation. More isolation, less core demand.',
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'compound',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    description: 'Greater range of motion. Can be seated or standing.',
  },
  {
    name: 'Arnold Press',
    category: 'compound',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    description: 'Rotating press variation. All three delt heads.',
  },
  {
    name: 'Push Press',
    category: 'compound',
    muscleGroups: ['shoulders', 'triceps', 'legs', 'core'],
    equipment: 'barbell',
    description: 'Explosive overhead press with leg drive.',
  },

  // SHOULDERS - Isolation
  {
    name: 'Lateral Raises',
    category: 'isolation',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    description: 'Side delt isolation. Slight bend in elbow, controlled tempo.',
  },
  {
    name: 'Front Raises',
    category: 'isolation',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    description: 'Front delt focus. Raise to eye level.',
  },
  {
    name: 'Rear Delt Flyes',
    category: 'isolation',
    muscleGroups: ['shoulders', 'back'],
    equipment: 'dumbbell',
    description: 'Bent over rear delt work. Crucial for shoulder health.',
  },
  {
    name: 'Cable Lateral Raises',
    category: 'isolation',
    muscleGroups: ['shoulders'],
    equipment: 'cable',
    description: 'Constant tension lateral raise. Cross-body variation.',
  },

  // ============================================================================
  // LEGS - Compound
  // ============================================================================
  {
    name: 'Back Squat',
    category: 'compound',
    muscleGroups: ['legs', 'core'],
    equipment: 'barbell',
    description: 'King of leg exercises. Depth is key.',
  },
  {
    name: 'Front Squat',
    category: 'compound',
    muscleGroups: ['legs', 'core'],
    equipment: 'barbell',
    description: 'Quad-dominant squat variation. Upright torso.',
  },
  {
    name: 'Romanian Deadlift',
    category: 'compound',
    muscleGroups: ['legs', 'back'],
    equipment: 'barbell',
    description: 'Hamstring and glute builder. Hip hinge pattern.',
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'dumbbell',
    description: 'Unilateral leg killer. Rear foot elevated.',
  },
  {
    name: 'Leg Press',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Machine quad and glute builder. Full ROM.',
  },
  {
    name: 'Lunges',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'dumbbell',
    description: 'Walking or stationary. Great for balance and unilateral strength.',
  },
  {
    name: 'Hack Squat',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Machine squat variation. Quad emphasis.',
  },
  {
    name: 'Step-Ups',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'dumbbell',
    description: 'Functional unilateral movement. Control the descent.',
  },

  // LEGS - Isolation
  {
    name: 'Leg Extension',
    category: 'isolation',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Quad isolation. Squeeze at top, control eccentric.',
  },
  {
    name: 'Leg Curl',
    category: 'isolation',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Hamstring isolation. Full ROM crucial.',
  },
  {
    name: 'Calf Raises',
    category: 'isolation',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Standing or seated calf work. Full stretch and contraction.',
  },
  {
    name: 'Hip Thrust',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'barbell',
    description: 'Glute builder. Squeeze at top, drive through heels.',
  },
  {
    name: 'Glute Bridge',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'barbell',
    description: 'Floor variation of hip thrust. Great for glute activation.',
  },

  // ============================================================================
  // ARMS - Biceps
  // ============================================================================
  {
    name: 'Barbell Curl',
    category: 'isolation',
    muscleGroups: ['biceps'],
    equipment: 'barbell',
    description: 'Classic bicep builder. Keep elbows locked.',
  },
  {
    name: 'Dumbbell Curl',
    category: 'isolation',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    description: 'Alternating or simultaneous. Control the negative.',
  },
  {
    name: 'Hammer Curl',
    category: 'isolation',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    description: 'Neutral grip curl. Hits brachialis.',
  },
  {
    name: 'Preacher Curl',
    category: 'isolation',
    muscleGroups: ['biceps'],
    equipment: 'barbell',
    description: 'Strict curl variation. Eliminates momentum.',
  },
  {
    name: 'Cable Curl',
    category: 'isolation',
    muscleGroups: ['biceps'],
    equipment: 'cable',
    description: 'Constant tension bicep work.',
  },
  {
    name: 'Concentration Curl',
    category: 'isolation',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    description: 'Seated, strict curl. Peak contraction focus.',
  },

  // ARMS - Triceps
  {
    name: 'Close-Grip Bench Press',
    category: 'compound',
    muscleGroups: ['triceps', 'chest'],
    equipment: 'barbell',
    description: 'Compound tricep builder. Hands shoulder-width.',
  },
  {
    name: 'Tricep Dips',
    category: 'compound',
    muscleGroups: ['triceps', 'chest'],
    equipment: 'bodyweight',
    description: 'Upright torso for tricep emphasis.',
  },
  {
    name: 'Overhead Tricep Extension',
    category: 'isolation',
    muscleGroups: ['triceps'],
    equipment: 'dumbbell',
    description: 'Stretches long head. Full ROM crucial.',
  },
  {
    name: 'Tricep Pushdown',
    category: 'isolation',
    muscleGroups: ['triceps'],
    equipment: 'cable',
    description: 'Cable tricep isolation. Various attachments work.',
  },
  {
    name: 'Skull Crushers',
    category: 'isolation',
    muscleGroups: ['triceps'],
    equipment: 'barbell',
    description: 'Lying tricep extension. Lower to forehead, extend fully.',
  },
  {
    name: 'Diamond Push-Ups',
    category: 'compound',
    muscleGroups: ['triceps', 'chest'],
    equipment: 'bodyweight',
    description: 'Hands in diamond formation. Tricep emphasis.',
  },

  // ============================================================================
  // CORE
  // ============================================================================
  {
    name: 'Plank',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    description: 'Isometric core hold. Neutral spine, squeeze glutes.',
  },
  {
    name: 'Side Plank',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    description: 'Lateral core stability. Stack feet, lift hips.',
  },
  {
    name: 'Hanging Leg Raises',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    description: 'Hanging ab work. Control the swing.',
  },
  {
    name: 'Cable Crunches',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'cable',
    description: 'Kneeling rope crunches. Flex spine, not hips.',
  },
  {
    name: 'Russian Twists',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'dumbbell',
    description: 'Rotational core work. Keep chest up.',
  },
  {
    name: 'Ab Wheel Rollouts',
    category: 'compound',
    muscleGroups: ['core', 'shoulders'],
    equipment: 'bodyweight',
    description: 'Advanced ab exercise. Brace core hard.',
  },
  {
    name: 'Bicycle Crunches',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    description: 'Alternating crunch with rotation. Slow and controlled.',
  },
  {
    name: 'Mountain Climbers',
    category: 'cardio',
    muscleGroups: ['core', 'legs'],
    equipment: 'bodyweight',
    description: 'Dynamic core and cardio. Drive knees to chest.',
  },

  // ============================================================================
  // CARDIO & CONDITIONING
  // ============================================================================
  {
    name: 'Running',
    category: 'cardio',
    muscleGroups: ['legs', 'core'],
    equipment: 'bodyweight',
    description: 'Classic cardio. Outdoor or treadmill.',
  },
  {
    name: 'Cycling',
    category: 'cardio',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Low-impact cardio. Stationary or road bike.',
  },
  {
    name: 'Rowing',
    category: 'cardio',
    muscleGroups: ['back', 'legs', 'core'],
    equipment: 'machine',
    description: 'Full-body cardio. Push with legs, pull with back.',
  },
  {
    name: 'Jump Rope',
    category: 'cardio',
    muscleGroups: ['legs', 'core'],
    equipment: 'bodyweight',
    description: 'High-intensity cardio. Great for conditioning.',
  },
  {
    name: 'Burpees',
    category: 'cardio',
    muscleGroups: ['full-body'],
    equipment: 'bodyweight',
    description: 'Full-body conditioning. Drop, push-up, jump.',
  },
  {
    name: 'Battle Ropes',
    category: 'cardio',
    muscleGroups: ['shoulders', 'core'],
    equipment: 'cable',
    description: 'High-intensity upper body cardio. Waves or slams.',
  },
  {
    name: 'Box Jumps',
    category: 'cardio',
    muscleGroups: ['legs'],
    equipment: 'bodyweight',
    description: 'Explosive leg power. Land softly, step down.',
  },
  {
    name: 'Stair Climber',
    category: 'cardio',
    muscleGroups: ['legs'],
    equipment: 'machine',
    description: 'Low-impact leg cardio. Steady pace.',
  },
  {
    name: 'Elliptical',
    category: 'cardio',
    muscleGroups: ['legs', 'core'],
    equipment: 'machine',
    description: 'Low-impact full-body cardio.',
  },
  {
    name: 'Swimming',
    category: 'cardio',
    muscleGroups: ['full-body'],
    equipment: 'bodyweight',
    description: 'Low-impact full-body cardio. Various strokes.',
  },

  // ============================================================================
  // OLYMPIC LIFTS & POWER
  // ============================================================================
  {
    name: 'Power Clean',
    category: 'compound',
    muscleGroups: ['full-body'],
    equipment: 'barbell',
    description: 'Explosive Olympic lift. Pull from floor to shoulders.',
  },
  {
    name: 'Hang Clean',
    category: 'compound',
    muscleGroups: ['full-body'],
    equipment: 'barbell',
    description: 'Clean from hang position. Less technical than floor.',
  },
  {
    name: 'Push Jerk',
    category: 'compound',
    muscleGroups: ['shoulders', 'legs', 'core'],
    equipment: 'barbell',
    description: 'Explosive overhead press with leg drive and dip.',
  },
  {
    name: 'Snatch',
    category: 'compound',
    muscleGroups: ['full-body'],
    equipment: 'barbell',
    description: 'Most technical Olympic lift. Floor to overhead.',
  },
  {
    name: 'Clean and Jerk',
    category: 'compound',
    muscleGroups: ['full-body'],
    equipment: 'barbell',
    description: 'Two-part Olympic lift. Clean to shoulders, jerk overhead.',
  },

  // ============================================================================
  // FUNCTIONAL & BODYWEIGHT
  // ============================================================================
  {
    name: 'Farmer Walk',
    category: 'compound',
    muscleGroups: ['full-body'],
    equipment: 'dumbbell',
    description: 'Carry heavy weights. Builds grip and core.',
  },
  {
    name: 'Turkish Get-Up',
    category: 'compound',
    muscleGroups: ['full-body'],
    equipment: 'dumbbell',
    description: 'Complex movement from floor to standing. One weight overhead.',
  },
  {
    name: 'Kettlebell Swings',
    category: 'compound',
    muscleGroups: ['legs', 'back', 'core'],
    equipment: 'dumbbell',
    description: 'Explosive hip hinge. Drive with hips, not arms.',
  },
  {
    name: 'Wall Balls',
    category: 'compound',
    muscleGroups: ['legs', 'shoulders'],
    equipment: 'medicine ball',
    description: 'Squat and throw medicine ball to target.',
  },
  {
    name: 'Sled Push',
    category: 'compound',
    muscleGroups: ['legs', 'core'],
    equipment: 'machine',
    description: 'Push loaded sled. Low handles for speed, high for power.',
  },
  {
    name: 'Sled Pull',
    category: 'compound',
    muscleGroups: ['back', 'legs'],
    equipment: 'cable',
    description: 'Pull loaded sled backward or forward.',
  },

  // ============================================================================
  // ADDITIONAL COMPOUND MOVEMENTS
  // ============================================================================
  {
    name: 'Sumo Deadlift',
    category: 'compound',
    muscleGroups: ['legs', 'back'],
    equipment: 'barbell',
    description: 'Wide stance deadlift. More quad and glute emphasis.',
  },
  {
    name: 'Trap Bar Deadlift',
    category: 'compound',
    muscleGroups: ['legs', 'back'],
    equipment: 'barbell',
    description: 'Hex bar deadlift. More quad dominant, easier on back.',
  },
  {
    name: 'Zercher Squat',
    category: 'compound',
    muscleGroups: ['legs', 'core'],
    equipment: 'barbell',
    description: 'Bar in elbow crooks. Extreme core demand.',
  },
  {
    name: 'Goblet Squat',
    category: 'compound',
    muscleGroups: ['legs'],
    equipment: 'dumbbell',
    description: 'Hold weight at chest, squat deep. Great for learning pattern.',
  },
  {
    name: 'Pause Squat',
    category: 'compound',
    muscleGroups: ['legs', 'core'],
    equipment: 'barbell',
    description: 'Pause at bottom of squat. Builds strength out of hole.',
  },

  // ============================================================================
  // GRIP & FOREARMS
  // ============================================================================
  {
    name: 'Wrist Curls',
    category: 'isolation',
    muscleGroups: ['forearms'],
    equipment: 'dumbbell',
    description: 'Forearm isolation. Palms up on bench.',
  },
  {
    name: 'Reverse Wrist Curls',
    category: 'isolation',
    muscleGroups: ['forearms'],
    equipment: 'dumbbell',
    description: 'Forearm extensors. Palms down.',
  },
  {
    name: 'Dead Hang',
    category: 'isolation',
    muscleGroups: ['forearms', 'back'],
    equipment: 'bodyweight',
    description: 'Hang from bar. Builds grip endurance.',
  },
];

async function seedExercises() {
  console.log('🌱 Seeding exercise library...');

  try {
    // Clear existing exercises
    await prisma.exercise.deleteMany({});
    console.log('✅ Cleared existing exercises');

    // Create exercises
    let created = 0;
    for (const exercise of exercises) {
      await prisma.exercise.create({
        data: exercise,
      });
      created++;
    }

    console.log(`✅ Created ${created} exercises`);
    console.log('\n📊 Summary by category:');

    const compound = exercises.filter(e => e.category === 'compound').length;
    const isolation = exercises.filter(e => e.category === 'isolation').length;
    const cardio = exercises.filter(e => e.category === 'cardio').length;

    console.log(`  - Compound: ${compound}`);
    console.log(`  - Isolation: ${isolation}`);
    console.log(`  - Cardio: ${cardio}`);

    console.log('\n📊 Summary by equipment:');
    const equipmentCounts = exercises.reduce((acc, e) => {
      acc[e.equipment] = (acc[e.equipment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(equipmentCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([equipment, count]) => {
        console.log(`  - ${equipment}: ${count}`);
      });

    console.log('\n✨ Exercise library seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedExercises();
}

export { exercises, seedExercises };
