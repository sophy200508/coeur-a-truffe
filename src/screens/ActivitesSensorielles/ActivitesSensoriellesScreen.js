// src/screens/ActivitesSensorielles/ActivitesSensoriellesScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Vibration,
  Alert,
  SectionList,
  ScrollView,
} from 'react-native';

import DATA, { CATEGORIES } from './activities-data';

import {
  getState,
  toggleFavorite,
  removeSession,
  statsLast7d,
  addSequenceRun,
  saveReminder,
  addSession,
} from './store-acts';

import { exportActsPDF } from './utils/export-acts-pdf';
import { exportActsCSV } from './utils/export-acts-csv';

// ⏰ sélecteur + planif avancée
import RemindersPlanModal from '../../components/RemindersPlanModal';
import { schedulePlan, clearReminder } from './utils/acts-notifications';

const COLORS = {
  primary: '#7d4ac5',
  primary2: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  bgChip: '#F1E8FF',
};

export default function ActivitesSensoriellesScreen() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Tous');
  const [level, setLevel] = useState('Tous');

  const [favorites, setFavorites] = useState({});
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ count7: 0, minutes7: 0 });

  const [reminder, setReminder] = useState(null); // { plan }
  const [remPlanOpen, setRemPlanOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const [seqOpen, setSeqOpen] = useState(false);
  const [seqRestSec, setSeqRestSec] = useState(60);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const st = await getState();
    setFavorites(st.favorites || {});
    setSessions(st.sessions || []);
    setReminder(st.reminder || null);
    setStats(await statsLast7d());
  };

  const categories = useMemo(() => ['Tous', ...CATEGORIES], []);
  const levels = ['Tous', 'Débutant', 'Équilibré', 'Expert'];

  const filtered = useMemo(
    () =>
      DATA.filter((a) => {
        const q = query.trim().toLowerCase();
        const okQ =
          !q ||
          [a.title, a.goal, ...(a.materials || [])]
            .join(' ')
            .toLowerCase()
            .includes(q);
        const okC = cat === 'Tous' || a.category === cat;
        const okL = level === 'Tous' || a.level === level;
        return okQ && okC && okL;
      }),
    [query, cat, level]
  );

  const startActivity = (a) => {
    setCurrent(a);
    setOpen(true);
  };

  const onToggleFav = async (id) => {
    const next = await toggleFavorite(id);
    setFavorites(next);
  };

  const onSaveSession = async ({ durationMin, notes, rating }) => {
    await addSession({ activityId: current.id, durationMin, notes, rating });
    setOpen(false);
    await load();
  };

  const onDeleteSession = async (id) => {
    await removeSession(id);
    await load();
  };

  const onExportPDF = async () => {
    await exportActsPDF();
  };

  const onExportCSV = async () => {
    await exportActsCSV();
  };

  // --------- SectionList data ---------
  const sections = useMemo(() => {
    const out = [{ title: 'ACTS', data: filtered }];
    if (sessions.length > 0) out.push({ title: 'JOURNAL', data: sessions });
    return out;
  }, [filtered, sessions]);

  // --------- headers (actions + filtres) ---------
  const ListHeader = () => (
    <View style={s.headerWrap}>
      <Text style={s.h1}>Activités sensorielles</Text>

      <View style={s.topRow}>
        <TouchableOpacity style={s.btnSecondary} onPress={onExportPDF}>
          <Text style={s.btnTxt}>Exporter PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} onPress={onExportCSV}>
          <Text style={s.btnTxt}>Exporter CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnSecondary, reminder?.plan && { backgroundColor: '#2ecc71' }]}
          onPress={() => setRemPlanOpen(true)}
        >
          <Text style={s.btnTxt}>⏰ Rappels</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btn} onPress={() => setSeqOpen(true)}>
          <Text style={s.btnTxt}>Parcours 3</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <Box label="Séances (7j)" value={String(stats.count7)} />
        <Box label="Minutes (7j)" value={String(stats.minutes7)} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher (ex: boîtes, calme, tapis...)"
        style={s.input}
        placeholderTextColor="#6b3fa3"
      />

      <View style={s.filtersCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsStrip}>
          {categories.map((c) => (
            <Chip key={c} label={c} active={c === cat} onPress={() => setCat(c)} />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsStripBottom}>
          {levels.map((l) => (
            <Chip key={l} label={l} active={l === level} onPress={() => setLevel(l)} />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const SectionHeader = ({ title }) => (title === 'JOURNAL' ? <Text style={s.h2}>Journal récent</Text> : null);

  // --------- renderers ---------
  const renderItem = ({ item, section }) => {
    if (section.title === 'JOURNAL') {
      const act = DATA.find((x) => x.id === item.activityId);
      const title =
        item.activityId === '_sequence'
          ? 'Parcours sensoriel (3 activités)'
          : act
            ? act.title
            : item.activityId;

      return (
        <View style={sCard.card}>
          <View style={s.rowBetween}>
            <Text style={sCard.title}>{title}</Text>
            <TouchableOpacity onPress={() => onDeleteSession(item.id)}>
              <Text>🗑</Text>
            </TouchableOpacity>
          </View>

          <Text style={sCard.meta}>
            {new Date(item.ts).toLocaleString()} • {item.durationMin} min{' '}
            {item.rating ? `• ${'★'.repeat(item.rating)}` : ''}
          </Text>

          {item.meta?.type === 'sequence' && (
            <Text style={sCard.body}>
              Activités:{' '}
              {item.meta.items
                .map((i) => DATA.find((x) => x.id === i.activityId)?.title || i.activityId)
                .join(' → ')}
            </Text>
          )}

          {item.notes ? <Text style={sCard.body}>{item.notes}</Text> : null}
        </View>
      );
    }

    const a = item;
    return (
      <View style={s.card}>
        <View style={s.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{a.title}</Text>
            <Text style={s.meta}>
              {a.category} • {a.level} • {a.durationMin} min
            </Text>
            <Text style={s.goal}>{a.goal}</Text>
          </View>

          <TouchableOpacity onPress={() => onToggleFav(a.id)} style={[s.fav, favorites[a.id] && s.favOn]}>
            <Text style={s.favTxt}>{favorites[a.id] ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        {!!a.materials?.length && (
          <View style={s.badges}>
            {a.materials.map((m, i) => (
              <Text key={i} style={s.badge}>
                {m}
              </Text>
            ))}
          </View>
        )}

        <View style={s.rowBetween}>
          <TouchableOpacity style={s.btn} onPress={() => startActivity(a)}>
            <Text style={s.btnTxt}>Démarrer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => {
              setCurrent(a);
              setOpen(true);
            }}
          >
            <Text style={s.btnGhostTxt}>Détails</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => (item.id ? String(item.id) : `row-${index}`)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<Text style={s.empty}>Rien ne matche ta recherche.</Text>}
        stickySectionHeadersEnabled={false}
      />

      {/* modals */}
      {open && current && <SessionModal activity={current} onClose={() => setOpen(false)} onSave={onSaveSession} />}

      {seqOpen && (
        <SequenceModal
          onClose={() => setSeqOpen(false)}
          restSec={seqRestSec}
          setRestSec={setSeqRestSec}
          onSaved={async ({ items, totalDurationMin, notes }) => {
            await addSequenceRun({ items, totalDurationMin, notes });
            setSeqOpen(false);
            await load();
          }}
        />
      )}

      {remPlanOpen && (
        <RemindersPlanModal
          initialPlan={reminder?.plan}
          onClose={() => setRemPlanOpen(false)}
          onSave={async (plan) => {
            if (!plan) {
              await clearReminder();
              await saveReminder(null);
              setReminder(null);
            } else {
              await schedulePlan({
                ...plan,
                title: '🐾 Activité sensorielle',
                body: 'Un moment sensoriel avec ton chien 💜',
              });
              await saveReminder({ plan });
              setReminder({ plan });
            }
            setRemPlanOpen(false);
            Alert.alert('OK', 'Rappels mis à jour ✅');
          }}
        />
      )}
    </View>
  );
}

/* ---------------- Modal session simple ---------------- */
function SessionModal({ activity, onClose, onSave }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState((activity.durationMin || 5) * 60);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const start = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          Vibration.vibrate(300);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const reset = () => {
    stop();
    setSeconds((activity.durationMin || 5) * 60);
  };

  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>{activity.title}</Text>
          <Text style={s.meta}>
            {activity.category} • {activity.level} • {activity.durationMin} min
          </Text>

          <View style={s.card}>
            <Text style={s.h3}>Étapes</Text>
            {activity.steps?.map((st, i) => (
              <Text key={i} style={s.step}>
                • {st}
              </Text>
            ))}
            {!!activity.safety && <Text style={s.safety}>⚠ {activity.safety}</Text>}
          </View>

          <View style={s.timerBox}>
            <Text style={s.timerTxt}>
              {min}:{sec}
            </Text>
            <View style={s.row}>
              {!running ? (
                <TouchableOpacity style={s.btn} onPress={start}>
                  <Text style={s.btnTxt}>Démarrer</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btn, { backgroundColor: '#c0392b' }]} onPress={stop}>
                  <Text style={s.btnTxt}>Stop</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.btnGhost} onPress={reset}>
                <Text style={s.btnGhostTxt}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Note (optionnel)"
              placeholderTextColor="#6b3fa3"
              style={s.input}
              multiline
            />
            <View style={[s.row, { justifyContent: 'center', marginTop: 8 }]}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity key={r} onPress={() => setRating(r)}>
                  <Text style={{ fontSize: 20 }}>{r <= rating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[s.rowBetween, { marginTop: 14 }]}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}>
              <Text style={s.btnGhostTxt}>Fermer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btn}
              onPress={() =>
                onSave({
                  durationMin: Math.max(1, Math.round(((activity.durationMin || 5) * 60 - seconds) / 60)),
                  notes,
                  rating,
                })
              }
            >
              <Text style={s.btnTxt}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------- Modal parcours 3 activités — choix libre ------------- */
/* (ton code d’origine est long ; je le garde IDENTIQUE, juste copié ci-dessous tel quel) */
function SequenceModal({ onClose, restSec, setRestSec, onSaved }) {
  const ALL = DATA;
  const pickByCat = (cat) => ALL.find((a) => a.category === cat) || ALL[0];
  const [a1, setA1] = useState(pickByCat('Olfactif'));
  const [a2, setA2] = useState(pickByCat('Tactile'));
  const [a3, setA3] = useState(pickByCat('Calme'));

  const [pickingSlot, setPickingSlot] = useState(null);
  const [catFilter, setCatFilter] = useState('Tous');
  const [q, setQ] = useState('');

  const [stepIdx, setStepIdx] = useState(0);
  const [seconds, setSeconds] = useState((a1?.durationMin || 5) * 60);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const timer = useRef(null);

  const phases = useMemo(
    () => [
      { type: 'act', act: a1, sec: (a1?.durationMin || 5) * 60 },
      { type: 'rest', sec: restSec },
      { type: 'act', act: a2, sec: (a2?.durationMin || 5) * 60 },
      { type: 'rest', sec: restSec },
      { type: 'act', act: a3, sec: (a3?.durationMin || 5) * 60 },
    ],
    [a1, a2, a3, restSec]
  );

  useEffect(() => {
    setSeconds(phases[0].sec);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [phases]);

  const start = () => {
    if (running) return;
    setRunning(true);
    timer.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          Vibration.vibrate(250);
          advance();
          return phases[Math.min(stepIdx + 1, phases.length - 1)]?.sec || 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
  };

  const advance = () => {
    const next = stepIdx + 1;
    if (next >= phases.length) {
      stop();
      const items = [
        { activityId: a1.id, durationMin: a1.durationMin },
        { activityId: a2.id, durationMin: a2.durationMin },
        { activityId: a3.id, durationMin: a3.durationMin },
      ];
      const total = (a1?.durationMin || 0) + (a2?.durationMin || 0) + (a3?.durationMin || 0);
      onSaved({ items, totalDurationMin: total, notes });
      return;
    }
    setStepIdx(next);
    setSeconds(phases[next].sec);
  };

  const label = () => (phases[stepIdx].type === 'rest' ? 'Pause' : phases[stepIdx].act.title);
  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return ALL.filter((a) => {
      const okC = catFilter === 'Tous' || a.category === catFilter;
      const okQ =
        !qq ||
        [a.title, a.goal, ...(a.materials || [])]
          .join(' ')
          .toLowerCase()
          .includes(qq);
      return okC && okQ;
    });
  }, [ALL, catFilter, q]);

  const setSlot = (slot, act) => {
    if (slot === 1) setA1(act);
    else if (slot === 2) setA2(act);
    else setA3(act);
    setPickingSlot(null);
    setQ('');
  };

  const Slot = ({ idx, act, onPick }) => (
    <View style={[s.card, { padding: 12 }]}>
      <View style={s.rowBetween}>
        <Text style={s.h3}>#{idx}</Text>
        <TouchableOpacity style={s.btnSecondary} onPress={onPick}>
          <Text style={s.btnTxt}>Changer</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.title}>{act?.title}</Text>
      <Text style={s.meta}>
        {act?.category} • {act?.level} • {act?.durationMin} min
      </Text>
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Parcours sensoriel — Choisis 3 activités</Text>

          <View style={{ gap: 10 }}>
            <Slot idx={1} act={a1} onPick={() => setPickingSlot(1)} />
            <Slot idx={2} act={a2} onPick={() => setPickingSlot(2)} />
            <Slot idx={3} act={a3} onPick={() => setPickingSlot(3)} />
          </View>

          <View style={[s.rowBetween, { marginTop: 12 }]}>
            <Text style={s.h3}>Pause automatique</Text>
            <View style={s.row}>
              <TouchableOpacity style={s.btnGhost} onPress={() => setRestSec(Math.max(10, restSec - 10))}>
                <Text style={s.btnGhostTxt}>−10s</Text>
              </TouchableOpacity>
              <Text style={[s.meta, { width: 60, textAlign: 'center' }]}>{restSec}s</Text>
              <TouchableOpacity style={s.btnGhost} onPress={() => setRestSec(restSec + 10)}>
                <Text style={s.btnGhostTxt}>+10s</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[s.timerBox, { marginTop: 12 }]}>
            <Text style={s.h3}>{label()}</Text>
            <Text style={s.timerTxt}>
              {min}:{sec}
            </Text>
            <View style={s.row}>
              {!running ? (
                <TouchableOpacity style={s.btn} onPress={start}>
                  <Text style={s.btnTxt}>Démarrer</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btn, { backgroundColor: '#c0392b' }]} onPress={stop}>
                  <Text style={s.btnTxt}>Stop</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.btnGhost} onPress={advance}>
                <Text style={s.btnGhostTxt}>Suivant</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[s.rowBetween, { marginTop: 12 }]}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}>
              <Text style={s.btnGhostTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {/* Pane de sélection */}
          {pickingSlot !== null && (
            <View style={picker.wrap}>
              <Text style={picker.title}>Choisir pour le slot #{pickingSlot}</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Tous', ...CATEGORIES].map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCatFilter(c)}
                    style={[s.chip, catFilter === c && s.chipOn]}
                  >
                    <Text style={[s.chipTxt, catFilter === c && s.chipTxtOn]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Rechercher (titre, but, matériel…)"
                placeholderTextColor="#6b3fa3"
                style={picker.input}
              />

              <ScrollView style={{ maxHeight: 280 }}>
                {filtered.map((act) => (
                  <TouchableOpacity key={act.id} onPress={() => setSlot(pickingSlot, act)} style={picker.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={picker.itemTitle}>{act.title}</Text>
                      <Text style={picker.itemMeta}>
                        {act.category} • {act.level} • {act.durationMin} min
                      </Text>
                      {!!act.goal && <Text style={picker.itemGoal}>{act.goal}</Text>}
                    </View>
                    <Text style={{ fontSize: 20 }}>＋</Text>
                  </TouchableOpacity>
                ))}
                {filtered.length === 0 && <Text style={picker.empty}>Aucun résultat.</Text>}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setPickingSlot(null)}
                style={[s.btnGhost, { alignSelf: 'flex-end', marginTop: 8 }]}
              >
                <Text style={s.btnGhostTxt}>Terminer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* --------- petits composants --------- */
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipTxt, active && s.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Box({ label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

/* ---------------- styles ---------------- */
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ laisse voir le fond global
  },

  listContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 80,
  },

  headerWrap: { marginBottom: 12 },

  h1: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'center',
  },

  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, justifyContent: 'center' },
  btnSecondary: { backgroundColor: COLORS.primary2, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnTxt: { color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statVal: { color: COLORS.ink, fontWeight: '900', fontSize: 24 },
  statLbl: { color: COLORS.sub, fontSize: 13, marginTop: 4 },

  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.ink },

  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipsStrip: { marginBottom: 6 },
  chipsStripBottom: { marginBottom: 0 },

  chip: {
    backgroundColor: COLORS.bgChip,
    borderWidth: 1,
    borderColor: '#d8c8ff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    marginRight: 8,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { color: COLORS.ink, fontWeight: '800', fontSize: 14 },
  chipTxtOn: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  title: { color: COLORS.ink, fontWeight: '900', fontSize: 16 },
  meta: { color: COLORS.sub, marginTop: 2 },
  goal: { color: COLORS.ink, marginTop: 6 },

  fav: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EFE6FB', alignItems: 'center', justifyContent: 'center' },
  favOn: { backgroundColor: '#f1d6ff' },
  favTxt: { fontSize: 22, color: COLORS.primary },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  badge: { backgroundColor: '#EFE6FB', color: COLORS.ink, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },

  empty: { color: COLORS.sub, textAlign: 'center', marginTop: 14 },

  // modal
  modalWrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 16, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink },

  timerBox: { backgroundColor: '#F7F2FF', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  timerTxt: { color: COLORS.ink, fontSize: 30, fontWeight: '900', marginBottom: 8 },

  step: { color: COLORS.ink, marginBottom: 6 },
  safety: { color: '#c0392b', marginTop: 8 },

  h2: { fontSize: 18, fontWeight: '900', color: COLORS.ink, marginTop: 16, marginBottom: 6 },
  h3: { fontSize: 16, fontWeight: '900', color: COLORS.ink },
});

const sCard = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  title: { color: COLORS.ink, fontWeight: '900' },
  meta: { color: COLORS.sub, marginTop: 2 },
  body: { color: COLORS.ink, marginTop: 6 },
});

const picker = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 60,
    bottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  title: { fontSize: 16, fontWeight: '900', color: '#4a235a', marginBottom: 8, textAlign: 'center' },
  input: { backgroundColor: '#F7F2FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, color: '#4a235a' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0e8ff',
  },
  itemTitle: { color: '#4a235a', fontWeight: '900' },
  itemMeta: { color: '#6b3fa3', marginTop: 2 },
  itemGoal: { color: '#4a235a', marginTop: 4 },
  empty: { color: '#6b3fa3', textAlign: 'center', marginTop: 10 },
});
