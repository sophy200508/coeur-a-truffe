import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import fondEcran from '../../assets/fondAccueil.png'; // même fond que ton App.js

export default function ScreenBackground({ children, contentStyle }) {
  return (
    <ImageBackground source={fondEcran} style={styles.bg} resizeMode="cover">
      <View style={[styles.overlay, contentStyle]}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  // overlay transparent pour garder tes écrans lisibles
  overlay: { flex: 1, backgroundColor: 'transparent' },
});
