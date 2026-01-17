import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ParcoursScreen from './ParcoursScreen';
import ParcoursDebutantList from './ParcoursDebutantList';
import ParcoursEquilibreList from './ParcoursEquilibreList';
import ParcoursExpertList from './ParcoursExpertList';
import StepDetail from './StepDetail';

const Stack = createStackNavigator();

export default function ParcoursNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="ParcoursHome"
        component={ParcoursScreen}
        options={{ title: 'Choisis ton parcours' }}
      />
      <Stack.Screen
        name="ParcoursDebutantList"
        component={ParcoursDebutantList}
        options={{ title: 'Parcours Débutant' }}
      />
      <Stack.Screen
        name="ParcoursEquilibreList"
        component={ParcoursEquilibreList}
        options={{ title: 'Parcours Équilibré' }}
      />
      <Stack.Screen
        name="ParcoursExpertList"
        component={ParcoursExpertList}
        options={{ title: 'Parcours Expert' }}
      />
      <Stack.Screen
        name="StepDetail"
        component={StepDetail}
        options={{ title: 'Détail de l’étape' }}
      />
    </Stack.Navigator>
  );
}
