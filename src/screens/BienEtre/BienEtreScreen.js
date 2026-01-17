import React, { useEffect, useMemo, useRef, useState } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-audio';
import { useNavigation } from '@react-navigation/native';

// ⏰ sélecteur réutilisable + planif system
import RemindersPlanModal from '../../components/RemindersPlanModal';
import { schedulePlan, clearReminder } from '../ActivitesSensorielles/utils/acts-notifications';

const KEY = 'bienetre_journal_v1';
const REM_KEY = 'bienetre_reminder_plan_v1';

/**
 * entry = {
 *   id, ts, mood (1..5), emotion, dog, activities:[], note?,
 *   photoUri?, audioUri?, meta?:{ suggestedBy? }
 * }
 */

const BREATH_PRESETS = [
  {
    id: 'express_2',
    title: 'Relax express (2 min)',
    pattern: [
      { phase: 'Inspire', ms: 4000, scale: 1.35 },
      { phase: 'Retiens', ms: 2000, scale: 1.35 },
      { phase: 'Expire', ms: 6000, scale: 1.0 },
    ],
    durationSec: 120,
  },
  {
    id: 'coherence_5',
    title: 'Cohérence cardiaque (5 min)',
    pattern: [
      { phase: 'Inspire', ms: 5000, scale: 1.35 },
      { phase: 'Expire', ms: 5000, scale: 1.0 },
    ],
    durationSec: 300,
  },
  {
    id: 'carre_3',
    title: 'Respiration en carré (3 min)',
    pattern: [
      { phase: 'Inspire', ms: 4000, scale: 1.35 },
      { phase: 'Retiens', ms: 4000, scale: 1.35 },
      { phase: 'Expire', ms: 4000, scale: 1.0 },
      { phase: 'Retiens', ms: 4000, scale: 1.0 },
    ],
    durationSec: 180,
  },
];

function computeStreak(entries) {
  const days = new Set(entries.map(e => new Date(e.ts).toDateString()));
  let n = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) n++; else break;
  }
  return n;
}
function suggest(entries) {
  const now = Date.now();
  const last = entries[0];
  const today = entries.filter(e => now - e.ts < 24 * 3600e3);
  const didBreath = today.some(e => (e.activities || []).includes('respiration'));
  const out = [];
  if (!last) {
    out.push({ id: 'start', title: 'Commencer par 2 min de respiration', action: { type: 'openBreath', presetId: 'express_2' }, reason: 'Première utilisation' });
    return out;
  }
  if (last.mood <= 2 || last.emotion === 'stressé' || last.emotion === 'anxieux') {
    out.push({ id: 'breath_now', title: 'Cohérence cardiaque (5 min)', action: { type: 'openBreath', presetId: 'coherence_5' }, reason: 'Ressenti tendu' });
  }
  if (!didBreath) {
    out.push({ id: 'daily_breath', title: 'Respiration express (2 min)', action: { type: 'openBreath', presetId: 'express_2' }, reason: 'Aucune respiration aujourd’hui' });
  }
  const dog = last.dog;
  if (dog === 'agité' || dog === 'fatigué') {
    out.push({ id: 'sniff', title: 'Proposer un jeu olfactif à Clem', action: { type: 'prefillEntry', preset: { activities: ['jeu_olfactif'], note: 'Suggestion : jeu olfactif' } }, reason: 'État du chien' });
  }
  const streak = computeStreak(entries);
  if (streak >= 3) {
    out.push({ id: 'streak', title: `Continue ta série (${streak} jours)`, action: { type: 'prefillEntry', preset: { note: 'On garde la dynamique ✨' } }, reason: 'Motivation' });
  }
  const map = new Map(); out.forEach(s => map.set(s.id, s));
  return [...map.values()];
}

const EMOTIONS = ['détendu', 'stressé', 'excité', 'fatigué', 'anxieux', 'apaisé'];
const DOG_STATES = ['calme', 'joueur', 'agité', 'fatigué'];
const ACTIVITIES = ['respiration', 'promenade', 'massage', 'jeu_olfactif', 'autre'];

