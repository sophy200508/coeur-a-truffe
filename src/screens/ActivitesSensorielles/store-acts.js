import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'acts_sensorielles_v1';

// structure:
// {
//   favorites: { [activityId]: true },
//   sessions: [ { id, activityId, ts, durationMin, notes?, rating?(1..5) } ]
// }

function assure(data) {
  const d = data || {};
  d.favorites = d.favorites && typeof d.favorites === 'object' ? d.favorites : {};
  d.sessions = Array.isArray(d.sessions) ? d.sessions : [];
  return d;
}

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return assure(raw ? JSON.parse(raw) : {});
  } catch {
    return assure({});
  }
}
async function write(d) { await AsyncStorage.setItem(KEY, JSON.stringify(assure(d))); }
function uid() { return String(Date.now()) + '-' + Math.random().toString(16).slice(2); }

export async function getState() { return await read(); }

export async function toggleFavorite(activityId) {
  const d = await read();
  d.favorites[activityId] = !d.favorites[activityId];
  await write(d);
  return d.favorites;
}

export async function addSession({ activityId, durationMin, notes, rating }) {
  const d = await read();
  d.sessions = [{ id: uid(), activityId, ts: Date.now(), durationMin, notes, rating }, ...d.sessions].slice(0,500);
  await write(d);
  return d.sessions;
}

export async function removeSession(id) {
  const d = await read();
  d.sessions = d.sessions.filter(s => s.id !== id);
  await write(d);
  return d.sessions;
}

export async function statsLast7d() {
  const d = await read();
  const now = Date.now();
  const last7 = d.sessions.filter(s => now - s.ts < 7 * 86400000);
  const totalMin = last7.reduce((a, s) => a + (s.durationMin || 0), 0);
  const count = last7.length;
  return { count7: count, minutes7: totalMin };
}
