import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Calendar, DollarSign, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Vendor, OCResult } from '~/types';
import { getVendorById, createReceipt, callOCFunction, uploadReceiptImage, getPublicUrl } from '~/lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ReviewRouteProp = RouteProp<RootStackParamList, 'Review'>;

const formatCurrency = (value: string): number => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function ReviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReviewRouteProp>();
  const { imageUri, vendorId } = route.params;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [ocResult, setOCResult] = useState<OCResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(true);
  
  // Form fields
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [subtotal, setSubtotal] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [pstAmount, setPstAmount] = useState('');
  const [total, setTotal] = useState('');
  const [vendorRef, setVendorRef] = useState('');
  const [notes, setNotes] = useState('');
  
  const [saving, setSaving] = useState(false);

  // Load vendor and run OCR
  useEffect(() => {
    const loadData = async () => {
      if (vendorId) {
        try {
          const vendorData = await getVendorById(vendorId);
          setVendor(vendorData);
        } catch (error) {
          console.error('Error loading vendor:', error);
        }
      }

      // Run OCR on the image
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result?.toString().split(',')[1] || '';
            resolve(base64);
          };
        });
        reader.readAsDataURL(blob);
        const base64 = await base64Promise;

        const result = await callOCFunction(base64);
        setOCResult(result);

        // Pre-fill form with OCR results
        if (result.date) setDate(result.date);
        if (result.subtotal) setSubtotal(result.subtotal.toFixed(2));
        if (result.gst_amount) setGstAmount(result.gst_amount.toFixed(2));
        if (result.pst_amount) setPstAmount(result.pst_amount.toFixed(2));
        if (result.total) setTotal(result.total.toFixed(2));
        if (result.vendor_ref) setVendorRef(result.vendor_ref);
      } catch (error) {
        console.error('OCR failed:', error);
        setOCResult({
          confidence: 'failed',
          vendor_name: null,
          date: null,
          subtotal: null,
          gst_amount: null,
          pst_amount: null,
          tax_total: null,
          total: null,
          vendor_ref: null,
        });
      } finally {
        setOcrLoading(false);
      }
    };

    loadData();
  }, [vendorId, imageUri]);

  // Auto-calculate total when subtotal or taxes change
  useEffect(() => {
    const sub = parseFloat(subtotal) || 0;
    const gst = parseFloat(gstAmount) || 0;
    const pst = parseFloat(pstAmount) || 0;
    const calculated = sub + gst + pst;
    if (calculated > 0 && !total) {
      setTotal(calculated.toFixed(2));
    }
  }, [subtotal, gstAmount, pstAmount]);

  const handleSave = async () => {
    if (!subtotal && !total) {
      Alert.alert('Error', 'Please enter at least a total amount');
      return;
    }

    setSaving(true);
    try {
      // Upload image to storage
      const fileName = `receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Read blob as base64 for upload
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(',')[1] || '';
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;
      
      await uploadReceiptImage(fileName, base64, 'image/jpeg');

      // Create receipt
      const receiptData = {
        vendor_id: vendorId,
        date: date || formatDateForInput(new Date()),
        subtotal: formatCurrency(subtotal),
        gst_amount: formatCurrency(gstAmount),
        pst_amount: formatCurrency(pstAmount),
        tax_total: formatCurrency(gstAmount) + formatCurrency(pstAmount),
        total: formatCurrency(total),
        vendor_ref: vendorRef || undefined,
        notes: notes || undefined,
        status: 'inbox' as const,
      };

      await createReceipt(receiptData);

      Alert.alert(
        'Success',
        'Receipt saved to inbox',
        [
          {
            text: 'Capture Another',
            onPress: () => navigation.navigate('Camera', { vendorId }),
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confidenceBadge = () => {
    if (!ocResult) return null;
    
    switch (ocResult.confidence) {
      case 'high':
        return (
          <View className="flex-row items-center bg-green-100 px-2 py-1 rounded">
            <CheckCircle size={14} color="#10b981" />
            <Text className="text-green-700 text-xs ml-1">High confidence</Text>
          </View>
        );
      case 'medium':
        return (
          <View className="flex-row items-center bg-yellow-100 px-2 py-1 rounded">
            <AlertCircle size={14} color="#f59e0b" />
            <Text className="text-yellow-700 text-xs ml-1">Medium confidence</Text>
          </View>
        );
      case 'low':
        return (
          <View className="flex-row items-center bg-red-100 px-2 py-1 rounded">
            <AlertTriangle size={14} color="#ef4444" />
            <Text className="text-red-700 text-xs ml-1">Low confidence - please review</Text>
          </View>
        );
      default:
        return (
          <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded">
            <AlertCircle size={14} color="#6b7280" />
            <Text className="text-gray-600 text-xs ml-1">Manual entry</Text>
          </View>
        );
    }
  };

  if (ocrLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-500 mt-4">Analyzing receipt...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header with close button */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Review Receipt</Text>
          {confidenceBadge()}
        </View>

        {/* Receipt Image Thumbnail */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-medium text-gray-500 mb-2">
            Receipt Image
          </Text>
          <Image
            source={{ uri: imageUri }}
            className="w-full h-48 rounded-lg"
            resizeMode="cover"
          />
        </View>

        {/* Vendor Info */}
        {vendor && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Vendor
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                <Text className="text-gray-600 font-semibold">
                  {vendor.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="font-medium text-gray-900">{vendor.name}</Text>
                <Text className="text-gray-500 text-sm">{vendor.display_id}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Receipt Details Form */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Receipt Details
          </Text>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Date</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <Calendar size={18} color="#6b7280" />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                className="flex-1 ml-2 text-base text-gray-900"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Vendor Reference (Optional)</Text>
            <TextInput
              value={vendorRef}
              onChangeText={setVendorRef}
              placeholder="e.g., INV-2026-001"
              className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Subtotal</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <DollarSign size={18} color="#6b7280" />
              <TextInput
                value={subtotal}
                onChangeText={setSubtotal}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="flex-1 ml-2 text-base"
              />
            </View>
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-sm text-gray-500 mb-1">GST (5%)</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
                <DollarSign size={18} color="#6b7280" />
                <TextInput
                  value={gstAmount}
                  onChangeText={setGstAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="flex-1 ml-2 text-base"
                />
              </View>
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-sm text-gray-500 mb-1">PST/QST (8%)</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
                <DollarSign size={18} color="#6b7280" />
                <TextInput
                  value={pstAmount}
                  onChangeText={setPstAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="flex-1 ml-2 text-base"
                />
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Total *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
              <DollarSign size={18} color="#6b7280" />
              <TextInput
                value={total}
                onChangeText={setTotal}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="flex-1 ml-2 text-base font-semibold"
              />
            </View>
          </View>

          <View>
            <Text className="text-sm text-gray-500 mb-1">Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-base"
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-1 py-4 rounded-xl border border-gray-300 mr-2 items-center"
          >
            <Text className="text-gray-700 font-medium">Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !total}
            className={`flex-1 py-4 rounded-xl ml-2 items-center ${
              saving || !total ? 'bg-gray-300' : 'bg-primary-600'
            }`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Save to Inbox</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
