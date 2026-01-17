// src/screens/MoiEtMonChien/tabs/HabitudesTab.js
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { getAll, upsertHabit, toggleHabitToday, habitStreak, habitSeries, setHabitReminder, clearHabitReminder } from '../store-moi';
import { scheduleDaily, cancelScheduled } from '../utils/notifications';

export default function HabitudesTab() {
  const [habits, setHabits] = useState({});
  const [title, setTitle] = useState('');
  const [remModal, setRemModal] = useState({ open:false, id:null, hour:9, minute:0 });

  const load = async () => { const d = await getAll(); setHabits(d.habits || {}); };
  useEffect(()=>{ load(); }, []);

  const add = async () => {
    if (!title.trim()) return;
    const id = title.trim().toLowerCase().replace(/\s+/g,'_');
    await upsertHabit(id, title.trim(), 'daily');
    setTitle(''); await load();
  };

  const toggle = async (id) => {
    const h = await toggleHabitToday(id);
    setHabits(prev => ({ ...prev, [id]: h }));
  };

  const openReminder = (id) => {
    const r = habits[id]?.reminder || { hour:9, minute:0 };
    setRemModal({ open:true, id, hour:r.hour ?? 9, minute: r.minute ?? 0 });
  };

  const saveReminder = async () => {
    const { id, hour, minute } = remModal;
    if (!id) return;
    // annule ancien si existe
    if (habits[id]?.reminder?.notifId) await cancelScheduled(habits[id].reminder.notifId);
    const notifId = await scheduleDaily('Rappel habitude', habits[id].title, hour, minute);
    await setHabitReminder(id, { hour, minute, notifId });
    setRemModal({ open:false, id:null, hour:9, minute:0 });
    await load();
    Alert.alert('Rappel activé', `${habits[id].title} — ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
  };

  const clearReminder = async (id) => {
    const notifId = habits[id]?.reminder?.notifId;
    if (notifId) await cancelScheduled(notifId);
    await clearHabitReminder(id);
    await load();
  };

  const SeriesBar = ({ id, days=7 }) => {
    const srs = habitSeries(habits[id], days); // ancien→récent
    const w = 12, gap = 4;
    return (
      <View style={{ flexDirection:'row', alignItems:'flex-end', marginTop:6 }}>
        {srs.map((d, idx) => (
          <View key={idx} style={{
            width: w, height: d.ok ? 24 : 8, backgroundColor: d.ok ? '#2ecc71' : '#EFE6FB',
            borderRadius: 6, marginRight: gap
          }}/>
        ))}
      </View>
    );
  };

  const Item = ({ id, h }) => {
    const todayKey = new Date().toISOString().slice(0,10);
    const done = !!h.history[todayKey];
    const streak = habitStreak(h);
    const rem = h.reminder;

    return (
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex:1 }}>
            <Text style={s.title}>{h.title}</Text>
            <Text style={s.meta}>Série: {streak} jour(s)</Text>
            <SeriesBar id={id} days={7} />
          </View>
          <TouchableOpacity onPress={()=>toggle(id)} style={[s.check, done && s.checkOn]}>
            <Text style={s.checkTxt}>{done ? '✔' : '+'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={s.smallBtn} onPress={() => openReminder(id)}>
            <Text style={s.smallTxt}>{rem ? `⏰ ${String(rem.hour).padStart(2,'0')}:${String(rem.minute).padStart(2,'0')}` : '⏰ Rappel'}</Text>
          </TouchableOpacity>
          {rem ? (
            <TouchableOpacity style={[s.smallBtn,{ backgroundColor:'#c0392b'}]} onPress={() => clearReminder(id)}>
              <Text style={s.smallTxt}>Désactiver</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex:1 }}>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Ajouter une habitude (ex: 10 min de calme)"
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnTxt}>+</Text></TouchableOpacity>
      </View>

      <FlatList
        data={Object.keys(habits)}
        keyExtractor={k=>k}
        renderItem={({ item }) => <Item id={item} h={habits[item]} />}
        ItemSeparatorComponent={()=><View style={{height:8}} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={<Text style={s.empty}>Aucune habitude.</Text>}
      />

      {/* Modal rappel */}
      <Modal visible={remModal.open} transparent animationType="fade" onRequestClose={()=>setRemModal({open:false,id:null,hour:9,minute:0})}>
        <View style={s.modalWrap}>
          <View style={s.modal}>
            <Text style={s.h2}>Rappel quotidien</Text>
            <View style={s.timeRow}>
              <TextInput
                style={s.timeInput}
                keyboardType="numeric"
                value={String(remModal.hour)}
                onChangeText={(t)=> setRemModal(m=>({ ...m, hour: Math.max(0, Math.min(23, parseInt(t || '0',10))) }))}
              />
              <Text style={{fontSize:20, color:'#4a235a'}}>:</Text>
              <TextInput
                style={s.timeInput}
                keyboardType="numeric"
                value={String(remModal.minute)}
                onChangeText={(t)=> setRemModal(m=>({ ...m, minute: Math.max(0, Math.min(59, parseInt(t || '0',10))) }))}
              />
            </View>

            <View style={s.rowBetween}>
              <TouchableOpacity style={s.btnGhost} onPress={()=>setRemModal({open:false,id:null,hour:9,minute:0})}><Text style={s.btnGhostTxt}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={s.btnPrimary} onPress={saveReminder}><Text style={s.btnPrimaryTxt}>Enregistrer</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  inputRow:{ flexDirection:'row', gap:8, marginBottom:10 },
  input:{ flex:1, backgroundColor:'#fff', borderRadius:10, paddingHorizontal:10, color:'#4a235a' },
  btn:{ backgroundColor:'#7d4ac5', width:44, height:44, borderRadius:10, alignItems:'center', justifyContent:'center' },
  btnTxt:{ color:'#fff', fontWeight:'800', fontSize:20 },

  card:{ backgroundColor:'#fff', borderRadius:12, padding:12 },
  row:{ flexDirection:'row', alignItems:'center', gap:10 },
  title:{ color:'#4a235a', fontWeight:'800' },
  meta:{ color:'#6b3fa3', marginTop:2 },

  check:{ width:44, height:44, borderRadius:10, backgroundColor:'#EFE6FB', alignItems:'center', justifyContent:'center', marginLeft:10 },
  checkOn:{ backgroundColor:'#2ecc71' },
  checkTxt:{ color:'#fff', fontWeight:'900', fontSize:18 },

  actionsRow:{ flexDirection:'row', gap:8, marginTop:8 },
  smallBtn:{ backgroundColor:'#a077e6', paddingVertical:6, paddingHorizontal:10, borderRadius:8 },
  smallTxt:{ color:'#fff', fontWeight:'800' },

  // modal
  modalWrap:{ flex:1, backgroundColor:'#0007', alignItems:'center', justifyContent:'center', padding:16 },
  modal:{ backgroundColor:'#fff', borderRadius:14, padding:14, width:'100%' },
  h2:{ fontSize:18, fontWeight:'800', color:'#4a235a' },
  timeRow:{ flexDirection:'row', alignItems:'center', gap:8, marginTop:10, marginBottom:12, justifyContent:'center' },
  timeInput:{ width:64, backgroundColor:'#F7F2FF', borderRadius:10, padding:8, textAlign:'center', color:'#4a235a', fontSize:18, fontWeight:'800' },
  rowBetween:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  btnGhost:{ paddingVertical:10, paddingHorizontal:12 },
  btnGhostTxt:{ color:'#7d4ac5', fontWeight:'800' },
  btnPrimary:{ backgroundColor:'#7d4ac5', paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  btnPrimaryTxt:{ color:'#fff', fontWeight:'800' },

  empty:{ color:'#6b3fa3', textAlign:'center', marginTop:20 },
});
