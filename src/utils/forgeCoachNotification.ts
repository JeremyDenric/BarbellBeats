import * as Notifications from 'expo-notifications';
import devLog from './devLog';

type SessionDayType = 'push' | 'pull' | 'legs' | 'upper' | 'full_body' | 'deload' | 'cardio';

const DAY_TYPE_LABELS: Record<SessionDayType, string> = {
  push:      'Push Day',
  pull:      'Pull Day',
  legs:      'Leg Day',
  upper:     'Upper Body',
  full_body: 'Full Body',
  deload:    'Deload Session',
  cardio:    'Cardio Session',
};

const MUSIC_PREVIEWS: Record<SessionDayType, string> = {
  push:      '135 BPM · Hip-hop / Trap',
  pull:      '145 BPM · Rock / Metal',
  legs:      '148 BPM · EDM / Electronic',
  upper:     '120 BPM · Hip-hop / R&B',
  full_body: '130 BPM · Electronic / Hip-hop',
  deload:    '90 BPM · Lo-fi / Chill',
  cardio:    '128 BPM · Pop / Dance',
};

const RPE_ADVICE: Record<'light' | 'moderate' | 'hard', string> = {
  light:    'You have gas in the tank — push the weights up this session.',
  moderate: 'Solid effort last time. Hold your targets and add where it feels right.',
  hard:     'High intensity last session. Keep loads the same and focus on form today.',
};

export interface ForgeCoachNotificationParams {
  nextWorkoutName: string;
  dayType: SessionDayType;
  recentRpe?: number;
}

export async function scheduleForgeCoachNotification({
  nextWorkoutName,
  dayType,
  recentRpe,
}: ForgeCoachNotificationParams): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      if (requested !== 'granted') {
        devLog.warn('[ForgeCoach] Notification permission denied');
        return;
      }
    }

    // Determine weight advice from most recent RPE
    let rpeCategory: 'light' | 'moderate' | 'hard' = 'moderate';
    if (recentRpe !== undefined) {
      if (recentRpe <= 5) rpeCategory = 'light';
      else if (recentRpe >= 9) rpeCategory = 'hard';
    }

    const label = DAY_TYPE_LABELS[dayType] ?? nextWorkoutName;
    const music = MUSIC_PREVIEWS[dayType] ?? '';
    const advice = RPE_ADVICE[rpeCategory];

    const fireDate = new Date();
    fireDate.setHours(fireDate.getHours() + 18);

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Tomorrow: ${label}`,
        body: `${advice} · Playlist: ${music}`,
        data: { type: 'forge_coach', dayType },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });

    devLog.log('[ForgeCoach] Notification scheduled for', fireDate.toISOString());
  } catch (err) {
    devLog.error('[ForgeCoach] Failed to schedule notification:', err);
  }
}
