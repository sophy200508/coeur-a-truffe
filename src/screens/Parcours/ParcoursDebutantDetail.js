import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { STEPS_DEBUTANT } from './steps-debutant';
import { getParcours, saveParcours, stepProgress, overallProgress } from './store-parcours';

export default function ParcoursDebutantDetail({ route, navigation }) {
  const { step: stepParam, stepId: stepIdParam } = route.params || {};
  const step = useMemo(()=> stepParam || STEPS_DEBUTANT.find(s=>s.id === String(stepIdParam || '1')), [stepParam, stepIdParam]);

  const [notes, setNotes] = useState('');
  const [checked, setChecked] = useState(new Set()); // task ids
  const [photoUri, setPhotoUri] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const [recording, setRecording] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    (async () => {
      const p = await getParcours();
      setNotes(p.notes?.[step.id] || '');
      setChecked(new Set(p.checks?.[step.id] || []));
      setPhotoUri(p.photos?.[step.id] || '');
      setAudioUri(p.audios?.[step.id] || '');
    })();
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, [step.id]);

  const toggle = (taskId) => setChecked(prev => {
    const n = new Set(prev);
    n.has(taskId) ? n.delete(taskId) : n.add(taskId);
    return n;
  });

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission', 'Autorise la galerie.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!r.canceled && r.assets?.length) setPhotoUri(r.assets[0].uri);
  };

  const recToggle = async ()=>{
    if (recording){
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); setAudioUri(uri); setRecording(null); return;
    }
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted){ Alert.alert('Micro refusé'); return; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS:true, playsInSilentModeIOS:true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync(); setRecording(rec);
  };

  const playAudio = async ()=>{
    if (!audioUri) return;
    if (soundRef.current) await soundRef.current.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    soundRef.current = sound; await sound.playAsync();
  };

  const canValidate = stepProgress({ checks:{ [step.id]: Array.from(checked) } }, step.id).valid;

  const save = async () => {
    const p = await getParcours();
    const next = {
      ...p,
      startedAt: p.startedAt || Date.now(),
      notes: { ...(p.notes||{}), [step.id]: notes },
      checks: { ...(p.checks||{}), [step.id]: Array.from(checked) },
      photos: photoUri ? { ...(p.photos||{}), [step.id]: photoUri } : p.photos,
      audios: audioUri ? { ...(p.audios||{}), [step.id]: audioUri } : p.audios,
      done: { ...(p.done||{}), [step.id]: canValidate ? true : !!p.done?.[step.id] },
    };
    if (Object.keys(next.done).length === STEPS_DEBUTANT.length) next.completedAt = next.completedAt || Date.now();
    await saveParcours(next);

    // si validé, propose d’ouvrir l’étape suivante
    if (canValidate) {
      const ov = overallProgress(next);
      const nextStep = STEPS_DEBUTANT.find(s=>s.id===ov.nextId);
      Alert.alert('Étape validée 🎉', 'Continuer vers la suite ?', [
        { text:'Plus tard', style:'cancel', onPress:()=>navigation.goBack() },
        { text:'Continuer', onPress:()=>navigation.replace('ParcoursDebutantDetail', { step: nextStep }) }
      ]);
    } else {
      navigation.goBack();
    }
  };

  const prog = stepProgress({ checks:{ [step.id]: Array.from(checked) } }, step.id);

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.h1}>{step.title}</Text>
      <Text style={s.desc}>{step.desc}</Text>
      {step.tip ? <Text style={s.tip}>💡 {step.tip}</Text> : null}

      {/* Progression locale */}
      <View style={s.bar}><View style={[s.fill,{width:`${Math.round((prog.doneCount/prog.total)*100)}%`}]} /></View>
      <Text style={s.meta}>{prog.doneCount}/{prog.total} tâches • {prog.requiredOK ? 'Obligatoires OK' : 'Obligatoires manquantes'}</Text>

      {/* Checklist */}
      <Text style={s.h2}>Checklist</Text>
      {step.tasks.map(t=>(
        <TouchableOpacity key={t.id} style={s.task} onPress={()=>toggle(t.id)}>
          <Text style={[s.box, checked.has(t.id)&&s.boxOn]}>{checked.has(t.id)?'✔':''}</Text>
          <Text style={s.taskLabel}>{t.label}{t.required ? ' *' : ''}</Text>
        </TouchableOpacity>
      ))}
      <Text style={s.req}>* requis — minimum {step.minChecks} au total</Text>

      {/* Notes */}
      <Text style={s.h2}>Notes</Text>
      <TextInput
        style={s.input}
        placeholder="Observations (signaux apaisés, contexte, durée...)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {/* Médias */}
      <Text style={s.h2}>Médias</Text>
      <View style={s.row}>
        <TouchableOpacity style={s.btnSm} onPress={pickPhoto}><Text style={s.btnTxt}>🖼 Photo</Text></TouchableOpacity>
        {photoUri ? <Image source={{ uri: photoUri }} style={s.photo} /> : <Text style={s.meta}>aucune</Text>}
      </View>
      <View style={s.row}>
        <TouchableOpacity style={[s.btnSm, recording && {backgroundColor:'#c0392b'}]} onPress={recToggle}>
          <Text style={s.btnTxt}>{recording ? '■ Stop' : (audioUri ? '🎙 Réenregistrer' : '🎙 Enregistrer')}</Text>
        </TouchableOpacity>
        {audioUri ? <TouchableOpacity style={s.btnSm} onPress={playAudio}><Text style={s.btnTxt}>▶ Écouter</Text></TouchableOpacity> : <Text style={s.meta}>aucun</Text>}
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={[s.btn, !canValidate && { opacity:0.6 }]}
        onPress={save}
      >
        <Text style={s.btnMainTxt}>{canValidate ? 'Valider l’étape' : 'Enregistrer (critères incomplets)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.btnGhost} onPress={()=>navigation.goBack()}>
        <Text style={s.btnGhostTxt}>Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:{ padding:16, paddingBottom:120 },
  h1:{ fontSize:20, fontWeight:'800', color:'#4a235a' },
  desc:{ color:'#6b3fa3', marginTop:6 },
  tip:{ color:'#4a235a', marginTop:6, fontStyle:'italic' },
  bar:{ height:10, backgroundColor:'#EFE6FB', borderRadius:6, marginTop:10, overflow:'hidden' },
  fill:{ height:'100%', backgroundColor:'#7d4ac5' },
  h2:{ marginTop:14, fontWeight:'800', color:'#4a235a' },
  task:{ flexDirection:'row', alignItems:'center', marginTop:8 },
  box:{ width:22, height:22, borderRadius:6, borderWidth:2, borderColor:'#7d4ac5', textAlign:'center', lineHeight:18, marginRight:8, color:'#fff' },
  boxOn:{ backgroundColor:'#7d4ac5' },
  taskLabel:{ color:'#4a235a', flex:1 },
  req:{ color:'#6b3fa3', fontSize:12, marginTop:6 },
  input:{ backgroundColor:'#F7F2FF', borderRadius:10, padding:10, minHeight:80, textAlignVertical:'top', color:'#4a235a', marginTop:6 },
  row:{ flexDirection:'row', alignItems:'center', gap:10, marginTop:8 },
  btnSm:{ backgroundColor:'#a077e6', paddingVertical:8, paddingHorizontal:12, borderRadius:10 },
  btn:{ backgroundColor:'#7d4ac5', padding:12, borderRadius:12, alignItems:'center', marginTop:16 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  btnMainTxt:{ color:'#fff', fontWeight:'800' },
  btnGhost:{ padding:10, alignItems:'center', marginTop:8 },
  btnGhostTxt:{ color:'#7d4ac5', fontWeight:'800' },
  photo:{ width:64, height:64, borderRadius:10, backgroundColor:'#ddd' },
  meta:{ color:'#6b3fa3' },
});
