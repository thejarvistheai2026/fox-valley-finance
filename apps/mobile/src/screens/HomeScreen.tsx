import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Camera, Search, ChevronRight, Receipt, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types';
import { signOut } from '~/lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const quickActions = [
    {
      icon: Plus,
      title: 'Capture Receipt',
      subtitle: 'Take a photo of a receipt',
      color: '#0ea5e9',
      bgColor: '#e0f2fe',
      onPress: () => navigation.navigate('SelectVendor'),
    },
    {
      icon: Search,
      title: 'Search Vendors',
      subtitle: 'Find vendor information',
      color: '#10b981',
      bgColor: '#d1fae5',
      onPress: () => navigation.navigate('Search' as never),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Quick Actions
          </Text>
          <Text className="text-gray-500">
            Capture receipts or find vendors
          </Text>
        </View>

        <View className="space-y-3">
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row items-center"
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: action.bgColor }}
              >
                <action.icon size={24} color={action.color} />
              </View>
              
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 text-base">
                  {action.title}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {action.subtitle}
                </Text>
              </View>
              
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <View className="flex-row items-start">
            <Receipt size={20} color="#0ea5e9" className="mr-3 mt-0.5" />
            <View className="flex-1">
              <Text className="font-medium text-gray-900 mb-1">
                Mobile Capture Tips
              </Text>
              <Text className="text-gray-600 text-sm">
                • Take photos in good lighting{'\n'}
                • Keep the receipt flat and centered{'\n'}
                • Make sure all text is legible
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => signOut()}
          className="mt-8 py-3 items-center"
        >
          <Text className="text-gray-400 text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
