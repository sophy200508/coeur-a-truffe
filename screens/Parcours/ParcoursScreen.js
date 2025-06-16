import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ParcoursScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisis ton parcours :</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ParcoursDebutant')}>
        <Text style={styles.buttonText}>Débutant</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ParcoursEquilibre')}>
        <Text style={styles.buttonText}>Équilibré</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ParcoursExpert')}>
        <Text style={styles.buttonText}>Expert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f0ff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#7d4ac5', padding: 12, borderRadius: 20, marginVertical: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
