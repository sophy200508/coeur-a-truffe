import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import useTrackProgress from './useTrackProgress';

export default function StepDetail({ route, navigation }) {
  const params = route?.params;
  if (!params || !params.step || !params.track) {
    return (
      <View style={s.center}>
        <Text style={s.err}>⚠️ Aucune donnée reçue pour cette étape.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { track, step } = params;
  const { markStepDone, resetStep } = useTrackProgress(track);

  const handleDone = async () => {
    await markStepDone(step.id);
    Alert.alert('Validé ✅', `Étape “${step.title}” marquée comme faite.`);
    navigation.goBack();
  };
  const handleReset = async () => {
    await resetStep(step.id);
    Alert.alert('Réinitialisé 🔄', `Tu peux recommencer “${step.title}”.`);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.h1}>{step.title}</Text>
      {step.duration ? <Text style={s.meta}>{step.duration}</Text> : null}
      {step.description ? <Text style={s.body}>{step.description}</Text> : null}

      <TouchableOpacity style={s.btn} onPress={handleDone}>
        <Text style={s.btnTxt}>✅ Valider l’étape</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, s.btnAlt]} onPress={handleReset}>
        <Text style={s.btnTxt}>🔄 Recommencer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backTxt}>← Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, paddingTop: 80, paddingBottom: 60 },
  h1: { fontSize: 22, fontWeight: '900', color: '#4a235a' },
  meta: { color: '#6b3fa3', marginTop: 4 },
  body: { color: '#4a235a', marginTop: 12, lineHeight: 22 },
  btn: { backgroundColor: '#7d4ac5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  btnAlt: { backgroundColor: '#ff9800' },
  btnTxt: { color: '#fff', fontWeight: '800' },
  back: { marginTop: 14, alignSelf: 'center' },
  backTxt: { color: '#4a235a', textDecorationLine: 'underline', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  err: { color: 'red', fontWeight: '700' },
});
