import React, { useState, useEffect } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ParametresScreen({ navigation }) {
  const [form, setForm] = useState({
    prenomHumain: '',
    email: '',
    tadatedenaissance: '',
    prenomChien: '',
    raceChien: '',
    niveauActivite: '',
    dateNaissanceChien: '',
    photoUri: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setForm(JSON.parse(data));
      }
    };
    loadData();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    Alert.alert("Choisir une source", "", [
      {
        text: "Caméra",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission refusée", "Autorisez la caméra pour prendre une photo.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true });
          if (!result.canceled && result.assets?.length > 0) {
            setForm(prev => ({ ...prev, photoUri: result.assets[0].uri }));
          }
        }
      },
      {
        text: "Galerie",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true });
          if (!result.canceled && result.assets?.length > 0) {
            setForm(prev => ({ ...prev, photoUri: result.assets[0].uri }));
          }
        }
      },
      { text: "Annuler", style: "cancel" }
    ]);
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(form));
      navigation.reset({ index: 0, routes: [{ name: 'Accueil', params: { userData: form } }] });
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/fondAccueil.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.containerBox}>
          <Text style={styles.title}>Modifier mes informations</Text>

          <TextInput style={styles.input} placeholder="Prénom humain" value={form.prenomHumain} onChangeText={(val) => handleChange('prenomHumain', val)} />
          <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(val) => handleChange('email', val)} />
          <TextInput style={styles.input} placeholder="Ta date de naissance (JJ/MM/AAAA)" value={form.tadatedenaissance} onChangeText={(val) => handleChange('tadatedenaissance', val)} />
          <TextInput style={styles.input} placeholder="Prénom chien" value={form.prenomChien} onChangeText={(val) => handleChange('prenomChien', val)} />
          <TextInput style={styles.input} placeholder="Race chien" value={form.raceChien} onChangeText={(val) => handleChange('raceChien', val)} />
          <TextInput style={styles.input} placeholder="Niveau d'activité" value={form.niveauActivite} onChangeText={(val) => handleChange('niveauActivite', val)} />
          <TextInput style={styles.input} placeholder="Date de naissance chien (JJ/MM/AAAA)" value={form.dateNaissanceChien} onChangeText={(val) => handleChange('dateNaissanceChien', val)} />

          {form.photoUri ? (
            <Image source={{ uri: form.photoUri }} style={styles.photo} />
          ) : (
            <Text style={styles.subtitle}>Aucune photo enregistrée</Text>
          )}

          <TouchableOpacity style={styles.buttonSecondary} onPress={handlePickImage}>
            <Text style={styles.buttonText}>Ajouter / Modifier photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Enregistrer</Text>
          </TouchableOpacity>
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
    padding: 60,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.0)', // plus de fond opaque
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    color: '#A38ACF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#A38ACF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#FFF',
  },
  button: {
    backgroundColor: '#A38ACF',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: '#a077e6',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});
