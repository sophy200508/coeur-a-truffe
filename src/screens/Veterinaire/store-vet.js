import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'vet_state_v2';
// structure: { items:[entry], reminder:{plan}, vetContact:{name,phone,email,address} }

export async function getState() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { items: [], reminder: null, vetContact: null };
}

async function setState(next) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
export const setStateInStore = setState;

export async function addEntry(entry) {
  const st = await getState();
  const next = { ...st, items: [entry, ...(st.items || [])] };
  await setState(next);
  return entry;
}

export async function removeEntry(id) {
  const st = await getState();
  const next = { ...st, items: (st.items || []).filter(it => it.id !== id) };
  await setState(next);
}

export async function saveReminder(rem) {
  const st = await getState();
  return setState({ ...st, reminder: rem });
}

/** Contact véto */
export async function saveVetContact(contact) {
  const st = await getState();
  return setState({ ...st, vetContact: contact });
}

export async function stats7d() {
  const st = await getState();
  const now = Date.now();
  const last7 = (st.items || []).filter(it => now - it.ts < 7 * 86400000);

  const visits7 = last7.filter(it => it.type === 'visit').length;
  const meds7 = last7.filter(it => ['vaccine', 'flea', 'deworm'].includes(it.type)).length;

  const weights = last7.filter(it => it.type === 'weight' && typeof it.weight === 'number').map(it => it.weight);
  const avgWeight7 = weights.length ? weights.reduce((a,b)=>a+b,0) / weights.length : 0;

  return { visits7, meds7, avgWeight7 };
}

/**
 * Prochains soins (inclut retard & futur).
 * On renvoie toutes les entrées ayant un nextDate, triées par date croissante,
 * limitées à `max` éléments.
 */
export async function nextDue(max = 5) {
  const st = await getState();
  const list = (st.items || [])
    .filter(it => ['vaccine','flea','deworm'].includes(it.type) && it.nextDate)
    .sort((a,b) => a.nextDate - b.nextDate)
    .slice(0, max);
  return list;
}
