// src/screens/MoiEtMonChien/store-moi.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'moietmonchien_v2';

const DEFAULT = {
  journal: [],
  habits: {
    // id: { title, freq:'daily'|'weekly', history:{'YYYY-MM-DD':true}, reminder?:{hour,minute, notifId?} }
  },
  education: [],
  health: [],
  memories: [],
};

function ensure(x) {
  const base = { ...DEFAULT, ...(x || {}) };
  base.journal = Array.isArray(base.journal) ? base.journal : [];
  base.habits = base.habits && typeof base.habits === 'object' ? base.habits : {};
  base.education = Array.isArray(base.education) ? base.education : [];
  base.health = Array.isArray(base.health) ? base.health : [];
  base.memories = Array.isArray(base.memories) ? base.memories : [];
  return base;
}
async function read() {
  try { const raw = await AsyncStorage.getItem(KEY); return ensure(raw ? JSON.parse(raw) : DEFAULT); }
  catch { return ensure(DEFAULT); }
}
async function write(data) { await AsyncStorage.setItem(KEY, JSON.stringify(ensure(data))); }

function uid() { return String(Date.now()) + '-' + Math.random().toString(16).slice(2); }
function dISO(d=new Date()){ return d.toISOString().slice(0,10); }

export async function getAll(){ return await read(); }
export async function setAll(x){ await write(x); }

// Journal
export async function addJournal(text, tags=[]) {
  const d = await read();
  d.journal = [{ id: uid(), ts: Date.now(), text: text.trim(), tags }, ...d.journal].slice(0,500);
  await write(d); return d.journal;
}
export async function removeJournal(id){
  const d = await read();
  d.journal = d.journal.filter(x=>x.id!==id);
  await write(d); return d.journal;
}

// Habitudes
export async function upsertHabit(id, title, freq='daily'){
  const d = await read();
  d.habits[id] = d.habits[id] || { title, freq, history: {} };
  d.habits[id].title = title; d.habits[id].freq = freq;
  await write(d); return d.habits;
}
export async function toggleHabitToday(id){
  const d = await read();
  d.habits[id] = d.habits[id] || { title:id, freq:'daily', history:{} };
  const k = dISO();
  d.habits[id].history[k] = !d.habits[id].history[k];
  await write(d); return d.habits[id];
}
export function habitStreak(h){
  let n=0;
  for (let i=0;i<365;i++){
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    const k=dISO(dt);
    if (h.history[k]) n++; else break;
  }
  return n;
}
export function habitSeries(h, days=7){
  // retourne [{dateISO, ok:boolean}] pour les N derniers jours (du plus ancien au plus récent)
  const out=[];
  for (let i=days-1;i>=0;i--){
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    const k=dISO(dt);
    out.push({ dateISO:k, ok: !!h.history[k] });
  }
  return out;
}
export async function setHabitReminder(id, {hour, minute, notifId}){
  const d = await read();
  d.habits[id] = d.habits[id] || { title:id, freq:'daily', history:{} };
  d.habits[id].reminder = { hour, minute, notifId };
  await write(d); return d.habits[id];
}
export async function clearHabitReminder(id){
  const d = await read();
  if (d.habits[id]) d.habits[id].reminder = undefined;
  await write(d); return d.habits[id];
}

// Education
export async function addEdu(title, desc=''){
  const d = await read();
  d.education.push({ id: uid(), title, desc, done:false, notes:'' });
  await write(d); return d.education;
}
export async function toggleEdu(id){
  const d = await read();
  d.education = d.education.map(e=> e.id===id ? { ...e, done:!e.done } : e);
  await write(d); return d.education;
}
export async function saveEduNotes(id, notes){
  const d = await read();
  d.education = d.education.map(e=> e.id===id ? { ...e, notes } : e);
  await write(d); return d.education;
}
export async function removeEdu(id){
  const d = await read();
  d.education = d.education.filter(e=>e.id!==id);
  await write(d); return d.education;
}

// Santé
export async function addHealth({ dateISO, type, notes='' }){
  const d = await read();
  d.health = [{ id: uid(), dateISO, type, notes }, ...d.health];
  await write(d); return d.health;
}
export async function removeHealth(id){
  const d = await read();
  d.health = d.health.filter(h=>h.id!==id);
  await write(d); return d.health;
}

// Souvenirs
export async function addMemory({ photoUri, note='' }){
  const d = await read();
  d.memories = [{ id: uid(), ts: Date.now(), photoUri, note }, ...d.memories];
  await write(d); return d.memories;
}
export async function removeMemory(id){
  const d = await read();
  d.memories = d.memories.filter(m=>m.id!==id);
  await write(d); return d.memories;
}
