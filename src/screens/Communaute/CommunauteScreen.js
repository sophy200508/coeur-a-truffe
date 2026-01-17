// src/screens/Communaute/CommunauteScreen.js
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../../components/ScreenContainer';

export default function CommunauteScreen({ navigation }) {
  const onLogout = async () => {
    Alert.alert(
      'Se déconnecter',
      'Tu veux vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userData');
              // Retour à l'écran d'inscription (et le Drawer se recalera au prochain reload)
              navigation.reset({ index: 0, routes: [{ name: 'Inscription' }] });
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de se déconnecter.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Text style={s.h1}>Communauté</Text>

      <View style={s.card}>
        <Text style={s.big}>🚧 En construction</Text>
        <Text style={s.p}>
          La communauté arrive très bientôt. Tu pourras partager, échanger et trouver du soutien.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Compte</Text>
        <TouchableOpacity style={s.btnDanger} onPress={onLogout}>
          <Text style={s.btnTxt}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4a235a',
    textAlign: 'center',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  big: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4a235a',
    textAlign: 'center',
  },
  p: {
    marginTop: 10,
    color: '#6b3fa3',
    textAlign: 'center',
    lineHeight: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4a235a',
    marginBottom: 10,
  },
  btnDanger: {
    backgroundColor: '#c0392b',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnTxt: {
    color: '#fff',
    fontWeight: '900',
  },
});
