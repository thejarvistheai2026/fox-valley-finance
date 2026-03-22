import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera as CameraIcon, Image as ImageIcon, RotateCcw } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CameraRouteProp = RouteProp<RootStackParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CameraRouteProp>();
  const { vendorId } = route.params || {};
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo?.uri) {
          await processAndCompressImage(photo.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await processAndCompressImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processAndCompressImage = async (uri: string) => {
    try {
      setProcessing(true);
      // Compress image: max 2000px width, JPEG 80% quality
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 2000 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCapturedImage(manipulatedImage.uri);
    } catch (error) {
      console.error('Image processing error:', error);
      // Fall back to original image if manipulation fails
      setCapturedImage(uri);
    } finally {
      setProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!capturedImage) return;
    
    navigation.navigate('Review', {
      imageUri: capturedImage,
      vendorId,
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  // Preview captured image
  if (capturedImage) {
    return (
      <View className="flex-1 bg-black">
        <Image
          source={{ uri: capturedImage }}
          className="flex-1"
          resizeMode="contain"
        />

        <View className="absolute bottom-0 left-0 right-0 bg-white p-4">
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleRetake}
              className="flex-1 py-3 rounded-lg border border-gray-300 mr-2 items-center flex-row justify-center"
            >
              <RotateCcw size={18} color="#374151" className="mr-2" />
              <Text className="text-gray-700 font-medium">Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinue}
              disabled={processing}
              className="flex-1 py-3 rounded-lg bg-primary-600 ml-2 items-center flex-row justify-center"
            >
              <Text className="text-white font-semibold">Continue</Text>
              <CameraIcon size={18} color="white" className="ml-2" />
            </TouchableOpacity>
          </View>        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View className="flex-1 bg-black">
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          className="flex-1"
          facing="back"
        >
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-black/50">
            <View className="flex-row items-center justify-center">
              <TouchableOpacity
                onPress={pickFromGallery}
                className="absolute left-0 w-12 h-12 bg-white/20 rounded-full items-center justify-center"
              >
                <ImageIcon size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePicture}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 items-center justify-center"
              >
                <View className="w-14 h-14 rounded-full bg-white" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-white text-center mt-4 text-sm opacity-80">
              Tap to capture receipt
            </Text>
          </View>
        </CameraView>
      ) : (
        <View className="flex-1 items-center justify-center p-6">
          <CameraIcon size={64} color="#9ca3af" />
          <Text className="text-white text-center mt-4 mb-4">
            Camera permission is required to capture receipts
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-primary-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Grant Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromGallery}
            className="mt-6 px-6 py-3"
          >
            <Text className="text-white">Or select from gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
