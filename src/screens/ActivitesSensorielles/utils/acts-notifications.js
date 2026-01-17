import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Permission
 */
async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Annule tout
 */
export async function clearReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Ancienne compat: un seul rappel quotidien
 */
export async function setDailyReminder(hour = 18, minute = 0) {
  const ok = await ensurePermission();
  if (!ok) return null;
  await clearReminder();
  return Notifications.scheduleNotificationAsync({
    content: { title: '🐾 Rappel', body: 'Pense à ta séance avec ton chien !' },
    trigger: { hour, minute, repeats: true },
  });
}

/**
 * Plusieurs rappels quotidiens (liste d’horaires) — compat
 */
export async function setReminders(times /* [{hour,minute}] */) {
  const ok = await ensurePermission();
  if (!ok) return [];
  await clearReminder();
  const ids = [];
  for (const t of times || []) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: '🐾 Rappel', body: 'Pense à la nutrition/hydratation 💧🍽️' },
      trigger: { hour: clamp(t.hour,0,23), minute: clamp(t.minute,0,59), repeats: true },
    });
    ids.push(id);
  }
  return ids;
}

/**
 * ✅ Plan avancé : choisis les jours de semaine, l’heure, et une durée (en semaines)
 *
 * plan = {
 *   title?: string, body?: string,
 *   days: [0..6]            // 0=dimanche, 1=lundi, ...
 *   time: { hour, minute },
 *   startDate?: number      // optional, ms (par défaut: aujourd’hui)
 *   weeks: number           // ex: 8 → planifie jusqu’à +8 semaines
 * }
 *
 * Implémentation:
 * - on GENÈRE TOUTES les occurrences entre startDate et startDate+weeks
 * - on programme des notifications NON répétées (repeats:false)
 * - plus fiable pour arrêter automatiquement après la période
 */
export async function schedulePlan(plan) {
  const ok = await ensurePermission();
  if (!ok) return [];

  const {
    days = [1,2,3,4,5],             // lun..ven par défaut
    time = { hour: 18, minute: 0 },
    startDate = Date.now(),
    weeks = 8,
    title = '🐾 Rappel',
    body = 'N’oublie pas de noter nutrition & hydratation.',
  } = plan || {};

  // On annule tout avant de reprogrammer ce plan
  await clearReminder();

  const end = addDays(startDate, Math.max(1, weeks) * 7);
  const occurrences = computeOccurrences(days, time, startDate, end);

  const ids = [];
  for (const ts of occurrences) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: new Date(ts), // NON répété, notification à une date précise
    });
    ids.push(id);
  }
  return ids;
}

/* ---------------- utils ---------------- */
const clamp = (n,min,max) => Math.max(min, Math.min(max, Number(n||0)));
function addDays(ts, d) { const dt = new Date(ts); dt.setDate(dt.getDate()+d); return dt.getTime(); }

/**
 * Retourne une liste de timestamps (ms) pour chaque (jour + heure:minute)
 * compris entre start (inclus) et end (exclu).
 * days: [0..6] -> 0=dimanche.
 */
function computeOccurrences(days, time, start, end) {
  const want = new Set((days||[]).map(d => clamp(d,0,6)));
  const out = [];
  const cur = new Date(start);
  cur.setHours(0,0,0,0);

  while (cur.getTime() < end) {
    const dow = cur.getDay(); // 0..6
    if (want.has(dow)) {
      const fire = new Date(cur);
      fire.setHours(clamp(time.hour,0,23), clamp(time.minute,0,59), 0, 0);
      if (fire.getTime() >= start && fire.getTime() < end) out.push(fire.getTime());
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
