import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Home, Search, Inbox, Camera, Plus } from 'lucide-react-native';

import { RootStackParamList, MainTabParamList } from '~/types';
import { useAuth } from '~/hooks/useAuth';

// Screens
import AuthScreen from '~/screens/AuthScreen';
import HomeScreen from '~/screens/HomeScreen';
import SearchScreen from '~/screens/SearchScreen';
import InboxScreen from '~/screens/InboxScreen';
import VendorDetailScreen from '~/screens/VendorDetailScreen';
import ReceiptDetailScreen from '~/screens/ReceiptDetailScreen';

// Capture Flow Screens
import SelectVendorScreen from '~/screens/CaptureFlow/SelectVendorScreen';
import CameraScreen from '~/screens/CaptureFlow/CameraScreen';
import ReviewScreen from '~/screens/CaptureFlow/ReviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
          tabBarLabel: 'Inbox',
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerShadowVisible: true,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {!session ? (
          <Stack.Screen
            name="Main"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            {/* Capture Flow Screens */}
            <Stack.Screen
              name="SelectVendor"
              component={SelectVendorScreen}
              options={{
                title: 'Capture Receipt',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
              options={{
                title: 'Take Photo',
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Review"
              component={ReviewScreen}
              options={{
                title: 'Review',
                presentation: 'modal',
              }}
            />
            {/* Legacy Capture screen */}
            <Stack.Screen
              name="Capture"
              component={SelectVendorScreen}
              options={{
                title: 'Capture Receipt',
                presentation: 'fullScreenModal',
              }}
            />
            {/* Detail Screens */}
            <Stack.Screen
              name="VendorDetail"
              component={VendorDetailScreen}
              options={{
                title: 'Vendor',
              }}
            />
            <Stack.Screen
              name="ReceiptDetail"
              component={ReceiptDetailScreen}
              options={{
                title: 'Receipt',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
