import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { getAll, addEdu, toggleEdu, saveEduNotes, removeEdu } from '../store-moi';

export default function EducationTab() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const load = async () => { const d = await getAll(); setItems(d.education || []); };
  useEffect(()=>{ load(); }, []);

  const add = async () => {
    if (!title.trim()) return;
    await addEdu(title.trim(), desc.trim());
    setTitle(''); setDesc(''); await load();
  };

  const toggle = async (id) => { await toggleEdu(id); await load(); };
  const saveNotes = async (id, notes) => { await saveEduNotes(id, notes); };

  const Item = ({ it }) => (
    <View style={s.card}>
      <View style={s.row}>
        <TouchableOpacity onPress={()=>toggle(it.id)} style={[s.check, it.done && s.checkOn]}>
          <Text style={s.checkTxt}>{it.done?'✔':'→'}</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.title}>{it.title}</Text>
          {it.desc ? <Text style={s.desc}>{it.desc}</Text> : null}
          <TextInput
            style={s.notes}
            placeholder="Notes d’entraînement…"
            defaultValue={it.notes || ''}
            onEndEditing={(e)=> saveNotes(it.id, e.nativeEvent.text)}
            multiline
          />
        </View>
        <TouchableOpacity onPress={()=>{ removeEdu(it.id).then(load); }}><Text>🗑</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex:1 }}>
      <View style={s.inputCard}>
        <TextInput style={s.input} placeholder="Objectif (ex: reste calme à la porte)" value={title} onChangeText={setTitle} />
        <TextInput style={[s.input,{marginTop:6}]} placeholder="Description (optionnel)" value={desc} onChangeText={setDesc} />
        <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnTxt}>Ajouter</Text></TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i=>i.id}
        ItemSeparatorComponent={()=> <View style={{ height:8 }} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => <Item it={item} />}
        ListEmptyComponent={<Text style={s.empty}>Aucun objectif.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  inputCard:{ backgroundColor:'#fff', borderRadius:12, padding:10, marginBottom:10 },
  input:{ backgroundColor:'#F7F2FF', borderRadius:10, padding:10, color:'#4a235a' },
  btn:{ alignSelf:'flex-end', backgroundColor:'#7d4ac5', paddingVertical:8, paddingHorizontal:12, borderRadius:10, marginTop:8 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  card:{ backgroundColor:'#fff', borderRadius:12, padding:10 },
  row:{ flexDirection:'row', alignItems:'flex-start', gap:10 },
  check:{ width:36, height:36, borderRadius:8, backgroundColor:'#EFE6FB', alignItems:'center', justifyContent:'center' },
  checkOn:{ backgroundColor:'#2ecc71' },
  checkTxt:{ color:'#fff', fontWeight:'900' },
  title:{ color:'#4a235a', fontWeight:'800' },
  desc:{ color:'#6b3fa3', marginTop:2, marginBottom:6 },
  notes:{ backgroundColor:'#F7F2FF', borderRadius:10, padding:8, minHeight:60, textAlignVertical:'top', color:'#4a235a', marginTop:6 },
  empty:{ color:'#6b3fa3', textAlign:'center', marginTop:20 },
});
