import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Image } from 'react-native';

// Écrans principaux
import InscriptionScreen from './screens/Inscription/InscriptionScreen';
import AccueilScreen from './screens/Accueil/AccueilScreen';
import BienEtreScreen from './screens/BienEtre/BienEtreScreen';
import MoiEtMonChienScreen from './screens/MoiEtMonChien/MoiEtMonChienScreen';
import ParcoursScreen from './screens/Parcours/ParcoursScreen';
import ActivitesSensoriellesScreen from './screens/ActivitesSensorielles/ActivitesSensoriellesScreen';
import NutritionScreen from './screens/Nutrition/NutritionScreen';
import VeterinaireScreen from './screens/Veterinaire/VeterinaireScreen';
import EducationScreen from './screens/Education/EducationScreen';
import InteractionScreen from './screens/Interaction/InteractionScreen';
import CohabitationScreen from './screens/Cohabitation/CohabitationScreen';
import AllerPlusLoinScreen from './screens/AllerPlusLoin/AllerPlusLoinScreen';
import MonetisationScreen from './screens/Monetisation/MonetisationScreen';
import CommunauteScreen from './screens/Communaute/CommunauteScreen';
import ParametresScreen from './screens/Parametres/ParametresScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const icons = {
  Accueil: require('./assets/icons/accueil.png'),
  'Bien-être': require('./assets/icons/bienetre.png'),
  'Moi & Mon Chien': require('./assets/icons/moietmonchien.png'),
  Parcours: require('./assets/icons/parcours.png'),
  'Activités sensorielles': require('./assets/icons/activites.png'),
  'Nutrition & Hydratation': require('./assets/icons/nutrition.png'),
  'Vétérinaire & Prévention': require('./assets/icons/veterinaire.png'),
  Éducation: require('./assets/icons/education.png'),
  Interaction: require('./assets/icons/interaction.png'),
  'Cohabitation & Respect': require('./assets/icons/cohabitation.png'),
  'Aller plus loin': require('./assets/icons/plusloin.png'),
  Monétisation: require('./assets/icons/monetisation.png'),
  Communauté: require('./assets/icons/communaute.png'),
  Paramètres: require('./assets/icons/parametres.png'),
};

function DrawerMenu() {
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        drawerIcon: ({ size }) => (
          <Image
            source={icons[route.name]}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        ),
      })}
    >
      <Drawer.Screen name="Accueil" component={AccueilScreen} />
      <Drawer.Screen name="Bien-être" component={BienEtreScreen} />
      <Drawer.Screen name="Moi & Mon Chien" component={MoiEtMonChienScreen} />
      <Drawer.Screen name="Parcours" component={ParcoursScreen} />
      <Drawer.Screen name="Activités sensorielles" component={ActivitesSensoriellesScreen} />
      <Drawer.Screen name="Nutrition & Hydratation" component={NutritionScreen} />
      <Drawer.Screen name="Vétérinaire & Prévention" component={VeterinaireScreen} />
      <Drawer.Screen name="Éducation" component={EducationScreen} />
      <Drawer.Screen name="Interaction" component={InteractionScreen} />
      <Drawer.Screen name="Cohabitation & Respect" component={CohabitationScreen} />
      <Drawer.Screen name="Aller plus loin" component={AllerPlusLoinScreen} />
      <Drawer.Screen name="Monétisation" component={MonetisationScreen} />
      <Drawer.Screen name="Communauté" component={CommunauteScreen} />
      <Drawer.Screen name="Paramètres" component={ParametresScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inscription" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Inscription" component={InscriptionScreen} />
        <Stack.Screen name="Accueil" component={DrawerMenu} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
