import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Oops!</Text>
      <Text>Cette page n'existe pas.</Text>
      <Link href="/(tabs)/home">
        <Text style={{ color: 'blue', marginTop: 10 }}>Retour à l'accueil</Text>
      </Link>
    </View>
  );
}
