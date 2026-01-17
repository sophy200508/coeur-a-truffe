// src/screens/Nutrition/NutritionScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, Modal,
  ScrollView, Vibration, Alert,
} from 'react-native';

import {
  getState, addMeal, addWater, removeItem, stats7d, saveReminder,
} from './store-nutri';

import { exportNutriPDF } from './utils/export-nutri-pdf';
import { exportNutriCSV } from './utils/export-nutri-csv';
import { clearReminder, schedulePlan } from '../ActivitesSensorielles/utils/acts-notifications';

const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  chip: '#F1E8FF',
};

export default function NutritionScreen() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [favFoods, setFavFoods] = useState([]);
  const [stats, setStats] = useState({ meals7: 0, waterL7: 0, kcalPerDay: 0 });

  const [reminder, setReminderState] = useState(null);
  const [remModal, setRemModal] = useState(false);

  const [openMeal, setOpenMeal] = useState(false);
  const [openWater, setOpenWater] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const s = await getState();
    setItems(s.items || []);
    setFavFoods(s.favFoods || []);
    setReminderState(s.reminder || null);
    setStats(await stats7d());
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter(it =>
      it.type === 'meal'
        ? [it.food, it.note || ''].join(' ').toLowerCase().includes(qq)
        : (it.note || '').toLowerCase().includes(qq)
    );
  }, [items, q]);

  const onDelete = async (id) => { await removeItem(id); await load(); };

  const renderHeader = () => (
    <View style={s.header}>
      <Text style={s.title}>Nutrition & Hydratation</Text>

      <View style={s.topRow}>
        <TouchableOpacity style={s.btnSecondary} onPress={() => setOpenMeal(true)}><Text style={s.btnTxt}>+ Repas</Text></TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => setOpenWater(true)}><Text style={s.btnTxt}>+ Eau</Text></TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={exportNutriPDF}><Text style={s.btnTxt}>Exporter PDF</Text></TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={exportNutriCSV}><Text style={s.btnTxt}>Exporter CSV</Text></TouchableOpacity>
        <TouchableOpacity
          style={[s.btnSecondary, reminder?.plan ? { backgroundColor: '#2ecc71' } : null]}
          onPress={() => setRemModal(true)}
        >
          <Text style={s.btnTxt}>⏰ Rappels</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <Box label="Repas (7j)" value={String(stats.meals7)} />
        <Box label="Eau (7j)" value={`${stats.waterL7.toFixed(1)} L`} />
        <Box label="kcal moy./j (7j)" value={String(Math.round(stats.kcalPerDay))} />
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Rechercher (aliment, note...)"
        placeholderTextColor="#6b3fa3"
        style={s.input}
      />
    </View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={s.container}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={s.empty}>Aucune entrée pour l’instant.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.rowBetween}>
              <Text style={s.cardTitle}>{item.type === 'meal' ? '🍽️ Repas' : '💧 Hydratation'}</Text>
              <TouchableOpacity onPress={() => onDelete(item.id)}><Text>🗑</Text></TouchableOpacity>
            </View>
            <Text style={s.meta}>{new Date(item.ts).toLocaleString()}</Text>
            {item.type === 'meal' ? (
              <>
                <Text style={s.bodyBold}>{item.food}</Text>
                <Text style={s.meta}>{item.kcal} kcal • {item.amount} g • prot {item.protein || 0} g</Text>
                {item.note ? <Text style={s.body}>{item.note}</Text> : null}
              </>
            ) : (
              <>
                <Text style={s.bodyBold}>{item.ml} ml d’eau</Text>
                {item.note ? <Text style={s.body}>{item.note}</Text> : null}
              </>
            )}
          </View>
        )}
      />

      {openMeal && (
        <MealModal
          favFoods={favFoods}
          onClose={() => setOpenMeal(false)}
          onSaved={async () => { setOpenMeal(false); await load(); }}
        />
      )}

      {openWater && (
        <WaterModal
          onClose={() => setOpenWater(false)}
          onSaved={async () => { setOpenWater(false); await load(); }}
        />
      )}

      {remModal && (
        <PlanModal
          initial={reminder?.plan}
          onClose={() => setRemModal(false)}
          onSave={async (plan) => {
            if (!plan) {
              await clearReminder();
              await saveReminder(null);
              setReminderState(null);
              setRemModal(false);
              return;
            }
            await schedulePlan(plan);
            await saveReminder({ plan });
            setReminderState({ plan });
            setRemModal(false);
            Alert.alert('OK', 'Rappels planifiés ✅');
          }}
        />
      )}
    </View>
  );
}

