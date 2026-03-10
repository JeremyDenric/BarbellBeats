import { Platform } from 'react-native';
import { z } from 'zod';
import safeStorage from '../utils/safeStorage';
import * as Sentry from '@sentry/react-native';
import devLog from '../utils/devLog';

// Lazy-loaded notifications module to avoid initialization errors
let NotificationsModule: typeof import('expo-notifications') | null = null;
let notificationsLoadFailed = false;

async function getNotifications() {
  if (notificationsLoadFailed) return null;
  if (NotificationsModule) return NotificationsModule;

  try {
    NotificationsModule = await import('expo-notifications');
    return NotificationsModule;
  } catch (error) {
    devLog.warn('[Notifications] Failed to load expo-notifications:', error);
    notificationsLoadFailed = true;
    return null;
  }
}

// Synchronous getter for cases where we know it's already loaded
function getNotificationsSync() {
  return NotificationsModule;
}

export type ReminderSchedule = 'daily' | 'weekdays';

export type PersonalizedNotificationCategory =
  | 'promotions'
  | 'restocks'
  | 'feature-updates'
  | 'gym-updates'
  | 'music-insights';

export type NotificationSettings = {
  workoutRemindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderSchedule: ReminderSchedule;
  overtrainingAlertsEnabled: boolean;
  calorieThreshold: number;
  personalizedEnabled: boolean;
  personalizedWeeklyCap: number;
  quietHoursEnabled: boolean;
  quietStartHour: number;
  quietStartMinute: number;
  quietEndHour: number;
  quietEndMinute: number;
  promotionsEnabled: boolean;
  restocksEnabled: boolean;
  featureUpdatesEnabled: boolean;
  gymUpdatesEnabled: boolean;
  musicInsightsEnabled: boolean;
};

const SETTINGS_KEY = '@notification_settings';
const REMINDER_IDS_KEY = '@workout_reminder_ids';
const PERSONALIZED_LOG_KEY = '@personalized_notification_log';
const PERSONALIZED_CHANNEL_ID = 'personalized-updates';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  workoutRemindersEnabled: false,
  reminderHour: 7,
  reminderMinute: 0,
  reminderSchedule: 'daily',
  overtrainingAlertsEnabled: false,
  calorieThreshold: 700,
  personalizedEnabled: false,
  personalizedWeeklyCap: 2,
  quietHoursEnabled: true,
  quietStartHour: 21,
  quietStartMinute: 0,
  quietEndHour: 8,
  quietEndMinute: 0,
  promotionsEnabled: false,
  restocksEnabled: false,
  featureUpdatesEnabled: true,
  gymUpdatesEnabled: true,
  musicInsightsEnabled: true,
};

let handlerInitialized = false;

export async function initializeNotifications() {
  if (handlerInitialized) return;

  const Notifications = await getNotifications();
  if (!Notifications) {
    devLog.warn('[Notifications] Module not available, skipping initialization');
    return;
  }

  handlerInitialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as { type?: string } | undefined;
      const isPersonalized = data?.type === 'personalized';
      return {
        shouldShowAlert: true,
        shouldPlaySound: !isPersonalized,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CBFF00',
    }).catch((error) => {
      devLog.warn('Failed to set notification channel:', error);
    });

    Notifications.setNotificationChannelAsync(PERSONALIZED_CHANNEL_ID, {
      name: 'Personalized updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
      lightColor: '#CBFF00',
    }).catch((error) => {
      devLog.warn('Failed to set personalized channel:', error);
    });
  }
}

// Schema for notification settings validation
const NotificationSettingsSchema = z.object({
  workoutRemindersEnabled: z.boolean(),
  reminderHour: z.number().min(0).max(23),
  reminderMinute: z.number().min(0).max(59),
  reminderSchedule: z.enum(['daily', 'weekdays']),
  overtrainingAlertsEnabled: z.boolean(),
  calorieThreshold: z.number(),
  personalizedEnabled: z.boolean(),
  personalizedWeeklyCap: z.number(),
  quietHoursEnabled: z.boolean(),
  quietStartHour: z.number().min(0).max(23),
  quietStartMinute: z.number().min(0).max(59),
  quietEndHour: z.number().min(0).max(23),
  quietEndMinute: z.number().min(0).max(59),
  promotionsEnabled: z.boolean(),
  restocksEnabled: z.boolean(),
  featureUpdatesEnabled: z.boolean(),
  gymUpdatesEnabled: z.boolean(),
  musicInsightsEnabled: z.boolean(),
});

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const stored = await safeStorage.getJSON<NotificationSettings>(SETTINGS_KEY, {
    schema: NotificationSettingsSchema,
    defaultValue: DEFAULT_NOTIFICATION_SETTINGS,
  });

  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...stored };
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  const success = await safeStorage.setJSON(SETTINGS_KEY, settings, {
    schema: NotificationSettingsSchema,
  });

  if (!success && !__DEV__) {
    Sentry.captureMessage('Failed to save notification settings', {
      level: 'error',
      tags: { service: 'notifications', operation: 'save' },
    });
  }
}

export async function requestNotificationPermission() {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const request = await Notifications.requestPermissionsAsync();
  return request.status === 'granted';
}

