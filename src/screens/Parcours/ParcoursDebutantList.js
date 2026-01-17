import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import H1 from '../../components/H1';
import useTrackProgress from './useTrackProgress';

const STEPS = [
  { id: '1', title: 'Créer le lien', duration: '5 min', description: 'Observe calmement ton chien et note 1 chose positive.' },
  { id: '2', title: 'Balade calme', duration: '8 min', description: 'Marche lente en laisse, sans distractions.' },
  { id: '3', title: 'Caresse consciente', duration: '2 min', description: 'Caresse lente, arrête si le chien détourne.' },
  { id: '4', title: 'Jeu partagé', duration: '5 min', description: 'Jeu libre court, alternance pause/jeu.' },
  { id: '5', title: 'Évaluation', duration: '2 min', description: 'Note ton ressenti et celui de ton chien.' },
];

export default function ParcoursDebutantList() {
  const navigation = useNavigation();
  const { loaded, doneMap, toggle, resetAll } = useTrackProgress('debutant');

  const goDetail = (step, done) => {
    navigation.navigate('StepDetail', { track: 'debutant', step, done: !!done });
  };

  const renderItem = ({ item }) => {
    const done = !!doneMap[item.id]; // safe: doneMap jamais undefined
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
      // éviter undefined → on n’affiche rien de spécial pendant le 1er render
      ListHeaderComponent={
        <View style={s.header}>
          <H1>Débutant sensible</H1>
          <TouchableOpacity style={s.ghost} onPress={resetAll}>
            <Text style={s.ghostTxt}>Réinitialiser le parcours</Text>
          </TouchableOpacity>
          {!loaded && <Text style={s.loading}>Chargement…</Text>}
        </View>
      }
      contentContainerStyle={{ padding: 20, paddingTop: 80, paddingBottom: 40, gap: 10 }}
    />
  );
}

const s = StyleSheet.create({
  header: { marginBottom: 10, alignItems: 'center' },
  loading: { color: '#6b3fa3', marginTop: 6 },
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
