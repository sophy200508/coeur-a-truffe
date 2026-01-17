// src/screens/Education/EducationScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList,
  Modal, Vibration, Alert, Share,
} from 'react-native';

import DATA, { CATEGORIES } from './skills-data';
import {
  getState, toggleFavorite, addSession, removeSession,
  stats7d, saveReminder, percentFor
} from './store-edu';

import RemindersPlanModal from '../../components/RemindersPlanModal';
import { schedulePlan, clearReminder } from '../ActivitesSensorielles/utils/acts-notifications';

const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  chip: '#F1E8FF',
};

export default function EducationScreen() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tous');
  const [level, setLevel] = useState('Tous');

  const [favorites, setFavorites] = useState({});
  const [progress, setProgress] = useState({});
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ count7: 0, minutes7: 0, successRate: 0 });
  const [reminder, setReminder] = useState(null);

  const [open, setOpen] = useState(false);
  const [skill, setSkill] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);

  const [chartMode, setChartMode] = useState('rate'); // rate|reps|minutes
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const st = await getState();
    setFavorites(st.favorites || {});
    setProgress(st.progress || {});
    setSessions(st.sessions || []);
    setReminder(st.reminder || null);
    setStats(await stats7d());
  };

  const levels = ['Tous', 'Débutant', 'Équilibré', 'Expert'];

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return DATA.filter(s => {
      const okQ = !qq || [s.title, ...(s.steps || []), s.tips || ''].join(' ').toLowerCase().includes(qq);
      const okC = cat === 'Tous' || s.category === cat;
      const okL = level === 'Tous' || s.level === level;
      return okQ && okC && okL;
    });
  }, [q, cat, level]);

  const chart = useMemo(() => buildDailySeries(sessions, 14, chartMode), [sessions, chartMode]);

  const Header = (
    <View style={s.header}>
      <Text style={s.h1}>Éducation</Text>

      <View style={s.topRow}>
        <TouchableOpacity
          style={[s.btnSecondary, reminder?.plan && { backgroundColor: '#2ecc71' }]}
          onPress={() => setPlanOpen(true)}
        >
          <Text style={s.btnTxt}>⏰ Rappels</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <Box label="Séances (7j)" value={String(stats.count7)} />
        <Box label="Minutes (7j)" value={String(stats.minutes7)} />
        <Box label="Succès (7j)" value={`${stats.successRate}%`} />
      </View>

      <View style={s.card}>
        <View style={[s.rowBetween, { marginBottom: 8 }]}>
          <Text style={s.h3}>Évolution (14 jours)</Text>
          <View style={s.row}>
            <ToggleChip label="% Succès" on={chartMode==='rate'} onPress={() => { setChartMode('rate'); setSelectedDay(null); }} />
            <ToggleChip label="Répétitions" on={chartMode==='reps'} onPress={() => { setChartMode('reps'); setSelectedDay(null); }} />
            <ToggleChip label="Minutes" on={chartMode==='minutes'} onPress={() => { setChartMode('minutes'); setSelectedDay(null); }} />
          </View>
        </View>

        <MiniBarChart
          series={chart.series}
          max={chart.max}
          mode={chartMode}
          onBarPress={(detail) => setSelectedDay(detail)}
        />
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Rechercher (titre, étapes, astuces…)"
        placeholderTextColor="#6b3fa3"
        style={s.input}
      />

      <View style={s.filtersCard}>
        <FlatList
          data={['Tous', ...CATEGORIES]}
          keyExtractor={(x) => x}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Chip label={item} active={item === cat} onPress={() => setCat(item)} />}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
        <View style={{ height: 8 }} />
        <FlatList
          data={levels}
          keyExtractor={(x) => x}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Chip label={item} active={item === level} onPress={() => setLevel(item)} />}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
      </View>
    </View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={s.empty}>Aucun exercice trouvé.</Text>}
        renderItem={({ item }) => (
          <SkillCard
            skill={item}
            fav={!!favorites[item.id]}
            percent={percentFor(progress[item.id], item.targetSuccess)}
            onToggleFav={async () => setFavorites(await toggleFavorite(item.id))}
            onStart={() => { setSkill(item); setOpen(true); }}
          />
        )}
      />

      {open && skill && (
        <SessionModal
          skill={skill}
          onClose={() => setOpen(false)}
          onSaved={async (payload) => {
            await addSession(payload);
            Vibration.vibrate(120);
            setOpen(false);
            await load();
          }}
        />
      )}

      {planOpen && (
        <RemindersPlanModal
          initialPlan={reminder?.plan}
          onClose={() => setPlanOpen(false)}
          onSave={async (plan) => {
            if (!plan) {
              await clearReminder();
              await saveReminder(null);
              setReminder(null);
            } else {
              await schedulePlan({ ...plan, title: '🐾 Éducation', body: 'Petite session d’éducation aujourd’hui 💜' });
              await saveReminder({ plan });
              setReminder({ plan });
            }
            setPlanOpen(false);
            Alert.alert('OK', 'Rappels mis à jour ✅');
          }}
        />
      )}

      <DayDetailModal
        visible={!!selectedDay}
        detail={selectedDay}
        sessions={sessions}
        onDeleteSession={async (id) => { await removeSession(id); await load(); }}
        onClose={() => setSelectedDay(null)}
      />
    </View>
  );
}

