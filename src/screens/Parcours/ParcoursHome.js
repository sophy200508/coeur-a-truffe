import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ParcoursHome() {
  const navigation = useNavigation();

  const Btn = ({label, to}) => (
    <TouchableOpacity style={s.btn} onPress={() => {
      console.log('Go ->', to);
      navigation.navigate(to);
    }}>
      <Text style={s.btnTxt}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Choisis ton parcours :</Text>
      <Btn label="Débutant"  to="ParcoursDebutantList" />
      <Btn label="Équilibré" to="ParcoursEquilibreList" />
      <Btn label="Expert"    to="ParcoursExpertList" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, alignItems:'center', justifyContent:'center', padding:24, backgroundColor:'#efe6fb' },
  title:{ fontSize:22, fontWeight:'800', color:'#000', marginBottom:18 },
  btn:{ backgroundColor:'#7d4ac5', paddingVertical:12, paddingHorizontal:22, borderRadius:22, marginVertical:10 },
  btnTxt:{ color:'#fff', fontWeight:'800' }
});
