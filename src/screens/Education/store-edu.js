import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'edu_state_v1';
// shape:
// {
//   favorites: { [skillId]: true },
//   progress: { [skillId]: { success: number, attempts: number } },
//   sessions: [ { id, ts, skillId, durationMin, reps, success, notes, rating } ],
//   reminder: { plan } | null
// }

export async function getState() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { favorites: {}, progress: {}, sessions: [], reminder: null };
}
async function setState(next) { await AsyncStorage.setItem(KEY, JSON.stringify(next)); return next; }

export async function toggleFavorite(id) {
  const st = await getState();
  const fav = { ...(st.favorites || {}) };
  fav[id] = !fav[id];
  await setState({ ...st, favorites: fav });
  return fav;
}

export async function addSession(sess) {
  const st = await getState();
  const sessions = [sess, ...(st.sessions || [])];

  // progression
  const prog = { ...(st.progress || {}) };
  const p = prog[sess.skillId] || { success: 0, attempts: 0 };
  prog[sess.skillId] = {
    success: p.success + (Number(sess.success) || 0),
    attempts: p.attempts + (Number(sess.reps) || 0)
  };

  await setState({ ...st, sessions, progress: prog });
}

export async function removeSession(id) {
  const st = await getState();
  await setState({ ...st, sessions: (st.sessions || []).filter(s => s.id !== id) });
}

export async function stats7d() {
  const st = await getState();
  const now = Date.now();
  const last7 = (st.sessions || []).filter(s => now - s.ts < 7 * 86400000);
  const count7 = last7.length;
  const minutes7 = last7.reduce((a, s) => a + (s.durationMin || 0), 0);
  const successRate =
    last7.reduce((a, s) => a + (s.success || 0), 0) /
    Math.max(1, last7.reduce((a, s) => a + (s.reps || 0), 0));
  return { count7, minutes7, successRate: Math.round(successRate * 100) };
}

export async function saveReminder(rem) {
  const st = await getState();
  return setState({ ...st, reminder: rem });
}

export function percentFor(progress, target) {
  const s = progress?.success || 0;
  const p = Math.min(100, Math.round((s / Math.max(1, target || 30)) * 100));
  return p;
}
