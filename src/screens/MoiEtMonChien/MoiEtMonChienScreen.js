// src/screens/MoiEtMonChien/MoiEtMonChienScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Sous-onglets
import JournalTab from './tabs/JournalTab';
import HabitudesTab from './tabs/HabitudesTab';
import EducationTab from './tabs/EducationTab';
import SanteTab from './tabs/SanteTab';
import SouvenirsTab from './tabs/SouvenirsTab';

const TABS = ['Journal', 'Habitudes', 'Éducation', 'Santé', 'Souvenirs'];

export default function MoiEtMonChienScreen() {
  const [tab, setTab] = useState('Journal');

  const renderTab = () => {
    switch (tab) {
      case 'Journal':
        return <JournalTab />;
      case 'Habitudes':
        return <HabitudesTab />;
      case 'Éducation':
        return <EducationTab />;
      case 'Santé':
        return <SanteTab />;
      case 'Souvenirs':
        return <SouvenirsTab />;
      default:
        return null;
    }
  };

  return (
    <View style={s.screen}>
      <Text style={s.h1}>Moi & mon chien</Text>

      {/* Segmented */}
      <View style={s.segWrap}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[s.seg, tab === t && s.segOn]}
            activeOpacity={0.85}
          >
            <Text style={[s.segTxt, tab === t && s.segTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.content}>{renderTab()}</View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ laisse apparaître le fond global (App.js)
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 120,
  },

  h1: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4a235a',
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#fff', // optionnel : style "pille" comme Bien-être
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'center',
  },

  segWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    justifyContent: 'center',
  },

  seg: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EFE6FB',
  },
  segOn: { backgroundColor: '#7d4ac5' },

  segTxt: { color: '#4a235a', fontWeight: '800' },
  segTxtOn: { color: '#fff' },

  content: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ important aussi
  },
});
