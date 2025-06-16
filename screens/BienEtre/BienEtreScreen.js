import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  ImageBackground,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backgroundImage from '../../assets/background.png'; // Assure-toi que le fichier existe bien ici

export default function BienEtreScreen() {
  const [phase, setPhase] = useState('');
  const [timer, setTimer] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [journal, setJournal] = useState([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [running, setRunning] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  const cycle = [
    { phase: 'Inspire', duration: 4000, scale: 1.4 },
    { phase: 'Retiens', duration: 7000, scale: 1.4 },
    { phase: 'Expire', duration: 8000, scale: 1 },
  ];

  useEffect(() => {
    const loadJournal = async () => {
      const data = await AsyncStorage.getItem('journal_bienetre');
      if (data) setJournal(JSON.parse(data));
    };
    loadJournal();
  }, []);

  useEffect(() => {
    if (!running) return;
    let i = 0;
    let localCycleCount = 0;

    const animate = () => {
      const { phase, duration, scale } = cycle[i];
      setPhase(phase);
      setTimer(duration / 1000);
      Vibration.vibrate(200);

      Animated.timing(scaleAnim, {
        toValue: scale,
        duration,
        useNativeDriver: true,
      }).start();

      if (phase === 'Expire') {
        localCycleCount++;
        setCycleCount(localCycleCount);
        if (localCycleCount >= 4) {
          const now = new Date().toLocaleString();
          const newEntry = `✅ Séance terminée le ${now}`;
          setJournal((prev) => {
            const updated = [...prev, newEntry];
            AsyncStorage.setItem('journal_bienetre', JSON.stringify(updated));
            return updated;
          });
          setRunning(false);
          setSessionDone(true);
          return;
        }
      }

      let countdown = duration / 1000;
      const countdownInterval = setInterval(() => {
        countdown--;
        setTimer(countdown);
        if (countdown <= 0) clearInterval(countdownInterval);
      }, 1000);

      i = (i + 1) % cycle.length;
      setTimeout(animate, duration);
    };

    animate();
  }, [running]);

  const startSession = () => {
    setCycleCount(0);
    setSessionDone(false);
    setRunning(true);
  };

  const restartSession = () => {
    setCycleCount(0);
    setSessionDone(false);
    setRunning(false);
    setPhase('');
    setTimer(0);
  };

  const clearEntry = async (indexToDelete) => {
    const updated = journal.filter((_, index) => index !== indexToDelete);
    setJournal(updated);
    await AsyncStorage.setItem('journal_bienetre', JSON.stringify(updated));
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
          {running && <Text style={styles.timerText}>{timer}s</Text>}
        </Animated.View>

        {!running && !sessionDone && (
          <TouchableOpacity onPress={startSession} style={styles.button}>
            <Text style={styles.buttonText}>Commencer</Text>
          </TouchableOpacity>
        )}

        {running && (
          <>
            <Text style={styles.phaseText}>{phase}</Text>
            <Text style={styles.counterText}>Cycle {cycleCount} / 4</Text>
            <TouchableOpacity onPress={restartSession} style={styles.buttonSecondary}>
              <Text style={styles.buttonText}>Arrêter</Text>
            </TouchableOpacity>
          </>
        )}

        {sessionDone && (
          <>
            <Text style={styles.bravoText}>🎉 Bravo pour ta séance !</Text>
            <TouchableOpacity onPress={startSession} style={styles.button}>
              <Text style={styles.buttonText}>Recommencer</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>

        {journal.length > 0 && (
          <View style={styles.journal}>
            <Text style={styles.journalTitle}>Journal des séances :</Text>
            <FlatList
              data={journal}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View style={styles.journalItem}>
                  <Text style={styles.journalText}>{item}</Text>
                  <TouchableOpacity onPress={() => clearEntry(index)}>
                    <Text style={styles.deleteText}>🗑 Supprimer</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  circle: {
    width: 200,
    height: 200,
    backgroundColor: 'black',
    borderRadius: 100,
    opacity: 0.3,
    marginBottom: 30,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4a235a',
    marginBottom: 10,
    textAlign: 'center',
  },
  timerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  counterText: {
    fontSize: 18,
    marginBottom: 30,
    color: '#4a235a',
    textAlign: 'center',
  },
  bravoText: {
    fontSize: 24,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7d4ac5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    alignSelf: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#a077e6',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  journal: {
    marginTop: 30,
  },
  journalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#4a235a',
    textAlign: 'center',
  },
  journalItem: {
    backgroundColor: '#efe6fb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  journalText: {
    marginBottom: 6,
    fontSize: 14,
    color: '#4a235a',
  },
  deleteText: {
    color: '#c0392b',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
  },
});
