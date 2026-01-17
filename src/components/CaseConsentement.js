import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

export default function CaseConsentement({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#ccc', true: '#B5D8B5' }}
        thumbColor={value ? '#A38ACF' : '#f4f3f4'}
      />
      <Text style={styles.text}>
        J'accepte les conditions d'utilisation et la politique de confidentialité.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  text: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});
