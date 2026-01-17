// App.js
import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Image, ImageBackground, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
// Fond
import fondEcran from './assets/fondAccueil.png';

// Écrans
import InscriptionScreen from './src/screens/Inscription/InscriptionScreen';
import AccueilScreen from './src/screens/Accueil/AccueilScreen';
import BienEtreScreen from './src/screens/BienEtre/BienEtreScreen';
import MoiEtMonChienScreen from './src/screens/MoiEtMonChien/MoiEtMonChienScreen';
import ActivitesSensoriellesScreen from './src/screens/ActivitesSensorielles/ActivitesSensoriellesScreen';
import NutritionScreen from './src/screens/Nutrition/NutritionScreen';
import VeterinaireScreen from './src/screens/Veterinaire/VeterinaireScreen';
import EducationScreen from './src/screens/Education/EducationScreen';
import InteractionScreen from './src/screens/Interaction/InteractionScreen';
import CohabitationScreen from './src/screens/Cohabitation/CohabitationScreen';
import AllerPlusLoinScreen from './src/screens/AllerPlusLoin/AllerPlusLoinScreen';
import CommunauteScreen from './src/screens/Communaute/CommunauteScreen';
import ParametresScreen from './src/screens/Parametres/ParametresScreen';
import CollectionRunScreen from './src/screens/AllerPlusLoin/CollectionRunScreen';

// Parcours (navigator)
import ParcoursNavigator from './src/screens/Parcours/ParcoursNavigator';

// Icônes
const icons = {
  Accueil: require('./assets/icons/accueil.png'),
  'Bien-être': require('./assets/icons/bienetre.png'),
  'Moi & Mon Chien': require('./assets/icons/moietmonchien.png'),
  Parcours: require('./assets/icons/parcours.png'),
  'Activités sensorielles': require('./assets/icons/activites.png'),
  'Nutrition & Hydratation': require('./assets/icons/nutrition.png'),
  'Vétérinaire & Prévention': require('./assets/icons/veterinaire.png'),
  Education: require('./assets/icons/education.png'),
  Interaction: require('./assets/icons/interaction.png'),
  'Cohabitation & Respect': require('./assets/icons/cohabitation.png'),
  'Aller plus loin': require('./assets/icons/plusloin.png'),
  Communauté: require('./assets/icons/communaute.png'),
  Paramètres: require('./assets/icons/parametres.png'),
};

const Drawer = createDrawerNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        setIsRegistered(!!userData);
      } catch {
        setIsRegistered(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const refreshRegistration = useCallback(async () => {
    const userData = await AsyncStorage.getItem('userData');
    setIsRegistered(!!userData);
  }, []);

  const drawerIcon = useCallback(
    (name) => () => <Image source={icons[name]} style={{ width: 24, height: 24 }} />,
    []
  );

  const theme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: { ...DefaultTheme.colors, background: 'transparent' },
    }),
    []
  );

  if (!ready) {
    return (
      <ImageBackground source={fondEcran} style={{ flex: 1 }} resizeMode="cover">
        <ActivityIndicator size="large" color="#7d4ac5" style={{ flex: 1 }} />
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={fondEcran} style={{ flex: 1 }} resizeMode="cover">
      <NavigationContainer theme={theme}>
        <Drawer.Navigator
          initialRouteName={isRegistered ? 'Accueil' : 'Inscription'}
          screenOptions={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            drawerStyle: { backgroundColor: 'rgba(250, 249, 246, 0.0)' },
            sceneContainerStyle: { backgroundColor: 'transparent' },
          }}
        >
          {!isRegistered ? (
            <Drawer.Screen name="Inscription">
              {(props) => (
                <InscriptionScreen {...props} onRegistered={refreshRegistration} />
              )}
            </Drawer.Screen>
          ) : (
            <>
              <Drawer.Screen
                name="Accueil"
                component={AccueilScreen}
                options={{ drawerIcon: drawerIcon('Accueil') }}
              />

              <Drawer.Screen
                name="Bien-être"
                component={BienEtreScreen}
                options={{ drawerIcon: drawerIcon('Bien-être') }}
              />

              <Drawer.Screen
                name="CollectionRun"
                component={CollectionRunScreen}
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerTransparent: true,
                }}
              />

              <Drawer.Screen
                name="Moi & Mon Chien"
                component={MoiEtMonChienScreen}
                options={{ drawerIcon: drawerIcon('Moi & Mon Chien') }}
              />

              <Drawer.Screen
                name="Parcours"
                component={ParcoursNavigator}
                options={{ drawerIcon: drawerIcon('Parcours') }}
              />

              <Drawer.Screen
                name="Activités sensorielles"
                component={ActivitesSensoriellesScreen}
                options={{ drawerIcon: drawerIcon('Activités sensorielles') }}
              />

              <Drawer.Screen
                name="Nutrition & Hydratation"
                component={NutritionScreen}
                options={{ drawerIcon: drawerIcon('Nutrition & Hydratation') }}
              />

              <Drawer.Screen
                name="Vétérinaire & Prévention"
                component={VeterinaireScreen}
                options={{ drawerIcon: drawerIcon('Vétérinaire & Prévention') }}
              />

              <Drawer.Screen
                name="Education"
                component={EducationScreen}
                options={{ drawerIcon: drawerIcon('Education') }}
              />

              <Drawer.Screen
                name="Interaction"
                component={InteractionScreen}
                options={{ drawerIcon: drawerIcon('Interaction') }}
              />

              <Drawer.Screen
                name="Cohabitation & Respect"
                component={CohabitationScreen}
                options={{ drawerIcon: drawerIcon('Cohabitation & Respect') }}
              />

              <Drawer.Screen
                name="Aller plus loin"
                component={AllerPlusLoinScreen}
                options={{ drawerIcon: drawerIcon('Aller plus loin') }}
              />

              <Drawer.Screen
                name="Communauté"
                component={CommunauteScreen}
                options={{ drawerIcon: drawerIcon('Communauté') }}
/>


              <Drawer.Screen
                name="Paramètres"
                component={ParametresScreen}
                options={{ drawerIcon: drawerIcon('Paramètres') }}
              />
            </>
          )}
        </Drawer.Navigator>
      </NavigationContainer>
    </ImageBackground>
  );
}
