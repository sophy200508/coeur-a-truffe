import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAll, addMemory, removeMemory } from '../store-moi';

export default function SouvenirsTab() {
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');

  const load = async () => { const d = await getAll(); setItems(d.memories || []); };
  useEffect(()=>{ load(); }, []);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission', 'Autorise l’accès aux photos.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.length) {
      await addMemory({ photoUri: res.assets[0].uri, note: note.trim() });
      setNote(''); await load();
    }
  };

  const del = async (id) => {
    Alert.alert('Supprimer ?', '', [
      { text:'Annuler', style:'cancel' },
      { text:'Supprimer', style:'destructive', onPress: async ()=>{ await removeMemory(id); await load(); } }
    ]);
  };

  const Item = ({ it }) => (
    <View style={s.card}>
      <Image source={{ uri: it.photoUri }} style={s.img} />
      {it.note ? <Text style={s.caption}>{it.note}</Text> : null}
      <View style={s.row}>
        <Text style={s.meta}>{new Date(it.ts).toLocaleString()}</Text>
        <TouchableOpacity onPress={()=>del(it.id)}><Text>🗑</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex:1 }}>
      <View style={s.inputCard}>
        <TextInput style={s.input} placeholder="Note (optionnel)" value={note} onChangeText={setNote} />
        <TouchableOpacity style={s.btn} onPress={pick}><Text style={s.btnTxt}>+ Photo</Text></TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i=>i.id}
        ItemSeparatorComponent={()=> <View style={{ height:10 }} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => <Item it={item} />}
        ListEmptyComponent={<Text style={s.empty}>Aucun souvenir.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  inputCard:{ backgroundColor:'#fff', borderRadius:12, padding:10, marginBottom:10, flexDirection:'row', gap:8, alignItems:'center' },
  input:{ flex:1, backgroundColor:'#F7F2FF', borderRadius:10, padding:10, color:'#4a235a' },
  btn:{ backgroundColor:'#7d4ac5', paddingVertical:10, paddingHorizontal:12, borderRadius:10 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  card:{ backgroundColor:'#fff', borderRadius:12, padding:10 },
  img:{ width:'100%', height:220, borderRadius:10, backgroundColor:'#ddd' },
  caption:{ color:'#4a235a', marginTop:8 },
  row:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:6 },
  meta:{ color:'#6b3fa3' },
  empty:{ color:'#6b3fa3', textAlign:'center', marginTop:20 },
});
