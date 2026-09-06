import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Reminder } from '../store/types';
import i18n from '../i18n';
import { EXPO_PUSH_URL } from '../constants/urls';

// We use lazy loading for expo-notifications to avoid the "remote notifications removed" error
// that crashes Expo Go on Android even when only using local notifications.
let NotificationsModule: any = null;
let notificationHandlerSet = false;

// ── Canal definitions ─────────────────────────────────────────────────────────
// Each category gets its own Android channel with distinct importance/color/vibration
export const CHANNELS = {
  messages: {
    id: 'messages',
    get name() { return '💬 ' + i18n.t('notifications.channels.messages'); },
    get description() { return i18n.t('notifications.channels.messagesDesc'); },
    importance: 5, // IMPORTANCE_HIGH
    lightColor: '#7C5CFC',
    vibrationPattern: [0, 100, 50, 100],
  },
  social: {
    id: 'social',
    get name() { return '👥 ' + i18n.t('notifications.channels.social'); },
    get description() { return i18n.t('notifications.channels.socialDesc'); },
    importance: 4, // IMPORTANCE_DEFAULT
    lightColor: '#4FC3F7',
    vibrationPattern: [0, 200, 100, 200],
  },
  nutrition: {
    id: 'nutrition',
    get name() { return '🥗 ' + i18n.t('notifications.channels.nutrition'); },
    get description() { return i18n.t('notifications.channels.nutritionDesc'); },
    importance: 3, // IMPORTANCE_LOW
    lightColor: '#81C784',
    vibrationPattern: [0, 150],
  },
  fitness: {
    id: 'fitness',
    get name() { return '🏋️ ' + i18n.t('notifications.channels.fitness'); },
    get description() { return i18n.t('notifications.channels.fitnessDesc'); },
    importance: 4,
    lightColor: '#FFB74D',
    vibrationPattern: [0, 200, 100, 200],
  },
  achievements: {
    id: 'achievements',
    get name() { return '🏆 ' + i18n.t('notifications.channels.achievements'); },
    get description() { return i18n.t('notifications.channels.achievementsDesc'); },
    importance: 5,
    lightColor: '#FFD700',
    vibrationPattern: [0, 100, 80, 100, 80, 300],
  },
  reminders: {
    id: 'reminders',
    get name() { return '⏰ ' + i18n.t('notifications.channels.reminders'); },
    get description() { return i18n.t('notifications.channels.remindersDesc'); },
    importance: 3,
    lightColor: '#CE93D8',
    vibrationPattern: [0, 250, 250, 250],
  },
  default: {
    id: 'default',
    name: 'FitGO',
    get description() { return i18n.t('notifications.channels.defaultDesc'); },
    importance: 4,
    lightColor: '#7C5CFC',
    vibrationPattern: [0, 250, 250, 250],
  },
} as const;

export type ChannelKey = keyof typeof CHANNELS;

function getNotifications() {
  if (NotificationsModule === null) {
    try {
      // Use require for lazy loading
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const notif = require('expo-notifications');
      
      // In some environments, it might be nested under .default
      NotificationsModule = notif.default || notif;

      if (NotificationsModule && !notificationHandlerSet && typeof NotificationsModule.setNotificationHandler === 'function') {
        NotificationsModule.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationHandlerSet = true;
      }
    } catch (e) {
      console.warn('[Notifications] Failed to load expo-notifications:', e);
      // Fallback to a mock to prevent crashes
      NotificationsModule = {
        _isMock: true,
        requestPermissionsAsync: async () => ({ status: 'denied' }),
        getPermissionsAsync: async () => ({ status: 'denied' }),
        setNotificationChannelAsync: async () => {},
        scheduleNotificationAsync: async () => 'mock-id',
        cancelScheduledNotificationAsync: async () => {},
        cancelAllScheduledNotificationsAsync: async () => {},
        getExpoPushTokenAsync: async () => ({ data: 'mock-token' }),
        AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 }
      };
    }
  }
  return NotificationsModule;
}

// ── Setup all channels at once ────────────────────────────────────────────────
async function ensureChannels(notif: any) {
  if (Platform.OS !== 'android') return;
  for (const channel of Object.values(CHANNELS)) {
    try {
      await notif.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        vibrationPattern: channel.vibrationPattern,
        lightColor: channel.lightColor,
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
    } catch {
      // Non-fatal
    }
  }
}

