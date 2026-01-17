// src/screens/MoiEtMonChien/utils/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

export async function ensureNotifPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: s2 } = await Notifications.requestPermissionsAsync();
    return s2 === 'granted';
  }
  return true;
}

// planifie une notif quotidienne à hour:minute, retourne notifId
export async function scheduleDaily(title, body, hour=9, minute=0) {
  const ok = await ensureNotifPermission();
  if (!ok) return null;

  // Android: canal
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habitudes', importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { hour, minute, repeats: true, channelId: Platform.OS==='android' ? 'habits' : undefined },
  });
  return id;
}

export async function cancelScheduled(id) {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}
