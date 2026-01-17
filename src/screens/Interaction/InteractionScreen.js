import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList,
  Modal, Vibration, Alert, Share
} from 'react-native';

import ScreenBackground from '../../components/ScreenBackground';
import ScreenContainer from '../../components/ScreenContainer';

import DATA, { INTER_CATEGORIES } from './interactions-data';
import {
  getState, toggleFavorite, addSession, removeSession,
  stats7d, saveReminder
} from './store-inter';

import RemindersPlanModal from '../../components/RemindersPlanModal';
import { schedulePlan, clearReminder } from '../ActivitesSensorielles/utils/acts-notifications';

const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  chip: '#F1E8FF',
};

export default function InteractionScreen() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tous');
  const [level, setLevel] = useState('Tous');
  const levels = ['Tous', 'Débutant', 'Équilibré', 'Expert'];

  const [favorites, setFavorites] = useState({});
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ count7: 0, minutes7: 0, calmRate7: 0 });

  const [mode, setMode] = useState('minutes'); // minutes|calm
  const [dayDetail, setDayDetail] = useState(null);

  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);

  const [reminder, setReminder] = useState(null);
  const [remOpen, setRemOpen] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const st = await getState();
    setFavorites(st.favorites || {});
    setSessions(st.sessions || []);
    setReminder(st.reminder || null);
    setStats(await stats7d());
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return DATA.filter(it => {
      const okQ = !qq || [it.title, it.goal || '', it.tips || ''].join(' ').toLowerCase().includes(qq);
      const okC = cat === 'Tous' || it.category === cat;
      const okL = level === 'Tous' || it.level === level;
      return okQ && okC && okL;
    });
  }, [q, cat, level]);

  const chart = useMemo(() => buildSeries(sessions, 14, mode), [sessions, mode]);

  const Header = (
    <View style={s.header}>
      <Text style={s.h1}>Interaction</Text>

      <View style={s.topRow}>
        <TouchableOpacity
          style={[s.btnSecondary, reminder?.plan && { backgroundColor: '#2ecc71' }]}
          onPress={() => setRemOpen(true)}
        >
          <Text style={s.btnTxt}>⏰ Rappels</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} onPress={() => exportCSVAll(sessions)}>
          <Text style={s.btnTxt}>Exporter CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <Box label="Séances (7j)" value={String(stats.count7)} />
        <Box label="Minutes (7j)" value={String(stats.minutes7)} />
        <Box label="Calme (7j)" value={`${stats.calmRate7}%`} />
      </View>

      <View style={s.card}>
        <View style={[s.rowBetween, { marginBottom: 8 }]}>
          <Text style={s.h3}>Évolution (14 jours)</Text>
          <View style={s.row}>
            <ToggleChip label="Minutes" on={mode === 'minutes'} onPress={() => { setMode('minutes'); setDayDetail(null); }} />
            <ToggleChip label="% Calme" on={mode === 'calm'} onPress={() => { setMode('calm'); setDayDetail(null); }} />
          </View>
        </View>
        <MiniBarChart series={chart.series} max={chart.max} onBarPress={(d) => setDayDetail(d)} />
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Rechercher (titre, but, astuces…)"
        placeholderTextColor="#6b3fa3"
        style={s.input}
      />

      <View style={s.filtersCard}>
        <FlatList
          data={['Tous', ...INTER_CATEGORIES]}
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
    <ScreenBackground>
      <ScreenContainer style={{ backgroundColor: 'transparent' }}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <FlatList
            style={{ backgroundColor: 'transparent' }}
            data={filtered}
            keyExtractor={(i) => i.id}
            ListHeaderComponent={Header}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, backgroundColor: 'transparent' }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={<Text style={s.empty}>Aucun élément.</Text>}
            renderItem={({ item: it }) => (
              <InterCard
                it={it}
                fav={!!favorites[it.id]}
                onToggleFav={async () => setFavorites(await toggleFavorite(it.id))}
                onStart={() => { setItem(it); setOpen(true); }}
              />
            )}
          />

          {open && item && (
            <SessionModal
              inter={item}
              onClose={() => setOpen(false)}
              onSaved={async (payload) => {
                await addSession(payload);
                Vibration.vibrate(120);
                setOpen(false);
                await load();
              }}
            />
          )}

          {remOpen && (
            <RemindersPlanModal
              initialPlan={reminder?.plan}
              onClose={() => setRemOpen(false)}
              onSave={async (plan) => {
                if (!plan) {
                  await clearReminder();
                  await saveReminder(null);
                  setReminder(null);
                } else {
                  await schedulePlan({ ...plan, title: '🐾 Interaction', body: 'Une petite interaction guidée aujourd’hui 💜' });
                  await saveReminder({ plan });
                  setReminder({ plan });
                }
                setRemOpen(false);
                Alert.alert('OK', 'Rappels mis à jour ✅');
              }}
            />
          )}

          <DayDetailModal
            visible={!!dayDetail}
            detail={dayDetail}
            sessions={sessions}
            onDeleteSession={async (id) => { await removeSession(id); await load(); }}
            onClose={() => setDayDetail(null)}
          />
        </View>
      </ScreenContainer>
    </ScreenBackground>
  );
}