function moodEmoji(m) { return ['😖', '😟', '😐', '🙂', '😄'][Math.max(1, Math.min(5, m)) - 1]; }
function dateLabel(ts) {
  const d = new Date(ts);
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  const ds = d.toDateString();
  if (ds === today) return 'Aujourd’hui';
  if (ds === yest) return 'Hier';
  return d.toLocaleDateString();
}

export default function BienEtreScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addPreset, setAddPreset] = useState(null);
  const [breathOpen, setBreathOpen] = useState(false);
  const [breathPreset, setBreathPreset] = useState(BREATH_PRESETS[0]);

  // ⏰ Rappels planifiés
  const [remPlanOpen, setRemPlanOpen] = useState(false);
  const [reminderPlan, setReminderPlan] = useState(null); // { plan }

  const stats = useMemo(() => {
    const now = Date.now();
    const last7 = entries.filter(e => now - e.ts < 7 * 86400000);
    const today = entries.filter(e => now - e.ts < 86400000);
    return {
      todayCount: today.length,
      todayBreath: today.filter(e => (e.activities || []).includes('respiration')).length,
      mood7: last7.length ? Math.round((last7.reduce((a, e) => a + (e.mood || 0), 0) / last7.length) * 10) / 10 : 0,
      breath7: last7.filter(e => (e.activities || []).includes('respiration')).length,
    };
  }, [entries]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      setEntries(raw ? JSON.parse(raw) : []);
      const rem = await AsyncStorage.getItem(REM_KEY);
      setReminderPlan(rem ? JSON.parse(rem) : null);
    })();
  }, []);

  const saveEntries = async (next) => {
    setEntries(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  const suggestions = useMemo(() => suggest(entries), [entries]);

  const handleSuggestion = (sug) => {
    const a = sug.action;
    if (a.type === 'openBreath') {
      const preset = BREATH_PRESETS.find(p => p.id === a.presetId) || BREATH_PRESETS[0];
      setBreathPreset(preset);
      setBreathOpen(true);
      return;
    }
    if (a.type === 'prefillEntry') {
      setAddPreset(a.preset || null);
      setShowAdd(true);
      return;
    }
  };

  const addBreathEntry = async (note) => {
    const e = {
      id: cryptoRandomId(),
      ts: Date.now(),
      mood: 3,
      emotion: 'apaisé',
      dog: 'calme',
      activities: ['respiration'],
      note: note || `Séance ${breathPreset.title}`,
      meta: { suggestedBy: 'manual_breath' },
    };
    await saveEntries([e, ...entries]);
  };

  const removeEntry = (id) => {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          const next = entries.filter(e => e.id !== id);
          await saveEntries(next);
        }
      }
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* H1 lisible */}
        <Text style={styles.h1}>Bien-être</Text>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat label="Entrées (auj.)" value={String(stats.todayCount)} />
          <Stat label="Resp. (auj.)" value={String(stats.todayBreath)} />
          <Stat label="Humeur moy. (7j)" value={String(stats.mood7)} />
          <Stat label="Resp. (7j)" value={String(stats.breath7)} />
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestWrap}>
            <Text style={styles.sectionTitle}>Suggestions pour aujourd’hui</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestions.map(s => (
                <TouchableOpacity key={s.id} style={styles.suggestCard} onPress={() => handleSuggestion(s)}>
                  <Text style={styles.suggestTitle}>{s.title}</Text>
                  <Text style={styles.suggestReason}>{s.reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Respiration + Rappels */}
        <View style={styles.actionsRow}>
          <View style={styles.breathRow}>
            {BREATH_PRESETS.map(p => (
              <TouchableOpacity key={p.id} style={styles.breathBtn} onPress={() => { setBreathPreset(p); setBreathOpen(true); }}>
                <Text style={styles.breathBtnText}>{p.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.breathBtn, reminderPlan?.plan && { backgroundColor: '#2ecc71' }]}
            onPress={() => setRemPlanOpen(true)}
          >
            <Text style={styles.breathBtnText}>⏰ Rappels</Text>
          </TouchableOpacity>
        </View>

        {/* Ajouter entrée */}
        <TouchableOpacity style={styles.addBtn} onPress={() => { setAddPreset(null); setShowAdd(true); }}>
          <Text style={styles.addBtnText}>+ Ajouter un ressenti</Text>
        </TouchableOpacity>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Journal</Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>Aucune entrée pour l’instant.</Text>}
          renderItem={({ item }) => <EntryCard entry={item} onDelete={() => removeEntry(item.id)} />}
        />

        {/* Retour */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Ajout */}
      <AddEntryModal
        visible={showAdd}
        preset={addPreset}
        onClose={() => setShowAdd(false)}
        onSave={async (e) => { await saveEntries([e, ...entries]); setShowAdd(false); }}
      />

      {/* Modal Respiration */}
      <BreathModal
        visible={breathOpen}
        preset={breathPreset}
        onClose={() => setBreathOpen(false)}
        onDone={async () => { await addBreathEntry(); setBreathOpen(false); }}
      />

      {/* Modal Rappels planifiés */}
      {remPlanOpen && (
        <RemindersPlanModal
          initialPlan={reminderPlan?.plan}
          onClose={() => setRemPlanOpen(false)}
          onSave={async (plan) => {
            if (!plan) {
              await clearReminder();
              await AsyncStorage.setItem(REM_KEY, JSON.stringify(null));
              setReminderPlan(null);
            } else {
              await schedulePlan({ ...plan, title: '🧘 Respiration', body: 'Prends 2–5 min de respiration guidée.' });
              await AsyncStorage.setItem(REM_KEY, JSON.stringify({ plan }));
              setReminderPlan({ plan });
            }
            setRemPlanOpen(false);
          }}
        />
      )}
    </View>
  );
}

/* UI bits */
function Stat({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EntryCard({ entry, onDelete }) {
  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>{dateLabel(entry.ts)}</Text>
        <Text style={styles.entryMood}>{moodEmoji(entry.mood)} {entry.mood}/5</Text>
      </View>
      <Text style={styles.entryChips}>
        {entry.emotion} • chien: {entry.dog}{entry.activities?.length ? ` • ${entry.activities.join(', ')}` : ''}
      </Text>
      {!!entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
      {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={styles.entryPhoto} /> : null}
      {entry.audioUri ? <AudioPlayer uri={entry.audioUri} /> : null}

      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}><Text style={styles.deleteText}>🗑 Supprimer</Text></TouchableOpacity>
    </View>
  );
}

function AudioPlayer({ uri }) {
  const soundRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => { if (soundRef.current) soundRef.current.unloadAsync(); }, []);
  const toggle = async () => {
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => { if (st.isLoaded && !st.isPlaying) setPlaying(false); });
    }
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await soundRef.current.pauseAsync(); setPlaying(false);
    } else {
      await soundRef.current.playAsync(); setPlaying(true);
    }
  };
  return (
    <TouchableOpacity style={styles.audioBtn} onPress={toggle}>
      <Text style={styles.audioBtnText}>{playing ? '⏸ Pause audio' : '▶️ Écouter audio'}</Text>
    </TouchableOpacity>
  );
}

