import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';

export default function InscriptionScreen({ navigation }) {
  const [prenom, setPrenom] = useState('');
  const [prenomChien, setPrenomChien] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [sexe, setSexe] = useState('');
  const [sterilise, setSterilise] = useState('');
  const [email, setEmail] = useState('');

  const handleInscription = () => {
    if (!prenom || !prenomChien || !dateNaissance || !sexe || !sterilise || !email) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs.');
      return;
    }

    // À personnaliser : envoie vers la suite (par ex. Accueil)
    navigation.replace('Accueil');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bienvenue !</Text>
      <TextInput
        placeholder="Ton prénom"
        value={prenom}
        onChangeText={setPrenom}
        style={styles.input}
      />
      <TextInput
        placeholder="Prénom de ton chien"
        value={prenomChien}
        onChangeText={setPrenomChien}
        style={styles.input}
      />
      <TextInput
        placeholder="Date de naissance (JJ/MM/AAAA)"
        value={dateNaissance}
        onChangeText={setDateNaissance}
        style={styles.input}
      />
      <TextInput
        placeholder="Sexe (F/M)"
        value={sexe}
        onChangeText={setSexe}
        style={styles.input}
      />
      <TextInput
        placeholder="Stérilisé / Castré ? (Oui / Non)"
        value={sterilise}
        onChangeText={setSterilise}
        style={styles.input}
      />
      <TextInput
        placeholder="Ton e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />

      <Button title="Commencer" onPress={handleInscription} color="#7d4ac5" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f7ff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7d4ac5',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
});
