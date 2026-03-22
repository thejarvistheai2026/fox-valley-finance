import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { Calendar, DollarSign, FileText, Building2, Tag, ExternalLink, Download } from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Receipt } from '~/types';
import { getReceiptById, getPublicUrl, supabase } from '~/lib/supabase';
import type { Vendor } from '~/types';

type ReceiptDetailRouteProp = RouteProp<RootStackParamList, 'ReceiptDetail'>;

export default function ReceiptDetailScreen() {
  const route = useRoute<ReceiptDetailRouteProp>();
  const { receiptId } = route.params;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [receiptId]);

  const loadReceipt = async () => {
    try {
      // Get receipt with documents
      const receiptData = await getReceiptById(receiptId);
      setReceipt(receiptData);

      // Fetch vendor if receipt has vendor_id
      if (receiptData?.vendor_id) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', receiptData.vendor_id)
          .single();
        
        if (!vendorError && vendorData) {
          setVendor(vendorData as Vendor);
        }
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount?.toFixed(2) || '0.00'}`;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500">Receipt not found</Text>
      </View>
    );
  }

  const hasImage = receipt.documents && receipt.documents.length > 0 && 
                   receipt.documents[0]?.file_type?.startsWith('image/');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <View className="flex-row justify-between items-start mb-3">
            <View>
              <Text className="text-2xl font-bold text-gray-900">{receipt.display_id}</Text>
              <View className="flex-row items-center mt-1">
                <View
                  className={`px-2 py-1 rounded ${
                    receipt.status === 'inbox'
                      ? 'bg-amber-100'
                      : 'bg-green-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium capitalize ${
                      receipt.status === 'inbox'
                        ? 'text-amber-700'
                        : 'text-green-700'
                    }`}
                  >
                    {receipt.status}
                  </Text>
                </View>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-2xl font-bold text-gray-900">
                {formatCurrency(receipt.total)}
              </Text>
            </View>
          </View>

          {receipt.vendor_ref && (
            <Text className="text-gray-500">
              Vendor Ref: {receipt.vendor_ref}
            </Text>
          )}
        </View>

        {/* Vendor Info */}
        {vendor && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Vendor
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                <Building2 size={20} color="#6b7280" />
              </View>
              <View>
                <Text className="font-medium text-gray-900">{vendor.name}</Text>
                <Text className="text-gray-500 text-sm">{vendor.display_id}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Receipt Image */}
        {hasImage && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Receipt Image
            </Text>
            <Image
              source={{ uri: getPublicUrl(receipt.documents![0].storage_path) }}
              className="w-full h-64 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}

        {/* Details */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Receipt Details
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Calendar size={18} color="#6b7280" />
                <Text className="ml-2 text-gray-500">Date</Text>
              </View>
              <Text className="text-gray-900">{formatDate(receipt.date)}</Text>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <DollarSign size={18} color="#6b7280" />
                <Text className="ml-2 text-gray-500">Subtotal</Text>
              </View>
              <Text className="text-gray-900">{formatCurrency(receipt.subtotal)}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text className="text-gray-500 ml-6">GST (5%)</Text>
              </View>
              <Text className="text-gray-900">{formatCurrency(receipt.gst_amount)}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text className="text-gray-500 ml-6">PST/QST (8%)</Text>
              </View>
              <Text className="text-gray-900">{formatCurrency(receipt.pst_amount)}</Text>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <DollarSign size={18} color="#6b7280" />
                <Text className="ml-2 text-gray-900 font-semibold">Total</Text>
              </View>
              <Text className="text-gray-900 font-bold text-lg">{formatCurrency(receipt.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Type & Tags */}
        {(receipt.payment_type || (receipt.tags && receipt.tags.length > 0) || receipt.notes) && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </Text>

            <View className="space-y-3">
              {receipt.payment_type && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-500">Payment Type</Text>
                  <Text className="text-gray-900 capitalize">{receipt.payment_type}</Text>
                </View>
              )}

              {receipt.tags && receipt.tags.length > 0 && (
                <View className="flex-row items-start">
                  <Tag size={18} color="#6b7280" />
                  <View className="ml-2 flex-1">
                    <Text className="text-gray-500">Tags</Text>
                    <View className="flex-row flex-wrap mt-1">
                      {receipt.tags.map((tag, index) => (
                        <View key={index} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-gray-700 text-sm">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {receipt.notes && (
                <View className="flex-row items-start">
                  <FileText size={18} color="#6b7280" />
                  <View className="ml-2 flex-1">
                    <Text className="text-gray-500">Notes</Text>
                    <Text className="text-gray-900 mt-1">{receipt.notes}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Documents */}
        {receipt.documents && receipt.documents.length > 0 && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Attached Documents
            </Text>

            <View className="space-y-2">
              {receipt.documents.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => {
                    const url = getPublicUrl(doc.storage_path);
                    Linking.openURL(url);
                  }}
                  className="flex-row items-center p-3 border border-gray-200 rounded-lg"
                >
                  <FileText size={20} color="#6b7280" />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 font-medium">
                      {doc.display_name || doc.original_file_name}
                    </Text>
                    <Text className="text-gray-500 text-sm">{doc.display_id}</Text>
                  </View>
                  <ExternalLink size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Capture Info */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Capture Information
          </Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Created</Text>
              <Text className="text-gray-900">{formatDate(receipt.created_at)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Last Updated</Text>
              <Text className="text-gray-900">{formatDate(receipt.updated_at)}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
