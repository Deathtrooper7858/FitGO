import { Platform } from 'react-native';
import { Reminder } from '../store/types';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// We use lazy loading for expo-notifications to avoid the "remote notifications removed" error
// that crashes Expo Go on Android even when only using local notifications.
let NotificationsModule: any = null;
let notificationHandlerSet = false;

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
        AndroidImportance: { MAX: 4 }
      };
    }
  }
  return NotificationsModule;
}

export async function requestNotificationPermissions() {
  const notif = getNotifications();
  if (notif._isMock) return null;

  try {
    if (Platform.OS === 'android') {
      await notif.setNotificationChannelAsync('default', {
        name: 'default',
        importance: notif.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C5CFC',
      });
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

    const id = await notif.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
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
        title: "FitGO Test 🔔",
        body: "If you're reading this, notifications are working perfectly!",
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[Notifications] Test notification error:', e);
  }
}

export async function triggerInstantNotification(title: string, body: string, data?: any) {
  const notif = getNotifications();
  if (notif._isMock) return;
  try {
    await notif.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
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
    await notif.setNotificationChannelAsync('default', {
      name: 'default',
      importance: notif.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C5CFC',
    });
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

