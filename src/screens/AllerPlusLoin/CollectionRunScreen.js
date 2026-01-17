import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Vibration, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'more_v1';
const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  card: '#fff',
};

// clé de sauvegarde de progression par playlist
const runKey = (playlistId) => `more_run_${playlistId}`;

export default function CollectionRunScreen({ route, navigation }) {
  const { playlist } = route.params || {};
  const resources = playlist?.resources || [];

  const [idx, setIdx] = useState(0);
  const [userData, setUserData] = useState({ fav:{}, done:{}, notes:{}, custom:[], playlists:[], reminder:null, settings:{} });

  // Minuteur
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  // total passé (pour le récap final)
  const [totalSpentSec, setTotalSpentSec] = useState(0);

  // Pref: auto-start
  const autoStart = !!userData?.settings?.autoStartTimers;

  // charge données (prefs + done…)
  useEffect(()=>{ (async()=>{
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setUserData(JSON.parse(raw));
  })(); },[]);

  const saveUserData = async (next) => {
    setUserData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setAutoStart = async (val) => {
    const next = { ...userData, settings: { ...(userData.settings||{}), autoStartTimers: !!val } };
    await saveUserData(next);
  };

  const current = resources[idx];
  const progress = useMemo(()=> resources.length ? Math.round(((idx)/resources.length)*100) : 0, [idx, resources.length]);
  const doneCount = useMemo(()=> resources.filter(r => userData.done[r.id]).length, [userData, resources]);

  useEffect(()=>{ navigation.setOptions?.({ title: playlist?.name || 'Lecture collection' }); }, [playlist, navigation]);

  // ---------- reprise auto si progression sauvegardée ----------
  useEffect(()=>{ (async()=>{
    if (!playlist?.id) return;
    const raw = await AsyncStorage.getItem(runKey(playlist.id));
    if (!raw) {
      initForCurrent(); // première ouverture
      return;
    }
    try {
      const saved = JSON.parse(raw);
      const savedIdx = Math.min(saved.idx ?? 0, Math.max(0, resources.length - 1));
      setIdx(savedIdx);
      // init seconds après setIdx via un 2e cycle
      setTimeout(() => {
        const fallback = Math.max(1, Number(resources[savedIdx]?.minutes || 10)) * 60;
        setSeconds(Number.isFinite(saved.seconds) ? Math.max(0, saved.seconds) : fallback);
        setTotalSpentSec(Math.max(0, saved.totalSpentSec || 0));
        setRunning(false); // on reprend en pause
      }, 0);
    } catch {
      initForCurrent();
    }
  })(); /* eslint-disable-next-line */ }, [playlist?.id, resources.length]);

  // init minuteur pour l’item courant (sans reprise)
  const initForCurrent = () => {
    if (!current) return;
    const initial = Math.max(1, Number(current.minutes || 10)) * 60;
    setSeconds(initial);
    setTotalSpentSec(0);
    setRunning(false);
    if (autoStart) setRunning(true);
  };

  // quand l’item change → (ré)init
  useEffect(()=>{
    stopTimer();
    if (!current) return;
    const initial = Math.max(1, Number(current.minutes || 10)) * 60;
    setSeconds(initial);
    setRunning(false);
    if (autoStart) setRunning(true);
    // on sauve l’état (idx + seconds réinit) pour reprise
    persistRun(idx, initial, totalSpentSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.id, autoStart]);

  // tick du minuteur
  useEffect(()=>{
    if (!running) return;
    timerRef.current = setInterval(()=>{
      setSeconds(prev=>{
        if (prev <= 1) {
          clearInterval(timerRef.current);
          Vibration.vibrate(300);
          // 1 seconde restante = on compte cette dernière seconde passée
          setTotalSpentSec(t => t + 1);
          autoFinish();
          return 0;
        }
        // compte la seconde passée
        setTotalSpentSec(t => t + 1);
        return prev - 1;
      });
    }, 1000);
    return ()=> { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  // persistance à la volée
  useEffect(()=>{
    persistRun(idx, seconds, totalSpentSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, seconds, totalSpentSec, running]);

  // sauvegarde progression (idx/seconds/totalSpentSec) pour reprise
  const persistRun = async (curIdx, curSeconds, curTotal) => {
    if (!playlist?.id) return;
    const payload = JSON.stringify({ idx: curIdx, seconds: curSeconds, totalSpentSec: curTotal });
    await AsyncStorage.setItem(runKey(playlist.id), payload);
  };

  // clear progression quand fini
  const clearRun = async () => {
    if (!playlist?.id) return;
    await AsyncStorage.removeItem(runKey(playlist.id));
  };

  const openUrl = async () => {
    const url = current?.url;
    if (!url) return;
    const ok = await Linking.canOpenURL(url);
    ok ? Linking.openURL(url) : Alert.alert('Lien invalide', url);
  };

  const markDone = async () => {
    if (!current) return;
    const next = { ...userData, done: { ...userData.done, [current.id]: Date.now() } };
    await saveUserData(next);
  };

  const nextItem = () => {
    if (idx + 1 >= resources.length) {
      // fin — récap temps total
      const alreadyCountsThis = userData.done[current?.id] ? 0 : 1;
      const doneNow = doneCount + alreadyCountsThis;
      const mins = Math.floor(totalSpentSec / 60);
      const secs = totalSpentSec % 60;
      const spentLabel = `${mins} min ${String(secs).padStart(2,'0')} s`;
      clearRun();
      Alert.alert(
        'Terminé 🎉',
        `Tu as complété "${playlist?.name}" (${doneNow}/${resources.length}).\nTemps passé : ${spentLabel}`,
        [
          { text: 'Revenir', onPress: ()=>navigation.goBack() },
          { text: 'Recommencer', onPress: ()=>{ setIdx(0); setTotalSpentSec(0); } }
        ]
      );
      return;
    }
    setIdx(idx + 1);
  };

  const autoFinish = async () => {
    await markDone();
    nextItem();
  };

  const startTimer = () => setRunning(true);
  const pauseTimer = () => setRunning(false);
  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); setRunning(false); };
  const resetTimer = () => {
    stopTimer();
    const initial = Math.max(1, Number(current?.minutes || 10)) * 60;
    setSeconds(initial);
    // reset ne change pas le temps total passé
  };

  // 🔄 Réinit. session (remet le total à 0, garde idx/seconds)
  const resetSession = () => {
    setTotalSpentSec(0);
    persistRun(idx, seconds, 0);
  };

  // Sauvegarde à la sortie de l’écran
  useEffect(()=>{
    return () => {
      stopTimer();
      persistRun(idx, seconds, totalSpentSec);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!current) {
    return (
      <View style={[s.container, { alignItems:'center', justifyContent:'center' }]}>
        <Text style={s.h1}>Aucune ressource</Text>
        <TouchableOpacity style={s.btn} onPress={()=>navigation.goBack()}>
          <Text style={s.btnTxt}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const already = !!userData.done[current.id];
  const mm = String(Math.floor(seconds/60)).padStart(2,'0');
  const ss = String(seconds%60).padStart(2,'0');

  const minsTotal = Math.floor(totalSpentSec / 60);
  const secsTotal = totalSpentSec % 60;

  return (
    <View style={s.container}>
      <Text style={s.h1}>{playlist?.name}</Text>

      {/* Barre de progression */}
      <View style={s.progressWrap}>
        <View style={[s.progressFill, { width: `${(idx / Math.max(1, resources.length)) * 100}%` }]} />
      </View>
      <Text style={s.meta}>Étape {idx+1}/{resources.length} • {doneCount}/{resources.length} complétées</Text>

      {/* Préférence auto-start */}
      <View style={[s.rowBetween, { marginTop: 10 }]}>
        <Text style={s.meta}>Démarrer auto les timers</Text>
        <Switch value={autoStart} onValueChange={setAutoStart} />
      </View>

      {/* Carte ressource */}
      <View style={s.card}>
        <Text style={s.title}>{current.title}</Text>
        <Text style={s.meta}>{current.type} • {current.minutes} min • {current.source}</Text>
        {current.tags?.length ? <Text style={s.body}>Tags : {current.tags.join(', ')}</Text> : null}
        {current.desc ? <Text style={s.body}>{current.desc}</Text> : null}

        <View style={[s.rowBetween, { marginTop: 12 }]}>
          <TouchableOpacity style={s.btn} onPress={openUrl}><Text style={s.btnTxt}>Ouvrir</Text></TouchableOpacity>
          <Text style={[s.meta, { opacity: already ? 1 : 0.6 }]}>{already ? '✅ Vu' : 'Non vu'}</Text>
        </View>
      </View>

      {/* Minuteur */}
      <View style={s.timerBox}>
        <Text style={s.timer}>{mm}:{ss}</Text>
        <View style={[s.row, { gap: 8 }]}>
          {!running ? (
            <TouchableOpacity style={s.btn} onPress={startTimer}><Text style={s.btnTxt}>Démarrer</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.btn, { backgroundColor:'#c0392b' }]} onPress={pauseTimer}><Text style={s.btnTxt}>Pause</Text></TouchableOpacity>
          )}
          <TouchableOpacity style={s.btnGhost} onPress={resetTimer}><Text style={s.btnGhostTxt}>Réinit. timer</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btnGhost, { borderColor:'#f39c12' }]} onPress={resetSession}>
            <Text style={[s.btnGhostTxt, { color:'#f39c12' }]}>Réinit. session</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.metaSmall}>À 0:00 → auto “vu” + suivant</Text>

        {/* temps total passé (session) */}
        <Text style={[s.metaSmall, { marginTop: 6 }]}>
          Temps passé total: {minsTotal} min {String(secsTotal).padStart(2,'0')} s
        </Text>
      </View>

      {/* Actions */}
      <View style={[s.rowBetween, { marginTop: 14 }]}>
        <TouchableOpacity style={[s.btnGhost, { borderColor:'#c0392b' }]} onPress={()=>navigation.goBack()}>
          <Text style={[s.btnGhostTxt, { color:'#c0392b' }]}>Quitter</Text>
        </TouchableOpacity>

        <View style={s.row}>
          <TouchableOpacity style={[s.btnGhost, already && { borderColor:'#2ecc71' }]} onPress={markDone}>
            <Text style={[s.btnGhostTxt, already && { color:'#2ecc71' }]}>{already ? 'Marqué' : 'Marquer vu'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { marginLeft: 8 }]} onPress={nextItem}>
            <Text style={s.btnTxt}>{idx+1 >= resources.length ? 'Terminer' : 'Suivant ⏭'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, padding:20, paddingTop:80, paddingBottom:20 },
  h1:{ fontSize:22, fontWeight:'900', color:COLORS.ink, backgroundColor:'#fff', paddingVertical:6, paddingHorizontal:12, borderRadius:10, alignSelf:'center', marginBottom:12 },

  progressWrap:{ height:10, backgroundColor:'#EFE6FB', borderRadius:6, overflow:'hidden' },
  progressFill:{ height:10, backgroundColor:COLORS.primary },

  row:{ flexDirection:'row', alignItems:'center' },
  rowBetween:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },

  card:{ backgroundColor:COLORS.card, borderRadius:14, padding:14, marginTop:12 },
  title:{ color:COLORS.ink, fontWeight:'900', fontSize:16 },
  meta:{ color:COLORS.sub, marginTop:6 },
  body:{ color:COLORS.ink, marginTop:6 },

  timerBox:{ backgroundColor:'#F7F2FF', borderRadius:14, padding:14, alignItems:'center', marginTop:12 },
  timer:{ color:COLORS.ink, fontSize:32, fontWeight:'900', marginBottom:8 },
  metaSmall:{ color:COLORS.sub, marginTop:6, fontSize:12 },

  btn:{ backgroundColor:COLORS.primary, paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  btnGhost:{ borderWidth:1, borderColor:'#d8c8ff', paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnGhostTxt:{ color:COLORS.ink, fontWeight:'800' },
});
