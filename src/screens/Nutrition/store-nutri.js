import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nutri_hydra_v1';
// shape:
// { items: [ { id, type:'meal'|'water', ts, ... }, ... ],
//   favFoods: string[], reminder?: { morning?, evening? } }

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function norm(d) {
  const x = d && typeof d === 'object' ? d : {};
  x.items = Array.isArray(x.items) ? x.items : [];
  x.favFoods = Array.isArray(x.favFoods) ? x.favFoods : [];
  return x;
}
async function read() { try { const raw = await AsyncStorage.getItem(KEY); return norm(raw ? JSON.parse(raw) : {}); } catch { return norm({}); } }
async function write(d) { return AsyncStorage.setItem(KEY, JSON.stringify(norm(d))); }

export async function getState() { return await read(); }

export async function addMeal({ food, kcal=0, amount=0, protein=0, note }) {
  const d = await read();
  const it = {
    id: uid(),
    type: 'meal',
    ts: Date.now(),
    food: String(food || '').slice(0, 80),
    kcal: clamp(Math.round(kcal), 0, 5000),
    amount: clamp(Math.round(amount), 0, 5000),
    protein: clamp(Math.round(protein), 0, 500),
    note: note || undefined,
  };
  d.items = [it, ...d.items].slice(0, 1000);
  // auto-ajout fav simple
  if (it.food && !d.favFoods.includes(it.food) && d.favFoods.length < 20) d.favFoods.push(it.food);
  await write(d);
  return it;
}

export async function addWater({ ml=0, note }) {
  const d = await read();
  const it = {
    id: uid(),
    type: 'water',
    ts: Date.now(),
    ml: clamp(Math.round(ml), 0, 5000),
    note: note || undefined,
  };
  d.items = [it, ...d.items].slice(0, 1000);
  await write(d);
  return it;
}

export async function removeItem(id) {
  const d = await read();
  d.items = d.items.filter(x => x.id !== id);
  await write(d);
  return d.items;
}

export async function clearAll() {
  const empty = { items: [], favFoods: [], reminder: undefined };
  await AsyncStorage.setItem(KEY, JSON.stringify(empty));
  return empty;
}

/* -------- stats 7j -------- */
export async function stats7d() {
  const d = await read();
  const now = Date.now();
  const last7 = d.items.filter(x => now - x.ts < 7 * 86400000);

  const meals = last7.filter(x => x.type === 'meal');
  const waters = last7.filter(x => x.type === 'water');

  const meals7 = meals.length;
  const waterL7 = waters.reduce((a, w) => a + (w.ml || 0), 0) / 1000;
  // moyenne kcal / jour sur 7j
  const kcal7 = meals.reduce((a, m) => a + (m.kcal || 0), 0);
  const kcalPerDay = kcal7 / 7;

  return { meals7, waterL7, kcalPerDay };
}

/* -------- rappel (stockage heure locale, planif via Notifications côté écran) -------- */
export async function saveReminder(rem) {
  const d = await read();
  d.reminder = rem || undefined;
  await write(d);
  return d.reminder;
}
