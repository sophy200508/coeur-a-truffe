import { Alert, Platform } from 'react-native';

let Notifications, Device;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (_) {
  Notifications = null; Device = null;
}

// règle iOS : notifications en foreground = alert simple
if (Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false,
    }),
  });
}

async function ensurePerms() {
  if (!Notifications || !Device) return false;
  if (!Device.isDevice) { Alert.alert('Rappels','Les notifications doivent être testées sur un appareil.'); return false; }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') { Alert.alert('Rappels','Permission refusée.'); return false; }
  return true;
}

/**
 * plan = { days:[0..6], time:{hour,minute}, weeks:number, title?:string, body?:string }
 */
export async function schedulePlan(plan) {
  if (!Notifications || !Device) {
    Alert.alert('Rappels', 'Module notifications indisponible. (fallback sans planification)');
    return;
  }
  const ok = await ensurePerms();
  if (!ok) return;

  // On annule tout d’abord
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const msPerWeek = 7*24*60*60*1000;
  const end = new Date(now.getTime() + plan.weeks * msPerWeek);

  const title = plan.title || 'Rappel';
  const body  = plan.body  || 'Petit apprentissage aujourd’hui 💜';

  // On planifie une notif pour chaque jour sélectionné, chaque semaine jusqu’à la fin
  for (let w = 0; w < plan.weeks; w++) {
    for (const d of plan.days) {
      const dt = new Date(now);
      // JS: 0=dim … 6=sam
      const currentDow = dt.getDay();
      const deltaDays = (d - currentDow + 7) % 7 + w*7;
      dt.setDate(dt.getDate() + deltaDays);
      dt.setHours(plan.time.hour, plan.time.minute, 0, 0);
      if (dt <= end) {
        await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: { date: dt },
        });
      }
    }
  }
  if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function clearReminder() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
