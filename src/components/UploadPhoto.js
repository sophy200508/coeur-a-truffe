import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function UploadPhoto({ onPhotoSelected }) {
  const handlePickImage = async (source) => {
    let result;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', 'La caméra est nécessaire pour prendre une photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true });
    }

    if (!result.cancelled) {
      onPhotoSelected(result.uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo du chien</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={() => handlePickImage('camera')}>
          <Text style={styles.buttonText}>Caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handlePickImage('gallery')}>
          <Text style={styles.buttonText}>Galerie</Text>
        </TouchableOpacity>
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
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#A38ACF',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