/* -------- chart -------- */
function MiniBarChart({ series, max, onBarPress }) {
  const maxH = 100;
  const first = series[0]?.dateLabel ?? '';
  const last = series[series.length - 1]?.dateLabel ?? '';
  const avg = series.length ? Math.round(series.reduce((a, b) => a + (b.value || 0), 0) / series.length) : 0;

  return (
    <View>
      <View style={chart.wrap}>
        <View style={chart.yAxis}>
          {[max, Math.round(max / 2), 0].map(v => (
            <View key={v} style={chart.yRow}><Text style={chart.yTxt}>{v}</Text></View>
          ))}
        </View>
        <View style={chart.barsWrap}>
          {series.map((b, i) => {
            const h = Math.round((Math.min(max, Math.max(0, b.value)) / Math.max(1, max)) * maxH);
            return (
              <TouchableOpacity key={i} style={chart.barSlot} onPress={() => b.detail && onBarPress?.(b.detail)}>
                <View style={[chart.barBg, { height: maxH }]}>
                  <View style={[chart.barFill, { height: h }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={chart.bottomRow}>
        <Text style={chart.xTxt}>{first}</Text>
        <Text style={chart.avgTxt}>Moy: {avg}</Text>
        <Text style={chart.xTxt}>{last}</Text>
      </View>
    </View>
  );
}

function buildSeries(sessions, days = 14, mode = 'minutes') {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = Array.from({ length: days }).map((_, i) => {
    const d = new Date(start.getTime()); d.setDate(start.getDate() + i);
    return {
      key: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString(),
      dateLabel: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      minutes: 0, count: 0, calm: 0
    };
  });

  (sessions || []).forEach(s => {
    const d = new Date(s.ts);
    const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    const b = buckets.find(x => x.key === k);
    if (b) {
      b.minutes += Number(s.durationMin) || 0;
      b.count += 1;
      if (s.outcome === 'calme') b.calm += 1;
    }
  });

  const series = buckets.map(b => {
    const calmRate = b.count ? Math.round((b.calm / b.count) * 100) : 0;
    const value = mode === 'minutes' ? b.minutes : calmRate;
    return { dateLabel: b.dateLabel, value, detail: { key: b.key, dateLabel: b.dateLabel, minutes: b.minutes, count: b.count, calmRate } };
  });

  const maxV = mode === 'minutes' ? niceCeil(Math.max(10, ...series.map(s => s.value))) : 100;
  return { series, max: maxV };
}

function niceCeil(n) {
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  if (n <= 30) return 30;
  if (n <= 50) return 50;
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / p) * p;
}

/* -------- cards/modals -------- */
function InterCard({ it, fav, onToggleFav, onStart }) {
  return (
    <View style={c.card}>
      <View style={s.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={c.title}>{it.title}</Text>
          <Text style={c.meta}>{it.category} • {it.level}</Text>
          {!!it.goal && <Text style={c.body}>🎯 {it.goal}</Text>}
          {!!it.tips && <Text style={c.body}>💡 {it.tips}</Text>}
        </View>
        <TouchableOpacity onPress={onToggleFav} style={[c.fav, fav && c.favOn]}>
          <Text style={c.favTxt}>{fav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.rowBetween, { marginTop: 8 }]}>
        <TouchableOpacity style={s.btn} onPress={onStart}><Text style={s.btnTxt}>Démarrer</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function SessionModal({ inter, onClose, onSaved }) {
  const [seconds, setSeconds] = useState(3 * 60);
  const [running, setRunning] = useState(false);
  const [intensity, setIntensity] = useState(2);
  const [outcome, setOutcome] = useState('ok'); // calme|ok|tendu
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
  const reset = () => { stop(); setSeconds(3 * 60); };

  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>{inter.title}</Text>
          <Text style={c.meta}>{inter.category} • {inter.level}</Text>

          <View style={s.timerBox}>
            <Text style={s.timerTxt}>{min}:{sec}</Text>
            <View style={s.row}>
              {!running
                ? <TouchableOpacity style={s.btn} onPress={start}><Text style={s.btnTxt}>Démarrer</Text></TouchableOpacity>
                : <TouchableOpacity style={[s.btn, { backgroundColor: '#c0392b' }]} onPress={stop}><Text style={s.btnTxt}>Stop</Text></TouchableOpacity>
              }
              <TouchableOpacity style={s.btnGhost} onPress={reset}><Text style={s.btnGhostTxt}>Reset</Text></TouchableOpacity>
            </View>
          </View>

          <View style={[s.rowBetween, { marginTop: 10 }]}>
            <Counter label="Intensité" value={intensity} onInc={() => setIntensity(Math.min(5, intensity + 1))} onDec={() => setIntensity(Math.max(1, intensity - 1))} />
            <OutcomePicker value={outcome} onChange={setOutcome} />
          </View>

          <TextInput
            style={[s.input, { minHeight: 70, marginTop: 8 }]}
            placeholder="Note (optionnel)"
            placeholderTextColor="#6b3fa3"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={[s.row, { justifyContent: 'center', marginTop: 6 }]}>
            {[1, 2, 3, 4, 5].map(r => (
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
                interId: inter.id,
                durationMin: Math.max(1, Math.round((3 * 60 - seconds) / 60)),
                intensity, outcome, notes, rating
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

function DayDetailModal({ visible, detail, sessions, onDeleteSession, onClose }) {
  if (!visible || !detail) return null;

  const daySessions = (sessions || []).filter(s => {
    const d = new Date(s.ts);
    const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    return k === detail.key;
  });

  const exportDay = async () => {
    const header = 'date,heure,interaction,min,intensite,issue,note,rating';
    const rows = daySessions.map(s => {
      const d = new Date(s.ts);
      const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const title = (DATA.find(x => x.id === s.interId)?.title || s.interId).replace(/,/g, ' ');
      const notes = (s.notes || '').replace(/\r?\n/g, ' ').replace(/,/g, ' ');
      return [date, time, title, s.durationMin, s.intensity, s.outcome, notes, s.rating || ''].join(',');
    });

    try { await Share.share({ title: `interactions_${detail.dateLabel}.csv`, message: [header, ...rows].join('\n') }); }
    catch { Alert.alert('Erreur', 'Partage impossible.'); }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={m.wrap}>
        <View style={m.card}>
          <Text style={m.title}>Détail — {detail.dateLabel}</Text>
          <Text style={m.line}>Minutes : {detail.minutes} • Séances : {detail.count} • Calme : {detail.calmRate}%</Text>

          <TouchableOpacity style={m.btnSmall} onPress={exportDay}>
            <Text style={m.btnSmallTxt}>Exporter CSV (jour)</Text>
          </TouchableOpacity>

          <Text style={m.sub}>Sessions</Text>
          {daySessions.length === 0 && <Text style={m.muted}>Aucune session.</Text>}
          {daySessions.map(se => (
            <View key={se.id} style={m.sessCard}>
              <View style={{ flex: 1 }}>
                <Text style={m.sessTitle}>{labelOf(se.interId)}</Text>
                <Text style={m.sessMeta}>
                  {new Date(se.ts).toLocaleTimeString()} • {se.durationMin} min • Int {se.intensity}/5 • {se.outcome}
                </Text>
                {se.notes ? <Text style={m.sessMeta}>📝 {se.notes}</Text> : null}
              </View>
              <TouchableOpacity style={[m.btnSmall, { borderColor: '#c0392b' }]} onPress={() => onDeleteSession?.(se.id)}>
                <Text style={[m.btnSmallTxt, { color: '#c0392b' }]}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* -------- helpers -------- */
function ToggleChip({ label, on, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipTxt, on && s.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}
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
function OutcomePicker({ value, onChange }) {
  const O = ['calme', 'ok', 'tendu'];
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={s.h3}>Issue</Text>
      <View style={[s.row, { marginTop: 6 }]}>
        {O.map(o => (
          <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.chip, value === o && s.chipOn]}>
            <Text style={[s.chipTxt, value === o && s.chipTxtOn]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const genId = () => String(Math.random()).slice(2) + String(Date.now());
const labelOf = (id) => (DATA.find(x => x.id === id)?.title || id);

async function exportCSVAll(sessions) {
  const header = 'date,heure,interaction,min,intensite,issue,note,rating';
  const rows = (sessions || []).map(s => {
    const d = new Date(s.ts);
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const title = (DATA.find(x => x.id === s.interId)?.title || s.interId).replace(/,/g, ' ');
    const notes = (s.notes || '').replace(/\r?\n/g, ' ').replace(/,/g, ' ');
    return [date, time, title, s.durationMin, s.intensity, s.outcome, notes, s.rating || ''].join(',');
  });
  try { await Share.share({ title: 'interactions.csv', message: [header, ...rows].join('\n') }); }
  catch { Alert.alert('Erreur', 'Partage impossible.'); }
}

/* -------- styles -------- */
const s = StyleSheet.create({
  header: { paddingTop: 80, paddingBottom: 12, backgroundColor: 'transparent' },

  h1: {
    fontSize: 26, fontWeight: '900', color: COLORS.ink,
    backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, alignSelf: 'center', marginBottom: 14,
  },
  h2: { fontSize: 20, fontWeight: '900', color: COLORS.ink, marginTop: 12, marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: '900', color: COLORS.ink },
  meta: { color: COLORS.sub },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 10 },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnSecondary: { backgroundColor: COLORS.secondary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnTxt: { color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.ink },
  statLbl: { color: COLORS.sub, marginTop: 4 },

  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.ink, marginBottom: 10 },

  filtersCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 12 },

  chip: { backgroundColor: COLORS.chip, borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22 },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { color: COLORS.ink, fontWeight: '800' },
  chipTxtOn: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, marginBottom: 12 },

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

const c = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  title: { color: COLORS.ink, fontWeight: '900', fontSize: 16 },
  meta: { color: COLORS.sub, marginTop: 2 },
  body: { color: COLORS.ink, marginTop: 6 },

  fav: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EFE6FB', alignItems: 'center', justifyContent: 'center' },
  favOn: { backgroundColor: '#f1d6ff' },
  favTxt: { fontSize: 22, color: COLORS.primary },
});

const m = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, maxWidth: 520, maxHeight: '92%' },
  title: { color: COLORS.ink, fontWeight: '900', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  line: { color: COLORS.ink, marginTop: 4, textAlign: 'center' },
  sub: { color: COLORS.ink, fontWeight: '900', marginTop: 10, marginBottom: 6 },
  muted: { color: COLORS.sub, textAlign: 'center' },

  sessCard: { backgroundColor: '#F7F2FF', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sessTitle: { color: COLORS.ink, fontWeight: '900' },
  sessMeta: { color: COLORS.sub, marginTop: 2 },

  btnSmall: { borderWidth: 1, borderColor: '#a077e6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
  btnSmallTxt: { color: COLORS.ink, fontWeight: '800' },
});
