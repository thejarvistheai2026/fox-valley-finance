import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleTakePicture = () => {
    navigation.navigate('Camera');
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header / Logo Area */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8">
          <Text className="text-4xl font-bold text-gray-900 text-center">
            Fox Valley
          </Text>
          <Text className="text-xl text-gray-500 text-center mt-1">
            Finance
          </Text>
        </View>

        <Text className="text-gray-400 text-center text-sm mb-12">
          Capture receipts for your home build
        </Text>

        {/* Take Picture Button */}
        <TouchableOpacity
          onPress={handleTakePicture}
          className="w-full bg-sky-500 py-5 rounded-2xl flex-row items-center justify-center shadow-sm"
        >
          <Camera size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-3">
            Take Picture of Receipt
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="pb-10 px-8">
        <Text className="text-gray-400 text-center text-xs">
          Tap to capture a receipt and upload it to your web dashboard
        </Text>
      </View>
    </View>
  );
}
