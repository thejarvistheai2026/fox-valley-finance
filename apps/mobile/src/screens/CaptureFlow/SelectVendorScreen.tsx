import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Search, Building2, Store, ChevronRight, X, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Vendor } from '~/types';
import { getVendors, createVendor } from '~/lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SelectVendorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorType, setNewVendorType] = useState<'contract' | 'retail'>('retail');
  const [creating, setCreating] = useState(false);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Search vendors when query changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadVendors(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const loadVendors = async (search?: string) => {
    setLoading(true);
    try {
      const results = await getVendors(search);
      setVendors(results);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }

    setCreating(true);
    try {
      const vendor = await createVendor(newVendorName.trim(), newVendorType);
      // Navigate to camera with the new vendor
      navigation.navigate('Camera', { vendorId: vendor.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create vendor');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectVendor = (vendor: Vendor) => {
    navigation.navigate('Camera', { vendorId: vendor.id });
  };

  const handleSkip = () => {
    navigation.navigate('Camera', {});
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      onPress={() => handleSelectVendor(item)}
      className="bg-white p-4 border-b border-gray-100 flex-row items-center"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        {item.type === 'contract' ? (
          <Building2 size={20} color="#8b5cf6" />
        ) : (
          <Store size={20} color="#10b981" />
        )}
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{item.name}</Text>
        <Text className="text-gray-500 text-sm">
          {item.display_id} · <Text className="capitalize">{item.type}</Text>
        </Text>
      </View>

      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  if (showCreateForm) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-semibold">Create New Vendor</Text>
          <TouchableOpacity onPress={() => setShowCreateForm(false)}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Vendor Name</Text>
          <TextInput
            value={newVendorName}
            onChangeText={setNewVendorName}
            placeholder="e.g., Home Depot"
            autoFocus
            className="border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900"
          />

          <Text className="text-sm font-medium text-gray-700 mt-4 mb-2">Vendor Type</Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setNewVendorType('retail')}
              className={`flex-1 py-3 px-4 rounded-lg mr-2 flex-row items-center justify-center ${
                newVendorType === 'retail' ? 'bg-green-100 border border-green-500' : 'bg-gray-100'
              }`}
            >
              <Store size={18} color={newVendorType === 'retail' ? '#10b981' : '#6b7280'} />
              <Text className={`ml-2 font-medium ${newVendorType === 'retail' ? 'text-green-700' : 'text-gray-600'}`}>
                Retail
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setNewVendorType('contract')}
              className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center ${
                newVendorType === 'contract' ? 'bg-purple-100 border border-purple-500' : 'bg-gray-100'
              }`}
            >
              <Building2 size={18} color={newVendorType === 'contract' ? '#8b5cf6' : '#6b7280'} />
              <Text className={`ml-2 font-medium ${newVendorType === 'contract' ? 'text-purple-700' : 'text-gray-600'}`}>
                Contract
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleCreateVendor}
            disabled={creating || !newVendorName.trim()}
            className={`mt-6 py-4 rounded-lg items-center ${
              creating || !newVendorName.trim() ? 'bg-gray-300' : 'bg-primary-600'
            }`}
          >
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Create & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold mb-2">Select Vendor</Text>
        <Text className="text-gray-500 text-sm mb-3">
          Choose a vendor for this receipt
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search vendors..."
            className="flex-1 ml-2 text-base text-gray-900"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Create new vendor button */}
      <TouchableOpacity
        onPress={() => setShowCreateForm(true)}
        className="mx-4 mt-4 py-3 border-2 border-dashed border-primary-300 rounded-lg items-center bg-primary-50"
      >
        <Text className="text-primary-600 font-medium">+ Create New Vendor</Text>
      </TouchableOpacity>

      {/* Skip option */}
      <TouchableOpacity
        onPress={handleSkip}
        className="mx-4 mt-2 py-2 items-center"
      >
        <Text className="text-gray-400 text-sm">Skip vendor selection →</Text>
      </TouchableOpacity>

      {/* Vendor list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(item) => item.id}
          renderItem={renderVendorItem}
          className="mt-2"
          ListEmptyComponent={() => (
            <View className="py-12 items-center">
              <Text className="text-gray-500">No vendors found</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Create a new vendor to continue
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
