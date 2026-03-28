import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from '~/types';

// Screens
import HomeScreen from '~/screens/HomeScreen';
import CameraScreen from '~/screens/CameraScreen';
import PreviewScreen from '~/screens/PreviewScreen';
import GalleryScreen from '~/screens/GalleryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  // No auth - starts at home screen
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
        />
        <Stack.Screen
          name="Preview"
          component={PreviewScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
