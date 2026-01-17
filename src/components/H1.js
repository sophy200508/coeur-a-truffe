import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

export default function H1({ children, style, containerStyle }) {
  return (
    <View style={[s.wrap, containerStyle]}>
      <Text style={[s.h1, style]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 14, marginTop: 0 },
  h1: {
    fontSize: 26,
    fontWeight: '900',
    color: '#4a235a',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
