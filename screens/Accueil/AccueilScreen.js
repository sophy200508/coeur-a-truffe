import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const humeurs = [
  { emoji: '😊', label: 'Sereine', message: 'Continue de rayonner comme ça 💛' },
  { emoji: '😔', label: 'Triste', message: 'Un câlin à ton chien peut t’aider 💗' },
  { emoji: '😠', label: 'Irritée', message: 'Prends une grande respiration… et observe Clem 🐾' },
  { emoji: '😴', label: 'Fatiguée', message: 'Pause douceur autorisée aujourd’hui ✨' },
];

const humeursChien = [
  { label: 'Calme et posé 🐾', message: 'Moment parfait pour renforcer votre lien par la douceur.' },
  { label: 'Agité ou excité 🐕💨', message: 'Une promenade ou un jeu peut l’aider à se recentrer.' },
  { label: 'Réservé ou anxieux 🐶😟', message: 'Offre-lui un espace calme, et reste présente avec lui.' },
];

export default function AccueilScreen() {
  const [humeur, setHumeur] = useState(null);
  const [humeurChien, setHumeurChien] = useState(null);
  const [journalChien, setJournalChien] = useState([]);
  const [evolutionDuo, setEvolutionDuo] = useState([]);
  const [afficherJournal, setAfficherJournal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const loadData = async () => {
      const dataChien = await AsyncStorage.getItem('journal_chien');
      const dataDuo = await AsyncStorage.getItem('evolution_duo');
      if (dataChien) setJournalChien(JSON.parse(dataChien));
      if (dataDuo) setEvolutionDuo(JSON.parse(dataDuo));
    };
    loadData();
  }, []);

  useEffect(() => {
    if (humeur && humeurChien) {
      const now = new Date().toLocaleString();
      const message = genererLienDuJour(humeur.label, humeurChien.label);
      const nouvelleEntree = {
        date: now,
        humain: humeur.label,
        chien: humeurChien.label,
        resume: message,
      };
      const updated = [nouvelleEntree, ...evolutionDuo];
      setEvolutionDuo(updated);
      AsyncStorage.setItem('evolution_duo', JSON.stringify(updated));
    }
  }, [humeur, humeurChien]);

  const supprimerEntreeDuo = async (indexToDelete) => {
    const updated = evolutionDuo.filter((_, index) => index !== indexToDelete);
    setEvolutionDuo(updated);
    await AsyncStorage.setItem('evolution_duo', JSON.stringify(updated));
  };

  const genererLienDuJour = (humeurHumaine, humeurDuChien) => {
    if (
      humeurHumaine === 'Sereine' && humeurDuChien.includes('Calme')
      || humeurHumaine === 'Joyeuse' && humeurDuChien.includes('Excité')
    ) {
      return '💞 En harmonie aujourd’hui';
    }
    if (
      humeurHumaine === 'Triste' || humeurHumaine === 'Irritée' || humeurDuChien.includes('Réservé') || humeurDuChien.includes('Agité')
    ) {
      return '🧩 Soutien mutuel nécessaire';
    }
    return '🌀 Besoin d’attention ou d’équilibre';
  };

  const noterObservationChien = async () => {
    const nouvelleEntree = {
      date: new Date().toLocaleString(),
      message: "Observation urgente concernant le comportement du chien",
    };
    const updated = [nouvelleEntree, ...journalChien];
    setJournalChien(updated);
    await AsyncStorage.setItem('journal_chien', JSON.stringify(updated));
    Alert.alert("Observation enregistrée", "Tu peux la consulter en bas de cette page.");
  };

  const supprimerObservation = async (indexToDelete) => {
    const updated = journalChien.filter((_, index) => index !== indexToDelete);
    setJournalChien(updated);
    await AsyncStorage.setItem('journal_chien', JSON.stringify(updated));
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bonjour Sophie 🌸</Text>
      <Text style={styles.subtitle}>Comment te sens-tu aujourd’hui ?</Text>

      <View style={styles.smileyRow}>
        {humeurs.map((item) => (
          <TouchableOpacity key={item.label} onPress={() => setHumeur(item)}>
            <Text style={styles.smiley}>{item.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {humeur && (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Tu te sens : {humeur.label}</Text>
          <Text style={styles.suggestion}>{humeur.message}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.subtitle}>Et Clem, comment est-elle ?</Text>
        {humeursChien.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.chienButton}
            onPress={() => setHumeurChien(item)}
          >
            <Text style={styles.chienText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        {humeurChien && (
          <Text style={styles.suggestion}>{humeurChien.message}</Text>
        )}
      </View>

      <TouchableOpacity
  style={styles.sosButton}
  onPress={() => navigation.navigate('Bien-être')}
>
  <Text style={styles.sosText}>🚨 Je ne vais pas bien</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.sosButton, { backgroundColor: '#ffa726' }]}
  onPress={() => {
    noterObservationChien();
    navigation.navigate('Journal'); // Affiché sous “Moi & Mon Chien”
  }}
>
  <Text style={styles.sosText}>🐾 Mon chien a besoin d’aide</Text>
</TouchableOpacity>

      <TouchableOpacity
        style={styles.routineButton}
        onPress={() => navigation.navigate('Bien-être')}
      >
        <Text style={styles.routineText}>🌿 Commencer la routine du jour</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.journalButton}
        onPress={() => setAfficherJournal(!afficherJournal)}
      >
        <Text style={styles.journalButtonText}>
          {afficherJournal ? '🛑 Masquer' : '📖 Voir les observations chien'}
        </Text>
      </TouchableOpacity>

      {afficherJournal && journalChien.length > 0 && (
        <View style={styles.journalContainer}>
          <Text style={styles.journalTitle}>📋 Observations :</Text>
          <FlatList
            data={journalChien}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.journalItem}>
                <Text style={styles.journalText}>📅 {item.date}</Text>
                <Text style={styles.journalText}>{item.message}</Text>
                <TouchableOpacity onPress={() => supprimerObservation(index)}>
                  <Text style={styles.deleteText}>🗑 Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* Section Évolution du duo */}
      {evolutionDuo.length > 0 && (
        <View style={styles.evolutionContainer}>
          <Text style={styles.journalTitle}>📈 Évolution du duo :</Text>
          {evolutionDuo.map((item, index) => (
            <View key={index} style={styles.evolutionItem}>
              <Text style={styles.journalText}>📅 {item.date}</Text>
              <Text style={styles.journalText}>🧠 Toi : {item.humain}</Text>
              <Text style={styles.journalText}>🐶 Clem : {item.chien}</Text>
              <Text style={styles.resumeText}>{item.resume}</Text>
              <TouchableOpacity onPress={() => supprimerEntreeDuo(index)}>
                <Text style={styles.deleteText}>🗑 Supprimer</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 75,
    backgroundColor: '#FDF6FF',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7d4ac5',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#444',
  },
  smileyRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  smiley: {
    fontSize: 40,
    marginHorizontal: 10,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  suggestion: {
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  section: {
    marginTop: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  chienButton: {
    backgroundColor: '#d9c3f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 5,
  },
  chienText: {
    color: '#4a2e75',
    fontWeight: '600',
  },
  sosButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  sosText: {
    color: 'white',
    fontWeight: 'bold',
  },
  routineButton: {
    backgroundColor: '#7d4ac5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 20,
  },
  routineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  journalButton: {
    marginTop: 25,
    backgroundColor: '#c2afe4',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  journalButtonText: {
    color: '#4a235a',
    fontWeight: 'bold',
  },
  journalContainer: {
    marginTop: 20,
    width: '100%',
  },
  journalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#4a235a',
    textAlign: 'center',
  },
  journalItem: {
    backgroundColor: '#f2ecfb',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
  },
  journalText: {
    fontSize: 14,
    color: '#4a235a',
    marginBottom: 5,
  },
  deleteText: {
    color: '#c0392b',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
  },
  evolutionContainer: {
    marginTop: 30,
    width: '100%',
  },
  evolutionItem: {
    backgroundColor: '#e4ddf5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  resumeText: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#5e3f92',
  },
});