/* --- Chart --- */
function MiniBarChart({ series, max, mode, onBarPress }) {
  const maxH = 100;
  const bars = series.length ? series : Array.from({ length: 14 }, () => ({ dateLabel: '', value: 0, detail: null }));
  const firstLabel = series[0]?.dateLabel ?? '';
  const lastLabel = series[series.length - 1]?.dateLabel ?? '';
  const avg = bars.reduce((a, b) => a + (b.value || 0), 0) / Math.max(1, bars.length);

  const yMax = Math.max(1, max || (mode === 'rate' ? 100 : 10));
  const yMid = Math.round(yMax / 2);

  return (
    <View>
      <View style={chart.wrap}>
        <View style={chart.yAxis}>
          {[yMax, yMid, 0].map((v) => (
            <View key={v} style={chart.yRow}><Text style={chart.yTxt}>{v}</Text></View>
          ))}
        </View>

        <View style={chart.barsWrap}>
          {bars.map((b, idx) => {
            const h = Math.round((Math.min(yMax, Math.max(0, b.value)) / yMax) * maxH);
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                style={chart.barSlot}
                onPress={() => b.detail && onBarPress?.(b.detail)}
              >
                <View style={[chart.barBg, { height: maxH }]}>
                  <View style={[chart.barFill, { height: h }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={chart.bottomRow}>
        <Text style={chart.xTxt}>{firstLabel}</Text>
        <Text style={chart.avgTxt}>
          Moyenne: {mode === 'rate' ? `${Math.round(avg)}%` : Math.round(avg)}
        </Text>
        <Text style={chart.xTxt}>{lastLabel}</Text>
      </View>
    </View>
  );
}

function buildDailySeries(sessions, days = 14, mode = 'rate') {
  const start = new Date(); start.setHours(0,0,0,0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = Array.from({ length: days }).map((_, i) => {
    const d = new Date(start.getTime()); d.setDate(start.getDate() + i);
    return {
      key: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString(),
      dateLabel: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
      success: 0, reps: 0, minutes: 0
    };
  });

  (sessions || []).forEach(s => {
    const d = new Date(s.ts);
    const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    const b = buckets.find(x => x.key === k);
    if (b) {
      b.success += Number(s.success) || 0;
      b.reps += Number(s.reps) || 0;
      b.minutes += Number(s.durationMin) || 0;
    }
  });

  const series = buckets.map(b => {
    const rate = b.reps ? Math.round((b.success / b.reps) * 100) : 0;
    const value = mode === 'rate' ? rate : mode === 'reps' ? b.reps : b.minutes;
    return { dateLabel: b.dateLabel, value, detail: { ...b, rate } };
  });

  const max =
    mode === 'rate'
      ? 100
      : niceCeil(Math.max(1, ...series.map(x => x.value)));

  return { series, max };
}

function niceCeil(n) {
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  if (n <= 30) return 30;
  if (n <= 50) return 50;
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / p) * p;
}

/* --- Cards --- */
function SkillCard({ skill, fav, percent, onToggleFav, onStart }) {
  return (
    <View style={card.card}>
      <View style={s.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={card.title}>{skill.title}</Text>
          <Text style={card.meta}>{skill.category} • {skill.level} • objectif {skill.targetSuccess}</Text>
        </View>
        <TouchableOpacity onPress={onToggleFav} style={[card.fav, fav && card.favOn]}>
          <Text style={card.favTxt}>{fav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <View style={card.progressRow}>
        <View style={card.progressBarBg}>
          <View style={[card.progressBarFill, { width: `${percent}%` }]} />
        </View>
        <Text style={card.progressPct}>{percent}%</Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={s.h3}>Étapes</Text>
        {(skill.steps || []).map((st, i) => <Text key={i} style={card.step}>• {st}</Text>)}
        {!!skill.tips && <Text style={card.tips}>💡 {skill.tips}</Text>}
      </View>

      <View style={[s.rowBetween, { marginTop: 10 }]}>
        <TouchableOpacity style={s.btn} onPress={onStart}><Text style={s.btnTxt}>Démarrer</Text></TouchableOpacity>
      </View>
    </View>
  );
}

/* --- Session Modal --- */
function SessionModal({ skill, onClose, onSaved }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(60 * 3);
  const [reps, setReps] = useState(5);
  const [success, setSuccess] = useState(3);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const start = () => {
    if (running) return;
    setRunning(true);
    timer.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { clearInterval(timer.current); Vibration.vibrate(250); setRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };
  const stop = () => { if (timer.current) clearInterval(timer.current); setRunning(false); };
  const reset = () => { stop(); setSeconds(60 * 3); };

  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>{skill.title}</Text>
          <Text style={card.meta}>{skill.category} • {skill.level}</Text>

          <View style={s.timerBox}>
            <Text style={s.timerTxt}>{min}:{sec}</Text>
            <View style={s.row}>
              {!running ? (
                <TouchableOpacity style={s.btn} onPress={start}><Text style={s.btnTxt}>Démarrer</Text></TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btn, { backgroundColor: '#c0392b' }]} onPress={stop}><Text style={s.btnTxt}>Stop</Text></TouchableOpacity>
              )}
              <TouchableOpacity style={s.btnGhost} onPress={reset}><Text style={s.btnGhostTxt}>Reset</Text></TouchableOpacity>
            </View>
          </View>

          <View style={[s.rowBetween, { marginTop: 10 }]}>
            <Counter label="Répétitions" value={reps} onInc={() => setReps(reps + 1)} onDec={() => setReps(Math.max(1, reps - 1))} />
            <Counter label="Réussites" value={success} onInc={() => setSuccess(Math.min(reps, success + 1))} onDec={() => setSuccess(Math.max(0, success - 1))} />
          </View>

          <TextInput
            style={[s.input, { minHeight: 70, marginTop: 10 }]}
            placeholder="Note (optionnel)"
            placeholderTextColor="#6b3fa3"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={[s.row, { justifyContent: 'center', marginTop: 6 }]}>
            {[1,2,3,4,5].map(r => (
              <TouchableOpacity key={r} onPress={() => setRating(r)}>
                <Text style={{ fontSize: 22 }}>{r <= rating ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[s.rowBetween, { marginTop: 12 }]}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
            <TouchableOpacity
              style={s.btn}
              onPress={() => onSaved({
                id: genId(),
                ts: Date.now(),
                skillId: skill.id,
                durationMin: Math.max(1, Math.round((60 * 3 - seconds) / 60)),
                reps, success, notes, rating
              })}
            >
              <Text style={s.btnTxt}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* --- Day detail --- */
function DayDetailModal({ visible, detail, sessions, onDeleteSession, onClose }) {
  if (!visible || !detail) return null;

  const daySessions = (sessions || []).filter(s => {
    const d = new Date(s.ts);
    const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    return k === detail.key;
  });

  const exportCSV = async () => {
    const header = 'date,heure,exercice,minutes,reps,success,note,rating';
    const rows = daySessions.map(s => {
      const d = new Date(s.ts);
      const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      const title = (DATA.find(x => x.id === s.skillId)?.title || s.skillId).replace(/,/g,' ');
      const notes = (s.notes || '').replace(/\r?\n/g,' ').replace(/,/g,' ');
      return [date,time,title,s.durationMin,s.reps,s.success,notes,s.rating||''].join(',');
    });
    try {
      await Share.share({ title: `sessions_${detail.dateLabel}.csv`, message: [header, ...rows].join('\n') });
    } catch {
      Alert.alert('Erreur', 'Impossible de partager le CSV.');
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={day.wrap}>
        <View style={day.card}>
          <Text style={day.title}>Détail — {detail.dateLabel}</Text>
          <Text style={day.line}>Rép: {detail.reps} • Succès: {detail.success} • Min: {detail.minutes} • Taux: {detail.rate}%</Text>

          <TouchableOpacity style={day.btn} onPress={exportCSV}>
            <Text style={day.btnTxt}>Exporter CSV (jour)</Text>
          </TouchableOpacity>

          <Text style={day.sub}>Sessions</Text>
          {daySessions.length === 0 && <Text style={day.muted}>Aucune session.</Text>}

          <ScrollView style={{ maxHeight: 280 }}>
            {daySessions.map(ses => (
              <View key={ses.id} style={day.sessCard}>
                <View style={{ flex: 1 }}>
                  <Text style={day.sessTitle}>{labelOf(ses.skillId)}</Text>
                  <Text style={day.sessMeta}>{new Date(ses.ts).toLocaleTimeString()} • {ses.durationMin} min • {ses.reps} rép • {ses.success} succès</Text>
                </View>
                <TouchableOpacity style={[day.btn, { borderColor: '#c0392b' }]} onPress={() => onDeleteSession?.(ses.id)}>
                  <Text style={[day.btnTxt, { color: '#c0392b' }]}>Suppr.</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* --- UI bits --- */
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipTxt, active && s.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}
function ToggleChip({ label, on, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipTxt, on && s.chipTxtOn]}>{label}</Text>
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
function Counter({ label, value, onInc, onDec }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={onInc} style={[s.btn, { paddingVertical: 6 }]}><Text style={s.btnTxt}>＋</Text></TouchableOpacity>
      <Text style={[s.h3, { marginVertical: 4 }]}>{value}</Text>
      <TouchableOpacity onPress={onDec} style={[s.btnGhost, { paddingVertical: 6 }]}><Text style={s.btnGhostTxt}>−</Text></TouchableOpacity>
      <Text style={[s.meta, { marginTop: 4 }]}>{label}</Text>
    </View>
  );
}

const genId = () => String(Math.random()).slice(2) + String(Date.now());
const labelOf = (id) => (DATA.find(s => s.id === id)?.title || id);

/* --- styles --- */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' }, // ✅ laisse voir le fond global
  header: { padding: 20, paddingTop: 80 },

  h1: {
    fontSize: 26, fontWeight: '900', color: COLORS.ink,
    backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, alignSelf: 'center', marginBottom: 14,
  },
  h3: { fontSize: 16, fontWeight: '900', color: COLORS.ink },
  meta: { color: COLORS.sub },

  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 10 },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnSecondary: { backgroundColor: COLORS.secondary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnTxt: { color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.ink },
  statLbl: { color: COLORS.sub, marginTop: 4 },

  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.ink, marginBottom: 10 },

  filtersCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2, marginBottom: 12 },

  chip: { backgroundColor: COLORS.chip, borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22 },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { color: COLORS.ink, fontWeight: '800' },
  chipTxtOn: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },

  timerBox: { backgroundColor: '#F7F2FF', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  timerTxt: { color: COLORS.ink, fontSize: 30, fontWeight: '900', marginBottom: 8 },

  modalWrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '94%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, marginBottom: 8 },

  btnGhost: { borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnGhostTxt: { color: COLORS.ink, fontWeight: '800' },

  empty: { color: COLORS.sub, textAlign: 'center', marginTop: 12 },
});

const chart = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end' },
  yAxis: { width: 28, height: 110, justifyContent: 'space-between' },
  yRow: { height: 1, justifyContent: 'center' },
  yTxt: { fontSize: 10, color: COLORS.sub, textAlign: 'right' },

  barsWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 110, paddingBottom: 4 },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barBg: { width: 12, backgroundColor: '#EEE7FF', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: 12, backgroundColor: COLORS.primary, borderTopLeftRadius: 6, borderTopRightRadius: 6 },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  xTxt: { fontSize: 10, color: COLORS.sub },
  avgTxt: { fontSize: 12, fontWeight: '900', color: COLORS.ink },
});

const card = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  title: { color: COLORS.ink, fontWeight: '900', fontSize: 16 },
  meta: { color: COLORS.sub, marginTop: 2 },

  fav: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EFE6FB', alignItems: 'center', justifyContent: 'center' },
  favOn: { backgroundColor: '#f1d6ff' },
  favTxt: { fontSize: 22, color: COLORS.primary },

  step: { color: COLORS.ink, marginTop: 4 },
  tips: { color: COLORS.ink, marginTop: 8, fontStyle: 'italic' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressBarBg: { flex: 1, height: 10, backgroundColor: '#EEE7FF', borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  progressPct: { width: 48, textAlign: 'right', color: COLORS.ink, fontWeight: '900' },
});

const day = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, maxWidth: 520, maxHeight: '92%' },
  title: { color: COLORS.ink, fontWeight: '900', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  line: { color: COLORS.ink, marginTop: 4, textAlign: 'center' },
  sub: { color: COLORS.ink, fontWeight: '900', marginTop: 10, marginBottom: 6 },
  muted: { color: COLORS.sub, textAlign: 'center' },

  sessCard: { backgroundColor: '#F7F2FF', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sessTitle: { color: COLORS.ink, fontWeight: '900' },
  sessMeta: { color: COLORS.sub, marginTop: 2 },

  btn: { borderWidth: 1, borderColor: '#a077e6', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'center', marginTop: 10 },
  btnTxt: { color: COLORS.ink, fontWeight: '800' },
});
