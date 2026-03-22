import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { Building2, Store, Mail, Phone, MapPin, FileText, ChevronRight, Receipt } from 'lucide-react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Vendor, Estimate, Receipt as ReceiptType } from '~/types';
import { getVendorById, getEstimatesByVendor, supabase } from '~/lib/supabase';

type VendorDetailRouteProp = RouteProp<RootStackParamList, 'VendorDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VendorDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VendorDetailRouteProp>();
  const { vendorId } = route.params;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVendorData = useCallback(async () => {
    try {
      const [vendorData, estimatesData] = await Promise.all([
        getVendorById(vendorId),
        getEstimatesByVendor(vendorId),
      ]);
      setVendor(vendorData);
      setEstimates(estimatesData || []);
      
      // Fetch receipts for this vendor
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'confirmed')
        .order('date', { ascending: false });
      
      if (receiptsError) throw receiptsError;
      setReceipts(receiptsData || []);
    } catch (error) {
      console.error('Error loading vendor:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  const totalPaid = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalHst = receipts.reduce((sum, r) => sum + (r.tax_total || 0), 0);
  const totalEstimated = estimates
    .filter(e => e.status === 'active')
    .reduce((sum, e) => sum + (e.estimated_total || 0), 0);
  const outstanding = totalEstimated - totalPaid;

  const renderReceiptItem = ({ item }: { item: ReceiptType }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
      className="bg-white p-4 border-b border-gray-100 flex-row items-center"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        <Receipt size={20} color="#6b7280" />
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{item.display_id}</Text>
        <Text className="text-gray-500 text-sm">{item.date}</Text>
        {item.vendor_ref && (
          <Text className="text-gray-400 text-xs">Ref: {item.vendor_ref}</Text>
        )}
      </View>

      <View className="items-end">
        <Text className="font-semibold text-gray-900">${item.total?.toFixed(2)}</Text>
        {item.payment_type && (
          <Text className="text-gray-500 text-xs capitalize">{item.payment_type}</Text>
        )}
      </View>

      <ChevronRight size={20} color="#9ca3af" className="ml-2" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500">Vendor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
              {vendor.type === 'contract' ? (
                <Building2 size={24} color="#8b5cf6" />
              ) : (
                <Store size={24} color="#10b981" />
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">{vendor.name}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500">{vendor.display_id}</Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded ${
                    vendor.type === 'contract'
                      ? 'bg-purple-100'
                      : 'bg-green-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium capitalize ${
                      vendor.type === 'contract'
                        ? 'text-purple-700'
                        : 'text-green-700'
                    }`}
                  >
                    {vendor.type}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        {(vendor.email || vendor.phone || vendor.address || vendor.notes) && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Contact Information
            </Text>

            <View className="space-y-3">
              {vendor.email ? (
                <View className="flex-row items-center">
                  <Mail size={18} color="#6b7280" />
                  <Text className="ml-3 text-gray-700">{vendor.email}</Text>
                </View>
              ) : null}

              {vendor.phone ? (
                <View className="flex-row items-center">
                  <Phone size={18} color="#6b7280" />
                  <Text className="ml-3 text-gray-700">{vendor.phone}</Text>
                </View>
              ) : null}

              {vendor.address ? (
                <View className="flex-row items-start">
                  <MapPin size={18} color="#6b7280" />
                  <Text className="ml-3 text-gray-700 flex-1">{vendor.address}</Text>
                </View>
              ) : null}

              {vendor.notes ? (
                <View className="flex-row items-start mt-2">
                  <FileText size={18} color="#6b7280" />
                  <Text className="ml-3 text-gray-700 flex-1">{vendor.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Financial Summary */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Financial Summary
          </Text>

          <View className="flex-row flex-wrap -mx-2">
            {vendor.type === 'contract' && (
              <View className="w-1/2 px-2 mb-3">
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-gray-500 text-sm">Estimated</Text>
                  <Text className="text-lg font-bold text-gray-900">${totalEstimated.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <View className="w-1/2 px-2 mb-3">
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-gray-500 text-sm">Total Paid</Text>
                <Text className="text-lg font-bold text-gray-900">${totalPaid.toFixed(2)}</Text>
              </View>
            </View>

            {vendor.type === 'contract' && (
              <View className="w-1/2 px-2 mb-3">
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-gray-500 text-sm">Outstanding</Text>
                  <Text className={`text-lg font-bold ${outstanding > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${outstanding.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <View className="w-1/2 px-2 mb-3">
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-gray-500 text-sm">HST Paid</Text>
                <Text className="text-lg font-bold text-gray-900">${totalHst.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Estimates */}
        {vendor.type === 'contract' && estimates.length > 0 && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Active Estimates
            </Text>

            <View className="space-y-3">
              {estimates.map((estimate) => (
                <View key={estimate.id} className="border border-gray-200 rounded-lg p-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{estimate.title}</Text>
                      <Text className="text-gray-500 text-sm">
                        {estimate.display_id} · {estimate.date}
                      </Text>
                    </View>
                    <View className="px-2 py-1 bg-green-100 rounded">
                      <Text className="text-xs text-green-700 font-medium capitalize">{estimate.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-gray-500">Estimated</Text>
                    <Text className="font-semibold text-gray-900">
                      ${estimate.estimated_total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Receipts */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Receipts ({receipts.length})
          </Text>

          {receipts.length > 0 ? (
            receipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                onPress={() => navigation.navigate('ReceiptDetail', { receiptId: receipt.id })}
                className="border-b border-gray-100 py-3 flex-row items-center"
              >
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Receipt size={16} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{receipt.display_id}</Text>
                  <Text className="text-gray-500 text-xs">{receipt.date}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-gray-900">${receipt.total?.toFixed(2)}</Text>
                  {receipt.payment_type && (
                    <Text className="text-gray-500 text-xs capitalize">{receipt.payment_type}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-400 italic">No receipts yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
