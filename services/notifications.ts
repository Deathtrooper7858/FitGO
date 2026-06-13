import { Platform } from 'react-native';
import { Reminder } from '../store/types';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// We use lazy loading for expo-notifications to avoid the "remote notifications removed" error
// that crashes Expo Go on Android even when only using local notifications.
let NotificationsModule: any = null;
let notificationHandlerSet = false;

// ── Canal definitions ─────────────────────────────────────────────────────────
// Each category gets its own Android channel with distinct importance/color/vibration
export const CHANNELS = {
  messages: {
    id: 'messages',
    name: '💬 Mensajes',
    description: 'Mensajes directos de amigos',
    importance: 5, // IMPORTANCE_HIGH
    lightColor: '#7C5CFC',
    vibrationPattern: [0, 100, 50, 100],
  },
  social: {
    id: 'social',
    name: '👥 Social',
    description: 'Solicitudes de amistad y actividad social',
    importance: 4, // IMPORTANCE_DEFAULT
    lightColor: '#4FC3F7',
    vibrationPattern: [0, 200, 100, 200],
  },
  nutrition: {
    id: 'nutrition',
    name: '🥗 Nutrición',
    description: 'Recordatorios de comidas, calorías e hidratación',
    importance: 3, // IMPORTANCE_LOW
    lightColor: '#81C784',
    vibrationPattern: [0, 150],
  },
  fitness: {
    id: 'fitness',
    name: '🏋️ Fitness',
    description: 'Entrenamientos, rachas y pasos',
    importance: 4,
    lightColor: '#FFB74D',
    vibrationPattern: [0, 200, 100, 200],
  },
  achievements: {
    id: 'achievements',
    name: '🏆 Logros',
    description: 'Logros desbloqueados y recompensas',
    importance: 5,
    lightColor: '#FFD700',
    vibrationPattern: [0, 100, 80, 100, 80, 300],
  },
  reminders: {
    id: 'reminders',
    name: '⏰ Recordatorios',
    description: 'Recordatorios programados',
    importance: 3,
    lightColor: '#CE93D8',
    vibrationPattern: [0, 250, 250, 250],
  },
  default: {
    id: 'default',
    name: 'FitGO',
    description: 'Notificaciones generales de FitGO',
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
    } catch (e) {
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

export async function scheduleReminder(reminder: Reminder): Promise<string | undefined> {
  if (!reminder.enabled) return undefined;
  const notif = getNotifications();
  if (notif._isMock) return undefined;

  try {
    const [hour, minute] = reminder.time.split(':').map(Number);
    const channelId = (reminder.type === 'meal' || reminder.type === 'water')
      ? CHANNELS.nutrition.id
      : CHANNELS.reminders.id;

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
  } catch (e) {
    console.error('[Notifications] Schedule error:', e);
    return undefined;
  }
}

export async function cancelReminder(notificationId: string) {
  if (notificationId) {
    const notif = getNotifications();
    if (notif._isMock) return;
    try {
      await notif.cancelScheduledNotificationAsync(notificationId);
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
    await fetch('https://exp.host/--/api/v2/push/send', {
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
