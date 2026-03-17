import { OCRResult } from './index';

export async function recognizeWithGoogle(imageUri: string): Promise<OCRResult> {
  throw new Error(
    'Google Cloud Vision not implemented. ' +
    'Set OCR_PROVIDER=mlkit in your environment to use ML Kit instead. ' +
    'To enable Google Vision, add GOOGLE_CLOUD_VISION_API_KEY to your environment and implement this function.'
  );
}