/* ---------- Modal Plan Rappels ---------- */
function PlanModal({ initial, onClose, onSave }) {
  const WEEK = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const [days, setDays] = useState(initial?.days ?? [1,2,3,4,5]);
  const [hour, setHour] = useState(initial?.time?.hour ?? 18);
  const [minute, setMinute] = useState(initial?.time?.minute ?? 0);
  const [weeks, setWeeks] = useState(initial?.weeks ?? 8);

  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a,b)=>a-b));
  const inc = (val, min, max) => (val + 1 > max ? min : val + 1);
  const dec = (val, min, max) => (val - 1 < min ? max : val - 1);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={[s.modal, { maxHeight: '92%' }]}>
          <Text style={s.modalTitle}>Planifier les rappels</Text>

          <Text style={[s.cardTitle, { marginBottom: 6 }]}>Jours</Text>
          <View style={[s.row, { flexWrap: 'wrap', gap: 8, marginBottom: 10 }]}>
            {WEEK.map((lbl, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => toggleDay(idx)}
                style={[s.chip, days.includes(idx) && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
              >
                <Text style={[s.chipTxt, days.includes(idx) && { color:'#fff' }]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.cardTitle, { marginBottom: 6 }]}>Heure</Text>
          <View style={[s.row, { justifyContent: 'center', marginBottom: 10 }]}>
            <Stepper value={hour} onInc={() => setHour(inc(hour,0,23))} onDec={() => setHour(dec(hour,0,23))} label="Heure" />
            <Text style={{ marginHorizontal: 6, fontWeight: '900', color: COLORS.ink }}>:</Text>
            <Stepper value={minute} onInc={() => setMinute(inc(minute,0,59))} onDec={() => setMinute(dec(minute,0,59))} label="Minute" />
          </View>

          <Text style={[s.cardTitle, { marginBottom: 6 }]}>Durée</Text>
          <View style={[s.row, { justifyContent: 'center', marginBottom: 10 }]}>
            <Stepper value={weeks} onInc={() => setWeeks(Math.min(52, weeks+1))} onDec={() => setWeeks(Math.max(1, weeks-1))} label="Semaines" />
          </View>

          <View style={[s.rowBetween, { marginTop: 12 }]}>
            <TouchableOpacity style={[s.btnGhost, { borderColor: '#c0392b' }]} onPress={() => onSave(null)}>
              <Text style={[s.btnGhostTxt, { color: '#c0392b' }]}>Désactiver</Text>
            </TouchableOpacity>

            <View style={s.row}>
              <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, { marginLeft: 8 }]}
                onPress={() => onSave({ days, time:{hour,minute}, weeks })}
                disabled={days.length === 0}
              >
                <Text style={s.btnTxt}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Saisie repas/eau ---------- */
function MealModal({ favFoods, onClose, onSaved }) {
  const [food, setFood] = useState(favFoods[0] || '');
  const [kcal, setKcal] = useState('');
  const [amount, setAmount] = useState('');
  const [protein, setProtein] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!food) return;
    setSaving(true);
    await addMeal({ food: food.trim(), kcal: Number(kcal)||0, amount: Number(amount)||0, protein: Number(protein)||0, note: note.trim()||undefined });
    Vibration.vibrate(120);
    setSaving(false);
    onSaved();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Ajouter un repas</Text>

          {favFoods.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {favFoods.map((f, i) => (
                <TouchableOpacity key={i} style={s.chip} onPress={() => setFood(f)}>
                  <Text style={s.chipTxt}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TextInput value={food} onChangeText={setFood} placeholder="Aliment (ex: croquettes…)" style={s.input} placeholderTextColor="#6b3fa3" />
          <View style={s.row}>
            <TextInput value={kcal} onChangeText={setKcal} keyboardType="numeric" placeholder="kcal" style={[s.input, { flex: 1 }]} placeholderTextColor="#6b3fa3" />
            <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="grammes" style={[s.input, { flex: 1 }]} placeholderTextColor="#6b3fa3" />
          </View>
          <TextInput value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="protéines (g) – optionnel" style={s.input} placeholderTextColor="#6b3fa3" />
          <TextInput value={note} onChangeText={setNote} placeholder="Note (optionnel)" style={[s.input, { minHeight: 70 }]} multiline placeholderTextColor="#6b3fa3" />

          <View style={s.rowBetween}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={save} disabled={saving}><Text style={s.btnTxt}>{saving ? '...' : 'Enregistrer'}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WaterModal({ onClose, onSaved }) {
  const [ml, setMl] = useState('250');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await addWater({ ml: Number(ml)||0, note: note.trim()||undefined });
    Vibration.vibrate(120);
    setSaving(false);
    onSaved();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Ajouter de l’eau</Text>

          <View style={s.row}>
            {[150, 250, 330, 500].map(v => (
              <TouchableOpacity key={v} style={s.chip} onPress={() => setMl(String(v))}>
                <Text style={s.chipTxt}>{v} ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput value={ml} onChangeText={setMl} keyboardType="numeric" placeholder="Quantité (ml)" style={s.input} placeholderTextColor="#6b3fa3" />
          <TextInput value={note} onChangeText={setNote} placeholder="Note (optionnel)" style={[s.input, { minHeight: 70 }]} multiline placeholderTextColor="#6b3fa3" />

          <View style={s.rowBetween}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={save} disabled={saving}><Text style={s.btnTxt}>{saving ? '...' : 'Enregistrer'}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- briques ---------- */
function Stepper({ value, onInc, onDec, label }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={onInc} style={[s.btn, { paddingVertical: 6 }]}><Text style={s.btnTxt}>＋</Text></TouchableOpacity>
      <Text style={[s.cardTitle, { marginVertical: 4 }]}>{String(value).padStart(2, '0')}</Text>
      <TouchableOpacity onPress={onDec} style={[s.btnGhost, { paddingVertical: 6 }]}><Text style={s.btnGhostTxt}>−</Text></TouchableOpacity>
      <Text style={[s.meta, { marginTop: 4 }]}>{label}</Text>
    </View>
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

/* ---------- styles ---------- */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' }, // ✅ laisse voir le fond global (App.js)

  container: { padding: 20, paddingTop: 80, paddingBottom: 60 },
  header: { marginBottom: 10 },

  title: {
    fontSize: 26, fontWeight: '900', color: COLORS.ink,
    backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, alignSelf: 'center', marginBottom: 14,
  },

  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14, justifyContent: 'center' },

  btn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnSecondary: { backgroundColor: COLORS.secondary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnTxt: { color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.ink },
  statLbl: { color: COLORS.sub, marginTop: 4 },

  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.ink },

  chip: { backgroundColor: COLORS.chip, borderWidth: 1, borderColor: '#d8c8ff', borderRadius: 22, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  chipTxt: { color: COLORS.ink, fontWeight: '800' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  cardTitle: { color: COLORS.ink, fontWeight: '900', fontSize: 16 },
  meta: { color: COLORS.sub, marginTop: 2 },
  body: { color: COLORS.ink, marginTop: 6 },
  bodyBold: { color: COLORS.ink, marginTop: 6, fontWeight: '900' },

  empty: { color: COLORS.sub, textAlign: 'center', marginTop: 12 },

  modalWrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '94%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, marginBottom: 8 },

  btnGhost: { borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnGhostTxt: { color: COLORS.ink, fontWeight: '800' },
});
