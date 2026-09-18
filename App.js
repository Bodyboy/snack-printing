// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OrderScreen from './src/screens/OrderScreen';
import PrinterListScreen from './src/screens/PrinterListScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Order"
        screenOptions={{
          headerStyle: { backgroundColor: '#2B2420' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="Order"
          component={OrderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrinterList"
          component={PrinterListScreen}
          options={{ title: 'Imprimante Bluetooth' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
