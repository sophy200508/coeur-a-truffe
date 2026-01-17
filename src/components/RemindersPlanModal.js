import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = { ink:'#4a235a', sub:'#6b3fa3', primary:'#7d4ac5' };

export default function RemindersPlanModal({ initialPlan, onClose, onSave }) {
  // days: 0=dim .. 6=sam
  const WEEK = ['D','L','M','M','J','V','S'];
  const [days, setDays]     = useState(initialPlan?.days ?? [1,2,3,4,5]);
  const [hour, setHour]     = useState(initialPlan?.time?.hour ?? 18);
  const [minute, setMinute] = useState(initialPlan?.time?.minute ?? 0);
  const [weeks, setWeeks]   = useState(initialPlan?.weeks ?? 8);

  const toggle = d => setDays(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d].sort((a,b)=>a-b));
  const inc = (v,min,max)=> v+1>max ? min : v+1;
  const dec = (v,min,max)=> v-1<min ? max : v-1;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.wrap}>
        <View style={s.modal}>
          <Text style={s.title}>Planifier les rappels</Text>

          <Text style={s.h3}>Jours</Text>
          <View style={s.rowWrap}>
            {WEEK.map((lbl,idx)=>(
              <TouchableOpacity key={idx} onPress={()=>toggle(idx)} style={[s.chip, days.includes(idx)&&s.chipOn]}>
                <Text style={[s.chipTxt, days.includes(idx)&&s.chipTxtOn]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.h3}>Heure</Text>
          <View style={[s.row,{justifyContent:'center', gap:6}]}>
            <Stepper value={hour}   onInc={()=>setHour(inc(hour,0,23))}   onDec={()=>setHour(dec(hour,0,23))} />
            <Text style={{fontWeight:'900', color:COLORS.ink}}>:</Text>
            <Stepper value={minute} onInc={()=>setMinute(inc(minute,0,59))} onDec={()=>setMinute(dec(minute,0,59))} />
          </View>

          <Text style={s.h3}>Durée</Text>
          <View style={[s.row,{justifyContent:'center'}]}>
            <SmallStepper label="Semaines" value={weeks} onInc={()=>setWeeks(Math.min(52,weeks+1))} onDec={()=>setWeeks(Math.max(1,weeks-1))}/>
          </View>

          <View style={[s.row,{justifyContent:'space-between', marginTop:12}]}>
            <TouchableOpacity style={[s.btnOutline,{borderColor:'#c0392b'}]} onPress={()=>onSave(null)}>
              <Text style={[s.btnOutlineTxt,{color:'#c0392b'}]}>Désactiver</Text>
            </TouchableOpacity>
            <View style={s.row}>
              <TouchableOpacity style={s.btnOutline} onPress={onClose}><Text style={s.btnOutlineTxt}>Fermer</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btn,{marginLeft:8}]} disabled={days.length===0}
                onPress={()=>onSave({ days, time:{hour,minute}, weeks })}>
                <Text style={s.btnTxt}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ value, onInc, onDec }) {
  return (
    <View style={{alignItems:'center'}}>
      <TouchableOpacity onPress={onInc} style={[s.btn,{paddingVertical:6}]}><Text style={s.btnTxt}>＋</Text></TouchableOpacity>
      <Text style={[s.h3,{marginVertical:4}]}>{String(value).padStart(2,'0')}</Text>
      <TouchableOpacity onPress={onDec} style={[s.btnOutline,{paddingVertical:6}]}><Text style={s.btnOutlineTxt}>−</Text></TouchableOpacity>
    </View>
  );
}
function SmallStepper({ label, value, onInc, onDec }) {
  return (
    <View style={{alignItems:'center'}}>
      <View style={s.row}>
        <TouchableOpacity onPress={onDec} style={[s.btnOutline,{paddingVertical:6,paddingHorizontal:10}]}><Text style={s.btnOutlineTxt}>−</Text></TouchableOpacity>
        <Text style={[s.h3,{width:60, textAlign:'center'}]}>{value}</Text>
        <TouchableOpacity onPress={onInc} style={[s.btnOutline,{paddingVertical:6,paddingHorizontal:10}]}><Text style={s.btnOutlineTxt}>＋</Text></TouchableOpacity>
      </View>
      <Text style={[s.meta,{marginTop:4}]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:{ flex:1, backgroundColor:'#0008', alignItems:'center', justifyContent:'center', padding:16 },
  modal:{ width:'100%', backgroundColor:'#fff', borderRadius:18, padding:16, maxHeight:'92%' },
  title:{ fontSize:18, fontWeight:'900', color:COLORS.ink, marginBottom:8 },
  h3:{ color:COLORS.ink, fontWeight:'900', marginTop:8, marginBottom:6 },
  meta:{ color:COLORS.sub },

  row:{ flexDirection:'row', alignItems:'center' },
  rowWrap:{ flexDirection:'row', flexWrap:'wrap', gap:8 },

  chip:{ backgroundColor:'#F1E8FF', borderWidth:1, borderColor:'#d8c8ff', borderRadius:22, paddingVertical:8, paddingHorizontal:14 },
  chipOn:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  chipTxt:{ color:COLORS.ink, fontWeight:'800' },
  chipTxtOn:{ color:'#fff' },

  btn:{ backgroundColor:COLORS.primary, paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  btnOutline:{ borderWidth:1, borderColor:'#d8c8ff', paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnOutlineTxt:{ color:COLORS.ink, fontWeight:'800' },
});
