import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { searchCards, getDefaultPortfolio, addToPortfolio, Card } from '../lib/api';
import CardResult from '../components/CardResult';
import SearchModal from '../components/SearchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

type ScanState = 'CAMERA' | 'PROCESSING' | 'RESULT' | 'FAILED';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('CAMERA');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedCard, setScannedCard] = useState<Card | null>(null);
  const [condition, setCondition] = useState('NEAR_MINT');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const resetToCamera = () => {
    setState('CAMERA');
    setCapturedImage(null);
    setScannedCard(null);
    setCondition('NEAR_MINT');
    setQuantity(1);
    setAdded(false);
  };

  const processImage = async (uri: string) => {
    setCapturedImage(uri);
    setState('PROCESSING');

    try {
      // Try to send to backend scan endpoint
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64 = manipulated.base64;
      if (!base64) {
        throw new Error('Failed to process image');
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (response.ok) {
        const result = await response.json();
        setScannedCard(result.card);
        setState('RESULT');
        return;
      }
    } catch (error) {
      // Backend scan not available — fall through to manual search
      console.log('Auto-scan unavailable, opening manual search');
    }

    // Fall back to manual search with the captured image as reference
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

  const handleAddToPortfolio = async () => {
    if (!scannedCard) return;

    setAdding(true);
    try {
      const portfolio = await getDefaultPortfolio();
      await addToPortfolio(portfolio.id, scannedCard.id, condition, quantity);
      setAdded(true);

      setTimeout(() => {
        resetToCamera();
      }, 2000);
    } catch (error) {
      console.error('Failed to add to portfolio:', error);
      Alert.alert('Error', 'Failed to add card to portfolio');
    } finally {
      setAdding(false);
    }
  };

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

      {state === 'RESULT' && scannedCard && (
        <View style={styles.resultContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.resultBackground} blurRadius={20} />
          )}
          <View style={styles.resultBackgroundOverlay} />
          <CardResult
            card={scannedCard}
            condition={condition}
            quantity={quantity}
            onConditionChange={setCondition}
            onQuantityChange={setQuantity}
            onAddToPortfolio={handleAddToPortfolio}
            onScanAnother={resetToCamera}
            adding={adding}
            added={added}
          />
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
            <Text style={styles.failedText}>Search for the card by name instead</Text>
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
          setScannedCard(card);
          setState('RESULT');
          setSearchVisible(false);
        }}
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
  resultContainer: {
    flex: 1,
  },
  resultBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  resultBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