/* Modal Ajout d’entrée */
function AddEntryModal({ visible, onClose, onSave, preset }) {
  const [mood, setMood] = useState(3);
  const [emotion, setEmotion] = useState('apaisé');
  const [dog, setDog] = useState('calme');
  const [activities, setActivities] = useState([]);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);

  useEffect(() => {
    if (visible) {
      setMood(3); setEmotion('apaisé'); setDog('calme'); setActivities(preset?.activities || []);
      setNote(preset?.note || ''); setPhotoUri(null); setAudioUri(null); setRecording(null);
    }
  }, [visible]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission', 'Autorise l’accès aux photos.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets?.length) setPhotoUri(res.assets[0].uri);
  };

  const recToggle = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      return;
    }
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission', 'Autorise le micro.'); return; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  };

  const toggleActivity = (a) => {
    setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const save = () => {
    if (!emotion || !dog || !mood) { Alert.alert('Champs requis', 'Humeur, émotion et état du chien.'); return; }
    const entry = {
      id: cryptoRandomId(),
      ts: Date.now(),
      mood, emotion, dog,
      activities,
      note: note?.trim() || undefined,
      photoUri: photoUri || undefined,
      audioUri: audioUri || undefined,
      meta: preset ? { suggestedBy: 'rule' } : undefined
    };
    onSave(entry);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Ajouter un ressenti</Text>

          {/* Humeur */}
          <View style={styles.rowCenter}>
            {[1,2,3,4,5].map(v => (
              <TouchableOpacity key={v} onPress={() => setMood(v)} style={[styles.moodDot, mood === v && styles.moodDotActive]}>
                <Text style={styles.moodDotText}>{moodEmoji(v)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Émotion */}
          <View style={styles.chipsWrap}>
            <Text style={styles.label}>Émotion</Text>
            <View style={styles.chipsRow}>
              {EMOTIONS.map(e => (
                <Chip key={e} label={e} active={emotion === e} onPress={() => setEmotion(e)} />
              ))}
            </View>
          </View>

          {/* Chien */}
          <View style={styles.chipsWrap}>
            <Text style={styles.label}>État du chien</Text>
            <View style={styles.chipsRow}>
              {DOG_STATES.map(e => (
                <Chip key={e} label={e} active={dog === e} onPress={() => setDog(e)} />
              ))}
            </View>
          </View>

          {/* Activités */}
          <View style={styles.chipsWrap}>
            <Text style={styles.label}>Activités</Text>
            <View style={styles.chipsRow}>
              {ACTIVITIES.map(a => (
                <Chip key={a} label={a} active={activities.includes(a)} onPress={() => toggleActivity(a)} />
              ))}
            </View>
          </View>

          {/* Note */}
          <TextInput
            style={styles.input}
            placeholder="Note (optionnel)"
            value={note}
            onChangeText={setNote}
            maxLength={500}
            multiline
            placeholderTextColor="#6b3fa3"
          />

          {/* Photo */}
          <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.smallBtn} onPress={pickPhoto}>
              <Text style={styles.smallBtnText}>{photoUri ? '🖼 Changer photo' : '🖼 Ajouter photo'}</Text>
            </TouchableOpacity>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
          </View>

          {/* Audio */}
          <TouchableOpacity style={[styles.smallBtn, recording && { backgroundColor: '#c0392b' }]} onPress={recToggle}>
            <Text style={styles.smallBtnText}>{recording ? '■ Stop enregistrement' : (audioUri ? '🎙️ Réenregistrer' : '🎙️ Enregistrer audio')}</Text>
          </TouchableOpacity>
          {audioUri ? <Text style={styles.audioHint}>Audio prêt ✅</Text> : null}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveText}>Enregistrer</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* Modal Respiration (animation + timer) */
function BreathModal({ visible, preset, onClose, onDone }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [remaining, setRemaining] = useState(preset?.durationSec || 0);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setPhaseIdx(0);
    setRemaining(preset?.durationSec || 0);
    setPhaseLabel('');
    setRunning(true);
    cancelRef.current = false;
  }, [visible, preset]);

  useEffect(() => {
    if (!running || !visible) return;
    let mounted = true;

    const loop = async () => {
      while (mounted && !cancelRef.current && remaining > 0) {
        const ph = preset.pattern[phaseIdx % preset.pattern.length];
        setPhaseLabel(ph.phase);
        // haptique court à chaque phase
        Vibration.vibrate(35);
        await animateTo(scaleAnim, ph.scale, ph.ms);
        setPhaseIdx(x => x + 1);
        setRemaining(prev => Math.max(0, prev - Math.round(ph.ms / 1000)));
      }
      if (mounted && !cancelRef.current && remaining <= 0) {
        setRunning(false);
      }
    };
    loop();

    return () => { mounted = false; };
  }, [running, visible, phaseIdx, remaining, preset]);

  const stop = () => { setRunning(false); cancelRef.current = true; };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{preset.title}</Text>
          <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.timerText}>{remaining}s</Text>
          </Animated.View>
          <Text style={styles.phaseText}>{phaseLabel}</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { stop(); onClose(); }}>
              <Text style={styles.cancelText}>Fermer</Text>
            </TouchableOpacity>

            {running ? (
              <TouchableOpacity style={styles.saveBtn} onPress={stop}>
                <Text style={styles.saveText}>Arrêter</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.saveBtn} onPress={async () => { await onDone(); onClose(); }}>
                <Text style={styles.saveText}>Marquer comme fait</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function animateTo(anim, toValue, duration) {
  return new Promise(resolve => {
    Animated.timing(anim, { toValue, duration, useNativeDriver: true }).start(() => resolve());
  });
}
function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const a = new Uint32Array(4); crypto.getRandomValues(a);
    return Array.from(a).map(x => x.toString(16)).join('');
  }
  return String(Math.random()).slice(2) + String(Date.now());
}

