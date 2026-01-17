import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ParcoursScreen from './ParcoursScreen';
import ParcoursDebutantList from './ParcoursDebutantList';
import ParcoursEquilibreList from './ParcoursEquilibreList';
import ParcoursExpertList from './ParcoursExpertList';
import StepDetail from './StepDetail';

const Stack = createNativeStackNavigator();

export default function ParcoursStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Hub parcours = "ParcoursHome" (pour revenir facilement) */}
      <Stack.Screen name="ParcoursHome" component={ParcoursScreen} />
      <Stack.Screen name="ParcoursDebutantList" component={ParcoursDebutantList} />
      <Stack.Screen name="ParcoursEquilibreList" component={ParcoursEquilibreList} />
      <Stack.Screen name="ParcoursExpertList" component={ParcoursExpertList} />
      <Stack.Screen name="StepDetail" component={StepDetail} />
    </Stack.Navigator>
  );
}
