// src/screens/Cohabitation/CohabitationScreen.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../../components/ScreenContainer';

const STORAGE_KEY = 'cohab_v1';

const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  chip: '#F1E8FF',
  card: '#fff',
};

// Zones d’observation (exemples)
const AREAS = ['Salon', 'Cuisine', 'Entrée', 'Jardin', 'Promeneurs', 'Invités'];

// -------- Helpers
const rid = () =>
  (typeof crypto !== 'undefined' && crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint32Array(3)))
        .map(n => n.toString(16))
        .join('')
    : `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`);

const dayKey = ts => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const shortDay = ts =>
  new Date(ts).toLocaleDateString(undefined, { weekday: 'short' });

// --------- Main screen
export default function CohabitationScreen() {
  const [entries, setEntries] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  // form modal
  const [area, setArea] = useState(AREAS[0]);
  const [score, setScore] = useState(3);
  const [note, setNote] = useState('');
  const savingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setEntries(raw ? JSON.parse(raw) : []);
    })();
  }, []);

  const saveAll = async next => {
    setEntries(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // filtres simples
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter(
      e =>
        e.area.toLowerCase().includes(s) ||
        (e.note || '').toLowerCase().includes(s)
    );
  }, [entries, q]);

  // stats & série 7j (moyenne par jour)
  const { avg7, count7, series } = useMemo(() => {
    const now = Date.now();
    const last7 = entries.filter(e => now - e.ts < 7 * 86400000);
    const count = last7.length;
    const avg =
      count === 0
        ? 0
        : Math.round(
            (last7.reduce((a, b) => a + (b.score || 0), 0) / count) * 10
          ) / 10;

    // Build last 7 days buckets
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.push({ k: dayKey(d), label: shortDay(d), vals: [] });
    }
    last7.forEach(e => {
      const k = dayKey(e.ts);
      const b = buckets.find(x => x.k === k);
      if (b) b.vals.push(e.score || 0);
    });
    const ser = buckets.map(b => ({
      dateLabel: b.label,
      value:
        b.vals.length === 0
          ? 0
          : Math.round(
              (b.vals.reduce((a, v) => a + v, 0) / b.vals.length) * 100
            ) / 100,
      detail: entries.filter(x => dayKey(x.ts) === b.k),
    }));
    return { avg7: avg, count7: count, series: ser };
  }, [entries]);

  const addEntry = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    const e = {
      id: rid(),
      ts: Date.now(),
      area,
      score,
      note: note.trim() || undefined,
    };
    await saveAll([e, ...entries]);
    setOpen(false);
    setArea(AREAS[0]);
    setScore(3);
    setNote('');
    Vibration.vibrate(120);
    savingRef.current = false;
  };

  const remove = id =>
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await saveAll(entries.filter(e => e.id !== id));
        },
      },
    ]);

  const maxForChart = 5; // score max

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.h1}>Cohabitation & Respect</Text>

        {/* actions */}
        <View style={s.row}>
          <TouchableOpacity style={s.btn} onPress={() => setOpen(true)}>
            <Text style={s.btnTxt}>+ Observation</Text>
          </TouchableOpacity>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher (zone, note...)"
            placeholderTextColor={COLORS.sub}
            style={[s.input, { flex: 1 }]}
          />
        </View>

        {/* stats */}
        <View style={s.statsRow}>
          <StatBox label="Entrées (7j)" value={String(count7)} />
          <StatBox label="Moyenne (7j)" value={String(avg7)} />
        </View>

        {/* mini chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Évolution 7 derniers jours</Text>
          <MiniBarChart
            series={series}
            max={maxForChart}
            onBarPress={listOfDay => {
              if (!listOfDay?.length) return;
              const msg = listOfDay
                .map(
                  e =>
                    `${new Date(e.ts).toLocaleTimeString()} — ${e.area} (${e.score}/5)${
                      e.note ? ` — ${e.note}` : ''
                    }`
                )
                .join('\n');
              Alert.alert('Détails du jour', msg);
            }}
          />
        </View>

        {/* liste simple (pas de FlatList pour éviter l’avertissement) */}
        <Text style={s.h2}>Journal</Text>
        {list.length === 0 ? (
          <Text style={s.empty}>Aucune observation.</Text>
        ) : (
          list.map(item => (
            <View key={item.id} style={s.entry}>
              <View style={s.rowBetween}>
                <Text style={s.entryTitle}>
                  {item.area} • {item.score}/5
                </Text>
                <TouchableOpacity onPress={() => remove(item.id)}>
                  <Text>🗑</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.meta}>{new Date(item.ts).toLocaleString()}</Text>
              {item.note ? <Text style={s.body}>{item.note}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal ajout */}
      <Modal visible={open} onRequestClose={() => setOpen(false)} transparent>
        <View style={s.modalWrap}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Nouvelle observation</Text>

            <Text style={s.label}>Zone</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
            >
              {AREAS.map(a => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setArea(a)}
                  style={[s.chip, area === a && s.chipOn]}
                >
                  <Text style={[s.chipTxt, area === a && s.chipTxtOn]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Score</Text>
            <View style={[s.row, { justifyContent: 'center', marginBottom: 8 }]}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setScore(n)}>
                  <Text style={{ fontSize: 22, marginHorizontal: 4 }}>
                    {n <= score ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (optionnel)"
              placeholderTextColor={COLORS.sub}
              multiline
              style={[s.input, { minHeight: 70 }]}
            />

            <View style={[s.rowBetween, { marginTop: 12 }]}>
              <TouchableOpacity style={s.btnGhost} onPress={() => setOpen(false)}>
                <Text style={s.btnGhostTxt}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={addEntry}>
                <Text style={s.btnTxt}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

/* ---------------- Mini bar chart (corrigé) ---------------- */
function MiniBarChart({ series, max, onBarPress }) {
  const MAXH = 100;
  const first = series[0]?.dateLabel ?? '';
  const last = series[series.length - 1]?.dateLabel ?? '';
  const avg = series.length
    ? Math.round(series.reduce((a, b) => a + (b.value || 0), 0) / series.length)
    : 0;

  return (
    <View>
      <View style={chart.wrap}>
        {/* Axe Y */}
        <View style={chart.yAxis}>
          {[max, Math.round(max / 2), 0].map(v => (
            <View key={v} style={chart.yRow}>
              <Text style={chart.yTxt}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Barres */}
        <View style={chart.barsWrap}>
          {series.map((b, i) => {
            const h = Math.round(
              (Math.max(0, b.value || 0) / Math.max(1, max)) * MAXH
            );
            return (
              <TouchableOpacity
                key={`${b.dateLabel}-${i}`}
                style={chart.barSlot}
                onPress={() => onBarPress && onBarPress(b.detail)}
                activeOpacity={0.8}
              >
                <View style={[chart.barBg, { height: MAXH }]}>
                  <View style={[chart.barFill, { height: h }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={chart.bottomRow}>
        <Text style={chart.xTxt}>{first}</Text>
        <Text style={chart.avgTxt}>Moyenne: {avg}</Text>
        <Text style={chart.xTxt}>{last}</Text>
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end' },
  yAxis: { width: 36, paddingRight: 6 },
  yRow: { height: 50, justifyContent: 'center' },
  yTxt: { fontSize: 11, color: COLORS.sub, textAlign: 'right' },

  barsWrap: { flexDirection: 'row', flex: 1, alignItems: 'flex-end', gap: 6 },
  barSlot: { flex: 1, alignItems: 'center' },
  barBg: {
    width: 16,
    backgroundColor: '#EFE6FB',
    borderRadius: 8,
    justifyContent: 'flex-end',
  },
  barFill: { width: 16, backgroundColor: COLORS.primary, borderRadius: 8 },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    alignItems: 'center',
  },
  xTxt: { fontSize: 11, color: COLORS.sub },
  avgTxt: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
});

/* ---------------- UI atoms ---------------- */
function StatBox({ label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

/* ---------------- styles écran ---------------- */
const s = StyleSheet.create({
  container: { padding: 20, paddingTop: 80, paddingBottom: 100 },
  h1: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 12,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  btnTxt: { color: '#fff', fontWeight: '800' },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#d8c8ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  btnGhostTxt: { color: COLORS.ink, fontWeight: '800' },

  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.ink,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.ink },
  statLbl: { color: COLORS.sub, marginTop: 4 },

  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTitle: { color: COLORS.ink, fontWeight: '900', marginBottom: 8 },

  h2: { color: COLORS.ink, fontWeight: '900', marginTop: 10, marginBottom: 8 },
  entry: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10 },
  entryTitle: { color: COLORS.ink, fontWeight: '900' },
  meta: { color: COLORS.sub, marginTop: 2 },
  body: { color: COLORS.ink, marginTop: 6 },

  empty: { color: COLORS.sub, textAlign: 'center', marginTop: 6 },

  chip: {
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: '#d8c8ff',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { color: COLORS.ink, fontWeight: '800' },
  chipTxtOn: { color: '#fff' },

  // modal
  modalWrap: {
    flex: 1,
    backgroundColor: '#0008',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 8,
  },
  label: { color: COLORS.sub, fontWeight: '700', marginBottom: 6 },
});
