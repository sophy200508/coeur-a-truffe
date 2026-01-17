// src/screens/MoiEtMonChien/tabs/JournalTab.js
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { addJournal, getAll, removeJournal } from '../store-moi';
import { exportJournalHealthPDF } from '../utils/export-pdf';

export default function JournalTab() {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => { const d = await getAll(); setItems(d.journal); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    await addJournal(text.trim());
    setText(''); await load();
  };
  const del = async (id) => {
    Alert.alert('Supprimer ?', '', [
      { text:'Annuler', style:'cancel' },
      { text:'Supprimer', style:'destructive', onPress: async ()=>{ await removeJournal(id); await load(); } }
    ]);
  };

  const exportPDF = async () => {
    try {
      await exportJournalHealthPDF();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le PDF.');
    }
  };

  const Item = ({ it }) => (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.date}>{new Date(it.ts).toLocaleString()}</Text>
        <TouchableOpacity onPress={() => del(it.id)}><Text style={s.del}>🗑</Text></TouchableOpacity>
      </View>
      <Text style={s.body}>{it.text}</Text>
    </View>
  );

  return (
    <View style={{ flex:1 }}>
      <View style={s.inputCard}>
        <TextInput
          style={s.input}
          placeholder="Écris un ressenti / une note…"
          value={text}
          onChangeText={setText}
          multiline
        />
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8 }}>
          <TouchableOpacity style={s.btnSecondary} onPress={exportPDF}><Text style={s.btnTxt}>Exporter PDF</Text></TouchableOpacity>
          <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnTxt}>Ajouter</Text></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={i=>i.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={()=> <View style={{ height:8 }} />}
        renderItem={({ item }) => <Item it={item} />}
        ListEmptyComponent={<Text style={s.empty}>Aucune entrée.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  inputCard:{ backgroundColor:'#fff', borderRadius:12, padding:10, marginBottom:10 },
  input:{ backgroundColor:'#F7F2FF', borderRadius:10, padding:10, minHeight:70, textAlignVertical:'top', color:'#4a235a' },
  btn:{ backgroundColor:'#7d4ac5', paddingVertical:8, paddingHorizontal:12, borderRadius:10 },
  btnSecondary:{ backgroundColor:'#a077e6', paddingVertical:8, paddingHorizontal:12, borderRadius:10 },
  btnTxt:{ color:'#fff', fontWeight:'800' },

  card:{ backgroundColor:'#fff', borderRadius:12, padding:10 },
  row:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  date:{ color:'#6b3fa3', fontWeight:'800' },
  del:{ fontSize:16 },
  body:{ color:'#4a235a', marginTop:6 },
  empty:{ color:'#6b3fa3', textAlign:'center', marginTop:20 },
});
