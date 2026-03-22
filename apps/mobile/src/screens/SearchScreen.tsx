import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Building2, Store, ChevronRight, User } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Vendor } from '~/types';
import { getVendors } from '~/lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  const searchVendors = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await getVendors(searchQuery || undefined);
      setVendors(results);
    } catch (error) {
      console.error('Error searching vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all vendors on mount
  useFocusEffect(
    useCallback(() => {
      searchVendors('');
    }, [searchVendors])
  );

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchVendors(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, searchVendors]);

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('VendorDetail', { vendorId: item.id })}
      className="bg-white p-4 border-b border-gray-100 flex-row items-center"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        {item.type === 'contract' ? (
          <Building2 size={20} color="#6b7280" />
        ) : (
          <Store size={20} color="#6b7280" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-semibold text-gray-900">{item.name}</Text>
          <View
            className={`ml-2 px-2 py-0.5 rounded text-xs ${
              item.type === 'contract'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            <Text className="text-xs font-medium capitalize">
              {item.type}
            </Text>
          </View>
        </View>
        <Text className="text-gray-500 text-sm">
          {item.display_id}
        </Text>
      </View>

      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search vendors by name or ID..."
            className="flex-1 ml-2 text-base text-gray-900"
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(item) => item.id}
          renderItem={renderVendorItem}
          ListEmptyComponent={() => (
            <View className="py-12 items-center">
              <User size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center">
                {query ? 'No vendors found' : 'No vendors yet'}
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                {query ? 'Try a different search term' : 'Vendors will appear here'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
