import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { getAll, addHealth, removeHealth } from '../store-moi';

export default function SanteTab() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('');
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0,10));
  const [notes, setNotes] = useState('');

  const load = async () => { const d = await getAll(); setItems(d.health || []); };
  useEffect(()=>{ load(); }, []);

  const add = async () => {
    if (!type.trim()) return;
    await addHealth({ dateISO, type: type.trim(), notes: notes.trim() });
    setType(''); setNotes(''); await load();
  };

  const del = async (id) => {
    Alert.alert('Supprimer ?', '', [
      { text:'Annuler', style:'cancel' },
      { text:'Supprimer', style:'destructive', onPress: async ()=>{ await removeHealth(id); await load(); } }
    ]);
  };

  const Item = ({ it }) => (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.title}>{it.type}</Text>
        <TouchableOpacity onPress={()=>del(it.id)}><Text>🗑</Text></TouchableOpacity>
      </View>
      <Text style={s.meta}>{it.dateISO}</Text>
      {it.notes ? <Text style={s.body}>{it.notes}</Text> : null}
    </View>
  );

  return (
    <View style={{ flex:1 }}>
      <View style={s.inputCard}>
        <TextInput style={s.input} placeholder="Type (ex: vaccin, vermifuge, veto…)" value={type} onChangeText={setType} />
        <TextInput style={s.input} placeholder="Date (YYYY-MM-DD)" value={dateISO} onChangeText={setDateISO} />
        <TextInput style={[s.input,{minHeight:60, textAlignVertical:'top'}]} placeholder="Notes (optionnel)" value={notes} onChangeText={setNotes} multiline />
        <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnTxt}>Ajouter</Text></TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i=>i.id}
        ItemSeparatorComponent={()=> <View style={{ height:8 }} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => <Item it={item} />}
        ListEmptyComponent={<Text style={s.empty}>Aucun enregistrement santé.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  inputCard:{ backgroundColor:'#fff', borderRadius:12, padding:10, marginBottom:10 },
  input:{ backgroundColor:'#F7F2FF', borderRadius:10, padding:10, color:'#4a235a', marginBottom:6 },
  btn:{ alignSelf:'flex-end', backgroundColor:'#7d4ac5', paddingVertical:8, paddingHorizontal:12, borderRadius:10, marginTop:2 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  card:{ backgroundColor:'#fff', borderRadius:12, padding:10 },
  row:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title:{ color:'#4a235a', fontWeight:'800' },
  meta:{ color:'#6b3fa3', marginTop:2 },
  body:{ color:'#4a235a', marginTop:6 },
  empty:{ color:'#6b3fa3', textAlign:'center', marginTop:20 },
});