export async function cancelWorkoutReminders() {
  const ids = await safeStorage.getJSON<string[]>(REMINDER_IDS_KEY, {
    schema: z.array(z.string()),
    defaultValue: [],
  });

  if (ids && ids.length > 0) {
    const Notifications = await getNotifications();
    if (Notifications) {
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    }
  }
  await safeStorage.remove(REMINDER_IDS_KEY);
}

async function scheduleDailyReminder(hour: number, minute: number) {
  const Notifications = await getNotifications();
  if (!Notifications) return [];

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Workout time',
      body: 'Your next session is waiting. Let\'s move.',
      sound: true,
    },
    trigger: {
      type: 'calendar',
      hour,
      minute,
      repeats: true,
      ...(Platform.OS === 'android' && { channelId: 'workout-reminders' }),
    } as any,
  });
  return [id];
}

async function scheduleWeekdayReminders(hour: number, minute: number) {
  const Notifications = await getNotifications();
  if (!Notifications) return [];

  const ids: string[] = [];
  for (let weekday = 2; weekday <= 6; weekday += 1) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekday workout',
        body: 'Keep the streak alive. Your plan is ready.',
        sound: true,
      },
      trigger: {
        type: 'calendar',
        weekday,
        hour,
        minute,
        repeats: true,
        ...(Platform.OS === 'android' && { channelId: 'workout-reminders' }),
      } as any,
    });
    ids.push(id);
  }
  return ids;
}

export async function scheduleWorkoutReminders(settings: NotificationSettings) {
  await cancelWorkoutReminders();
  if (!settings.workoutRemindersEnabled) return [];

  const ids =
    settings.reminderSchedule === 'weekdays'
      ? await scheduleWeekdayReminders(settings.reminderHour, settings.reminderMinute)
      : await scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);

  await safeStorage.setJSON(REMINDER_IDS_KEY, ids);
  return ids;
}

export async function sendOvertrainingAlert(calories: number, threshold: number) {
  if (calories < threshold) return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ease up a bit',
      body: `You burned ${calories} calories. Consider a cooldown to prevent overtraining.`,
      sound: true,
    },
    trigger: null,
  });
}

type PersonalizedLog = {
  weekStart: string;
  count: number;
  lastSentAt?: string;
};

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function isWithinQuietHours(date: Date, settings: NotificationSettings) {
  if (!settings.quietHoursEnabled) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const start = settings.quietStartHour * 60 + settings.quietStartMinute;
  const end = settings.quietEndHour * 60 + settings.quietEndMinute;
  if (start === end) return false;
  if (start < end) {
    return minutes >= start && minutes < end;
  }
  return minutes >= start || minutes < end;
}

function isCategoryEnabled(category: PersonalizedNotificationCategory, settings: NotificationSettings) {
  switch (category) {
    case 'promotions':
      return settings.promotionsEnabled;
    case 'restocks':
      return settings.restocksEnabled;
    case 'feature-updates':
      return settings.featureUpdatesEnabled;
    case 'gym-updates':
      return settings.gymUpdatesEnabled;
    case 'music-insights':
      return settings.musicInsightsEnabled;
    default:
      return false;
  }
}

const PersonalizedLogSchema = z.object({
  weekStart: z.string(),
  count: z.number(),
  lastSentAt: z.string().optional(),
});

async function getPersonalizedLog() {
  const stored = await safeStorage.getJSON<PersonalizedLog>(PERSONALIZED_LOG_KEY, {
    schema: PersonalizedLogSchema,
    defaultValue: { weekStart: getWeekStart(new Date()), count: 0 },
  });

  if (!stored) {
    return { weekStart: getWeekStart(new Date()), count: 0 } as PersonalizedLog;
  }

  const currentWeekStart = getWeekStart(new Date());
  if (stored.weekStart !== currentWeekStart) {
    return { weekStart: currentWeekStart, count: 0 } as PersonalizedLog;
  }
  return stored;
}

async function savePersonalizedLog(log: PersonalizedLog) {
  await safeStorage.setJSON(PERSONALIZED_LOG_KEY, log, {
    schema: PersonalizedLogSchema,
  });
}

export async function sendPersonalizedNotification(payload: {
  title: string;
  body: string;
  category: PersonalizedNotificationCategory;
  data?: Record<string, string>;
}) {
  const settings = await getNotificationSettings();
  if (!settings.personalizedEnabled) {
    return { sent: false, reason: 'disabled' as const };
  }
  if (!isCategoryEnabled(payload.category, settings)) {
    return { sent: false, reason: 'category-disabled' as const };
  }
  if (isWithinQuietHours(new Date(), settings)) {
    return { sent: false, reason: 'quiet-hours' as const };
  }

  const log = await getPersonalizedLog();
  if (log.count >= settings.personalizedWeeklyCap) {
    return { sent: false, reason: 'weekly-cap' as const };
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return { sent: false, reason: 'unavailable' as const };
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    return { sent: false, reason: 'permission' as const };
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      sound: false,
      data: { ...payload.data, type: 'personalized', category: payload.category },
    },
    trigger: null,
  });

  const nextLog: PersonalizedLog = {
    weekStart: log.weekStart,
    count: log.count + 1,
    lastSentAt: new Date().toISOString(),
  };
  await savePersonalizedLog(nextLog);

  return { sent: true as const };
}
