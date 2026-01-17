import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import H1 from '../../components/H1';
import useTrackProgress from './useTrackProgress';

const STEPS = [
  { id: '1', title: 'Cohérence marche', duration: '10 min', description: 'Marche au rythme, pauses régulières et observation du calme.' },
  { id: '2', title: 'Jeu olfactif', duration: '8 min', description: 'Recherche simple (friandises au sol / tapis / boîtes).' },
  { id: '3', title: 'Toucher ciblé', duration: '3 min', description: 'Toucher bref + récompense, arrêts fréquents, consentement.' },
  { id: '4', title: 'On/Off arousal', duration: '5 min', description: 'Alterner excitation contrôlée et retour au calme.' },
];

export default function ParcoursEquilibreList() {
  const navigation = useNavigation();
  const { doneMap, toggle, resetAll } = useTrackProgress('equilibre');

  const goDetail = (step, done) => {
    navigation.navigate('StepDetail', { track: 'equilibre', step, done: !!done });
  };

  const renderItem = ({ item }) => {
    const done = !!doneMap[item.id];
    return (
      <View style={s.item}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.meta}>{item.duration}</Text>
          {done ? <Text style={s.done}>✅ Validée</Text> : null}
        </View>

        <View style={s.col}>
          <TouchableOpacity
            style={[s.btn, done && { backgroundColor: '#2ecc71' }]}
            onPress={() => goDetail(item, done)}
          >
            <Text style={s.btnTxt}>{done ? 'Refaire' : 'Démarrer'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => toggle(item.id, !done)}>
            <Text style={s.linkTxt}>{done ? 'Marquer non fait' : 'Valider'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={STEPS}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={s.header}>
          <H1>Évolutif équilibré</H1>
          <TouchableOpacity style={s.ghost} onPress={resetAll}>
            <Text style={s.ghostTxt}>Réinitialiser le parcours</Text>
          </TouchableOpacity>
        </View>
      }
      contentContainerStyle={{ padding: 20, paddingTop: 80, paddingBottom: 40, gap: 10 }}
    />
  );
}

const s = StyleSheet.create({
  header: { marginBottom: 10, alignItems: 'center' },
  item: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  title: { color: '#4a235a', fontWeight: '800', fontSize: 16 },
  meta: { color: '#6b3fa3', marginTop: 2 },
  done: { color: '#2ecc71', fontWeight: '700', marginTop: 6 },
  col: { alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  btn: { backgroundColor: '#7d4ac5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnTxt: { color: '#fff', fontWeight: '800' },
  link: { paddingVertical: 4 },
  linkTxt: { color: '#4a235a', textDecorationLine: 'underline', fontWeight: '700' },
  ghost: { borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  ghostTxt: { color: '#4a235a', fontWeight: '800' },
});
