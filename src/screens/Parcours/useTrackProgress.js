import { useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'parcours_progress_v1';
// shape: { debutant: { [stepId]: true }, equilibre: {...}, expert: {...} }
const DEFAULT_STATE = { debutant: {}, equilibre: {}, expert: {} };

export default function useTrackProgress(track) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  // load once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : DEFAULT_STATE;
        if (mounted) {
          // merge avec DEFAULT pour éviter undefined
          setState({
            debutant: parsed.debutant || {},
            equilibre: parsed.equilibre || {},
            expert: parsed.expert || {},
          });
          setLoaded(true);
        }
      } catch {
        if (mounted) { setState(DEFAULT_STATE); setLoaded(true); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persist = useCallback(async (next) => {
    setState(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const safeTrack = (t) => (t && state[t]) ? t : (['debutant','equilibre','expert'].includes(track) ? track : 'debutant');

  const doneMap = useMemo(() => {
    const t = safeTrack(track);
    // jamais undefined
    return state[t] || {};
  }, [state, track]);

  const toggle = useCallback(async (stepId, value) => {
    const t = safeTrack(track);
    const cur = state[t] || {};
    const nextTrack = { ...cur };
    if (value) nextTrack[stepId] = true; else delete nextTrack[stepId];
    const next = { ...state, [t]: nextTrack };
    await persist(next);
  }, [state, track, persist]);

  const markStepDone = useCallback((stepId) => toggle(stepId, true), [toggle]);
  const resetStep = useCallback((stepId) => toggle(stepId, false), [toggle]);

  const resetAll = useCallback(async () => {
    const t = safeTrack(track);
    const next = { ...state, [t]: {} };
    await persist(next);
  }, [state, track, persist]);

  // pour comptages sûrs
  const count = useMemo(() => Object.keys(doneMap).length, [doneMap]);

  return {
    loaded,
    doneMap,          // jamais undefined
    count,
    toggle,
    markStepDone,
    resetStep,
    resetAll,
  };
}
