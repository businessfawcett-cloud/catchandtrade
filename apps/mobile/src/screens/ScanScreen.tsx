import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Card } from '../lib/api';
import SearchModal from '../components/SearchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

type ScanState = 'CAMERA' | 'PROCESSING' | 'FAILED';

export default function ScanScreen({ navigation }: { navigation: any }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('CAMERA');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  const resetToCamera = useCallback(() => {
    setState('CAMERA');
    setCapturedImage(null);
    setScanHint(null);
  }, []);

  // Reset to camera whenever the tab comes into focus
  useEffect(() => {
    if (isFocused) {
      resetToCamera();
    }
  }, [isFocused, resetToCamera]);

  const processImage = async (uri: string) => {
    setCapturedImage(uri);
    setState('PROCESSING');

    try {
      // Resize full image
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64 = manipulated.base64;
      if (!base64) {
        throw new Error('Failed to process image');
      }

      const fullWidth = manipulated.width;
      const fullHeight = manipulated.height;

      // Crop the TOP 15% — the card name is the biggest, boldest text on the card
      // Much more reliable for Tesseract than the tiny bottom number
      let topBase64: string | undefined;
      try {
        const topCropHeight = Math.round(fullHeight * 0.15);
        const topCrop = await ImageManipulator.manipulateAsync(
          uri,
          [
            { crop: { originX: 0, originY: 0, width: fullWidth, height: topCropHeight } },
            { resize: { width: 1200 } }, // upscale for better OCR on the name
          ],
          { format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        topBase64 = topCrop.base64 || undefined;
      } catch {
        // Crop failed, continue without
      }

      // Crop the BOTTOM 20% — card number zone (045/198)
      // Small text but clean digits, worth trying
      let bottomBase64: string | undefined;
      try {
        const bottomCropHeight = Math.round(fullHeight * 0.20);
        const bottomCrop = await ImageManipulator.manipulateAsync(
          uri,
          [
            { crop: { originX: 0, originY: fullHeight - bottomCropHeight, width: fullWidth, height: bottomCropHeight } },
            { resize: { width: 1200 } }, // upscale small digits
          ],
          { format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        bottomBase64 = bottomCrop.base64 || undefined;
      } catch {
        // Crop failed, continue without
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, topBase64, bottomBase64 }),
      });

      if (response.ok) {
        const result = await response.json();
        navigation.navigate('CardDetail', { cardId: result.card.id, cardName: result.card.name });
        resetToCamera();
        return;
      }

      // Extract hint info from the failed response
      try {
        const errorData = await response.json();
        if (errorData.candidates?.[0]) {
          setScanHint(errorData.candidates[0]);
        } else if (errorData.ocrText) {
          // Use first meaningful line from OCR text as hint
          const firstLine = errorData.ocrText.split('\n').find((l: string) => l.trim().length > 2);
          if (firstLine) setScanHint(firstLine.trim());
        }
      } catch {
        // ignore parse errors
      }
    } catch (error) {
      console.log('Auto-scan unavailable, opening manual search');
    }

    setState('FAILED');
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        await processImage(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      setState('FAILED');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  const navigateToCard = useCallback((card: Card) => {
    navigation.navigate('CardDetail', { cardId: card.id, cardName: card.name });
    resetToCamera();
  }, [navigation, resetToCamera]);

  const openSettings = () => {
    Linking.openSettings();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan your Pokemon cards
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {state === 'CAMERA' && (
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.instructionText}>Hold card flat in frame</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
              <Text style={styles.controlButtonText}>📁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => setSearchVisible(true)}>
              <Text style={styles.controlButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {state === 'PROCESSING' && capturedImage && (
        <View style={styles.processingContainer}>
          <Image source={{ uri: capturedImage }} style={styles.processingImage} blurRadius={10} />
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Identifying your card...</Text>
            <TouchableOpacity onPress={resetToCamera}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'FAILED' && (
        <View style={styles.failedContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.failedImage} />
          )}
          <View style={styles.failedContent}>
            <Text style={styles.failedIcon}>?</Text>
            <Text style={styles.failedTitle}>Couldn't auto-identify</Text>
            <Text style={styles.failedText}>
              {scanHint
                ? `We detected: "${scanHint}" — try searching below`
                : 'Search for the card by name instead'}
            </Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setSearchVisible(true)}
            >
              <Text style={styles.searchButtonText}>Search for Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={resetToCamera}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelectCard={(card) => {
          setSearchVisible(false);
          navigateToCard(card);
        }}
        initialQuery={scanHint || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  settingsButtonText: {
    color: '#0066cc',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewfinder: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 0,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  overlayBottom: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 28,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ff4444',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff4444',
  },
  processingContainer: {
    flex: 1,
  },
  processingImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  processingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  failedContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  failedImage: {
    width: 200,
    height: 280,
    alignSelf: 'center',
    borderRadius: 8,
    opacity: 0.7,
    marginTop: 40,
    marginBottom: 20,
  },
  failedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedIcon: {
    fontSize: 80,
    color: '#fff',
    width: 100,
    height: 100,
    textAlign: 'center',
    lineHeight: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    marginBottom: 20,
    overflow: 'hidden',
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  failedText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#999',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
