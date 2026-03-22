import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Inbox, Receipt, AlertCircle, ChevronRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Receipt as ReceiptType } from '~/types';
import { getInboxReceipts } from '~/lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function InboxScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadInbox = useCallback(async () => {
    try {
      const data = await getInboxReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Error loading inbox:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInbox();
    setRefreshing(false);
  }, [loadInbox]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadInbox().finally(() => setLoading(false));
    }, [loadInbox])
  );

  const renderReceiptItem = ({ item }: { item: ReceiptType }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
      className="bg-white p-4 border-b border-gray-100 flex-row items-center"
    >
      <View className="w-12 h-12 bg-amber-100 rounded-lg items-center justify-center mr-3">
        <Receipt size={24} color="#f59e0b" />
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-gray-900">
          {item.display_id}
        </Text>
        <Text className="text-gray-500 text-sm">
          {(item as any).vendors?.name || 'Unknown vendor'} · {item.date}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-gray-900 font-medium">
            ${item.total?.toFixed(2) || '0.00'}
          </Text>
          <View className="ml-2 px-2 py-0.5 bg-amber-100 rounded">
            <Text className="text-xs text-amber-700 font-medium">Inbox</Text>
          </View>
        </View>
      </View>

      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Inbox {receipts.length > 0 && `(${receipts.length})`}
        </Text>
        <Text className="text-gray-500 mt-1">
          Captured receipts waiting to be processed
        </Text>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id}
        renderItem={renderReceiptItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View className="py-16 items-center px-6">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Inbox size={32} color="#10b981" />
            </View>
            <Text className="text-gray-900 font-semibold text-lg">
              All caught up!
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              No receipts in your inbox.{'\n'}
              Capture a receipt to get started.
            </Text>
          </View>
        )}
      />
    </View>
  );
}