export async function requestNotificationPermissions() {
  const notif = getNotifications();
  if (notif._isMock) return null;

  try {
    if (Platform.OS === 'android') {
      await ensureChannels(notif);
    }

    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (e) {
    console.error('[Notifications] Permission error:', e);
    return null;
  }
}

export async function checkNotificationPermissions(): Promise<boolean> {
  const notif = getNotifications();
  if (notif._isMock) return false;
  try {
    const { status } = await notif.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export function getReminderChannelId(type?: string): string {
  switch (type) {
    case 'meal':
    case 'water':
      return CHANNELS.nutrition.id;
    case 'workout':
      return CHANNELS.fitness.id;
    case 'social':
      return CHANNELS.social.id;
    default:
      return CHANNELS.reminders.id;
  }
}

export async function scheduleReminder(reminder: Reminder): Promise<string | undefined> {
  if (!reminder.enabled) return undefined;
  const notif = getNotifications();
  if (notif._isMock) return undefined;

  try {
    const [hour, minute] = reminder.time.split(':').map(Number);
    const channelId = getReminderChannelId(reminder.type);

    // If no specific days or all 7 days are selected, trigger daily.
    if (!reminder.days || reminder.days.length === 0 || reminder.days.length === 7) {
      const id = await notif.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: true,
          channelId,
          color: '#7C5CFC',
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
          channelId,
        },
      });
      return id;
    }

    // Otherwise, schedule weekly triggers for each specific day
    const ids: string[] = [];
    for (const day of reminder.days) {
      // 0 (Sunday) -> 1, 6 (Saturday) -> 7 for expo-notifications
      const expoWeekday = day + 1;
      const id = await notif.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: true,
          channelId,
          color: '#7C5CFC',
        },
        trigger: {
          type: 'weekly',
          weekday: expoWeekday,
          hour,
          minute,
          channelId,
        },
      });
      if (id) {
        ids.push(id);
      }
    }
    return ids.length > 0 ? ids.join(',') : undefined;
  } catch (e) {
    console.error('[Notifications] Schedule error:', e);
    return undefined;
  }
}

export async function cancelReminder(notificationId?: string | null) {
  if (notificationId) {
    const notif = getNotifications();
    if (notif._isMock) return;
    try {
      const ids = notificationId.split(',');
      for (const id of ids) {
        const trimmed = id.trim();
        if (trimmed) {
          await notif.cancelScheduledNotificationAsync(trimmed);
        }
      }
    } catch (e) {
      console.error('[Notifications] Cancel error:', e);
    }
  }
}

export async function cancelAllReminders() {
  const notif = getNotifications();
  if (notif._isMock) return;
  try {
    await notif.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('[Notifications] Cancel all error:', e);
  }
}

export async function testReminderNotification(reminder: Reminder) {
  const notif = getNotifications();
  if (notif._isMock) {
    console.warn('[Notifications] Testing not available in mock mode');
    return;
  }

  try {
    const channelId = getReminderChannelId(reminder.type);
    await notif.scheduleNotificationAsync({
      content: {
        title: `🔔 ${reminder.title}`,
        body: reminder.body,
        sound: true,
        channelId,
        color: '#7C5CFC',
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[Notifications] Test reminder notification error:', e);
  }
}

export async function sendTestNotification() {
  const notif = getNotifications();
  if (notif._isMock) {
    console.warn('[Notifications] Testing not available in this environment');
    return;
  }
  
  try {
    await notif.scheduleNotificationAsync({
      content: {
        title: '🔔 FitGO Notificaciones',
        body: '¡Las notificaciones están funcionando perfectamente!',
        sound: true,
        channelId: CHANNELS.default.id,
        color: '#7C5CFC',
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[Notifications] Test notification error:', e);
  }
}

export async function triggerInstantNotification(
  title: string,
  body: string,
  data?: any,
  channelKey: ChannelKey = 'default'
) {
  const notif = getNotifications();
  if (notif._isMock) return;
  const channel = CHANNELS[channelKey];
  try {
    await notif.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        channelId: channel.id,
        color: channel.lightColor,
        data,
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[Notifications] Instant notification error:', e);
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  const notif = getNotifications();
  if (notif._isMock) return undefined;

  let token;

  if (Platform.OS === 'android') {
    await ensureChannels(notif);
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return undefined;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.warn('[Notifications] Project ID not found for push notifications');
      }
      token = (await notif.getExpoPushTokenAsync({
        projectId,
      })).data;
    } catch (e: any) {
      // Firebase / FCM not configured in development builds — non-fatal
      const msg = e?.message || String(e);
      if (msg.includes('FirebaseApp') || msg.includes('Firebase')) {
        console.warn('[Notifications] Firebase not configured in this build — push tokens unavailable. This is expected in dev builds without google-services.json.');
      } else {
        console.warn('[Notifications] Error fetching push token:', msg);
      }
      // Return undefined gracefully — app continues to work without push tokens
    }
  } else {
    console.warn('[Notifications] Must use physical device for Push Notifications');
  }

  return token;
}

export async function sendRemotePushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    channelId: CHANNELS.social.id,
    color: CHANNELS.social.lightColor,
  };

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.error('Error sending remote push notification:', e);
  }
}
