import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'interaction_state_v1';
// state = { favorites: { [id]: true }, sessions: [ {id,ts,interId,category,level,durationMin,intensity,outcome,notes,rating} ], reminder?:{plan} }

export async function getState() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { favorites: {}, sessions: [] };
}
async function saveState(st) { await AsyncStorage.setItem(KEY, JSON.stringify(st)); }

export async function toggleFavorite(id) {
  const st = await getState();
  st.favorites[id] = !st.favorites[id];
  await saveState(st);
  return st.favorites;
}

export async function addSession(payload) {
  const st = await getState();
  const item = {
    id: genId(),
    ts: Date.now(),
    ...payload, // interId, category, level, durationMin, intensity(1..5), outcome('calme','ok','tendu'), notes, rating(1..5)
  };
  st.sessions.unshift(item);
  await saveState(st);
}

export async function removeSession(id) {
  const st = await getState();
  st.sessions = st.sessions.filter(s => s.id !== id);
  await saveState(st);
}

export function percentCalmLast(sessions, days = 7) {
  const since = Date.now() - days * 86400000;
  const list = (sessions||[]).filter(s => s.ts >= since);
  if (!list.length) return 0;
  const calm = list.filter(s => s.outcome === 'calme').length;
  return Math.round((calm / list.length) * 100);
}

export function minutesLast(sessions, days = 7) {
  const since = Date.now() - days * 86400000;
  return (sessions||[]).filter(s => s.ts >= since).reduce((a,b)=>a+(b.durationMin||0),0);
}

export async function stats7d() {
  const st = await getState();
  const count7 = (st.sessions||[]).filter(s => s.ts >= Date.now()-7*86400000).length;
  return {
    count7,
    minutes7: minutesLast(st.sessions, 7),
    calmRate7: percentCalmLast(st.sessions, 7),
  };
}

// rappel plan
export async function saveReminder(reminder) {
  const st = await getState();
  st.reminder = reminder; // {plan}
  await saveState(st);
  return reminder;
}

// util
const genId = () => String(Math.random()).slice(2) + String(Date.now());
