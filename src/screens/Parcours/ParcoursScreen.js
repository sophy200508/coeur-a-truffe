// src/screens/Parcours/ParcoursScreen.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import H1 from '../../components/H1';
import useTrackProgress from './useTrackProgress';

// nombre total d’étapes (adapter si tu modifies les listes)
const TOTAL = {
  debutant: 5,
  equilibre: 4,
  expert: 3,
};

// utilitaire pour compter
const countDone = (hookRes) => {
  if (!hookRes) return 0;
  if (hookRes.doneMap) return Object.keys(hookRes.doneMap || {}).length;
  if (Array.isArray(hookRes.progress)) return hookRes.progress.length;
  return 0;
};

export default function ParcoursScreen() {
  const navigation = useNavigation();

  // progression
  const d = useTrackProgress('debutant');
  const e = useTrackProgress('equilibre');
  const x = useTrackProgress('expert');

  const doneDeb = countDone(d);
  const doneEqu = countDone(e);
  const doneExp = countDone(x);

  const pct = (done, total) => Math.max(0, Math.min(100, Math.round((done / total) * 100)));

  // barre avec % et couleur dynamique
  const Bar = ({ percent }) => {
    const isFull = percent >= 100;
    return (
      <View style={s.barRow}>
        <View style={s.barWrap}>
          <View
            style={[
              s.barFill,
              { width: `${percent}%`, backgroundColor: isFull ? '#2ecc71' : '#fff' },
            ]}
          />
        </View>
        <Text style={[s.barPct, isFull && { color: '#2ecc71' }]}>{percent}%</Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <H1>Parcours</H1>

      <View style={s.card}>
        <Text style={s.cardTitle}>Choisis un parcours</Text>
        <Text style={s.cardText}>
          Reprends où tu t’es arrêté — progression visible sur chaque carte.
        </Text>
      </View>

      <View style={s.list}>
        {/* Débutant */}
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('ParcoursDebutantList')}>
          <View style={{ flex: 1 }}>
            <Text style={s.btnTxt}>Débutant sensible</Text>
            <Text style={s.btnSub}>Créer le lien, calmer l’environnement.</Text>
            <Bar percent={pct(doneDeb, TOTAL.debutant)} />
          </View>
          <View style={[s.badge, doneDeb >= TOTAL.debutant && s.badgeDone]}>
            <Text style={[s.badgeTxt, doneDeb >= TOTAL.debutant && s.badgeTxtDone]}>
              {doneDeb}/{TOTAL.debutant}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Équilibré */}
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('ParcoursEquilibreList')}>
          <View style={{ flex: 1 }}>
            <Text style={s.btnTxt}>Évolutif équilibré</Text>
            <Text style={s.btnSub}>Progression douce et régulière.</Text>
            <Bar percent={pct(doneEqu, TOTAL.equilibre)} />
          </View>
          <View style={[s.badge, doneEqu >= TOTAL.equilibre && s.badgeDone]}>
            <Text style={[s.badgeTxt, doneEqu >= TOTAL.equilibre && s.badgeTxtDone]}>
              {doneEqu}/{TOTAL.equilibre}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Expert */}
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('ParcoursExpertList')}>
          <View style={{ flex: 1 }}>
            <Text style={s.btnTxt}>Expert engagé</Text>
            <Text style={s.btnSub}>Exigence, précision, constance.</Text>
            <Bar percent={pct(doneExp, TOTAL.expert)} />
          </View>
          <View style={[s.badge, doneExp >= TOTAL.expert && s.badgeDone]}>
            <Text style={[s.badgeTxt, doneExp >= TOTAL.expert && s.badgeTxtDone]}>
              {doneExp}/{TOTAL.expert}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, paddingTop: 80, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontWeight: '800', color: '#4a235a', fontSize: 16, marginBottom: 6 },
  cardText: { color: '#4a235a' },

  list: { gap: 14 },

  btn: {
    backgroundColor: '#7d4ac5',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  btnSub: { color: '#fff', opacity: 0.9, marginTop: 4 },

  // badge compteur
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff22',
    marginLeft: 10,
  },
  badgeTxt: { color: '#fff', fontWeight: '900' },
  badgeDone: { backgroundColor: '#2ecc71' },
  badgeTxtDone: { color: '#fff' },

  // barre + %
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  barWrap: {
    flex: 1,
    height: 8,
    backgroundColor: '#ffffff33',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  barPct: { color: '#fff', fontWeight: '900', minWidth: 36, textAlign: 'right' },
});
