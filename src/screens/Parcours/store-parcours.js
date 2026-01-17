// src/screens/Parcours/store-parcours.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'parcoursData_v2';

// shape attendue
// {
//   debutant:  { done: ['1','2'], nextId: '3' | null },
//   equilibre: { done: [],        nextId: '1' | null },
//   expert:    { done: [],        nextId: '1' | null },
// }

const DEFAULT_DATA = {
  debutant:  { done: [], nextId: '1' },
  equilibre: { done: [], nextId: '1' },
  expert:    { done: [], nextId: '1' },
};

// --- internes -------------------------------------------------

function ensureShape(data) {
  const out = { ...DEFAULT_DATA, ...(data || {}) };
  // compat rétro (v1: data.done => considéré comme "debutant")
  if (Array.isArray(out.done)) {
    out.debutant.done = out.done;
    delete out.done;
  }
  // Sanity: nextId string or null
  for (const k of ['debutant', 'equilibre', 'expert']) {
    if (!out[k] || !Array.isArray(out[k].done)) out[k] = { done: [], nextId: '1' };
    if (out[k].nextId !== null && typeof out[k].nextId !== 'string') out[k].nextId = '1';
  }
  return out;
}

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return ensureShape(raw ? JSON.parse(raw) : DEFAULT_DATA);
  } catch {
    return { ...DEFAULT_DATA };
  }
}

async function write(data) {
  await AsyncStorage.setItem(KEY, JSON.stringify(ensureShape(data)));
}

function calcNextId(doneArr, totalSteps) {
  const ids = Array.from({ length: totalSteps }, (_, i) => String(i + 1));
  const firstTodo = ids.find(id => !doneArr.includes(id));
  return firstTodo || null;
}

// --- API publique ---------------------------------------------

/** Récupère l’état complet des parcours. */
export async function getParcours() {
  return await read();
}

/** Écrase l’état complet (utilise avec précaution). */
export async function setParcours(data) {
  await write(data);
}

/**
 * Progression globale d’un parcours.
 * @param {object} data  sortie de getParcours()
 * @param {'debutant'|'equilibre'|'expert'} parcours
 * @param {number} totalSteps  nombre total d’étapes (ex: 5)
 */
export function overallProgress(data, parcours = 'debutant', totalSteps = 5) {
  const bucket = (data && data[parcours]) ? data[parcours] : DEFAULT_DATA[parcours];
  const done = bucket.done.length;
  const total = Math.max(1, totalSteps);
  const percent = Math.round((done / total) * 100);
  const nextId = calcNextId(bucket.done, total);
  return { done, total, percent, nextId };
}

/**
 * Marque une étape comme faite. Idempotent.
 * Recalcule nextId (première non faite) selon totalSteps.
 */
export async function markStep(parcours, id, totalSteps) {
  const data = await read();
  const bucket = data[parcours] || { ...DEFAULT_DATA[parcours] };
  const doneSet = new Set(bucket.done);
  doneSet.add(String(id));
  bucket.done = Array.from(doneSet).sort((a, b) => Number(a) - Number(b));
  bucket.nextId = calcNextId(bucket.done, totalSteps);
  data[parcours] = bucket;
  await write(data);
}

/** Indique si une étape est validée. */
export async function isStepDone(parcours, id) {
  const data = await read();
  return !!data?.[parcours]?.done?.includes(String(id));
}

/**
 * Recommence une étape (la sort de "done") et recalcule nextId.
 * Ne touche pas aux notes/checklists locales (à effacer côté écran si voulu).
 */
export async function restartStep(parcours, id, totalSteps) {
  const data = await read();
  const bucket = data[parcours] || { ...DEFAULT_DATA[parcours] };
  bucket.done = (bucket.done || []).filter(x => x !== String(id));
  bucket.nextId = calcNextId(bucket.done, totalSteps);
  data[parcours] = bucket;
  await write(data);
}

/** Réinitialise un parcours (toutes les étapes à faire). */
export async function resetParcours(parcours = 'debutant') {
  const data = await read();
  data[parcours] = { ...DEFAULT_DATA[parcours] };
  await write(data);
}

/** Réinitialise tous les parcours. */
export async function resetAllParcours() {
  await write({ ...DEFAULT_DATA });
}
