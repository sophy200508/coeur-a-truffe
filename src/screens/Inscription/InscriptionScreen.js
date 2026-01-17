import React, { useEffect, useState } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChampTexte from '../../components/ChampTexte';
import ChampSelect from '../../components/ChampSelect';
import UploadPhoto from '../../components/UploadPhoto';
import CaseConsentement from '../../components/CaseConsentement';
import BoutonValider from '../../components/BoutonValider';

const fondInscription = require('../../../assets/fondInscription.png');

const KEY_USER = 'userData';
const KEY_ONBOARD = 'onboarding_done';

// helpers
const emailOk = (v = '') => /^\S+@\S+\.\S+$/.test(v.trim());
const dateOk = (v = '') => {
  const t = v.trim();
  let d = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [jj, mm, aa] = t.split('/').map((n) => parseInt(n, 10));
    d = new Date(aa, mm - 1, jj);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    d = new Date(t);
  }
  return d && !isNaN(d.valueOf()) && d.getFullYear() > 1900 && d <= new Date();
};
const norm = (s = '') => s.trim();

export default function InscriptionScreen({ navigation, onRegistered }) {
  const [form, setForm] = useState({
    prenomHumain: '',
    tadatedenaissance: '', // JJ/MM/AAAA ou YYYY-MM-DD
    email: '',
    prenomChien: '',
    raceChien: '',
    dateNaissanceChien: '',
    sexeChien: '', // "Mâle" | "Femelle"
    sterilisation: '', // "Oui" | "Non"
    niveauActivite: '',
    photoUri: '',
    adresseRue: '',
    adresseVille: '',
    adresseCodePostal: '',
    motivation: '',
    consentement: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // si déjà onboardé → on sort
  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(KEY_ONBOARD);
      if (done === 'true') {
        navigation.reset({ index: 0, routes: [{ name: 'Accueil' }] });
      }
    })();
  }, [navigation]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const manquants = [];
    if (!norm(form.prenomHumain)) manquants.push('Ton prénom');
    if (!emailOk(form.email)) manquants.push('Email valide');
    if (!norm(form.prenomChien)) manquants.push('Prénom du chien');
    if (!norm(form.sexeChien)) manquants.push('Sexe du chien');
    if (!norm(form.sterilisation)) manquants.push('Stérilisé/Castré');
    if (!dateOk(form.tadatedenaissance)) manquants.push('Ta date de naissance (JJ/MM/AAAA)');
    if (!dateOk(form.dateNaissanceChien)) manquants.push('Date de naissance du chien (JJ/MM/AAAA)');
    if (!form.consentement) manquants.push('Consentement');

    if (manquants.length) {
      Alert.alert('Champs à corriger', `• ${manquants.join('\n• ')}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        ...form,
        prenomHumain: norm(form.prenomHumain),
        email: norm(form.email).toLowerCase(),
        prenomChien: norm(form.prenomChien),
        raceChien: norm(form.raceChien),
        sexeChien: form.sexeChien,
        sterilisation: form.sterilisation,
        niveauActivite: form.niveauActivite,
        adresseRue: norm(form.adresseRue),
        adresseVille: norm(form.adresseVille),
        adresseCodePostal: norm(form.adresseCodePostal),
        motivation: norm(form.motivation),
      };

      await AsyncStorage.setItem(KEY_USER, JSON.stringify(payload));
      await AsyncStorage.setItem(KEY_ONBOARD, 'true');

      // ✅ IMPORTANT : on notifie App.js pour qu'il repasse isRegistered à true
      await onRegistered?.();

      setIsLoading(false);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Accueil', params: { userData: payload } }],
      });
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Erreur', 'Impossible de sauvegarder les données.');
    }
  };

  return (
    <ImageBackground source={fondInscription} style={styles.background} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ChampTexte
          label="Ton Prénom"
          placeholder="ex: Sophie"
          value={form.prenomHumain}
          onChangeText={(v) => handleChange('prenomHumain', v)}
        />

        <ChampTexte
          label="Ta date de naissance"
          placeholder="JJ/MM/AAAA"
          value={form.tadatedenaissance}
          onChangeText={(v) => handleChange('tadatedenaissance', v)}
        />

        <ChampTexte
          label="Email"
          placeholder="ex: sophie@email.com"
          value={form.email}
          onChangeText={(v) => handleChange('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <ChampTexte
          label="Prénom du chien"
          placeholder="ex: Clem"
          value={form.prenomChien}
          onChangeText={(v) => handleChange('prenomChien', v)}
        />

        <ChampTexte
          label="Race du chien (optionnel)"
          placeholder="ex: Saint-Bernard"
          value={form.raceChien}
          onChangeText={(v) => handleChange('raceChien', v)}
        />

        <ChampTexte
          label="Date de naissance du chien"
          placeholder="JJ/MM/AAAA"
          value={form.dateNaissanceChien}
          onChangeText={(v) => handleChange('dateNaissanceChien', v)}
        />

        <ChampSelect
          label="Sexe du chien"
          value={form.sexeChien}
          onChange={(v) => handleChange('sexeChien', v)}
          options={['Mâle', 'Femelle']}
        />

        <ChampSelect
          label="Stérilisé/Castré"
          value={form.sterilisation}
          onChange={(v) => handleChange('sterilisation', v)}
          options={['Oui', 'Non']}
        />

        <ChampSelect
          label="Niveau d’activité du chien (optionnel)"
          value={form.niveauActivite}
          onChange={(v) => handleChange('niveauActivite', v)}
          options={['Calme', 'Modéré', 'Actif']}
        />

        <UploadPhoto onPhotoSelected={(uri) => handleChange('photoUri', uri)} />

        <ChampTexte
          label="Rue (optionnel)"
          placeholder="ex: 12 rue du Bonheur"
          value={form.adresseRue}
          onChangeText={(v) => handleChange('adresseRue', v)}
        />
        <ChampTexte
          label="Ville (optionnel)"
          placeholder="ex: Lyon"
          value={form.adresseVille}
          onChangeText={(v) => handleChange('adresseVille', v)}
        />
        <ChampTexte
          label="Code Postal (optionnel)"
          placeholder="ex: 69000"
          value={form.adresseCodePostal}
          onChangeText={(v) => handleChange('adresseCodePostal', v)}
          keyboardType="numeric"
        />

        <ChampTexte
          label="Pourquoi souhaites-tu utiliser Cœur à truffe ? (optionnel)"
          placeholder="ex: mieux gérer mon stress"
          value={form.motivation}
          onChangeText={(v) => handleChange('motivation', v)}
        />

        <CaseConsentement value={form.consentement} onChange={(v) => handleChange('consentement', v)} />

        {isLoading ? (
          <ActivityIndicator size="large" color="#A38ACF" />
        ) : (
          <BoutonValider onPress={handleSubmit} />
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { padding: 20, backgroundColor: 'rgba(250, 249, 246, 0.3)', flexGrow: 1 },
});
