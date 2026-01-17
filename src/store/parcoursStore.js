// src/store/parcoursStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// petite persist maison (évite dépendance zustand/middleware)
const KEY = 'parcours_store_v1';

async function loadInitial() {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
async function persist(state) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export const useParcoursStore = create((set, get) => ({
  // état
  parcoursActuel: null,        // 'debutant' | 'equilibre' | 'expert' | null
  lastOpenedAt: null,

  // actions
  setParcours: (p) => {
    set({ parcoursActuel: p, lastOpenedAt: Date.now() });
    persist(get());
  },
  resetParcours: () => { set({ parcoursActuel: null }); persist(get()); },

  // init async (à appeler une fois, ex: App.js)
  __rehydrate: async () => {
    const data = await loadInitial();
    if (data) set(data);
  },
}));
