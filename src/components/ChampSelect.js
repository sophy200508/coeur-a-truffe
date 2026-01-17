import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function ChampSelect({ label, value, onChange, options }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onChange(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label={`Sélectionner ${label.toLowerCase()}`} value="" />
          {options.map((opt, index) => (
            <Picker.Item key={index} label={opt} value={opt} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#A38ACF',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#A38ACF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
});
