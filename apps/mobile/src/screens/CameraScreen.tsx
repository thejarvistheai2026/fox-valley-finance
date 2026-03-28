import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Camera as CameraIcon, Image as ImageIcon, Grid3X3 } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [processing, setProcessing] = useState(false);

  // Reset camera when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setProcessing(false);
    }, [])
  );

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
        console.error('Camera error:', error);
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
      console.error('Gallery error:', error);
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
      // Navigate to preview immediately after capture
      navigation.navigate('Preview', { imageUri: manipulatedImage.uri });
    } catch (error) {
      console.error('Image processing error:', error);
      // Fall back to original image if manipulation fails
      navigation.navigate('Preview', { imageUri: uri });
    } finally {
      setProcessing(false);
    }
  };

  const handleGallery = () => {
    navigation.navigate('Gallery');
  };

  const goBack = () => {
    navigation.goBack();
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <CameraIcon size={64} color="#9ca3af" />
        <Text className="text-white text-center mt-4 mb-4">
          Camera permission is required to capture receipts
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-sky-500 px-6 py-3 rounded-lg"
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
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View - no children allowed */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
      />

      {/* Top bar overlay */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>&#8592;</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGallery} style={styles.galleryButton}>
          <Grid3X3 size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom controls overlay */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Gallery picker button */}
          <TouchableOpacity
            onPress={pickFromGallery}
            style={styles.galleryPickerButton}
          >
            <ImageIcon size={24} color="white" />
          </TouchableOpacity>

          {/* Shutter button */}
          <TouchableOpacity
            onPress={takePicture}
            disabled={processing}
            style={styles.shutterButton}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Spacer to balance layout */}
          <View style={styles.spacer} />
        </View>

        <Text style={styles.hintText}>
          Tap to capture receipt
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  galleryPickerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  spacer: {
    width: 56,
  },
  hintText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    opacity: 0.8,
  },
});