/* Styles */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20, paddingTop: 80, paddingBottom: 120 },

  h1: {
    fontSize: 26, fontWeight: '900', color: '#4a235a',
    backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, alignSelf: 'center', marginBottom: 14,
  },

  // Stats
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', marginHorizontal: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor:'#000',shadowOpacity:0.06,shadowRadius:6,elevation:2 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#4a235a' },
  statLabel: { fontSize: 12, color: '#6b3fa3' },

  // Suggestions
  suggestWrap: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontWeight: '800', fontSize: 16, color: '#4a235a', marginBottom: 8 },
  suggestCard: { backgroundColor: '#7d4ac5', padding: 12, borderRadius: 12, marginRight: 10, width: 230 },
  suggestTitle: { color: 'white', fontWeight: '800' },
  suggestReason: { color: 'white', opacity: 0.85, marginTop: 4, fontSize: 12 },

  // Actions
  actionsRow: { gap: 10, marginBottom: 12 },
  breathRow: { gap: 8 },
  breathBtn: { backgroundColor: '#a077e6', padding: 10, borderRadius: 10 },
  breathBtnText: { color: 'white', fontWeight: '800' },

  // Add
  addBtn: { backgroundColor: '#7d4ac5', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  addBtnText: { color: 'white', fontWeight: '800' },

  // Timeline
  empty: { color: '#4a235a', opacity: 0.8, marginVertical: 12, textAlign: 'center' },
  entryCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 10, shadowColor:'#000',shadowOpacity:0.05,shadowRadius:4,elevation:1 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  entryDate: { color: '#6b3fa3', fontWeight: '700' },
  entryMood: { color: '#6b3fa3', fontWeight: '700' },
  entryChips: { color: '#4a235a', marginTop: 6 },
  entryNote: { color: '#4a235a', marginTop: 6 },
  entryPhoto: { width: '100%', height: 160, borderRadius: 10, marginTop: 8, backgroundColor: '#ddd' },
  deleteBtn: { alignSelf: 'flex-end', marginTop: 8 },
  deleteText: { color: '#c0392b', fontWeight: 'bold' },

  // Audio
  audioBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#EFE6FB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  audioBtnText: { color: '#4a235a', fontWeight: '800' },

  // Cercle respi
  circle: {
    width: 220, height: 220, backgroundColor: 'black', borderRadius: 110,
    opacity: 0.25, marginBottom: 10, alignSelf: 'center', justifyContent: 'center', alignItems: 'center'
  },
  phaseText: { fontSize: 22, fontWeight: '800', color: '#4a235a', textAlign: 'center', marginTop: 4 },
  timerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Bouton retour
  buttonSecondary: {
    backgroundColor: '#a077e6',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Modal générique
  modalWrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '92%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#4a235a', marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#eee' },
  cancelText: { color: '#4a235a', fontWeight: '800' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#7d4ac5' },
  saveText: { color: 'white', fontWeight: '800' },

  // Add modal
  rowCenter: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8, gap: 6 },
  moodDot: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#EFE6FB' },
  moodDotActive: { backgroundColor: '#7d4ac5' },
  moodDotText: { fontSize: 20, color: '#4a235a' },
  chipsWrap: { marginTop: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#EFE6FB' },
  chipActive: { backgroundColor: '#7d4ac5' },
  chipText: { color: '#4a235a', fontWeight: '800' },
  chipTextActive: { color: 'white' },
  label: { color: '#6b3fa3', fontWeight: '800', marginBottom: 4 },
  input: { backgroundColor: '#F7F2FF', borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top', marginTop: 8, color: '#4a235a' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  smallBtn: { backgroundColor: '#a077e6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start' },
  smallBtnText: { color: 'white', fontWeight: '800' },
  preview: { width: 48, height: 48, borderRadius: 8, marginLeft: 8, backgroundColor: '#ddd' },
  audioHint: { color: '#4a235a', marginTop: 6 },
});
