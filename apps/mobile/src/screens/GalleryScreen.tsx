import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types';
import * as MediaLibrary from 'expo-media-library';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DevicePhoto {
  id: string;
  uri: string;
  creationTime: number;
}

export default function GalleryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [photos, setPhotos] = useState<DevicePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        return;
      }
      setPermissionGranted(true);

      // Get photos from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        createdAfter: sevenDaysAgo.getTime(),
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      setPhotos(assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        creationTime: asset.creationTime,
      })));
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPhotos().finally(() => setLoading(false));
    }, [loadPhotos])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const handleSelectPhoto = (uri: string) => {
    navigation.navigate('Preview', { imageUri: uri });
  };

  const renderItem = ({ item }: { item: DevicePhoto }) => (
    <TouchableOpacity
      onPress={() => handleSelectPhoto(item.uri)}
      className="bg-gray-800 rounded-xl overflow-hidden m-2 flex-1"
      style={{ maxWidth: '47%' }}
    >
      <Image
        source={{ uri: item.uri }}
        className="w-full aspect-square"
        resizeMode="cover"
      />
      <View className="p-2">
        <Text className="text-gray-400 text-xs">
          {new Date(item.creationTime).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!permissionGranted) {
    return (
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pt-12 bg-gray-900">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Recent Photos</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-500 text-center">
            Photo library access is needed to browse receipts
          </Text>
          <TouchableOpacity
            onPress={loadPhotos}
            className="mt-4 bg-sky-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Grant Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 pt-12 bg-gray-900">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Recent Photos</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 8 }}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500 text-center">
              No photos in the last 7 days{'\n'}
              Take a photo to get started!
            </Text>
          </View>
        )}
      />
    </View>
  );
}
