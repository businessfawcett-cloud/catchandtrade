import { Platform } from 'react-native';
import { OCRResult } from './index';
import { PhotoRecognizer } from 'react-native-vision-camera-text-recognition';

export async function recognizeWithMLKit(imageUri: string): Promise<OCRResult> {
  if (Platform.OS === 'web') {
    throw new Error('ML Kit OCR is not available on web');
  }

  try {
    const result = await PhotoRecognizer({ uri: imageUri });

    const text = result.resultText || '';
    const blocks = result.blocks?.map((block: any) => ({
      text: block.blockText || '',
      boundingBox: block.blockFrame ? {
        x: block.blockFrame.x || 0,
        y: block.blockFrame.y || 0,
        width: block.blockFrame.width || 0,
        height: block.blockFrame.height || 0,
      } : undefined,
    })) || [];

    return {
      text,
      confidence: 0.8,
      blocks,
    };
  } catch (error) {
    console.error('ML Kit OCR error:', error);
    throw new Error('Failed to recognize text with ML Kit');
  }
}
