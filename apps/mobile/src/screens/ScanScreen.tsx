import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import { Card, matchCard } from '../lib/api';
import { recognizeCardText } from '../lib/ocr';
import { parseOCRResult } from '../lib/ocr/parser';
import SearchModal from '../components/SearchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

type ScanState = 'CAMERA' | 'PROCESSING' | 'FAILED';

export default function ScanScreen({ navigation }: { navigation: any }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const [state, setState] = useState<ScanState>('CAMERA');
  const [searchVisible, setSearchVisible] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const resetToCamera = useCallback(() => {
    setState('CAMERA');
    setScanHint(null);
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setState('PROCESSING');

      try {
        // Use ML Kit on the picked image
        const ocrResult = await recognizeCardText(result.assets[0].uri);
        const parsed = parseOCRResult(ocrResult.text);

        const matchResult = await matchCard({
          cardNumber: parsed.cardNumber,
          setTotal: parsed.setTotal,
          setCode: parsed.setCode,
          name: parsed.query,
          rawText: ocrResult.text,
        });

        navigation.navigate('CardDetail', { cardId: matchResult.card.id, cardName: matchResult.card.name });
        resetToCamera();
      } catch (error) {
        setScanHint(null);
        setState('FAILED');
      }
    }
  };

  const manualCapture = async () => {
    if (!cameraRef.current) {
      console.log('[SCAN] No camera ref');
      return;
    }
    try {
      console.log('[SCAN] Taking photo...');
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      console.log('[SCAN] Photo taken:', photo.path);
      setState('PROCESSING');
      const uri = `file://${photo.path}`;
      const ocrResult = await recognizeCardText(uri);
      console.log('[SCAN] OCR result:', ocrResult.text.substring(0, 200));
      const parsed = parseOCRResult(ocrResult.text);
      console.log('[SCAN] Parsed:', JSON.stringify(parsed));

      setScanHint(parsed.query || null);

      const result = await matchCard({
        cardNumber: parsed.cardNumber,
        setTotal: parsed.setTotal,
        setCode: parsed.setCode,
        name: parsed.query,
        rawText: ocrResult.text,
      });

      const matchedName = result.card.name;
      // Show confirmation so user can reject wrong matches
      Alert.alert(
        'Card Found',
        `OCR read: "${parsed.query}"\nCard #${parsed.cardNumber || '?'}/${parsed.setTotal || '?'}\n\nMatched: ${matchedName}`,
        [
          { text: 'Wrong Card', style: 'cancel', onPress: () => setState('FAILED') },
          { text: 'Correct', onPress: () => {
            navigation.navigate('CardDetail', { cardId: result.card.id, cardName: result.card.name });
            resetToCamera();
          }},
        ]
      );
    } catch (error: any) {
      console.log('[SCAN] Error:', error.message || error);
      setState('FAILED');
    }
  };

  const navigateToCard = useCallback((card: Card) => {
    navigation.navigate('CardDetail', { cardId: card.id, cardName: card.name });
    resetToCamera();
  }, [navigation, resetToCamera]);

  const openSettings = () => {
    Linking.openSettings();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!hasPermission) {
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

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          No camera device found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {state === 'CAMERA' && (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused && state === 'CAMERA'}
            photo={true}
          />
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
              <Text style={styles.instructionText}>
                Position card in frame and tap capture
              </Text>

              <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.captureButton} onPress={manualCapture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={() => setSearchVisible(true)}>
                  <Ionicons name="search" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {state === 'PROCESSING' && (
        <View style={styles.processingContainer}>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingBottom: 30,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
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
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  processingContainer: {
    flex: 1,
  },
  processingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
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
