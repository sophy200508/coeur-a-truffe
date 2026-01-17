import React, { useState, useEffect } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import { View, Text, StyleSheet, Image, ScrollView, Alert, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import H1 from '../../components/H1';

export default function AccueilScreen({ route, navigation }) {
  const [userData, setUserData] = useState(route.params?.userData || null);

  useEffect(() => {
    if (!userData) {
      const loadUserData = async () => {
        try {
          const data = await AsyncStorage.getItem('userData');
          if (data) {
            const parsed = JSON.parse(data);
            setUserData(parsed);
          } else {
            Alert.alert("Info", "Aucune donnée trouvée, redirection vers l'inscription.");
            navigation.replace('Inscription');
          }
        } catch (e) {
          Alert.alert("Erreur", "Impossible de charger les données.");
        }
      };
      loadUserData();
    }
  }, []);

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../assets/fondAccueil.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.containerBox}>
          <Text style={styles.title}>
            Bienvenue {userData.prenomHumain} et {userData.prenomChien} !
          </Text>
          <Text style={styles.subtitle}>Vous et votre chien, une équipe unique</Text>

          <Text style={styles.subtitle}>
            <Text style={styles.label}>Race :</Text> {userData.raceChien}
          </Text>
          <Text style={styles.subtitle}>
            <Text style={styles.label}>Activité :</Text> {userData.niveauActivite}
          </Text>
          <Text style={styles.subtitle}>
            <Text style={styles.label}>Ta date de naissance :</Text> {userData.dateNaissanceHumain}
          </Text>
          <Text style={styles.subtitle}>
            <Text style={styles.label}>Date naissance chien :</Text> {userData.dateNaissanceChien}
          </Text>

          {userData.photoUri ? (
            <Image source={{ uri: userData.photoUri }} style={styles.photo} />
          ) : (
            <Text style={styles.subtitle}>Pas de photo enregistrée</Text>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  containerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    color: '#7B5CB3',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: '#7B5CB3',
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginTop: 20,
  },
});
