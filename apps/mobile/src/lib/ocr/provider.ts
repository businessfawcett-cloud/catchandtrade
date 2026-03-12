import { Platform } from 'react-native';
import { OCRResult } from './index';
import { recognizeWithMLKit } from './mlkit';
import { recognizeWithGoogle } from './google';

const PROVIDER = process.env.EXPO_PUBLIC_OCR_PROVIDER || 'mlkit';
const OCR_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('OCR timed out')), ms)
    )
  ]);
}

export async function recognizeCardText(imageUri: string): Promise<OCRResult> {
  if (Platform.OS === 'web') {
    throw new Error('Camera scanning is not available on web. Please use the mobile app.');
  }

  try {
    const result = await withTimeout(
      (async () => {
        switch (PROVIDER) {
          case 'google':
            return recognizeWithGoogle(imageUri);
          case 'mlkit':
          default:
            return recognizeWithMLKit(imageUri);
        }
      })(),
      OCR_TIMEOUT_MS
    );
    return result;
  } catch (error: any) {
    if (error.message === 'OCR timed out') {
      throw new Error('OCR took too long. Please try again with better lighting.');
    }
    throw error;
  }
}
