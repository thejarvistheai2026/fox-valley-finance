import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { RotateCcw, Send } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, OCResult } from '~/types';
import { createReceipt, uploadDocument, getOCRResults, supabase } from '~/lib/supabase';

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const UNASSIGNED_VENDOR_ID = '00000000-0000-0000-0000-000000000000'; // Unassigned vendor, reassigned on web

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PreviewRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export default function PreviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PreviewRouteProp>();
  const { imageUri } = route.params;

  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [ocrData, setOcrData] = useState<OCResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(true);

  // Run OCR on the captured image
  React.useEffect(() => {
    runOCR();
  }, []);

  const runOCR = async () => {
    try {
      setOcrLoading(true);
      // Convert image to base64 for OCR
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Check image size - if too large, skip OCR
      if (blob.size > 5 * 1024 * 1024) { // 5MB limit
        console.log('Image too large for OCR, skipping...');
        setOcrData({ confidence: 'failed' });
        setOcrLoading(false);
        return;
      }

      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];

        if (!base64Data) {
          console.error('Failed to get base64 data');
          setOcrData({ confidence: 'failed' });
          setOcrLoading(false);
          return;
        }

        try {
          const result = await getOCRResults(base64Data);
          console.log('OCR result:', result);
          setOcrData(result);
        } catch (error) {
          console.error('OCR error:', error);
          // OCR failed but we can still save the receipt
          setOcrData({ confidence: 'failed' });
        } finally {
          setOcrLoading(false);
        }
      };

      reader.onerror = () => {
        console.error('FileReader error');
        setOcrData({ confidence: 'failed' });
        setOcrLoading(false);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error reading image:', error);
      setOcrLoading(false);
      setOcrData({ confidence: 'failed' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('Starting save process...');
    try {
      // First upload the document to get a storage path (no vendor assigned yet)
      console.log('Uploading document...');
      const document = await uploadDocument(
        imageUri,
        `receipt_${Date.now()}.jpg`,
        'image/jpeg',
        PROJECT_ID,
        UNASSIGNED_VENDOR_ID
      );
      console.log('Document uploaded:', document);

      // Create the receipt with status 'inbox'
      const receiptData = {
        project_id: PROJECT_ID,
        vendor_id: UNASSIGNED_VENDOR_ID,
        vendor_ref: ocrData?.vendor_ref || `CAPTURE-${Date.now()}`,
        date: ocrData?.date || new Date().toISOString().split('T')[0],
        subtotal: ocrData?.subtotal || 0,
        gst_amount: ocrData?.gst_amount || 0,
        pst_amount: ocrData?.pst_amount || 0,
        total: ocrData?.total || 0,
        status: 'inbox' as const,
        notes: note || ocrData ? `OCR Vendor: ${ocrData?.vendor_name || 'Unknown'}` : undefined,
        mobile_note: note || undefined,
      };

      console.log('Creating receipt with data:', receiptData);
      const receipt = await createReceipt(receiptData);
      console.log('Receipt created successfully:', receipt);

      // Link the document to the receipt (documents table has receipt_id, not the other way around)
      console.log('Linking document to receipt...');
      await supabase
        .from('documents')
        .update({ receipt_id: receipt.id })
        .eq('id', document.id);
      console.log('Document linked to receipt');

      // Show success and go back to camera
      Alert.alert(
        'Saved to Inbox',
        'Receipt captured! Process it on the web app.',
        [{ text: 'OK', onPress: () => navigation.navigate('Camera') }]
      );
    } catch (error: any) {
      console.error('Error saving receipt:', JSON.stringify(error, null, 2));
      console.error('Error details:', error.message, error.code, error.details);
      Alert.alert('Error', `Failed to save receipt: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-black">
      {/* Image Preview */}
      <View className="flex-1">
        <Image
          source={{ uri: imageUri }}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      {/* Bottom Panel */}
      <View className="bg-white p-4 pb-8">
        {/* OCR Status */}
        {ocrLoading ? (
          <View className="flex-row items-center mb-4">
            <ActivityIndicator size="small" className="mr-2" />
            <Text className="text-gray-600">Reading receipt (optional)...</Text>
          </View>
        ) : ocrData?.confidence !== 'failed' ? (
          <View className="mb-4 p-3 bg-green-50 rounded-lg">
            <Text className="text-green-800 font-medium">
              ✓ Amount detected: ${ocrData?.total?.toFixed(2) || '0.00'}
            </Text>
            {ocrData?.vendor_name && (
              <Text className="text-green-700 text-sm">Vendor: {ocrData.vendor_name}</Text>
            )}
          </View>
        ) : (
          <View className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Text className="text-gray-600 text-sm">
              Processing on web app
            </Text>
          </View>
        )}

        {/* Quick Note Input */}
        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-2">Add a quick note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g., Kitchen cabinets deposit"
            className="border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
            editable={!saving}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleRetake}
            disabled={saving}
            className="flex-1 py-4 rounded-xl border border-gray-300 items-center flex-row justify-center"
          >
            <RotateCcw size={20} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-gray-700 font-semibold">Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="flex-1 py-4 rounded-xl bg-sky-500 items-center flex-row justify-center"
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Send size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold">Save to Inbox</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
